import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { map, mergeMap, take, tap } from 'rxjs/operators';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  ArrowLeft, ChevronRight, Save, X,
  LoaderCircle,
} from 'lucide-angular';
import { Metric } from '../../../../../admin/models/metric-old.model';
import { MetricRow, ReviewDto, ReviewMetricDto, ReviewMetricsByIdSourceNames } from '../../review-metrics-by-id/review-metrics-by-id.types';
import { MetricService } from '../../../../../admin/services/metric.service';
import { ReviewService } from '../../../../services/review.service';
import { ImpactMasterMetric, ImpactMasterMetricCategory, ReviewMetricConfigPageService } from './services/review-metric-config-page.service';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../../../shared/ui/toast/toast.service';
import { FormsModule } from '@angular/forms';
import { AuthStateService } from '../../../../../../core/auth';
 
interface MetricGroup {
  categoryCode:       string;
  categoryName?: string;
  badgeClass: string;
  badgeBackgroundColor?: string;
  metrics:    ReviewMetricDto[];
}

@Component({
  selector: 'app-review-metric-config-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ ArrowLeft, ChevronRight, Save, LoaderCircle, X }) },
  ],
  templateUrl: './review-metric-config-page.component.html',
})

export class ReviewMetricConfigPageComponent {
  
  private readonly router      = inject(Router);
  private readonly authStateService = inject(AuthStateService);
  private readonly route       = inject(ActivatedRoute);
  private readonly metricSvc   = inject(MetricService);
  private readonly reviewMetricConfigPageSvc   = inject(ReviewMetricConfigPageService);
  private readonly toastSvc   = inject(ToastService);
  // private readonly categorySvc = inject(MetricCategoryService);
  private readonly reviewSvc   = inject(ReviewService);

  protected savingMetricsConfig = signal(false);
  
  id = computed(() => this.route.snapshot.paramMap.get('id') as string);
  
  readonly source = toSignal(
    this.route.queryParamMap.pipe(map(p => p.get('source') as 'project' | 'corporate' | null)),
    { initialValue: null as 'project' | 'corporate' | null },
  );

  readonly typeLabel = computed(() => {
    const s = this.source();
    if (s === 'project')   return 'Project';
    if (s === 'corporate') return 'Corporate';
    return 'All';
  });

  readonly reviewDetail = signal<ReviewDto | null>(null);
  // toSignal(
  //   (
  //     this.reviewMetricConfigPageSvc.reviewDetail() ? of(this.reviewMetricConfigPageSvc.reviewDetail()) :
  //     this.reviewSvc.getReviewByReviewId(this.id(), this.authStateService.getCurrentUserId() || 0)
  //   )
    
  //   , { initialValue: null }
  // );

  constructor() {
    effect(() => {
      const filteredMetrics = this.filteredMetrics();
      const reviewDetail = this.reviewDetail();
      
      console.log("updating selectedCodes with filteredMetrics:", filteredMetrics);

      const includedMetricCodes = new Map<string, boolean>();
      for (const metric of (reviewDetail?.reviewMetrics || [])) {
        includedMetricCodes.set(metric.metricCode, true);
      }

      for (const filteredMetric of filteredMetrics) {
        for (const toplevelmetric of filteredMetric.metrics) {
          for (const l1metric of toplevelmetric.children) {
            this.selectedCodes.update(selectedCodes => {
              selectedCodes[l1metric.metricCode] = includedMetricCodes.get(l1metric.metricCode) ? true : false;
              return selectedCodes;
            });
          }
        }
      }


    });
    effect(() => {
      const selectedCodes = this.selectedCodes();

      
      this.selectedTopLevelCodes.update(selectedTopLevelCodes => {
        for (const filteredMetric of this.filteredMetrics()) {
          for (const toplevelmetric of filteredMetric.metrics) {
            let anyL1Selected = false;

            for (const l1metric of toplevelmetric.children) {
              if (selectedCodes[l1metric.metricCode]) {
                anyL1Selected = true;
                break;
              }
            }
            selectedTopLevelCodes[toplevelmetric.metricCode] = anyL1Selected;
          }
        }

        return selectedTopLevelCodes;
      });
    })
  }

  protected loadingMetrics = signal<boolean>(false);
  ngOnInit(): void {
    this.reviewSvc.getReviewByReviewId({ reviewId: this.id(), userId: this.authStateService.getCurrentUserId() || 0, stageId: null, sourcePage: ReviewMetricsByIdSourceNames.ProjectLibrary}).pipe(take(1))
    .subscribe(res => {
      this.reviewDetail.set(res);
    }, () => {
      this.toastSvc.error("Could not load data");
    })
  }

  getImpactMasterMetrics(): Observable<ImpactMasterMetricCategory[]> {
    const userId = this.authStateService.getCurrentUserId() || 0;
    const reviewDetails = this.reviewDetail() ? of(this.reviewDetail()) : this.reviewSvc.getReviewByReviewId({ reviewId: this.id(), userId, stageId: null, sourcePage: ReviewMetricsByIdSourceNames.ProjectLibrary });
    
    this.loadingMetrics.set(true);
    
    return reviewDetails.pipe(
      mergeMap((reviewDetails) => {
        if (!reviewDetails) {
          return of([]);
        }
        return this.reviewMetricConfigPageSvc.getAssignableMetricsForReview(reviewDetails.reviewId)
        // return this.reviewMetricConfigPageSvc.getImpactMasterMetrics(reviewDetails.impactMasterId)
        // .pipe(
          //   mergeMap(() => {
            //     return this.reviewMetricConfigPageSvc.getAssignableMetricsForReview(reviewDetails.reviewId)
            //   })
            // )
      })
      ,
      tap (() => {
        this.loadingMetrics.set(false);    
      })
    )
  }

