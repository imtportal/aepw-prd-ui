import { Component, computed, input } from '@angular/core';
import { CardComponent, CardContentComponent } from '../../../../../shared/ui/card/card.component';
import { UserRole } from '../../../../../core/models/user.model';

const ROLE_COLORS: Record<UserRole, string> = {
  Admin:
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-destructive/20 text-destructive',
  'Project Manager':
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-[hsl(var(--aepw-blue)/0.12)] text-[hsl(var(--aepw-blue))]',
  Reviewer:
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-[hsl(var(--aepw-accent-green)/0.15)] text-[hsl(var(--aepw-green))]',
  'Lead Reviewer':
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-[hsl(var(--aepw-green)/0.12)] text-[hsl(var(--aepw-green))]',
  'Funding Recipient':
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))]',
};

@Component({
  selector: 'app-user-role-card',
  standalone: true,
  imports: [CardComponent, CardContentComponent],
  templateUrl: './user-role-card.component.html',
})
export class UserRoleCardComponent {
  readonly role = input.required<string>();
  readonly count = input.required<number>();
  readonly description = input.required<string>();

  readonly roleColor = computed(
    () => ROLE_COLORS[this.role() as UserRole] || ROLE_COLORS['Reviewer'],
  );
}
