import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';

import {
  ArrowLeft,
  ChevronRight,
  Download,
  LUCIDE_ICONS,
  LucideIconProvider
} from 'lucide-angular';

import { REPORT_CONFIGS } from '../config/report-filter.config';
import { MetricFilterOptions, MetricFilterRequest, ReportFilter, ReportFilterIndependentOptions, ReportFilterProjectCascadingOptions, ReportFilterProjectCascadingRequest, ReportGenerationRequest, ReportIndependentFilterRequest } from '../models/reporting.model';
import { SelectComponent } from '../../../shared/ui/select/select.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReportingPageService } from '../services/reporting-page.service';
import { PageLoadingService } from '../../../core/services/page-loading.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReportRequest } from '../models/reporting.model';
import { ToastService } from '../../../shared/ui/toast/toast.service';
// import { UserService } from '../../../features/admin/services/user.service';
import { UserService } from '../../admin/services/user.service';

import { AuthorizationService, AuthStateService } from '../../../core/auth';
import type { ActionAccess } from '../../../core/auth/models/authorization.model';
@Component({
  selector: 'app-reporting-page-old',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectComponent, NgSelectModule
  ],

  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        ArrowLeft,
        ChevronRight,
        Download
      })
    }
  ],

  templateUrl: './reporting-page.component.html',
  styleUrl: './reporting-page.component.css'
})
export class ReportingPageComponent {
  private readonly pageLoadingService = inject(PageLoadingService);

  reportForm: FormGroup;

  selectedReportCode = signal<string>(
    'SummarySinceInception'
  );


  reportConfigs = REPORT_CONFIGS;

  // =====================================================
  // SELECTED REPORT
  // =====================================================

  // selectedReport = computed(() =>
  //   this.reportConfigs.find(
  //     report =>
  //       report.code === this.selectedReportCode()
  //   )
  // );

  selectedReport = computed(() =>
    this.availableReports().find(
      report => report.code === this.selectedReportCode()
    )
  );
  private readonly destroyRef = inject(DestroyRef);



  readonly metricFilterOptions = signal<MetricFilterOptions | null>(null)
  readonly reportProjectFilterOptions = signal<ReportFilterProjectCascadingOptions | null>(null)
  readonly reportIndependentFilterOptions = signal<ReportFilterIndependentOptions | null>(null)

  metricFilterState: MetricFilterRequest = {
    topicIds: [],
    topLevelMetricIds: [],
    l1MetricIds: []
  }

  reportProjectFilterState: ReportFilterProjectCascadingRequest = {
    projectIds: [],
    cpmUserIds: [],
    gelUserIds: [],
    plUserIds: [],
    fundingRecipientIds: [],
    programIds: [],
    countryCodes: [],
    cityIds: [],
    selectedReportType: null
  }

  reportIndependentFilterState: ReportIndependentFilterRequest = {
    projectStatusIDs: [],
    recordStatusIDs: [],
    reportingYears: [],
    quaters: []
  }

  // reportGenerationRequest: ReportGenerationRequest = {
  //   reportingYears: [],
  //   quaters: [],
  //   topicIds: [],
  //   topLevelMetricIds: [],
  //   l1metricids: [],
  //   projectids: [],
  //   cpmIds: [],
  //   programLeaderIds: [],
  //   fundingrecipientIds: [],
  //   programids: [],
  //   countrycityids: [],
  //   projectstatusids: [],
  //   sourcetypeids: [],
  //   startdate: "",
  //   enddate: "",
  //   recordStatus: [],
  // }

  reportGenerationRequest: any = [];
  showLoading = signal<Boolean>(false)

  private readonly authorizationService = inject(AuthorizationService);

  readonly actionAccess = signal<ActionAccess[]>([]);
  readonly actionAccessLoaded = signal(false);

  readonly availableReports = computed(() => {
    const allowedKeys = new Set(
      this.actionAccess()
        .filter(action => action.value)
        .map(action => action.key.toUpperCase())
    );

    return REPORT_CONFIGS.filter(report =>
      allowedKeys.has(report.actionKey.toUpperCase())
    );
  });

