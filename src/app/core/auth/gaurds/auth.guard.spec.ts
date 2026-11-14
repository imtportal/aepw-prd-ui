import { HttpErrorResponse } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { firstValueFrom, isObservable, NEVER, Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthorizationService } from '../services/authorization.service';
import { AuthService } from '../services/auth.service';
import { AuthStateService } from '../state/auth.state';
import { authGuard } from './auth.guard';

describe('authGuard (page-level authorization)', () => {
  const denied = { redirect: '/unauthorized' } as unknown as UrlTree;
  const timedOut = { redirect: '/server-timeout' } as unknown as UrlTree;
  const getPageAccess = vi.fn();
  const login = vi.fn();
  let authenticated = true;
  let userId: number | null = 7;

  const route = (data: Record<string, unknown>) => ({ data }) as unknown as ActivatedRouteSnapshot;

  const run = async (data: Record<string, unknown>) => {
    const result = TestBed.runInInjectionContext(() => authGuard(route(data), {} as never));
    return isObservable(result)
      ? firstValueFrom(result as Observable<boolean | UrlTree>)
      : result;
  };

  beforeEach(() => {
    authenticated = true;
    userId = 7;
    sessionStorage.clear();
    getPageAccess.mockReset();
    login.mockReset();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: AuthService,
          useValue: { isAuthenticatedSync: () => authenticated, login },
        },
        { provide: AuthStateService, useValue: { getCurrentUserId: () => userId } },
        { provide: AuthorizationService, useValue: { getPageAccess } },
        {
          provide: Router,
          useValue: {
            createUrlTree: (commands: string[]) =>
              commands[0] === '/server-timeout' ? timedOut : denied,
          },
        },
      ],
    });
  });

  it('allows navigation when the API returns Value = true', async () => {
    getPageAccess.mockReturnValue(of({ success: true, data: { key: 'DASHBOARD', value: true } }));

    expect(await run({ pageKey: 'DASHBOARD' })).toBe(true);
    expect(getPageAccess).toHaveBeenCalledWith('DASHBOARD', 7);
  });

  it('denies when Value = false', async () => {
    getPageAccess.mockReturnValue(of({ data: { key: 'REVIEWDETAIL', value: false } }));

    expect(await run({ pageKey: 'REVIEWDETAIL' })).toBe(denied);
  });

  it('denies when data is null (no matching row)', async () => {
    getPageAccess.mockReturnValue(of({ data: null }));

    expect(await run({ pageKey: 'REVIEWDETAIL' })).toBe(denied);
  });

  it('denies when the response is invalid or for another page', async () => {
    getPageAccess.mockReturnValue(of(null));
    expect(await run({ pageKey: 'DASHBOARD' })).toBe(denied);

    getPageAccess.mockReturnValue(of({ data: { key: 'OTHER', value: true } }));
    expect(await run({ pageKey: 'DASHBOARD' })).toBe(denied);

    getPageAccess.mockReturnValue(of({ success: false, data: { key: 'DASHBOARD', value: true } }));
    expect(await run({ pageKey: 'DASHBOARD' })).toBe(denied);
  });

  it('denies when the API errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    getPageAccess.mockReturnValue(throwError(() => new Error('500')));

    expect(await run({ pageKey: 'DASHBOARD' })).toBe(denied);
  });

  it('denies on a 403 or an unexpected error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    getPageAccess.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    expect(await run({ pageKey: 'DASHBOARD' })).toBe(denied);

    getPageAccess.mockReturnValue(throwError(() => new Error('boom')));
    expect(await run({ pageKey: 'DASHBOARD' })).toBe(denied);
    expect(login).not.toHaveBeenCalled();
  });

  it('starts re-login and cancels navigation on a 401', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    getPageAccess.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    expect(await run({ pageKey: 'DASHBOARD' })).toBe(false);
    expect(login).toHaveBeenCalledTimes(1);
  });

  it('stops re-login loops and shows the server page on a repeated 401', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    getPageAccess.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    expect(await run({ pageKey: 'DASHBOARD' })).toBe(false);
    expect(await run({ pageKey: 'DASHBOARD' })).toBe(timedOut);
    expect(login).toHaveBeenCalledTimes(1);
  });

  it('redirects to the server page on network failures and 5xx errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    for (const status of [0, 500, 503]) {
      getPageAccess.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
      expect(await run({ pageKey: 'DASHBOARD' })).toBe(timedOut);
    }

    expect(login).not.toHaveBeenCalled();
  });

  it('redirects to the server-timeout page when the API times out', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    getPageAccess.mockReturnValue(NEVER);
    vi.useFakeTimers();

    const pending = run({ pageKey: 'DASHBOARD' });
    await vi.advanceTimersByTimeAsync(10_000);
    const result = await pending;
    vi.useRealTimers();

    expect(result).toBe(timedOut);
    expect(result).not.toBe(denied);
  });

  it('denies a route without a pageKey without calling the API', async () => {
    expect(await run({})).toBe(denied);
    expect(getPageAccess).not.toHaveBeenCalled();
  });

  it('denies when the user ID is unavailable without calling the API', async () => {
    userId = null;

    expect(await run({ pageKey: 'DASHBOARD' })).toBe(denied);
    expect(getPageAccess).not.toHaveBeenCalled();
  });

  it('starts login and denies when unauthenticated', async () => {
    authenticated = false;

    expect(await run({ pageKey: 'DASHBOARD' })).toBe(denied);
    expect(login).toHaveBeenCalled();
    expect(getPageAccess).not.toHaveBeenCalled();
  });

  it('uses the current user ID on every navigation (no cross-account reuse)', async () => {
    getPageAccess.mockReturnValue(of({ data: { key: 'DASHBOARD', value: true } }));

    await run({ pageKey: 'DASHBOARD' });
    userId = 99;
    await run({ pageKey: 'DASHBOARD' });

    expect(getPageAccess).toHaveBeenNthCalledWith(1, 'DASHBOARD', 7);
    expect(getPageAccess).toHaveBeenNthCalledWith(2, 'DASHBOARD', 99);
  });
});
