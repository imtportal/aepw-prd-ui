import { Component, computed, inject, input, signal, WritableSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  LucideIconProvider,
  LUCIDE_ICONS,
  LayoutDashboard,
  FilePlus,
  Rocket,
  FileCheck,
  ChartBar,
  ClipboardCheck,
  History,
  Sparkles,
  FolderKanban,
  Ruler,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  X,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  Blocks,
  HandCoins,
} from 'lucide-angular';
import { AuthService } from '../auth/services/auth.service';
import { uiStore } from '../store/ui/ui.store';
import { PageLoadingService } from '../services/page-loading.service';
import { AuthStateService } from '../auth';
import { from, take } from 'rxjs';

interface NavItem {
  title: string;
  href: string;
  icon: string;
  pageKey: string;
}

const MAIN_NAV: NavItem[] = [
  {
    // REVIEWTASK
    pageKey: 'REVIEWDETAIL',
    title: 'Task',
    href: '/workflow/reviewTasks',
    icon: 'clipboard-check',
  },

  {
    pageKey: 'DASHBOARD',
    title: 'Dashboard',
    href: '/workflow/dashboard',
    icon: 'layout-dashboard',
  },
  {
    pageKey: 'PROJECTLIBRARY',
    title: 'Project Library',
    href: '/workflow/projectLibrary',
    icon: 'chart-bar',
  },
  // {
  //   pageKey: 'CREATEREVIEW',
  //   title: 'Create Review',
  //   href: '/reviews/create',
  //   icon: 'file-plus',
  // },
  // {
  //   pageKey: 'EVIDENCETRACKER',
  //   title: 'Evidence Tracker',
  //   href: '/evidence',
  //   icon: 'file-check',
  // },
  // {
  //   pageKey: 'REPORTING',
  //   title: 'Reporting',
  //   href: '/reporting',
  //   icon: 'chart-bar',
  // },
];

const REVIEW_NAV: NavItem[] = [
  // { title: 'Approval Queue', href: '/reviewer', icon: 'clipboard-check', pageKey: 'APPROVALQUEUE' },
  // { title: 'Audit Timeline', href: '/audit', icon: 'history', pageKey: 'AUDITTIMELINE' },
  // { title: 'AI Processing', href: '/ai-processing', icon: 'sparkles', pageKey: 'AIPROCESSING' },
];

const REPORTING_NAV: NavItem[] = [
  {
    title: 'Reports',
    href: '/reporting/reports',
    icon: 'Blocks',
    pageKey: 'REPORTING',
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    title: 'Program',
    href: '/admin/programs',
    icon: 'Blocks',
    pageKey: 'PROGRAMMANAGEMENT',
  },
  {
    title: 'Project Master',
    href: '/admin/projects',
    icon: 'folder-kanban',
    pageKey: 'PROJECTMASTER',
  },
  {
    pageKey: 'BULKLAUNCH',
    title: 'Bulk Launch',
    href: '/reviews/bulk-launch',
    icon: 'rocket',
  },

  // {
  //   title: 'Review Stage Management',
  //   href: '/reviews/review-stage-management',
  //   pageKey: 'REVIEWSTAGEMANAGEMENT',
  //   icon: 'list-todo',
  // },
  { title: 'Metric Config', href: '/admin/metrics', icon: 'ruler', pageKey: 'METRICCONFIG' },
  { title: 'User Management', href: '/admin/users', icon: 'users', pageKey: 'USERMANAGEMENT' },
  // {
  //   title: 'Business Role Management',
  //   href: '/admin/business-roles',
  //   icon: 'users',
  //   pageKey: 'BUSINESSROLEMANAGEMENT',
  // },
  {
    title: 'Funding Recipient',
    href: '/admin/funding-recipients',
    icon: 'hand-coins',
    pageKey: 'FUNDINGRECIPIENTMANAGEMENT',
  },
  {
    title: 'Security',
    href: '/admin/user-control-access',
    icon: 'shield-check',
    pageKey: 'USERCONTROLACCESS',
  },
  {
    title: 'Audit Timeline',
    href: '/admin/audit',
    icon: 'history',
    pageKey: 'AUDITTIMELINE',
  },
  {
    title: 'System Settings',
    href: '/admin/settings',
    icon: 'settings',
    pageKey: 'SYSTEMSETTINGS',
  },
];

const SIDEBAR_ICONS = {
  LayoutDashboard,
  FilePlus,
  Rocket,
  FileCheck,
  ChartBar,
  ClipboardCheck,
  History,
  Sparkles,
  FolderKanban,
  Ruler,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  X,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  Blocks,
  HandCoins,
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(SIDEBAR_ICONS) },
  ],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  readonly activeUrl = input.required<string>();
  protected profilePictureBlob: WritableSignal<Blob | null> = signal(null);

  protected profilePictureBlobUrl = signal('');

  readonly isOpen = input<boolean>(false);
  protected readonly isCollapsed = signal(false);
  private readonly pageLoadingService = inject(PageLoadingService);
  protected readonly closeSidebar = () => uiStore.sidebarOpen.set(false);
  protected readonly toggleSidebar = (): void => {
    this.isCollapsed.update((collapsed) => !collapsed);
  };

  protected readonly onMenuItemClick = (href: string): void => {
    this.closeSidebar();
    if (!this.isActive(href)) {
      this.pageLoadingService.start();
    }
  };

  protected readonly mainNav = computed(() =>
    MAIN_NAV.filter((item) => this.authState.hasPageAccess(item.pageKey)),
  );

  protected readonly reviewNav = computed(() =>
    REVIEW_NAV.filter((item) => this.authState.hasPageAccess(item.pageKey)),
  );

  protected readonly adminNav = computed(() =>
    ADMIN_NAV.filter(
      (item) =>
        !item.pageKey ||
        this.authState.hasPageAccess(item.pageKey),
    ),
  );

  protected readonly reportingNaV = computed(() =>
    REPORTING_NAV.filter((item) => this.authState.hasPageAccess(item.pageKey)),
  );

  protected readonly auth = inject(AuthService);
  protected readonly authState = inject(AuthStateService);

  protected isActive(href: string): boolean {
    const currentUrl = this.activeUrl().split(/[?#]/, 1)[0];

    if (href === '/') return currentUrl === '/';
    if (href === '/workflow/projectLibrary') {
      return (
        currentUrl === href ||
        currentUrl.startsWith(`${href}/`) ||
        currentUrl === '/admin/projects-info' ||
        currentUrl.startsWith('/admin/projects-info/')
      );
    }

    return currentUrl === href || currentUrl.startsWith(`${href}/`);
  }

  ngOnInit(): void {
    this.getProfilePicture();
  }

  getProfilePicture(): void {
    from(this.auth.getProfilePhoto())
      .pipe(take(1))
      .subscribe((blob) => {
        console.log('[AppComponent] Profile photo response:', blob);

        if (blob) {
          this.profilePictureBlob.update(() => blob);

          URL.revokeObjectURL(this.profilePictureBlobUrl());
          const url = URL.createObjectURL(<Blob>this.profilePictureBlob());
          this.profilePictureBlobUrl.set(url);
        }
      });
  }
}
