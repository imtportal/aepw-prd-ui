import { HttpErrorResponse } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, isObservable, NEVER, Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthorizationService } from '../services/authorization.service';
import { AuthRecoveryService, AuthenticationRequiredError } from '../services/auth-recovery.service';
import { AuthService } from '../services/auth.service';
import { AuthStateService } from '../state/auth.state';
import { authGuard } from './auth.guard';

describe('authGuard (page-level authorization)', () => {
  const denied = { redirect: '/unauthorized' } as unknown as UrlTree;
  const timedOut = { redirect: '/server-timeout' } as unknown as UrlTree;
  const getPageAccess = vi.fn();
  const acquireAccessToken = vi.fn();
  const reset = vi.fn();
  let redirectInProgress = false;
  let authenticated = true;
  let userId: number | null = 7;

  const route = (data: Record<string, unknown>) => ({ data }) as unknown as ActivatedRouteSnapshot;
  const state = { url: '/dashboard?tab=1' } as RouterStateSnapshot;

  const run = async (data: Record<string, unknown>) => {
    const result = TestBed.runInInjectionContext(() => authGuard(route(data), state));
    return isObservable(result)
      ? firstValueFrom(result as Observable<boolean | UrlTree>)
      : result;
  };

  beforeEach(() => {
    authenticated = true;
    userId = 7;
    redirectInProgress = false;
    getPageAccess.mockReset();
    acquireAccessToken.mockReset();
    acquireAccessToken.mockResolvedValue({ status: 'success', accessToken: 'token' });
    reset.mockReset();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: AuthService,
          useValue: { isAuthenticatedSync: () => authenticated },
        },
        {
          provide: AuthRecoveryService,
          useValue: { acquireAccessToken, reset, isRedirectInProgress: () => redirectInProgress },
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
    expect(acquireAccessToken).toHaveBeenCalledTimes(2);
  });

  it('acquires the token with the requested URL before checking page access', async () => {
    getPageAccess.mockReturnValue(of({ data: { key: 'DASHBOARD', value: true } }));

    expect(await run({ pageKey: 'DASHBOARD' })).toBe(true);
    expect(acquireAccessToken).toHaveBeenCalledWith('/dashboard?tab=1');
    expect(reset).toHaveBeenCalled();
  });

  it('cancels navigation while a redirect is pending after a 401', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    redirectInProgress = true;
    getPageAccess.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    expect(await run({ pageKey: 'DASHBOARD' })).toBe(false);
  });

  it('shows the server page on a 401 that did not start a redirect', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    getPageAccess.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    expect(await run({ pageKey: 'DASHBOARD' })).toBe(timedOut);
  });

  it('cancels navigation when token acquisition starts a redirect', async () => {
    acquireAccessToken.mockResolvedValue({ status: 'redirecting' });

    expect(await run({ pageKey: 'DASHBOARD' })).toBe(false);
    expect(getPageAccess).not.toHaveBeenCalled();
  });

  it('shows the server page when token acquisition is suppressed or unavailable', async () => {
    for (const status of ['cooldown', 'unavailable', 'failed']) {
      acquireAccessToken.mockResolvedValue({ status });
      expect(await run({ pageKey: 'DASHBOARD' })).toBe(timedOut);
    }

    expect(getPageAccess).not.toHaveBeenCalled();
  });

  it('maps a missing token raised by the interceptor to the redirect outcome', async () => {
    getPageAccess.mockReturnValue(
      throwError(() => new AuthenticationRequiredError({ status: 'redirecting' })),
    );

    expect(await run({ pageKey: 'DASHBOARD' })).toBe(false);
  });

  it('does not count silent token acquisition against the page-access timeout', async () => {
    getPageAccess.mockReturnValue(of({ data: { key: 'DASHBOARD', value: true } }));
    vi.useFakeTimers();
    acquireAccessToken.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ status: 'success', accessToken: 't' }), 15_000)),
    );

    const pending = run({ pageKey: 'DASHBOARD' });
    await vi.advanceTimersByTimeAsync(15_000);
    const result = await pending;
    vi.useRealTimers();

    expect(result).toBe(true);
  });

  it('redirects to the server page on network failures and 5xx errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    for (const status of [0, 500, 503]) {
      getPageAccess.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
      expect(await run({ pageKey: 'DASHBOARD' })).toBe(timedOut);
    }
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

  it('starts login with the requested URL and denies when unauthenticated', async () => {
    authenticated = false;
    acquireAccessToken.mockResolvedValue({ status: 'failed', error: new Error('no account') });

    expect(await run({ pageKey: 'DASHBOARD' })).toBe(denied);
    expect(acquireAccessToken).toHaveBeenCalledWith('/dashboard?tab=1');
    expect(getPageAccess).not.toHaveBeenCalled();

    acquireAccessToken.mockResolvedValue({ status: 'redirecting' });
    expect(await run({ pageKey: 'DASHBOARD' })).toBe(false);
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
