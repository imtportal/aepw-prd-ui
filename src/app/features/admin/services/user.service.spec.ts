import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';

describe('UserService (admin)', () => {
  let svc: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(UserService);
  });

  it('users() returns initial list', () => {
    expect(svc.users().length).toBeGreaterThan(0);
  });

  it('updateUserStatus() changes status', () => {
    const id = svc.users()[0].userId.toString();
    svc.updateUserStatus(id, 'Inactive');
    expect(svc.users().find(u => u.userId.toString() === id)?.status).toBe('Inactive');
  });
});
