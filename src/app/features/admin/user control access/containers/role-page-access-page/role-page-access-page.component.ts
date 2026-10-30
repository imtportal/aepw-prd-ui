import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
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
  RolePageAccessModel,
  SaveRolePageAccessRequest,
  RolePageAccessItem,
} from '../../models/user-control-access.model';
import { AuthStateService } from '../../../../../core/auth';
import { PageLoadingService } from '../../../../../core/services/page-loading.service';

interface PageAccessRow {
  pageStructureId: number;
  pageName: string;
  description: string;
  roleAccess: Map<number, boolean>; // roleId -> hasAccess
}

interface RoleHeader {
  systemRoleId: number;
  systemRoleName: string;
}

@Component({
  selector: 'app-role-page-access-page',
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
  templateUrl: './role-page-access-page.component.html',
})
export class RolePageAccessPageComponent {
  private readonly pageLoadingService = inject(PageLoadingService);
  private readonly authStateService = inject(AuthStateService);
  private readonly userControlAccessService = inject(UserControlAccessService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  ngOnInit(): void {
    this.pageLoadingService.stop();
  }

  protected readonly saving = signal(false);

  // Raw API response
  private readonly apiResponse = toSignal(
    this.userControlAccessService.getRolePageAccess().pipe(map((response) => response.data || [])),
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

  protected readonly pages = computed(() => {
    const data = this.apiResponse();
    const pagesMap = new Map<number, PageAccessRow>();

    data.forEach((item) => {
      if (!pagesMap.has(item.pageStructureId)) {
        pagesMap.set(item.pageStructureId, {
          pageStructureId: item.pageStructureId,
          pageName: item.pageName,
          description: item.description,
          roleAccess: new Map(),
        });
      }

      const page = pagesMap.get(item.pageStructureId)!;
      page.roleAccess.set(item.systemRoleId, item.hasAccess);
    });

    return Array.from(pagesMap.values());
  });

  protected hasAccess(page: PageAccessRow, roleId: number): boolean {
    return page.roleAccess.get(roleId) || false;
  }

  protected onAccessChange(page: PageAccessRow, roleId: number, hasAccess: boolean): void {
    // Update the local model
    page.roleAccess.set(roleId, hasAccess);
  }

  protected navigateToPageActions(pageStructureId: number): void {
    this.router.navigate(['/admin/user-control-access/page-actions', pageStructureId]);
  }

  protected save(): void {
    this.saving.set(true);

    // Flatten all role-page combinations into a single array
    const rolePageAccess: RolePageAccessItem[] = [];

    this.pages().forEach((page) => {
      this.roles().forEach((role) => {
        rolePageAccess.push({
          systemRoleId: role.systemRoleId,
          pageStructureId: page.pageStructureId,
          hasAccess: page.roleAccess.get(role.systemRoleId) || false,
        });
      });
    });

    const request: SaveRolePageAccessRequest = {
      rolePageAccess,
      updatedBy: this.authStateService.getCurrentUserId()!, 
    };

    this.userControlAccessService.saveRolePageAccess(request).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.success) {
          this.toastService.success('Page access saved successfully');
        } else {
          this.toastService.error(response.message || 'Failed to save page access');
        }
      },
      error: (error) => {
        this.saving.set(false);
        console.error('[RolePageAccessPage] Save failed:', error);
        this.toastService.error('Failed to save page access');
      },
    });
  }
}
