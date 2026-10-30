import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, LucideIconProvider, LUCIDE_ICONS, ArrowLeft } from 'lucide-angular';
import {
  CardComponent,
  CardContentComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
} from '../../../../../shared/ui/card/card.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { UserControlAccessService } from '../../services/user-control-access.service';
import {
  RolePageActionAccessModel,
  SaveRolePageActionAccessRequest,
  RolePageActionAccessItem,
} from '../../models/user-control-access.model';
import { AuthStateService } from '../../../../../core/auth';

interface ActionAccessRow {
  pageActionStructureId: number;
  actionName: string;
  actionKey: string;
  actionDescription: string;
  roleAccess: Map<number, boolean>; // roleId -> hasAccess
}

interface RoleHeader {
  systemRoleId: number;
  systemRoleName: string;
}

@Component({
  selector: 'app-role-page-action-access-page',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    CardComponent,
    CardContentComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    ButtonComponent,
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ ArrowLeft }),
    },
  ],
  templateUrl: './role-page-action-access-page.component.html',
})
export class RolePageActionAccessPageComponent {
  private readonly authStateService = inject(AuthStateService);
  private readonly userControlAccessService = inject(UserControlAccessService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected readonly saving = signal(false);

  // Get pageStructureId from route params
  private readonly pageStructureId = toSignal(
    this.route.params.pipe(map((params) => +params['pageStructureId'])),
  );

  // Raw API response
  private readonly apiResponse = toSignal(
    this.route.params.pipe(
      map((params) => +params['pageStructureId']),
      switchMap((pageId) =>
        this.userControlAccessService
          .getRolePageActionAccess(pageId)
          .pipe(map((response) => response.data || [])),
      ),
    ),
    { initialValue: [] },
  );

  // Transform the flat list into a matrix structure
  protected readonly roles = computed(() => {
    const data = this.apiResponse();
    const rolesMap = new Map<number, RoleHeader>();

    data.forEach((item) => {
      if (!rolesMap.has(item.systemRoleId)) {
        rolesMap.set(item.systemRoleId, {
          systemRoleId: item.systemRoleId,
          systemRoleName: item.systemRoleName,
        });
      }
    });

    return Array.from(rolesMap.values());
  });

  protected readonly actions = computed(() => {
    const data = this.apiResponse();
    const actionsMap = new Map<number, ActionAccessRow>();

    data.forEach((item) => {
      if (!actionsMap.has(item.pageActionStructureId)) {
        actionsMap.set(item.pageActionStructureId, {
          pageActionStructureId: item.pageActionStructureId,
          actionName: item.actionName,
          actionKey: item.actionKey,
          actionDescription: item.actionDescription,
          roleAccess: new Map(),
        });
      }

      const action = actionsMap.get(item.pageActionStructureId)!;
      action.roleAccess.set(item.systemRoleId, item.hasAccess);
    });

    return Array.from(actionsMap.values());
  });

  protected hasAccess(action: ActionAccessRow, roleId: number): boolean {
    return action.roleAccess.get(roleId) || false;
  }

  protected onAccessChange(action: ActionAccessRow, roleId: number, hasAccess: boolean): void {
    // Update the local model
    action.roleAccess.set(roleId, hasAccess);
  }

  protected goBack(): void {
    this.router.navigate(['/admin/user-control-access']);
  }

  protected save(): void {
    const pageId = this.pageStructureId();
    if (!pageId) {
      this.toastService.error('Invalid page ID');
      return;
    }

    this.saving.set(true);

    // Flatten all role-action combinations into a single array
    const rolePageActionAccess: RolePageActionAccessItem[] = [];

    this.actions().forEach((action) => {
      this.roles().forEach((role) => {
        rolePageActionAccess.push({
          systemRoleId: role.systemRoleId,
          pageActionStructureId: action.pageActionStructureId,
          canPerformAction: action.roleAccess.get(role.systemRoleId) || false,
        });
      });
    });

    const request: SaveRolePageActionAccessRequest = {
      rolePageActionAccess,
      updatedBy: this.authStateService.getCurrentUserId()!, // Hardcoded for now
    };

    this.userControlAccessService.saveRolePageActionAccess(request).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.success) {
          this.toastService.success('Page action access saved successfully');
        } else {
          this.toastService.error(response.message || 'Failed to save page action access');
        }
      },
      error: (error) => {
        this.saving.set(false);
        console.error('[RolePageActionAccessPage] Save failed:', error);
        this.toastService.error('Failed to save page action access');
      },
    });
  }
}
