import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  LucideAngularModule,
  LucideIconProvider,
  LUCIDE_ICONS,
  Search,
  Calendar,
  Filter,
  X,
  RefreshCw,
  AlertCircle,
} from 'lucide-angular';
import { CardComponent, CardContentComponent } from '../../../shared/ui/card/card.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { SelectComponent } from '../../../shared/ui/select/select.component';
import { SearchInputComponent } from '../../../shared/ui/search-input/search-input.component';
import { AlertComponent, AlertDescriptionComponent } from '../../../shared/ui/alert/alert.component';
import { AuditService, AUDIT_PAGE_SIZE } from '../services/audit.service';
import { LookupService } from '../../../core/services/lookup-service';
import { AuditModuleType, AuditTimelineItem, DatePreset } from '../models/audit.model';
import { AuditTimelineItemComponent } from '../components/audit-timeline-item/audit-timeline-item.component';
import { ImpactMasterLookup } from '../../../core/models/lookup-model';
import { MetricService } from '../../admin/services/metric.service';
import {
  MetricCascadeSelectComponent,
  MetricTreeNode,
} from '../components/metric-cascade-select/metric-cascade-select.component';
import {
  Subject,
  Observable,
  of,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
  catchError,
  startWith,
  BehaviorSubject,
  combineLatest,
} from 'rxjs';


