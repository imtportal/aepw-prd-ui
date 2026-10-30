import { Component, computed, inject, input, output, viewChild } from '@angular/core';
import {
  LucideAngularModule,
  LucideIconProvider,
  LUCIDE_ICONS,
  MoreVertical,
  Trash2,
} from 'lucide-angular';
import { BadgeComponent } from '../../../../../shared/ui/badge/badge.component';
import { DropdownMenuComponent } from '../../../../../shared/ui/dropdown-menu/dropdown-menu.component';
import { AppUserListModel } from '../../models/user-model';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
@Component({
  selector: '[app-user-row]',
  standalone: true,
  imports: [LucideAngularModule, BadgeComponent, DropdownMenuComponent, DatePipe],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ MoreVertical,Trash2 }),
    },
  ],
  templateUrl: './user-row.component.html',
})
export class UserRowComponent {
  readonly user = input.required<AppUserListModel>();
  private readonly toast = inject(ToastService);
  
  readonly editPermissions = output<string>();
  readonly resendInvite = output<string>();
  readonly toggleStatus = output<string>();
  readonly deleteClicked = output<AppUserListModel>();
  readonly canDelete = input(false);
  readonly dropdownRef = viewChild.required<DropdownMenuComponent>('dropdown');

  readonly initials = computed(() =>
    this.user()
      .displayName.split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase(),
  );

  readonly roleColor = computed(() => {
    switch (this.user().roleName) {
      case 'Admin':
        return 'bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))]';

      case 'Project Manager':
        return 'bg-[hsl(var(--aepw-blue)/0.12)] text-[hsl(var(--aepw-blue))]';

      case 'Approver':
        return 'bg-[hsl(var(--aepw-green)/0.12)] text-[hsl(var(--aepw-green))]';

      case 'Risk Adjustment Approver':
        return 'bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))]';

      case 'Portfolio Viewer':
        return 'bg-[hsl(var(--aepw-dark-grey)/0.12)] text-muted-foreground';

      default:
        return 'bg-muted text-muted-foreground';
    }
  });
  readonly statusColor = computed(() =>
    this.user().isActive
      ? 'bg-[hsl(var(--aepw-green)/0.12)] text-[hsl(var(--aepw-green))]'
      : 'bg-[hsl(var(--aepw-dark-grey)/0.12)] text-muted-foreground',
  );
  readonly avatarClass = computed(() => {
    switch (this.user().roleName) {
      case 'Admin':
        return 'bg-[hsl(var(--destructive)/0.15)] text-[hsl(var(--destructive))]';

      case 'Project Manager':
        return 'bg-[hsl(var(--aepw-blue)/0.15)] text-[hsl(var(--aepw-blue))]';

      case 'Approver':
        return 'bg-[hsl(var(--aepw-green)/0.15)] text-[hsl(var(--aepw-green))]';

      case 'Risk Adjustment Approver':
        return 'bg-[hsl(var(--aepw-orange)/0.15)] text-[hsl(var(--aepw-orange))]';

      default:
        return 'bg-muted text-muted-foreground';
    }
  });
  onDeleteClick(event: MouseEvent): void {
    event.stopPropagation();
    this.deleteClicked.emit(this.user());
  }
}
