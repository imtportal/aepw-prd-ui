import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { UsersPageComponent } from './users-page.component';
import { UserService } from '../../services/user.service';
import { UserListDto } from '../../../../core/models/user.model';

const USERS: UserListDto[] = [
  { userId: 1, displayName: 'Sarah Chen',   email: 's@a.org', role: 'Project Manager', status: 'Active',   lastLoginUtc: '2025-07-22T00:00:00Z' },
  { userId: 2, displayName: 'James Wright', email: 'j@a.org', role: 'Reviewer',        status: 'Active',   lastLoginUtc: '2025-07-21T00:00:00Z' },
  { userId: 3, displayName: 'Maria Santos', email: 'm@a.org', role: 'Project Manager', status: 'Inactive', lastLoginUtc: null },
];

describe('UsersPageComponent', () => {
  let fixture: ComponentFixture<UsersPageComponent>;
  let component: UsersPageComponent;
  const fakeSvc = {
    users:            signal(USERS),
    updateUserStatus: vi.fn(),
    addUser:          vi.fn(),
    loadPaged:        vi.fn().mockReturnValue(of({ data: [], total: 0, page: 0, pageSize: 10, status: 200 })),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports:   [UsersPageComponent],
      providers: [{ provide: UserService, useValue: fakeSvc }],
    }).compileComponents();
    fixture   = TestBed.createComponent(UsersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('roleCounts() counts only Active users by role', () => {
    const counts = component.roleCounts();
    expect(counts.get('Project Manager')).toBe(1); // Sarah is Active, Maria is Inactive
    expect(counts.get('Reviewer')).toBe(1);        // James is Active
  });

  it('onToggleStatus() calls updateUserStatus with toggled status for Active user', () => {
    component.onToggleStatus('1');
    expect(fakeSvc.updateUserStatus).toHaveBeenCalledWith('1', 'Inactive');
  });

  it('renders [data-users-table]', () => {
    expect(fixture.nativeElement.querySelector('[data-users-table]')).not.toBeNull();
  });
});