  readonly canGenerateSelectedReport = computed(() =>
    this.availableReports().some(
      report => report.code === this.selectedReportCode()
    )
  );

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private fb: FormBuilder,
    private reportingService: ReportingPageService,
    private toastService: ToastService,
    private authStateService: AuthStateService,
  ) {

    this.reportForm = this.fb.group({
      reportType: [
        'SummarySinceInception',
        Validators.required
      ]
    });

    // Get initial report based on selected report code
    const initialReport = this.reportConfigs.find(
      report => report.code === this.selectedReportCode()
    );

    if (initialReport) {
      this.buildFilterControls(initialReport.filters);
    }

    this.reportForm
      .get('reportType')
      ?.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(reportCode => {

        if (!reportCode) {
          return;
        }

        this.onReportTypeChange(reportCode);

      });
  }

  ngOnInit(): void {
    this.pageLoadingService.stop();


    this.loadActionAccess();
    this.loadMetricFilterOptions();
    this.loadProjectFilterOptions();
    this.loadIndepentdentFilterOption()

  }


  private loadActionAccess(): void {
    const userId = this.authStateService.getCurrentUserId();

    if (!userId) {
      console.error('[Authorization] Current user ID not available.');
      this.actionAccess.set([]);
      this.actionAccessLoaded.set(true);
      return;
    }

    this.authorizationService
      .getActionAccess('REPORTING', userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.actionAccess.set(response.data ?? []);

          const firstAllowedReport = REPORT_CONFIGS.find(report =>
            response.data?.some(
              action =>
                action.value &&
                action.key.toUpperCase() === report.actionKey.toUpperCase()
            )
          );

          if (firstAllowedReport) {
            this.selectedReportCode.set(firstAllowedReport.code);
            this.reportForm.patchValue(
              { reportType: firstAllowedReport.code },
              { emitEvent: false }
            );
            this.buildFilterControls(firstAllowedReport.filters);
          }

          this.actionAccessLoaded.set(true);
        },
        error: error => {
          console.error('[Authorization] Failed to load Reporting action access:', error);
          this.actionAccess.set([]);
          this.actionAccessLoaded.set(true);
        }
      });
  }

  // =====================================================
  // BUILD DYNAMIC FILTER CONTROLS
  // =====================================================

  private buildFilterControls(
    filters: ReportFilter[]
  ): void {

    // Remove previous dynamic controls
    Object.keys(this.reportForm.controls)
      .filter(key => key !== 'reportType')
      .forEach(key => {

        this.reportForm.removeControl(key);

      });


    // Add controls according to selected report
    filters.forEach(filter => {

      const validators =
        filter.required
          ? [Validators.required]
          : [];


      // Calendar filter
      if (filter.type === 'calendar') {

        this.reportForm.addControl(
          'startDate',
          new FormControl(null, validators)
        );

        this.reportForm.addControl(
          'endDate',
          new FormControl(null, validators)
        );

        return;
      }



      const defaultValue =
        filter.type === 'multi-select'
          ? []
          : null;


      this.reportForm.addControl(

        filter.key,

        new FormControl(
          defaultValue,
          validators
        )

      );

    });

    // Add date range validation
    this.reportForm.setValidators(
      this.dateRangeValidator
    );

    this.reportForm.updateValueAndValidity();

  }

  private dateRangeValidator = (group: AbstractControl): ValidationErrors | null => {

    const startDate = group.get('startDate')?.value;
    const endDate = group.get('endDate')?.value;

    if (!startDate || !endDate) {
      return null;
    }

    if (new Date(endDate) < new Date(startDate)) {
      return {
        endDateBeforeStartDate: true
      };
    }

    return null;
  };


  // onReportTypeChange(reportCode: string): void {

  //   this.selectedReportCode.set(reportCode);

  //   const config = this.reportConfigs.find(
  //     report => report.code === reportCode
  //   );

  //   if (!config) {
  //     return;
  //   }

  //   this.buildFilterControls(config.filters);
  //   this.ReloadCascadingFilters();
  // }

  onReportTypeChange(reportCode: string): void {

    this.selectedReportCode.set(reportCode);

    const config = this.availableReports().find(
      report => report.code === reportCode
    );

    if (!config) {
      return;
    }
    this.buildFilterControls(config.filters);
    this.ReloadCascadingFilters();
  }

 private readonly annualQuarterCode = 'ANNUAL_CODE'; // Replace with the Annual option's actual code

