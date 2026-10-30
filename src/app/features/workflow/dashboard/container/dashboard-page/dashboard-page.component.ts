import {
  Component,
  computed,
  effect,
  inject,
  signal,

} from '@angular/core';

import { CommonModule } from '@angular/common';
// import { ImpactMetricCardComponent } from '../impact-metric-card/impact-metric-card.component';

import type { DashboardMetric, DashboardPortfolioAdjustmentByCategories, DashboardPortfolioList, DashboardPortfolioListRequest, DashboardProgram, DashboardTableProgramRow, DashboardTableProjectRow } from '../../model/dashboard.model';
import { ImpactMetricCardComponent } from '../../component/impact-metric-card.component';
import { DashboardService } from '../../service/dashboard.service';
import { ImpactMasterService } from '../../../../admin/projects/services/project-new.service';
import { LookupService } from '../../../../../core/services/lookup-service'
import { PageLoadingService } from '../../../../../core/services/page-loading.service';
// import { LucideIcons } from 'lucide-angular';

import { SelectComponent } from "../../../../../shared/ui/select/select.component";
import { LucideAngularModule, LoaderCircle, LucideIconProvider, LUCIDE_ICONS } from "lucide-angular";
import { FormsModule } from "@angular/forms";
import { ImpactMasterFilterOptionsDto } from '../../../../admin/projects/models/project-new.model';
import { forkJoin } from 'rxjs';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ActionAccess } from '../../../../../core/auth/models/authorization.model';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthorizationService, AuthStateService } from '../../../../../core/auth';
export interface PortfolioCategory {
  code: string;
  name: string;
  color?: string;
  textColor?: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    ImpactMetricCardComponent,
    SelectComponent,
    LucideAngularModule,
    FormsModule,
    NgSelectModule

  ],

  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        LoaderCircle
      }),
    },
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css'

})
export class DashboardPageComponent {
  private readonly pageLoadingService = inject(PageLoadingService);

  metrics = signal<DashboardPortfolioAdjustmentByCategories[]>([]); // contains portfolio adjustment by categories



  portfolioList = signal<DashboardPortfolioList | null>(null);

  totalRecords = computed<number>(() => {
    return this.portfolioList()?.totalRecord ?? 0;
  });

  isSinceInceptionSelected = signal<boolean>(false);
  selectedYear = signal<string>(new Date().getFullYear().toString());


  selectedPeriod = signal<string>('A');

  selectedYears = signal<string[]>([
    new Date().getFullYear().toString()
  ]);

  selectedPeriods = signal<string[]>(['A']);

  selectedPeriodCodes = computed(() => {
    return this.calculatePeriodCodes(
      this.selectedYears(),
      this.selectedPeriods()
    );
  });

  selectedCategory = signal<string>('ALL');

  periodCode = computed(() => `${this.selectedYear()}-${this.selectedPeriod()

    }`

  );


  periodStartDate = signal<string>('');
  periodEndDate = signal<string>('');



  selectedProgramId = signal<string | null>(null); // filter by program ID
  selectedRecordTypeId = signal<string | null>(null); // filter by record type ID
  selectedStatusId = signal<string | null>(null); // filter by status ID

  programsFilteroptions = signal<{ programId: string; name: string }[]>([]);
  recordTypesFilterOptions = signal<{ recordTypeId: string; name: string }[]>([]);
  statusFilterOptions = signal<{ statusId: string; statusName: string }[]>([]);


  private readonly metricsLoaded = signal(false);
  private readonly portfolioListLoaded = signal(false);
  private readonly pendingMetricsRequests = signal(0);
  private readonly pendingPortfolioListRequests = signal(0);
  readonly loading = computed(() =>
    !this.metricsLoaded() ||
    !this.portfolioListLoaded() ||
    this.pendingMetricsRequests() > 0 ||
    this.pendingPortfolioListRequests() > 0
  );
  readonly filterOptions = signal<ImpactMasterFilterOptionsDto | null>(null);

  searchTerm = signal<string>('');
  searchInput = signal<string>('');
  private searchSubject = new Subject<string>();


  private readonly dashboardStateKey = 'dashboardState';


