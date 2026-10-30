import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserRoleCardComponent } from './user-role-card.component';
import { UserRole } from '../../../../../core/models/user.model';

describe('UserRoleCardComponent', () => {
  let fixture: ComponentFixture<UserRoleCardComponent>;

  async function create(role: UserRole, count: number, description: string) {
    await TestBed.configureTestingModule({ imports: [UserRoleCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(UserRoleCardComponent);
    fixture.componentRef.setInput('role', role);
    fixture.componentRef.setInput('count', count);
    fixture.componentRef.setInput('description', description);
    fixture.detectChanges();
  }

  it('renders role in [data-role-badge]', async () => {
    await create('Project Manager', 3, 'Manages projects');
    const badge = fixture.nativeElement.querySelector('[data-role-badge]') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('Project Manager');
  });

  it('renders count in [data-role-count]', async () => {
    await create('Admin', 1, 'Full access');
    const count = fixture.nativeElement.querySelector('[data-role-count]') as HTMLElement;
    expect(count.textContent?.trim()).toBe('1');
  });

  it('renders description in [data-role-description]', async () => {
    await create('Reviewer', 5, 'Reviews data');
    const desc = fixture.nativeElement.querySelector('[data-role-description]') as HTMLElement;
    expect(desc.textContent?.trim()).toBe('Reviews data');
  });

  it('Admin role uses destructive color class', async () => {
    await create('Admin', 1, 'Full access');
    const badge = fixture.nativeElement.querySelector('[data-role-badge]') as HTMLElement;
    expect(badge.className).toContain('destructive');
  });
});