onQuarterAdd(item: { code: string }): void {
  const quarterControl = this.reportForm.get('quaters');

  if (!quarterControl) {
    return;
  }

  const selectedQuarters: string[] = quarterControl.value ?? [];

  if (item.code === 'A') {
    quarterControl.setValue(['A']);
    return;
  }

  quarterControl.setValue(
    selectedQuarters.filter(code => code !== 'A')
  );
}
  // =====================================================
  // Filter options
  // =====================================================

  loadMetricFilterOptions(): void {





    const request = this.metricFilterState;

    this.reportingService
      .getReportMetricOptions(request)
      .subscribe({
        next: (response) => {


          this.metricFilterOptions.set(response);

        },
        error: (error) => {

          console.error(
            'Error loading metric filters:',
            error
          );

        }
      });
  }

  loadProjectFilterOptions() {

    const request = this.reportProjectFilterState;
    this.reportingService.getReportProjectFilterOptions(request).subscribe({
      next: (response) => {


        this.reportProjectFilterOptions.set(response)



      },
      error: (error) => {
        console.error('Error loading metric filters', error);
      }


    }

    )
  }

  loadIndepentdentFilterOption() {
    const projectIds: string[] = []

    this.reportingService.getReportIndependentFilterOptions(projectIds).subscribe({
      next: (response) => {
        this.reportIndependentFilterOptions.set(response)


      }
    })
  }

  getFilterOptions(filterKey: string): any[] {

    switch (filterKey) {

      // =========================
      // Metric Filters
      // =========================

      case 'topicIds':
        return this.metricFilterOptions()
          ?.topicMetricOptions ?? [];

      case 'topLevelMetricIds':
        return this.metricFilterOptions()
          ?.toplevelMetricOptions ?? [];

      case 'l1metricids':
        return this.metricFilterOptions()
          ?.l1MetricOptions ?? [];


      // =========================
      // Project Filters
      // =========================

      case 'projectids':
      case 'projectNameIds':
        return this.reportProjectFilterOptions()
          ?.projectOptions ?? [];

      case 'cpmIds':
        return this.reportProjectFilterOptions()
          ?.cpmOptions ?? [];

      case 'programLeaderIds':
        return this.reportProjectFilterOptions()
          ?.plOptions ?? [];

      case 'globalExecutionLeaderIds':
        return this.reportProjectFilterOptions()
          ?.gelOptions ?? [];

      case 'fundingrecipientIds':
        return this.reportProjectFilterOptions()
          ?.fundingRecipientOptions ?? [];

      case 'programids':
        return this.reportProjectFilterOptions()
          ?.programOptions ?? [];

      // case 'countrycityids':
      //   return [
      //     ...(this.reportProjectFilterOptions()?.countryCityOptions ?? []),
      //     // ...(this.reportProjectFilterOptions()?.cityOptions ?? [])
      //   ];

      case 'countrycityids':
        return (this.reportProjectFilterOptions()?.countryCityOptions ?? [])
      // ...(this.reportProjectFilterOptions()?.cityOptions ?? [])



      // =========================
      // Independent Filters
      // =========================

      case 'projectstatusids':
        return this.reportIndependentFilterOptions()
          ?.projectStatusOptions ?? [];

      case 'sourcetypeids':
        return this.reportIndependentFilterOptions()
          ?.sourceTypeOptions ?? [];

      case 'reportingYears':
        return this.reportIndependentFilterOptions()
          ?.reportingYearOptions ?? [];

      case 'quaters':
        return this.reportIndependentFilterOptions()
          ?.reportingQuarterOptions ?? [];

      case 'RecordStatusIds':
        return this.reportIndependentFilterOptions()
          ?.recordStatusOptions ?? [];

      case 'projectcategoryids':
        return this.reportIndependentFilterOptions()
          ?.projectCategoryOptions ?? [];

      default:
        console.warn('No filter options mapping for:', filterKey);
        return [];
    }
  }

  private getMetricFilterRequest(): MetricFilterRequest {

    return {
      topicIds:
        this.reportForm.get('topicIds')?.value ?? [],

      topLevelMetricIds:
        this.reportForm.get('topLevelMetricIds')?.value ?? [],

      l1MetricIds:
        this.reportForm.get('l1metricids')?.value ?? []
    };
  }
  private getProjectFilterRequest(): ReportFilterProjectCascadingRequest {
    const selectedQuarters = this.reportForm.get('quaters')?.value ?? [];

    const selectedReportType = this.selectedReportCode();

    return {
      projectIds:
        this.reportForm.get('projectids')?.value ?? [],

      cpmUserIds:
        this.reportForm.get('cpmIds')?.value ?? [],

      gelUserIds:
        this.reportForm.get('globalExecutionLeaderIds')?.value ?? [],

      plUserIds:
        this.reportForm.get('programLeaderIds')?.value ?? [],

      fundingRecipientIds:
        this.reportForm.get('fundingrecipientIds')?.value ?? [],

      programIds:
        this.reportForm.get('programids')?.value ?? [],

      countryCodes:
        this.reportForm.get('countrycityids')?.value ?? [],

      cityIds:
        this.reportForm.get('countrycityids')?.value ?? [],

      reportingYears:
        this.reportForm.get('reportingYears')?.value ?? [],

      quarterCodes:
        selectedQuarters,

      selectedReportType: selectedReportType
    };
  }
  ReloadCascadingFilters(): void {

    const metricRequest = this.getMetricFilterRequest();
    const projectRequest = this.getProjectFilterRequest();


    // Dynamic form: projectNameIds may or may not exist
    const projectControl = this.reportForm.get('projectNameIds');

    const projectIds: string[] =
      projectControl?.value ?? [];



    this.reportingService
      .getReportMetricOptions(metricRequest)
      .subscribe({
        next: response => {
          this.metricFilterOptions.set(response);
        },
        error: error => {
          console.error('Metric cascading failed:', error);
        }
      });

    this.reportingService
      .getReportProjectFilterOptions(projectRequest)
      .subscribe({
        next: response => {


          this.reportProjectFilterOptions.set(response);


        },
        error: error => {
          console.error('Project cascading failed:', error);
        }
      });

    this.reportingService
      .getReportIndependentFilterOptions(projectIds)
      .subscribe({
        next: response => {
          this.reportIndependentFilterOptions.set(response);

        },
        error: error => {
          console.error('Independent filters failed:', error);
        }
      });
  }

  onFilterChange(filterKey: string): void {


    // auto select on  PIN selection and Project Name selection
    const selectedValues =
      this.reportForm.get(filterKey)?.value ?? [];

    // Project PIN changed
    if (filterKey === 'projectids') {

      this.reportForm
        .get('projectNameIds')
        ?.setValue(selectedValues);

    }



    // Project Name changed
    if (filterKey === 'projectNameIds') {

      this.reportForm
        .get('projectids')
        ?.setValue(selectedValues);

    }




    this.ReloadCascadingFilters();


  }
  getOptionLabel(filterKey: string): string {

    switch (filterKey) {

      case 'projectids':
        return 'pin';

      case 'projectNameIds':
        return 'projectName';



      default:
        return 'name';
    }
  }

  getOptionValue(filterKey: string): string {

    switch (filterKey) {

      case 'projectids':
      case 'projectNameIds':
        return 'projectId';

      case 'quaters':
        return 'code';

      default:
        return 'id';
    }
  }

  selectAllFilter(filterKey: string): void {

    const options = this.getFilterOptions(filterKey);

    if (!options?.length) {
      return;
    }

    const valueKey = this.getOptionValue(filterKey);

    const allValues = options.map((option: any) => option[valueKey]);

    this.reportForm.get(filterKey)?.setValue(allValues);

    this.onFilterChange(filterKey);
  }
  // =====================================================
  // GENERATE REPORT
  // =====================================================

  private CalculateReviewPeriod(
    reportingYears: string[],
    quarters: string[]
  ): string[] {

    return reportingYears.flatMap(year =>
      quarters.map(quarter => `${year}-${quarter}`)
    );
  }


  clearSelectedFilter(): void {
    const reportType = this.reportForm.get('reportType')?.value;

    this.reportForm.reset();

    this.reportForm.patchValue({
      reportType: reportType
    });

    this.ReloadCascadingFilters();
  }

  generateReport(): void {


    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      this.toastService.error("Please select the required filters")
      return
    }

    if (!this.canGenerateSelectedReport()) {
      this.toastService.error('You do not have permission to generate this report.');
      return;
    }

    this.reportGenerationRequest = this.reportForm.getRawValue();

    this.showLoading.set(true)
    const filters = {
      ...this.reportGenerationRequest
    };

    // Add reviewPeriodCodes only when both filters are present
    if (
      this.reportGenerationRequest.reportingYears?.length &&
      this.reportGenerationRequest.quaters?.length
    ) {
      filters.reviewPeriodCodes = this.CalculateReviewPeriod(
        this.reportGenerationRequest.reportingYears,
        this.reportGenerationRequest.quaters
      );
    }

    // Add userid 
    // filters.userId = this.authStateService.getCurrentUserId()?.toString();
    // filters.generationDate = new Date().toISOString().split('T')[0];



    const request: ReportRequest = {
      reportType: this.selectedReportCode().toString(),
      filters
    };

    const UserId = this.authStateService.getCurrentUserId()?.toString() || '';



    this.reportingService.postGenerateReport(request, UserId)
      .subscribe({
        next: (response) => {

          const blob = response.body;

          if (!blob) {
            return;
          }

          const contentDisposition =
            response.headers.get('Content-Disposition');



          let fileName = 'Report.xlsx';

          if (contentDisposition) {

            const match = contentDisposition.match(
              /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i
            );

            if (match?.[1]) {
              fileName = decodeURIComponent(match[1]);
            }
          }



          const url = window.URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;

          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          window.URL.revokeObjectURL(url);
          this.showLoading.set(false);
          this.ReloadCascadingFilters();
        },

        error: (error) => {
          console.error('Report generation failed:', error);
          this.toastService.error(`Unexpected Error occurs ${error}`)
          this.showLoading.set(false)
        }
      });
  }






}