  expandedProgramId = signal<string | null>(null); // contains the ID of the currently expanded program, if any

  currentPage = signal(1);

  pageSize = signal(10);

  pageSizeOptions = [10, 20, 50, 100];

  private readonly authStateService = inject(AuthStateService);
  private readonly authorizationService = inject(AuthorizationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly actionAccess = signal<ActionAccess[]>([]);
  private readonly pageKey = 'DASHBOARD';




  constructor(
    private readonly dashboardService: DashboardService,
    private readonly impactMasterService: ImpactMasterService,
    private readonly lookupService: LookupService,
    private readonly router: Router
  ) {
    this.restoreDashboardState();
    this.searchSubject
      .pipe(
        debounceTime(2000),
        distinctUntilChanged()
      )
      .subscribe(term => {

        console.log('Debounced Search Term:', term);

        this.searchTerm.set(term);

        // Reset pagination when new search happens
        this.currentPage.set(1);
      });


    effect(() => {

      // Read the computed signal so Angular tracks changes
      // const period = this.periodCode();
      // this.isFilterorPaginationChange();
      // debugger;
      // console.log('Period changed:', period);

      this.loadAdjustmentByCategories();
      this.loadPortfolioList();

    });
  }

  // ACTION SIGNALS
   protected readonly canViewTopLevelMetricDetails = computed(() =>
    this.actionAccess().some(
      (action) => action.key === 'VIEWTOPLEVELMETRICDETAILS' && action.value,
    ),
  );

  protected readonly canUseYearQuarterFilter = computed(() =>
    this.actionAccess().some(
      (action) => action.key === 'YEARQUARTERFILTER' && action.value,
    ),
  );


  ngOnInit(): void {
    this.pageLoadingService.stop();
    this.loadfilterfromlookups();
    this.loadActionAccess();
  }

  private loadActionAccess(): void {
  const userId = this.authStateService.getCurrentUserId();

  if (!userId) {
    console.error('[Authorization] Current user ID not available.');
    return;
  }

  this.authorizationService
    .getActionAccess(this.pageKey, userId)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (response) => {
        this.actionAccess.set(response.data ?? []);
      },
      error: (error) => {
        console.error('[Authorization] Failed to load Dashboard action access:', error);
        this.actionAccess.set([]);
      },
    });
}

  loadAdjustmentByCategories(): void {
    this.pendingMetricsRequests.update(count => count + 1);


    const request = {
      categoryCode: this.selectedCategory(),
      reviewPeriodCodes: this.selectedPeriodCodes(),
      sinceInception: this.isSinceInceptionSelected()
    };

    console.log('Request for Dashboard Portfolio Adjustment By Categories:', request);
    //   const selectedPeriodCodes = this.calculatePeriodCodes(
    //   this.selectedYears(),
    //   this.selectedPeriods()
    // );
    //   console.log('Request for Dashboard Portfolio Adjustment By Categories:', selectedPeriodCodes);
    // return
    debugger;
    this.dashboardService
      .getDashboardPortfolioAdjustmentByCategories(request)
      .pipe(finalize(() => {
        this.pendingMetricsRequests.update(count => count - 1);
        if (this.pendingMetricsRequests() === 0) {
          this.metricsLoaded.set(true);
        }
      }))
      .subscribe({
        next: (response) => {

          console.log(
            'Dashboard Portfolio Adjustment By Categories:',
            response
          );

          this.metrics.set(response.data);

          console.log(
            'Metric:',
            this.metrics()
          );
        },

        error: (error) => {
          console.error(
            'Failed to load dashboard metrics:',
            error

          );
        }


      });
  }





  filteredMetrics = computed(() => {


    const metrics = this.metrics();

    if (!metrics || metrics.length === 0) {
      return [];
    }

    const category = this.selectedCategory();

    if (category === 'ALL') {
      return metrics;
    }

    const filteredMetrics = metrics.filter(metric => metric.code.split('.')[0] === category);

    return filteredMetrics;
  });


  selectCategory(categoryCode: string): void {

    this.selectedCategory.set(categoryCode);

    // this.loadAdjustmentByCategories();
    // this.loadPortfolioList();
  }

  categories = signal<PortfolioCategory[]>([{ code: 'ALL', name: 'All Categories' }, { code: 'MW', name: 'Material Waste', color: '#2874A6', textColor: '#FFFFFF' }, { code: 'CV', name: 'Circular Value', color: '#25804A', textColor: '#FFFFFF' }, { code: 'EE', name: 'Enable Ecosystem', color: '#9BCB5A', textColor: '#17324D' }, { code: 'MC', name: 'Mobilized Capital', color: '#D97B60', textColor: '#FFFFFF' }, { code: 'SB', name: 'Social Benefits', color: '#8EC3D4', textColor: '#17324D' }]);

  // yearOptions = Array.from(
  //   { length: 31 },
  //   (_, index) => {
  //     const year = 2016 + index;

  //     return {
  //       label: year.toString(),
  //       value: year.toString()
  //     };
  //   }
  // );

  yearOptions = Array.from(
    { length: 11 },
    (_, index) => {

      const currentYear = new Date().getFullYear();
      const year = currentYear - index;

      return {
        label: year.toString(),
        value: year.toString()
      };
    }
  );

  periodOptions = [
    {
      label: 'Annual',
      value: 'A'
    },
    {
      label: 'Q1',
      value: 'Q1'
    },
    {
      label: 'Q2',
      value: 'Q2'
    },
    {
      label: 'Q3',
      value: 'Q3'
    },
    {
      label: 'Q4',
      value: 'Q4'
    }
  ];


  onPeriodChange(values: string[]): void {
    if (!values || values.length === 0) {
      this.selectedPeriods.set([]);
      return;
    }

    // Annual selected
    if (values.includes('A')) {
      this.selectedPeriods.set(['A']);
      return;
    }

    // Only quarters selected
    this.selectedPeriods.set(values);
  }

  private calculatePeriodCodes(
    years: string[],
    periods: string[]
  ): string[] {
    return years.flatMap(year =>
      periods.map(period => `${year}-${period}`)
    );
  }
  resetFilters(): void {
    // Default current year
    this.selectedYears.set([
      new Date().getFullYear().toString()
    ]);

    // Default Annual
    this.selectedPeriods.set(['A']);

    // Disable Since Inception
    this.isSinceInceptionSelected.set(false);

    // Clear validation message if you have one
    // this.periodValidationError.set('');
  }


  private saveDashboardState(): void {
    const state = {
      selectedProgramId: this.selectedProgramId(),
      selectedRecordTypeId: this.selectedRecordTypeId(),
      selectedStatusId: this.selectedStatusId(),
      selectedCategory: this.selectedCategory(),

      selectedYears: this.selectedYears(),
      selectedPeriods: this.selectedPeriods(),
      isSinceInceptionSelected: this.isSinceInceptionSelected(),

      periodStartDate: this.periodStartDate(),
      periodEndDate: this.periodEndDate(),

      searchTerm: this.searchTerm(),
      searchInput: this.searchInput(),

      currentPage: this.currentPage(),
      pageSize: this.pageSize(),
      // expandedProgramId: this.expandedProgramId()
    };

    sessionStorage.setItem(
      this.dashboardStateKey,
      JSON.stringify(state)
    );
  }


  private restoreDashboardState(): void {
    const savedState = sessionStorage.getItem(
      this.dashboardStateKey
    );

    if (!savedState) {
      return;
    }

    try {
      const state = JSON.parse(savedState);

      this.selectedProgramId.set(state.selectedProgramId ?? null);
      this.selectedRecordTypeId.set(state.selectedRecordTypeId ?? null);
      this.selectedStatusId.set(state.selectedStatusId ?? null);
      this.selectedCategory.set(state.selectedCategory ?? 'ALL');

      this.selectedYears.set(
        Array.isArray(state.selectedYears)
          ? state.selectedYears
          : [new Date().getFullYear().toString()]
      );

      this.selectedPeriods.set(
        Array.isArray(state.selectedPeriods)
          ? state.selectedPeriods
          : ['A']
      );

      this.isSinceInceptionSelected.set(
        state.isSinceInceptionSelected ?? false
      );

      this.periodStartDate.set(state.periodStartDate ?? '');
      this.periodEndDate.set(state.periodEndDate ?? '');

      this.searchTerm.set(state.searchTerm ?? '');
      this.searchInput.set(state.searchInput ?? state.searchTerm ?? '');

      this.currentPage.set(state.currentPage ?? 1);
      this.pageSize.set(state.pageSize ?? 10);

      // this.expandedProgramId.set(state.expandedProgramId ?? null);

    } catch (error) {
      console.error('Failed to restore dashboard state:', error);
      sessionStorage.removeItem(this.dashboardStateKey);
    }
  }


  ////////////////////////////////////--Table section -//////////////////////////////////////////////////

  // =========================================================
  // TABLE DATA
  // =========================================================
  loadPortfolioList(): void {
    this.pendingPortfolioListRequests.update(count => count + 1);
    const reviewPeriodCodes = this.selectedPeriodCodes();



    const request: DashboardPortfolioListRequest = {

      reviewPeriodCodes,

      categoryCode: this.selectedCategory() ?? 'ALL',

      programId: this.selectedProgramId() ?? null,

      statusId: this.selectedStatusId() ?? null,

      recordTypeId: this.selectedRecordTypeId() ?? null,

      searchTerm: this.searchTerm() ?? null,

      pageNumber: this.currentPage(),

      pageSize: this.pageSize(),
      sinceInception: this.isSinceInceptionSelected()
    };

    this.dashboardService
      .getDashboardPortfolioList(request)
      .pipe(finalize(() => {
        this.pendingPortfolioListRequests.update(count => count - 1);
        if (this.pendingPortfolioListRequests() === 0) {
          this.portfolioListLoaded.set(true);
        }
      }))
      .subscribe({

        next: response => {

          console.log(
            'Dashboard Portfolio List:',
            response
          );

          const data = response.data;

          console.log(
            'Dashboard Portfolio List Data:',
            data
          );

          this.portfolioList.set(data);
          // this.loading.set(false);
        },

        error: error => {

          console.error(
            'Failed to load dashboard portfolio list:',
            error
          );
          // this.loading.set(false)
          this.portfolioList.set(null);

        }

      });
  }

  tableMetrics = computed<DashboardMetric[]>(() => {

    return this.portfolioList()?.metrics ?? [];

  });



  // =========================================================
  // PROGRAMS
  // =========================================================

  programs = computed<DashboardProgram[]>(() => {

    return this.portfolioList()?.programs ?? [];

  });

  tableRows = computed<DashboardTableProgramRow[]>(() => {

    const programs = this.programs();

    return programs.map(program => {

      const programMetricValues =
        this.createMetricMap(
          program.metrics as any
        );

      const projects: DashboardTableProjectRow[] =
        (program.impacts ?? []).map(impact => ({

          impactMasterId:
            impact.impactMasterId ?? '',

          pin:
            impact.pin ?? '',

          impactName:
            impact.impactName ?? '',

          categoryCode:
            impact.categoryCode ?? '',

          categoryName:
            impact.categoryName ?? '',

          color:
            impact.color ?? '',

          statusCode:
            impact.statusCode ?? '',

          statusName:
            impact.statusName ?? '',

          recordTypeName:
            impact.recordTypeName ?? '',

          metricValues:
            this.createMetricMap(
              impact.metrics as any
            ),

          fundingRecipients: impact.fundingRecipients ?? ''



        }));

      return {

        programId:
          program.programId ?? '',

        programCode:
          program.programCode ?? '',

        programName:
          program.programName ?? '',

        projectCount:
          Number(program.projectCount) || 0,

        metricValues:
          programMetricValues,

        projects

      };

    });

  });

  private createMetricMap(
    metrics: {
      metricCode: string;
      riskAdjustment: string;
    }[]
  ): Record<string, string> {

    const result: Record<string, string> = {};

    for (const metric of metrics) {

      result[metric.metricCode] =
        metric.riskAdjustment;

    }

    return result;
  }

  toggleProgram(programId: string): void {

    this.expandedProgramId.update(current =>
      current === programId
        ? null
        : programId
    );
  }

  isProgramExpanded(programId: string): boolean {

    return this.expandedProgramId() === programId;

  }

  formatMetricValue(
    value: string | number | null | undefined
  ): string {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '—';
    }

    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      return String(value);
    }

    if (numberValue === 0) {
      return '—';
    }

    return this.formatNumber(numberValue);
  }

  // private formatNumber(value: number): string {

  //   if (Math.abs(value) >= 1_000_000) {

  //     return `${(value / 1_000_000)
  //       .toFixed(1)
  //       .replace('.0', '')}M`;

  //   }

  //   if (Math.abs(value) >= 1_000) {

  //     return `${(value / 1_000)
  //       .toFixed(1)
  //       .replace('.0', '')}K`;

  //   }

  //   return value
  //     .toLocaleString('en-US', {
  //       maximumFractionDigits: 2
  //     });

  // }

  private formatNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('en-US', {
      maximumFractionDigits: 2
    })}M`;
  }

  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toLocaleString('en-US', {
      maximumFractionDigits: 2
    })}K`;
  }

  return value.toLocaleString('en-US', {
    maximumFractionDigits: 2
  });
}

  //  onEditImpactMaster(impactMaster: ImpactMasterListModel): void {
  //      this.router.navigate(['/admin/projects-info', impactMaster.impactMasterId], {
  //        queryParams: {
  //          recordTypeId: impactMaster.recordTypeId,
  //        },
  //      });
  //    }

  onMetricValueClick(
    project: DashboardTableProjectRow,
    metric: DashboardMetric,
    event: MouseEvent
  ): void {

    event.stopPropagation();

    const impactMasterId = project.impactMasterId;

    const recordType = this.recordTypesFilterOptions().find(
      x => x.name === project.recordTypeName
    );

    if (!recordType) {
      console.error(
        'Record Type not found:',
        project.recordTypeName
      );
      return;
    }

    const recordTypeId = recordType.recordTypeId;



    this.mapPeriodCodeDates()

    this.saveDashboardState();

    this.router.navigate(['/admin/projects-info', impactMasterId], {
      queryParams: {
        from: 'dashboard',
        recordTypeId: recordTypeId,
        tlm: metric.metricCode,
        ...(!this.isSinceInceptionSelected() && {
          startDate: this.periodStartDate(),
          endDate: this.periodEndDate(),
        }),
      },
    });

  }



  mapPeriodCodeDates(): void {
    const period = this.periodCode();

    const [yearString, periodType] = period.split('-');
    const year = Number(yearString);

    if (!year || !periodType) {
      this.periodStartDate.set('');
      this.periodEndDate.set('');
      return;
    }

    let startMonth: number;
    let endMonth: number;

    switch (periodType) {
      case 'Q1':
        startMonth = 0;
        endMonth = 2;
        break;

      case 'Q2':
        startMonth = 3;
        endMonth = 5;
        break;

      case 'Q3':
        startMonth = 6;
        endMonth = 8;
        break;

      case 'Q4':
        startMonth = 9;
        endMonth = 11;
        break;

      case 'A':
        startMonth = 0;
        endMonth = 11;
        break;

      default:
        this.periodStartDate.set('');
        this.periodEndDate.set('');
        return;
    }

    const startDate = new Date(year, startMonth, 1);

    // Day 0 of the next month gives the last day of the current month
    const endDate = new Date(year, endMonth + 1, 0);

    const formatDate = (date: Date): string => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');

      // return `${yyyy}-${mm}-${dd}T00:00:00`;
      return `${yyyy}-${mm}-${dd}`;
    };

    this.periodStartDate.set(formatDate(startDate));
    this.periodEndDate.set(formatDate(endDate));
  }
  // ----------------------------------Search and filter----------------------------------------------
  onGlobalSearchClick() { }

  onProgramFilterChange(value: string | null): void {
    this.selectedProgramId.set(value);

  }

  onRecordTypeFilterChange(value: string | null): void {
    this.selectedRecordTypeId.set(value);

  }

  onStatusFilterChange(value: string | null): void {
    this.selectedStatusId.set(value);

  }

  // private loadFilterOptions(): void {
  //   this.impactMasterService
  //     .getImpactMasterFilterOptions(
  //       this.selectedProgramId() || null,
  //       this.selectedRecordTypeId() || null,
  //       this.selectedStatusId() || null,
  //     )
  //     .subscribe({
  //       next: (result) => {
  //         this.filterOptions.set(result);
  //         console.log('Filter options:', result);
  //       },
  //       error: (error) => {
  //         console.error('Failed to load impact master filter options', error);
  //       },
  //     });
  // }

  private loadfilterfromlookups(): void {
    forkJoin({
      programs: this.lookupService.getPrograms(),
      recordTypes: this.lookupService.getRecordTypes(),
      statuses: this.lookupService.getStatusesByModule('ImpactMaster'),
      metricCategories: this.lookupService.getMetricCategories(),
    }).subscribe({
      next: (result) => {
        this.programsFilteroptions.set(result.programs.data ?? []);
        const statuses = (result.statuses.data ?? []).filter(
          status => status.statusName?.toLowerCase() !== 'draft'
        );

        this.statusFilterOptions.set(statuses);
        this.recordTypesFilterOptions.set(result.recordTypes.data ?? []);
        // this.metricCategories.set(result.metricCategories.data ?? []);
      },
      error: (error) => {
        console.error('Failed to load lookups', error);
      },
    });
  }

  // onSearchChange(value: string): void {

  //   console.log('User typing:', value);

  //   // this.searchInput.set(value);

  //   this.searchSubject.next(value);
  //   // this.loadPortfolioList();
  // }

  onSearchChange(value: string): void {
    this.searchInput.set(value);
    this.searchSubject.next(value);
  }

  clearTablefilter() {
    this.selectedStatusId.set(null)
    this.selectedProgramId.set(null)
    this.selectedRecordTypeId.set(null)
    this.searchTerm.set('')
  }
  //--------------------------------------------------Pagination----------------------------------------------
  totalPages = computed(() => {

    const total = this.totalRecords();

    if (total === 0) {
      return 1;
    }

    return Math.ceil(
      total / this.pageSize()
    );

  });

  goToPage(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages() ||
      page === this.currentPage()
    ) {
      return;
    }

    this.currentPage.set(page);

    this.loadPortfolioList();
  }

  previousPage(): void {

    this.goToPage(
      this.currentPage() - 1
    );

  }

  nextPage(): void {

    this.goToPage(
      this.currentPage() + 1
    );

  }

  changePageSize(size: number): void {

    this.pageSize.set(size);

    this.currentPage.set(1);

    this.loadPortfolioList();

  }

  pageStart = computed(() => {

    if (this.totalRecords() === 0) {
      return 0;
    }

    return (
      (this.currentPage() - 1) *
      this.pageSize()
    ) + 1;

  });

  pageEnd = computed(() => {

    return Math.min(
      this.currentPage() * this.pageSize(),
      this.totalRecords()
    );

  });

  ///////////////////////////////////////////////////////////////////////////////////////

  protected readonly recordTypeColors: Record<string, string> = {
    Project: 'bg-[hsl(var(--aepw-blue)/0.12)] text-[hsl(var(--aepw-blue))]',

    Corporate: 'bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))]',
  };
  protected readonly projectCategoryColors: Record<string, string> = {
    Pilot: 'bg-[hsl(var(--aepw-blue)/0.12)] text-[hsl(var(--aepw-blue))]',

    'Fast Track': 'bg-[hsl(var(--aepw-green)/0.12)] text-[hsl(var(--aepw-green))]',

    Anchor: 'bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))]',

    Other: 'bg-[hsl(var(--aepw-dark-grey)/0.12)] text-[hsl(var(--aepw-dark-grey))]',
  };
  protected readonly statusColors: Record<string, string> = {
    Draft: 'bg-[hsl(var(--aepw-yellow)/0.12)] text-[hsl(var(--aepw-yellow))]',
    'Active with reporting': 'bg-[hsl(var(--aepw-green)/0.12)] text-[hsl(var(--aepw-green))]',

    'Active with no reporting': 'bg-[hsl(var(--aepw-blue)/0.12)] text-[hsl(var(--aepw-blue))]',

    'Closed with further reporting':
      'bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))]',

    'Closed with no further reporting':
      'bg-[hsl(var(--aepw-dark-grey)/0.12)] text-[hsl(var(--aepw-dark-grey))]',
  };


}
