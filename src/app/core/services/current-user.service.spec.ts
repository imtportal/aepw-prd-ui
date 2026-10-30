import { TestBed } from '@angular/core/testing';
import { CurrentUserService } from './current-user.service';
import { AuthService } from '../auth/services/auth.service';
import { signal } from '@angular/core';

// Minimal mock for AuthService identity signals
const mockAuthService = {
  currentUser: signal<{ account: { localAccountId: string } } | null>({
    account: { localAccountId: 'mock-user-001' },
  }),
  displayName: signal('Sarah Connor'),
  email: signal('sarah.connor@example.com'),
  initials: signal('SC'),
};

describe('CurrentUserService', () => {
  let svc: CurrentUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CurrentUserService, { provide: AuthService, useValue: mockAuthService }],
    });
    svc = TestBed.inject(CurrentUserService);
  });

  it('currentUser().id is "mock-user-001"', () => {
    expect(svc.currentUser().id).toBe('mock-user-001');
  });

  it('currentUser().name is "Sarah Connor"', () => {
    expect(svc.currentUser().name).toBe('Sarah Connor');
  });

  it('currentUser().initials is "SC"', () => {
    expect(svc.currentUser().initials).toBe('SC');
  });

  it('currentUser is a signal (callable function)', () => {
    expect(typeof svc.currentUser).toBe('function');
  });
});