  protected readonly filteredMetrics = toSignal(
    this.getImpactMasterMetrics()
    // () => {
     
    // uncomment when ALL METRICS are needed and not just the ones in the review
    // return this.metricSvc.metrics().filter(m => {
    //   if (!t) return true;
    //   if (t === 'project')   return m.dataProvider === 'Project'   || m.dataProvider === 'Corporate + Project';
    //   if (t === 'corporate') return m.dataProvider === 'Corporate' || m.dataProvider === 'Corporate + Project';
    //   return true;
    // });
    // }
    , { initialValue: [] as ImpactMasterMetricCategory[] }
  );

  readonly metricGroups = computed<ImpactMasterMetricCategory[]>(() => {
    const metrics = this.filteredMetrics();
    const codes = [...new Set(metrics.map(m => m.categoryCode))];

    const badgeClassMap: Map<string, string> = new Map();
    const badgeNameMap: Map<string, string> = new Map();

    for (const m of metrics) {
      if (m.categoryColor) {
        if (!badgeClassMap.has(m.categoryCode)) {
          badgeClassMap.set(m.categoryCode, m.categoryColor);
        }
        if (!badgeNameMap.has(m.categoryCode) && m.categoryName) {
          badgeNameMap.set(m.categoryCode, m.categoryName);
        }
      }
    }

    return this.filteredMetrics();

    // return codes.map(code => ({
    //   categoryCode: code,
    //   categoryName:  badgeNameMap.get(code),
    //   badgeClass: 'bg-muted text-muted-foreground',
    //   badgeBackgroundColor: badgeClassMap.get(code),
    //   metrics:    metrics.filter(m => m.categoryCode === code),
    // }));
  });

  readonly selectedTopLevelCodes = signal<{ [key: string]: boolean }>({});

  readonly selectedCodes = linkedSignal<{ [key: string]: boolean }>(() => {
    const detail = this.reviewDetail();
    if (!detail) return {};
    return Object.fromEntries(detail.reviewMetrics.map(m => [m.metricCode, true]));
  });

  toggleMetric(code: string, isTopLevel: boolean, checked: boolean): void {
    // for Top level metric
    if (isTopLevel) {
      const groups = this.metricGroups();
      for (const group of groups) {
        for (const metric of group.metrics) {
          if (metric.metricCode == code) {
            for (const l1metric of metric.children) {
              if (checked == true) {
                this.selectedCodes.update(s => {
                  const n = { ...s };
                  n[l1metric.metricCode] = true;
                  return n;
                });
                // l1metric.metricCode
              }
              else {
                this.selectedCodes.update(s => {
                  const n = { ...s };
                  delete n[l1metric.metricCode];
                  return n;
                });
                // l1metric.metricCode
              }
            }

            break;
          }
        }
      }


      return;
    }

    // for L1 Metric
    this.selectedCodes.update(selectedCodes => {
      
      // selectedCodes[code] = !selectedCodes[code]
      return JSON.parse(JSON.stringify(selectedCodes));
    });
  }

  save(): void {
    // const selected        = this.selectedCodes();
    // const existing        = this.reviewDetail()?.reviewMetrics ?? [];
    // const filteredCodes   = new Set(this.filteredMetrics().map(m => m.metricCode));

    // // Preserve metrics outside the current type-filtered view unchanged
    // const untouched = existing.filter(m => !filteredCodes.has(m.metricCode));

    // // From the filtered pool: keep selected existing rows, add newly selected ones
    // const existingCodes  = new Set(existing.map(m => m.metricCode));
    // const kept   = existing.filter(m => filteredCodes.has(m.metricCode) && selected.has(m.metricCode));
    // const added  = this.filteredMetrics()
    //   .filter((m: ReviewMetricDto) => selected.has(m.metricCode) && !existingCodes.has(m.metricCode)) ;

    this.savingMetricsConfig.set(true);

    const metricIds: string[] = [];

    const selectedCodes = this.selectedCodes();

    const metricGroups = this.metricGroups();

    for (const group of metricGroups) {
      for (const toplevelmetric of  group.metrics) {
        for (const l1metric of toplevelmetric.children) {
          if (selectedCodes[l1metric.metricCode]) {
            metricIds.push(l1metric.metricId);
          }
        }
      }
    }

    this.reviewMetricConfigPageSvc.saveMetricsConfig(+this.id(), metricIds, 1)
    .pipe
    (
      take(1)
    ).subscribe(res => {
      this.savingMetricsConfig.set(false);
      this.toastSvc.success('Metrics configuration saved successfully.');
      this.cancel();
    },
    () => {
      this.savingMetricsConfig.set(false);
      this.toastSvc.error('Failed to save metrics configuration.');
    });
    // this.reviewSvc.updateReviewMetrics(this.id(), [...untouched, ...kept, ...added]);
    // this.router.navigate(['/reviews', this.id()]);
  }


  getTopLevelCheckValue(metricCode: string): boolean {
    const groups = this.metricGroups();
    const selectedCodes= this.selectedCodes();

    for (const group of groups) {
      for (const topLevelMetric of group.metrics) {
        if (topLevelMetric.metricCode == metricCode) {
          for (const l1Metric of topLevelMetric.children) {
            if (!selectedCodes[l1Metric.metricCode]) {
              return false;
            }
          }

          break;
        }
      }
    }
    return true;
  }

  cancel(): void {
    const stage = this.route.snapshot.queryParams['stage'] as string | undefined;
    if (!stage) {
      return;
    }
 
    this.router.navigate(['/reviews', this.id(), stage]);
  }

  
}