@Component({
  selector: 'app-audit-page',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    NgSelectModule,
    LucideAngularModule,
    CardComponent,
    CardContentComponent,
    BadgeComponent,
    ButtonComponent,
    SelectComponent,
    SearchInputComponent,
    AlertComponent,
    AlertDescriptionComponent,
    AuditTimelineItemComponent,
    MetricCascadeSelectComponent,
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Search, Calendar, Filter, X, RefreshCw, AlertCircle }),
    },
  ],
  templateUrl: './audit-page.component.html',
})
export class AuditPageComponent implements OnInit {
  private readonly auditService = inject(AuditService);
  private readonly lookupService = inject(LookupService);
  private readonly metricService = inject(MetricService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private getTodayDateString(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  readonly todayDateString = computed(() => this.getTodayDateString());

  // Filter Signals
  readonly selectedModule = signal<AuditModuleType>(AuditModuleType.UserManagement);
  readonly selectedProjectId = signal<string | null>(null);
  readonly selectedProgramId = signal<string | null>(null);
  readonly selectedEventAction = signal<'all' | 'created' | 'modified'>('all');
  readonly datePreset = signal<DatePreset>('today');
  readonly customFromDate = signal<string>('');
  readonly customToDate = signal<string>(this.getTodayDateString());
  readonly searchText = signal<string>('');
  readonly selectedMetricCode = signal<string | null>(null);
  readonly rawMetricTreeNodes = signal<MetricTreeNode[]>([]);
  readonly metricTreeNodes = computed<MetricTreeNode[]>(() => {
    const all = this.rawMetricTreeNodes();
    const isApproval = Number(this.selectedModule()) === AuditModuleType.ReviewApproval;
    if (isApproval) {
      // For Review Approval: Approvals exist strictly on Top-Level (Parent) metrics
      return all.map((parent) => ({
        ...parent,
        children: [],
      }));
    }
    // For Review Metric & Restatement: show full Parent-Child hierarchy
    return all;
  });
  readonly metricOptions = signal<{ code: string; label: string; group?: string; isParent: boolean }[]>([]);
  readonly metricsLoading = signal<boolean>(false);
  readonly initialProject$ = new BehaviorSubject<ImpactMasterLookup | null>(null);
  readonly initialProject = signal<ImpactMasterLookup | null>(null);
  readonly programOptions = signal<{ value: string; label: string }[]>([]);

  /**
   * Stores the APPLIED custom date range (set only when user clicks "Apply Range").
   * Separate from the input signals so badge shows confirmed range, not mid-edit values.
   */
  private readonly appliedFromDate = signal<string>('');
  private readonly appliedToDate = signal<string>('');

  /** Validation: true when dates are entered and From Date > To Date or any date is in the future */
  readonly isCustomDateRangeInvalid = computed(() => {
    const from = this.customFromDate();
    const to = this.customToDate();
    const today = this.todayDateString();
    if (!from || !to) return false;
    return from > to || to > today || from > today;
  });

  /** Range can only be applied when both dates are selected, valid (from <= to), and not in future */
  readonly canApplyCustomRange = computed(() => {
    const from = this.customFromDate();
    const to = this.customToDate();
    const today = this.todayDateString();
    return !!from && !!to && from <= to && to <= today && from <= today;
  });

  /** Computed label: "01 Sep – 30 Sep 2026" or just preset name for non-custom modes. */
  readonly dateRangeLabel = computed(() => {
    const preset = this.datePreset();
    if (preset !== 'custom') {
      const labels: Record<string, string> = { today: 'Today', '7d': 'Last 7 Days', '30d': 'Last 30 Days' };
      return labels[preset] ?? preset;
    }
    const from = this.appliedFromDate();
    const to = this.appliedToDate();
    if (!from && !to) return 'Custom (no dates set)';
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    if (from && to) return `${fmt(from)} – ${fmt(to)}`;
    if (from) return `From ${fmt(from)}`;
    return `Until ${fmt(to)}`;
  });

  // --- Server-Side Pagination Signals ---
  /** Current page number fetched from server (1-based). */
  readonly currentPage = signal<number>(1);
  /**
   * True when the last server response returned a full page (AUDIT_PAGE_SIZE items),
   * meaning more data likely exists. Button hides when server returns < AUDIT_PAGE_SIZE.
   */
  readonly hasMoreServerItems = signal<boolean>(false);

  // Project Typeahead Stream (Reused from Project Master)
  readonly projectSearch$ = new Subject<string>();

  // Debounced Search Text Stream (Prevents API spamming on every keystroke)
  readonly searchInput$ = new Subject<string>();
  readonly projects$: Observable<ImpactMasterLookup[]> = combineLatest([
    this.projectSearch$.pipe(startWith('')),
    this.initialProject$,
  ]).pipe(
    debounceTime(150),
    switchMap(([term, initProj]) => {
      const trimmed = term?.trim();
      if (!trimmed || trimmed.length < 2) {
        return of<ImpactMasterLookup[]>(initProj ? [initProj] : []);
      }
      return this.lookupService.getImpactMasters(trimmed).pipe(
        map((res) => {
          const items = res.data ?? [];
          if (initProj && !items.some((x) => String(x.impactMasterId) === String(initProj.impactMasterId))) {
            items.unshift(initProj);
          }
          return items;
        }),
        catchError((err) => {
          console.error('[AuditPageComponent] Project Typeahead Error:', err);
          return of<ImpactMasterLookup[]>(initProj ? [initProj] : []);
        }),
      );
    }),
    takeUntilDestroyed(this.destroyRef),
  );

  // Derived state (from service signals)
  readonly loading = computed(() => this.auditService.loading());
  readonly loadingMore = computed(() => this.auditService.loadingMore());
  readonly error = computed(() => this.auditService.error());

  // All loaded items (grows with each Load More page)
  readonly visibleItems = computed(() => this.auditService.items());

  // Show Project dropdown for Project Master (3), Review Lifecycle (4), Review Approval (5), Restatement (6)
  readonly showProjectFilter = computed(() => {
    const mod = Number(this.selectedModule());
    return mod === AuditModuleType.ImpactMaster
        || mod === AuditModuleType.ReviewLifecycle
        || mod === AuditModuleType.ReviewApproval
        || mod === AuditModuleType.Restatement;
  });

  // Project selection is mandatory for Review Lifecycle, Review Approval, and Restatement
  readonly isProjectRequired = computed(() => {
    const mod = Number(this.selectedModule());
    return mod === AuditModuleType.ReviewLifecycle
        || mod === AuditModuleType.ReviewApproval
        || mod === AuditModuleType.Restatement;
  });

  // Show Metric dropdown for Review Lifecycle (4), Review Approval (5), Restatement (6)
  readonly isMetricFilterApplicable = computed(() => {
    const mod = Number(this.selectedModule());
    return mod === AuditModuleType.ReviewLifecycle
        || mod === AuditModuleType.ReviewApproval
        || mod === AuditModuleType.Restatement;
  });

  // Show Program dropdown for Project Master (3), Review Lifecycle (4), Review Approval (5), Restatement (6)
  readonly showProgramFilter = computed(() => {
    const mod = Number(this.selectedModule());
    return mod === AuditModuleType.ImpactMaster
        || mod === AuditModuleType.ReviewLifecycle
        || mod === AuditModuleType.ReviewApproval
        || mod === AuditModuleType.Restatement;
  });

  // Group items by Day in Descending Order (latest first)
  readonly groupedTimelineSections = computed(() => {
    const raw = this.visibleItems();
    if (!raw.length) return [];

    const map = new Map<string, { maxTime: number; items: AuditTimelineItem[] }>();
    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    for (const item of raw) {
      const dateObj = new Date(item.changedOn);
      const timeMs = isNaN(dateObj.getTime()) ? 0 : dateObj.getTime();
      let dateKey = 'Earlier';

      if (timeMs > 0) {
        const itemDateStr = dateObj.toDateString();
        if (itemDateStr === todayStr) {
          dateKey = 'Today';
        } else if (itemDateStr === yesterdayStr) {
          dateKey = 'Yesterday';
        } else {
          dateKey = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      }

      const existing = map.get(dateKey);
      if (existing) {
        existing.items.push(item);
        if (timeMs > existing.maxTime) {
          existing.maxTime = timeMs;
        }
      } else {
        map.set(dateKey, { maxTime: timeMs, items: [item] });
      }
    }

    // Convert map to array and sort descending by maxTime (newest date section first at top!)
    const sections = Array.from(map.entries()).map(([dateKey, val]) => {
      // Sort items within each day strictly descending by exact timestamp (seconds and milliseconds)
      val.items.sort((a, b) => {
        const timeA = new Date(a.changedOn).getTime();
        const timeB = new Date(b.changedOn).getTime();
        if (timeA !== timeB) {
          return timeB - timeA; // Descending: newer timestamp first
        }
        // Sub-millisecond tie-breaker via ISO string comparison
        const strCmp = (b.changedOn || '').localeCompare(a.changedOn || '');
        if (strCmp !== 0) {
          return strCmp;
        }
        return 0; // Stable preservation of field order from SQL
      });

      return {
        dateKey,
        maxTime: val.maxTime,
        items: val.items,
      };
    });

    sections.sort((a, b) => b.maxTime - a.maxTime);

    return sections;
  });


  readonly moduleOptions = [
    { value: AuditModuleType.UserManagement, label: 'User Management' },
    { value: AuditModuleType.MetricMaster, label: 'Metric Master' },
    { value: AuditModuleType.ImpactMaster, label: 'Project Master' },
    { value: AuditModuleType.ReviewLifecycle, label: 'Review Metric' },
    { value: AuditModuleType.ReviewApproval, label: 'Review Approval' },
    { value: AuditModuleType.Restatement, label: 'Restatement' },
  ];

  readonly datePresetOptions: { value: DatePreset; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: 'custom', label: 'Custom Range' },
  ];

  readonly eventActionOptions: { value: 'all' | 'created' | 'modified'; label: string }[] = [
    { value: 'all', label: 'All Actions' },
    { value: 'created', label: 'Created' },
    { value: 'modified', label: 'Modified' },
  ];

  getModuleName(mod: AuditModuleType): string {
    const opt = this.moduleOptions.find((m) => m.value === mod);
    return opt ? opt.label : 'this module';
  }

  ngOnInit(): void {
    // Read route queryParams for deep linking (e.g. from Approval Progress modal)
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      let shouldFetch = false;

      if (params['module']) {
        const mod = params['module'];
        if (mod === 'ReviewApproval' || mod === '5') {
          this.selectedModule.set(AuditModuleType.ReviewApproval);
          shouldFetch = true;
        } else if (mod === 'ReviewLifecycle' || mod === '4' || mod === 'ReviewMetric') {
          this.selectedModule.set(AuditModuleType.ReviewLifecycle);
          shouldFetch = true;
        } else if (mod === 'Restatement' || mod === '6') {
          this.selectedModule.set(AuditModuleType.Restatement);
          shouldFetch = true;
        }
      }

      if (params['projectId']) {
        const pId = String(params['projectId']);
        const pName = params['projectName'] ? String(params['projectName']) : '';
        this.selectedProjectId.set(pId);
        this.loadMetricsForProject(pId);

        // Immediate seed so ng-select displays project name/PIN without waiting for network
        const seedProject: ImpactMasterLookup = {
          impactMasterId: Number(pId) || (pId as any),
          pin: '',
          title: pName || `Project #${pId}`,
          fundingRecipientName: '',
        };
        this.initialProject.set(seedProject);
        this.initialProject$.next(seedProject);

        // Fetch full project details (including PIN) from lookup service
        this.lookupService
          .getImpactMasters(pName || pId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res) => {
              const found =
                (res.data ?? []).find((x) => String(x.impactMasterId) === pId) ||
                res.data?.[0];
              if (found) {
                this.initialProject.set(found);
                this.initialProject$.next(found);
              }
            },
          });
        shouldFetch = true;
      }

      if (params['metricCode']) {
        this.selectedMetricCode.set(String(params['metricCode']));
        shouldFetch = true;
      }

      if (params['preset']) {
        this.datePreset.set(params['preset'] as DatePreset);
        shouldFetch = true;
      }

      if (params['search']) {
        this.searchText.set(String(params['search']));
        shouldFetch = true;
      }

      if (shouldFetch) {
        this.fetchAuditTimeline(false);
      }
    });

    // Load Program Dropdown Options
    this.lookupService
      .getPrograms()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const options = (res.data ?? []).map((p) => ({
            value: p.programId,
            label: p.name ?? (p as any).programName ?? p.code,
          }));
          this.programOptions.set(options);
        },
        error: (err) => console.error('[AuditPageComponent] Program lookup error:', err),
      });

    // 300ms Debounce stream for Keyword Search
    this.searchInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((term) => {
      this.searchText.set(term);
      this.fetchAuditTimeline(false); // reset: page 1, replace list
    });

    // Perform default initial fetch only if queryParams did not trigger one
    const snapshot = this.route.snapshot.queryParams;
    if (!snapshot['module'] && !snapshot['projectId'] && !snapshot['metricCode']) {
      this.fetchAuditTimeline(false);
    }
  }

  private activeFetchSub?: import('rxjs').Subscription;

  /**
   * Core fetch method.
   * @param isLoadMore false → reset to page 1, replace list (filter change / initial load)
   *                   true  → increment page, append to list (Load More clicked)
   */
  fetchAuditTimeline(isLoadMore = false): void {
    // Unsubscribe from any in-flight request to prevent race conditions when typing quickly
    if (!isLoadMore && this.activeFetchSub) {
      this.activeFetchSub.unsubscribe();
      this.activeFetchSub = undefined;
    }

    // If module requires a project and none is selected, clear list and skip query
    if (this.isProjectRequired() && !this.selectedProjectId()) {
      this.auditService.clearItems();
      this.hasMoreServerItems.set(false);
      return;
    }

    let fromStr: string | undefined;
    let toStr: string | undefined;

    const preset = this.datePreset();
    const now = new Date();

    if (preset === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      fromStr = startOfDay.toISOString();
      toStr = endOfDay.toISOString();
    } else if (preset === '7d') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      fromStr = d7.toISOString();
      toStr = now.toISOString();
    } else if (preset === '30d') {
      const d30 = new Date();
      d30.setDate(d30.getDate() - 30);
      fromStr = d30.toISOString();
      toStr = now.toISOString();
    } else if (preset === 'custom') {
      if (this.customFromDate()) {
        const [y, m, d] = this.customFromDate().split('-').map(Number);
        fromStr = new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
      }
      if (this.customToDate()) {
        const [y, m, d] = this.customToDate().split('-').map(Number);
        toStr = new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
      }
    }

    // Determine which page to request
    let pageToFetch: number;
    if (isLoadMore) {
      // Increment page for append mode
      pageToFetch = this.currentPage() + 1;
      this.currentPage.set(pageToFetch);
    } else {
      // Reset to page 1 for filter changes / initial load
      pageToFetch = 1;
      this.currentPage.set(1);
      this.hasMoreServerItems.set(false); // hide button until response arrives
    }

    this.activeFetchSub = this.auditService
      .getAuditTimeline(
        {
          module: Number(this.selectedModule()),
          fromDate: fromStr,
          toDate: toStr,
          projectId: this.selectedProjectId() ?? undefined,
          programId: this.selectedProgramId() ?? undefined,
          searchText: this.searchText() || undefined,
          metricCode: this.selectedMetricCode() || undefined,
          eventAction: this.selectedEventAction() === 'all' ? undefined : this.selectedEventAction(),
          pageNumber: pageToFetch,
          pageSize: AUDIT_PAGE_SIZE,
        },
        isLoadMore, // appendMode
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const items = res.data ?? [];
          const count = items.length;

          // Show Load More if server returned a full page (implies more rows may exist beyond this page)
          this.hasMoreServerItems.set(count >= AUDIT_PAGE_SIZE);
        },
        error: () => {
          // Error already handled in service; reset button visibility
          this.hasMoreServerItems.set(false);
        },
      });
  }


  onModuleChange(mod: AuditModuleType): void {
    this.selectedModule.set(mod);
    // Auto-clear all active filters when switching modules
    this.resetFilterSignals();
    this.fetchAuditTimeline(false); // reset: page 1, replace list
  }

  onProgramChange(programId: string | null): void {
    this.selectedProgramId.set(programId);
    this.fetchAuditTimeline(false); // reset: page 1, replace list
  }

  onProjectChange(projectId: string | null): void {
    this.selectedProjectId.set(projectId);
    this.selectedMetricCode.set(null);
    if (this.isMetricFilterApplicable() && projectId) {
      this.loadMetricsForProject(projectId);
    } else {
      this.metricOptions.set([]);
    }
    this.fetchAuditTimeline(false); // reset: page 1, replace list
  }

  onMetricCodeChange(code: string | null): void {
    this.selectedMetricCode.set(code);
    this.fetchAuditTimeline(false);
  }

  resetMetricFilter(): void {
    this.selectedMetricCode.set(null);
    this.fetchAuditTimeline(false);
  }

  loadMetricsForProject(projectId: string | number | null): void {
    if (!projectId) {
      this.rawMetricTreeNodes.set([]);
      this.metricOptions.set([]);
      this.selectedMetricCode.set(null);
      return;
    }

    this.metricsLoading.set(true);
    // Fetch all system metrics so all top-level parents and child sub-metrics are always available
    this.metricService
      .getAllMetrics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const raw = res.data ?? [];
          if (raw.length > 0) {
            this.buildMetricTree(raw);
          } else {
            this.fallbackToProjectMetrics(projectId);
          }
          this.metricsLoading.set(false);
        },
        error: (err) => {
          console.warn('[AuditPageComponent] getAllMetrics error, falling back:', err);
          this.fallbackToProjectMetrics(projectId);
        },
      });
  }

  private fallbackToProjectMetrics(projectId: string | number): void {
    this.metricService
      .GetMetricsForProject(+projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.buildMetricTree(res.data ?? []);
          this.metricsLoading.set(false);
        },
        error: () => {
          this.rawMetricTreeNodes.set([]);
          this.metricsLoading.set(false);
        },
      });
  }

  private buildMetricTree(raw: any[]): void {
    const parents: MetricTreeNode[] = [];
    const childrenByParentId = new Map<string, MetricTreeNode[]>();
    const processedChildIds = new Set<string>();

    for (const item of raw) {
      const code = String(item.metricCode || item.code || '');
      const name = String(item.metricName || item.name || '');
      const metricId = String(item.metricId || '');
      const isTopLevel = Boolean(item.isTopLevel);
      const parentMetricId = item.parentMetricId ? String(item.parentMetricId) : null;

      if (!code) continue;

      const node: MetricTreeNode = {
        metricId,
        code,
        name,
        isTopLevel,
        children: [],
      };

      if (isTopLevel || !parentMetricId) {
        parents.push(node);
      } else {
        if (!childrenByParentId.has(parentMetricId)) {
          childrenByParentId.set(parentMetricId, []);
        }
        childrenByParentId.get(parentMetricId)!.push(node);
      }
    }

    // Attach children to respective parent
    for (const p of parents) {
      const children = childrenByParentId.get(String(p.metricId)) ?? [];
      for (const c of children) {
        processedChildIds.add(String(c.metricId));
      }
      p.children = children;
    }

    // Fallback for any children whose parent wasn't in top-level
    for (const [pId, children] of childrenByParentId.entries()) {
      for (const c of children) {
        if (!processedChildIds.has(String(c.metricId))) {
          parents.push({
            metricId: c.metricId,
            code: c.code,
            name: c.name,
            isTopLevel: false,
            children: [],
          });
        }
      }
    }

    this.rawMetricTreeNodes.set(parents);
  }

  onProjectSearch(event: { term: string }): void {
    this.projectSearch$.next(event?.term ?? '');
  }

  onPresetChange(preset: DatePreset): void {
    this.datePreset.set(preset);
    if (preset === 'custom') {
      if (!this.customToDate() || this.customToDate() > this.todayDateString()) {
        this.customToDate.set(this.todayDateString());
      }
    } else {
      this.fetchAuditTimeline(false); // reset: page 1, replace list
    }
  }

  onCustomFromDateChange(val: string): void {
    this.customFromDate.set(val);
    if (!this.customToDate()) {
      this.customToDate.set(this.todayDateString());
    }
  }

  onCustomToDateChange(val: string): void {
    this.customToDate.set(val);
  }

  onApplyCustomRange(): void {
    if (!this.canApplyCustomRange() || this.isCustomDateRangeInvalid()) {
      return;
    }
    // Snapshot the applied range so the badge shows confirmed dates
    this.appliedFromDate.set(this.customFromDate());
    this.appliedToDate.set(this.customToDate());
    this.fetchAuditTimeline(false); // reset: page 1, replace list
  }

  /** Search text change: passes term through 300ms debounced stream. */
  onSearchTextChange(term: string): void {
    this.searchInput$.next(term);
  }

  onEventActionChange(action: 'all' | 'created' | 'modified'): void {
    this.selectedEventAction.set(action);
    this.fetchAuditTimeline(false); // reset: page 1, replace list
  }

  resetEventAction(): void {
    this.selectedEventAction.set('all');
    this.fetchAuditTimeline(false);
  }

  resetSearchText(): void {
    this.searchText.set('');
    this.searchInput$.next('');
    this.fetchAuditTimeline(false);
  }

  resetDatePreset(): void {
    this.datePreset.set('today');
    this.customFromDate.set('');
    this.customToDate.set(this.todayDateString());
    this.appliedFromDate.set('');
    this.appliedToDate.set('');
    this.fetchAuditTimeline(false);
  }

  resetProgramFilter(): void {
    this.selectedProgramId.set(null);
    this.fetchAuditTimeline(false);
  }

  resetProjectFilter(): void {
    this.selectedProjectId.set(null);
    this.selectedMetricCode.set(null);
    this.rawMetricTreeNodes.set([]);
    this.metricOptions.set([]);
    this.initialProject.set(null);
    this.initialProject$.next(null);
    this.projectSearch$.next('');
    this.fetchAuditTimeline(false);
  }

  clearAllFilters(): void {
    this.resetFilterSignals();
    this.fetchAuditTimeline(false); // reset: page 1, replace list
  }

  private resetFilterSignals(): void {
    this.selectedProjectId.set(null);
    this.projectSearch$.next('');
    this.initialProject.set(null);
    this.initialProject$.next(null);
    this.selectedMetricCode.set(null);
    this.rawMetricTreeNodes.set([]);
    this.metricOptions.set([]);
    this.selectedProgramId.set(null);
    this.selectedEventAction.set('all');
    this.datePreset.set('today');
    this.customFromDate.set('');
    this.customToDate.set(this.todayDateString());
    this.appliedFromDate.set('');
    this.appliedToDate.set('');
    this.searchText.set('');
  }

  /** Load More: fetch next page and append results to existing list. */
  loadMore(): void {
    if (this.loadingMore() || !this.hasMoreServerItems()) return;
    this.fetchAuditTimeline(true); // append: next page
  }
}

