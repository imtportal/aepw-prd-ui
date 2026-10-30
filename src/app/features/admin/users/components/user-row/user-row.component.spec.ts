import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { UserRowComponent } from './user-row.component';
import { UserListDto } from '../../../../../core/models/user.model';

const ACTIVE_USER: UserListDto = {
  userId: 1, displayName: 'Sarah Chen', email: 'sarah@aepw.org',
  role: 'Project Manager', status: 'Active', lastLoginUtc: '2025-07-22T14:32:00Z',
};

const INACTIVE_USER: UserListDto = { ...ACTIVE_USER, userId: 2, status: 'Inactive' };

describe('UserRowComponent', () => {
  async function create(user: UserListDto): Promise<ComponentFixture<UserRowComponent>> {
    await TestBed.configureTestingModule({ imports: [UserRowComponent] }).compileComponents();
    const f = TestBed.createComponent(UserRowComponent);
    f.componentRef.setInput('user', user);
    f.detectChanges();
    return f;
  }

  it('renders user name', async () => {
    const f = await create(ACTIVE_USER);
    expect(f.nativeElement.textContent).toContain('Sarah Chen');
  });

  it('renders [data-status-badge] with status text', async () => {
    const f = await create(ACTIVE_USER);
    const badge = f.nativeElement.querySelector('[data-status-badge]') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('Active');
  });

  it('emits toggleStatus with user id string', async () => {
    const f = await create(ACTIVE_USER);
    const spy = vi.fn();
    f.componentInstance.toggleStatus.subscribe(spy);
    f.componentInstance.dropdownRef().isOpen.set(true);
    f.detectChanges();
    const btn = f.nativeElement.querySelector('[data-toggle-status-btn]') as HTMLElement;
    btn.click();
    expect(spy).toHaveBeenCalledWith('1');
  });

  it('active user shows deactivate option', async () => {
    const f = await create(ACTIVE_USER);
    f.componentInstance.dropdownRef().isOpen.set(true);
    f.detectChanges();
    const btn = f.nativeElement.querySelector('[data-toggle-status-btn]') as HTMLElement;
    expect(btn.textContent?.toLowerCase()).toContain('deactivate');
  });

  it('inactive user shows activate option', async () => {
    const f = await create(INACTIVE_USER);
    f.componentInstance.dropdownRef().isOpen.set(true);
    f.detectChanges();
    const btn = f.nativeElement.querySelector('[data-toggle-status-btn]') as HTMLElement;
    expect(btn.textContent?.toLowerCase()).toContain('activate');
  });
});
