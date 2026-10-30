import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { AuthStateService } from '../../../../../core/auth';
import { LookupService } from '../../../../../core/services/lookup-service';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { ReviewService } from '../../../services/review.service';
import { ReviewMetricsByIdComponent } from './review-metrics-by-id.component';
import { ReviewMetricsByIdService, ReviewMetricsPageData } from './review-metrics-by-id.service';
import { ApiResponse } from '../../../../../core/models/api-response.model';
import { ReviewMetricsByIdSourceNames } from './review-metrics-by-id.types';
import { EvidenceDto } from '../../../models/review.model';

describe('ReviewMetricsByIdComponent rendered Restatement flow', () => {
  it.each([
    { field: 'reportedInput', baseline: null, rawValue: 12 },
    { field: 'baselineInput', baseline: 12, rawValue: 10 },
    { field: 'baselineInput', baseline: 0, rawValue: 10 },
  ])('saves $field with baseline $baseline through the restatement API', async ({ field, baseline, rawValue }) => {
    const params = convertToParamMap({});
    const updateValues = vi.fn(() => of({ data: 1, status: 200, success: true }));
    const issueRestatement = vi.fn(() => of({ data: [], status: 200, success: true }));
    const review = {
      reviewId: '42',
      periodLabel: 'Q1 2026', phaseLabel: 'Approval', roleLabel: '',
      stage: '3', stageDisplayValue: 'Approval',
      allowRestatement: true,
      categories: [{ code: 'CV', name: 'Value', color: '#008080', uploadedEvidence: 0, requiredEvidence: 0 }],
      topMetrics: [{
        metricId: 1, metricCode: 'CV1', categoryCode: 'CV', isTopLevel: true,
        reviewMetricId: 1, metricName: 'Value', unit: 'tonnes', reportedValue: '10',
        pmStatus: 'Pending', reviewStatus: 'Pending', leadStatus: 'Pending',
        evidenceUploadCount: 0, evidenceFiles: [], evidenceCount: 0,
        l1Metrics: [{
          metricId: 2, metricCode: 'CV1.1', categoryCode: 'CV',
          baseline: 5, rawValue: 10, riskOriginal: 20, evidenceCount: 0, evidences: [],
          reviewMetricId: 2, metricName: 'Value metric', unit: 'tonnes', reportedValue: '10',
          pmStatus: 'Pending', reviewStatus: 'Pending', leadStatus: 'Pending',
          evidenceUploadCount: 0, evidenceFiles: [],
        }],
      }],
    } as ReviewMetricsPageData;
    await TestBed.configureTestingModule({
      imports: [ReviewMetricsByIdComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: {
          queryParamMap: of(params), snapshot: { queryParamMap: params },
        } },
        { provide: Router, useValue: {} },
        { provide: LookupService, useValue: {} },
        { provide: AuthStateService, useValue: {} },
        { provide: ToastService, useValue: { error: vi.fn(), success: vi.fn() } },
        { provide: ReviewService, useValue: {
          getValorisationTypes: () => of([]),
          RestatementUpdateBaselineOrRawValueForMetric: updateValues,
          issueRestatementForReview: issueRestatement,
        } },
        { provide: ReviewMetricsByIdService, useValue: {
          loading: signal(false), error: signal(null), baselineCalculation: signal({}),
          refreshReviewMetricsData: new Subject<void>(), load: () => of(review),
        } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ReviewMetricsByIdComponent);
    fixture.componentRef.setInput('reviewId', 42);
    fixture.componentRef.setInput('stageId', null);
    fixture.componentRef.setInput('refreshReviewMetricsData', false);
    fixture.componentRef.setInput('sourcePage', ReviewMetricsByIdSourceNames.ProjectLibrary);
    fixture.componentRef.setInput('detailsExpanded', true);
    vi.spyOn(fixture.componentInstance, 'getUserId').mockReturnValue(7);
    const render = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
    };
    const host = fixture.nativeElement as HTMLElement;
    const button = (label: string): HTMLButtonElement =>
      Array.from(host.querySelectorAll<HTMLButtonElement>('button'))
        .find((element) => element.textContent?.trim() === label)!;
    await render();
    button('Restatement').click();
    await render();
    const reported = host.querySelector(`[id="${field}_CV1.1"]`) as HTMLInputElement;
    expect(reported).not.toBeNull();
    reported.value = String(field === 'baselineInput' ? baseline : rawValue);
    reported.dispatchEvent(new Event('input'));
    reported.dispatchEvent(new Event('blur'));
    expect(updateValues).not.toHaveBeenCalled();
    button('Save Changes').click();
    await render();

    const comment = fixture.nativeElement.querySelector('ui-modal textarea') as HTMLTextAreaElement;
    expect(comment).not.toBeNull();
    expect(updateValues).not.toHaveBeenCalled();
    comment.value = 'Restatement comment';
    comment.dispatchEvent(new Event('input'));
    button('Confirm').click();
    await render();

    expect(updateValues).toHaveBeenCalledExactlyOnceWith('42', [{
      MetricId: 2, Baseline: baseline, RawValue: rawValue, RiskPercentage: 20,
      RestatementComment: 'Restatement comment',
    }], 7);
    expect(issueRestatement).toHaveBeenCalledExactlyOnceWith({
      ReviewId: 42, UserId: 7, Comment: 'Restatement comment', Start: false,
      Metrics: [{ MetricId: 2 }],
    });
  });
});

describe('ReviewService current metric stages request', () => {
  it.each([3, null])('gets current stages with ReviewIds, StageId %s and MetricId', (stageCodeId) => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(ReviewService);
    const http = TestBed.inject(HttpTestingController);
    const response = { data: [], status: 200, success: true };
    const received = vi.fn();

    service.getCurrentMetricStages([42, 43], stageCodeId, 1).subscribe(received);

    const request = http.expectOne((req) =>
      req.url.endsWith('/Review/ReviewGetCurrentMetricStages'),
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('ReviewIds')).toBe('42,43');
    expect(request.request.params.get('StageId')).toBe(stageCodeId === null ? '' : '3');
    expect(request.request.params.get('MetricId')).toBe('1');
    request.flush(response);
    expect(received).toHaveBeenCalledWith(response);
    http.verify();
  });
});

describe('ReviewMetricsByIdComponent metric deep links', () => {
  let fixture: ComponentFixture<ReviewMetricsByIdComponent>;
  let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let reviews: BehaviorSubject<ReviewMetricsPageData | null>;
  let scrollIntoView: ReturnType<typeof vi.fn>;
  let stages: Subject<ApiResponse<unknown>>;
  let getCurrentMetricStages: ReturnType<typeof vi.fn>;
  let toastError: ReturnType<typeof vi.fn>;
  let toastWarning: ReturnType<typeof vi.fn>;
  let recallTopLevelMetric: ReturnType<typeof vi.fn>;
  let updateBaselineOrRawValueForMetric: ReturnType<typeof vi.fn>;
  let issueRestatementForReview: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  let hasPageAccess: ReturnType<typeof vi.fn>;
  const originalScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');

  const review = {
    reviewId: '42',
    categories: [
      { code: 'MW', name: 'Waste' },
      { code: 'CV', name: 'Value' },
    ],
    topMetrics: [{
      metricId: 1,
      metricCode: 'CV1',
      categoryCode: 'CV',
      currentStage: '3',
      l1Metrics: [
        { metricId: 2, metricCode: 'CV1.1' },
        { metricId: 3, metricCode: 'CV1.2' },
      ],
    }],
  } as ReviewMetricsPageData;

  beforeEach(async () => {
    queryParams = new BehaviorSubject(convertToParamMap({ tlm: 'CV1.2' }));
    reviews = new BehaviorSubject<ReviewMetricsPageData | null>(null);
    stages = new Subject<ApiResponse<unknown>>();
    getCurrentMetricStages = vi.fn(() => stages);
    toastError = vi.fn();
    toastWarning = vi.fn();
    recallTopLevelMetric = vi.fn(() => of({ data: [], status: 200, success: true }));
    updateBaselineOrRawValueForMetric = vi.fn(() => of({ data: 1, status: 200, success: true }));
    issueRestatementForReview = vi.fn(() => of({ data: [], status: 200, success: true }));
    navigate = vi.fn();
    hasPageAccess = vi.fn(() => true);
    scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });

    await TestBed.configureTestingModule({
      imports: [ReviewMetricsByIdComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: {
          queryParamMap: queryParams,
          snapshot: { queryParamMap: queryParams.value },
        } },
        { provide: Router, useValue: { url: '/reviews/1509/60?from=queue', navigate } },
        { provide: LookupService, useValue: {} },
        { provide: AuthStateService, useValue: { hasPageAccess } },
        { provide: ToastService, useValue: { error: toastError, warning: toastWarning, success: vi.fn() } },
        { provide: ReviewService, useValue: {
          getValorisationTypes: () => of([]),
          getCurrentMetricStages,
          recallTopLevelMetric,
          updateBaselineOrRawValueForMetric,
          RestatementUpdateBaselineOrRawValueForMetric: updateBaselineOrRawValueForMetric,
          issueRestatementForReview,
        } },
        { provide: ReviewMetricsByIdService, useValue: {
          loading: signal(false),
          error: signal(null),
          baselineCalculation: signal({}),
          refreshReviewMetricsData: new Subject<void>(),
          load: () => reviews,
        } },
      ],
    }).overrideComponent(ReviewMetricsByIdComponent, {
      set: {
        imports: [],
        template: `
          @if (restatementConfirmationVisible()) {
            <div data-restatement-modal>
              <input data-restatement-comment [value]="restatementComment()"
                (input)="restatementComment.set($any($event.target).value)" />
              <button data-restatement-confirm [disabled]="confirmingRestatement()"
                (click)="confirmRestatement()">Confirm</button>
              <button data-restatement-close (click)="cancelRestatementConfirmation()">Close</button>
            </div>
          }
          @if (recallModalOpen()) {
            <div data-recall-modal>
              <input data-recall-comment [value]="recallComment()"
                (input)="recallComment.set($any($event.target).value)" />
              <button data-recall-confirm [disabled]="recallLoader()"
                (click)="confirmRecallFromModal()">Confirm</button>
              <button data-recall-close (click)="closeRecallModal()">Close</button>
            </div>
          }
          @if (detailsExpanded()) {
            @for (topMetric of visibleTopMetrics(); track topMetric.metricId) {
              <article [attr.data-review-metric-code]="topMetric.metricCode">
                @if (isTopMetricExpanded(topMetric.metricCode)) {
                  @for (child of topMetric.l1Metrics; track child.metricId) {
                    <div [attr.data-review-metric-code]="child.metricCode"
                      [attr.data-expanded]="isL1Expanded(child.metricCode)"></div>
                  }
                }
              </article>
            }
          }
        `,
      },
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewMetricsByIdComponent);
    fixture.componentRef.setInput('reviewId', 42);
    fixture.componentRef.setInput('stageId', null);
    fixture.componentRef.setInput('refreshReviewMetricsData', false);
    vi.spyOn(fixture.componentInstance, 'getUserId').mockReturnValue(7);
    fixture.componentInstance.detailsExpansionChange.subscribe(({ expanded }) => {
      fixture.componentRef.setInput('detailsExpanded', !expanded);
    });
  });

  it('preserves the current review URL when opening evidence review', () => {
    fixture.componentInstance.viewEvidence({ evidenceId: 12 } as EvidenceDto);

    expect(navigate).toHaveBeenCalledWith(['/reviews/evidence-review'], {
      queryParams: {
        evidenceId: 12,
        returnUrl: '/reviews/1509/60?from=queue',
      },
    });
  });

  it('does not navigate to evidence review without page access', () => {
    hasPageAccess.mockReturnValue(false);

    fixture.componentInstance.viewEvidence({ evidenceId: 12 } as EvidenceDto);

    expect(navigate).not.toHaveBeenCalled();
  });

  afterEach(() => {
    if (originalScrollIntoView) {
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScrollIntoView);
    } else {
      delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
    }
  });

  async function render(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function openRestatementModal(
    editMetrics: (metrics: ReviewMetricsPageData['topMetrics'][number]['l1Metrics']) => void =
      (metrics) => { metrics[0].rawValue = 12; },
  ): Promise<void> {
    const restatementReview = {
      ...review,
      topMetrics: [{
        ...review.topMetrics[0],
        l1Metrics: review.topMetrics[0].l1Metrics.map((metric) => ({
          ...metric, baseline: 5, rawValue: 10, riskOriginal: 20,
        })),
      }],
    };
    reviews.next(restatementReview);
    await render();
    fixture.componentInstance.toggleRestatement();
    editMetrics(restatementReview.topMetrics[0].l1Metrics);
    fixture.componentInstance.toggleRestatement();
    await render();
  }

  function confirmRestatement(comment = ' Restatement comment '): void {
    const input = fixture.nativeElement.querySelector('[data-restatement-comment]') as HTMLInputElement;
    input.value = comment;
    input.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('[data-restatement-confirm]').click();
  }

  it('saves the restatement comment only for the edited metric', async () => {
    const updateResponse = new Subject<{ data: number; status: number; success: boolean }>();
    updateBaselineOrRawValueForMetric.mockReturnValue(updateResponse);
    await openRestatementModal();

    expect(fixture.nativeElement.querySelector('[data-restatement-modal]')).not.toBeNull();
    expect(updateBaselineOrRawValueForMetric).not.toHaveBeenCalled();
    expect(issueRestatementForReview).not.toHaveBeenCalled();

    confirmRestatement();
    confirmRestatement();
    await render();
    expect(updateBaselineOrRawValueForMetric).toHaveBeenCalledExactlyOnceWith('42', [
      { MetricId: 2, Baseline: null, RawValue: 12, RiskPercentage: 20, RestatementComment: 'Restatement comment' },
    ], 7);
    expect(issueRestatementForReview).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[data-restatement-confirm]').disabled).toBe(true);

    updateResponse.next({ data: 1, status: 200, success: true });
    await render();
    expect(issueRestatementForReview).toHaveBeenCalledExactlyOnceWith({
      ReviewId: 42, UserId: 7, Comment: 'Restatement comment', Start: false,
      Metrics: [{ MetricId: 2 }],
    });
    expect(fixture.nativeElement.querySelector('[data-restatement-modal]')).toBeNull();
  });

  it('saves baseline-only changes for multiple child metrics', async () => {
    await openRestatementModal((metrics) => {
      metrics[0].baseline = 0;
      metrics[1].baseline = 7.5;
    });
    confirmRestatement();
    await render();

    expect(updateBaselineOrRawValueForMetric).toHaveBeenCalledExactlyOnceWith('42', [
      { MetricId: 2, Baseline: 0, RawValue: 10, RiskPercentage: 20, RestatementComment: 'Restatement comment' },
      { MetricId: 3, Baseline: 7.5, RawValue: 10, RiskPercentage: 20, RestatementComment: 'Restatement comment' },
    ], 7);
  });

  it('restores child baselines when restatement is cancelled', async () => {
    let children: ReviewMetricsPageData['topMetrics'][number]['l1Metrics'] = [];
    await openRestatementModal((metrics) => {
      children = metrics;
      metrics[0].baseline = 0;
      metrics[1].baseline = 7.5;
    });
    fixture.componentInstance.cancelRestatementConfirmation();
    fixture.componentInstance.cancelRestatement();
    await render();

    expect(children.map((metric) => metric.baseline)).toEqual([5, 5]);
    expect(updateBaselineOrRawValueForMetric).not.toHaveBeenCalled();
  });

  it.each([null, NaN, Infinity])('rejects an invalid changed baseline: %s', async (baseline) => {
    await openRestatementModal((metrics) => { Object.assign(metrics[0], { baseline }); });

    expect(fixture.nativeElement.querySelector('[data-restatement-modal]')).toBeNull();
    expect(toastError).toHaveBeenCalled();
    expect(updateBaselineOrRawValueForMetric).not.toHaveBeenCalled();
  });

  it('includes a metric when only its Risk % changes', async () => {
    await openRestatementModal((metrics) => { metrics[1].riskOriginal = 25; });
    confirmRestatement();
    await render();

    expect(updateBaselineOrRawValueForMetric).toHaveBeenCalledExactlyOnceWith('42', [
      { MetricId: 3, Baseline: null, RawValue: 10, RiskPercentage: 25, RestatementComment: 'Restatement comment' },
    ], 7);
    expect(issueRestatementForReview).toHaveBeenCalledExactlyOnceWith({
      ReviewId: 42, UserId: 7, Comment: 'Restatement comment', Start: false,
      Metrics: [{ MetricId: 3 }],
    });
  });

  it('adds the comment to each changed metric when multiple metrics are edited', async () => {
    await openRestatementModal((metrics) => {
      metrics[0].rawValue = 12;
      metrics[1].riskOriginal = 25;
    });
    confirmRestatement();
    await render();

    expect(updateBaselineOrRawValueForMetric).toHaveBeenCalledExactlyOnceWith('42', [
      { MetricId: 2, Baseline: null, RawValue: 12, RiskPercentage: 20, RestatementComment: 'Restatement comment' },
      { MetricId: 3, Baseline: null, RawValue: 10, RiskPercentage: 25, RestatementComment: 'Restatement comment' },
    ], 7);
  });

  it.each([false, true])('does not save unchanged metrics, including reverted edits: %s', async (revertEdit) => {
    await openRestatementModal((metrics) => {
      if (revertEdit) {
        metrics[0].rawValue = 12;
        metrics[0].rawValue = 10;
      }
    });

    expect(fixture.nativeElement.querySelector('[data-restatement-modal]')).toBeNull();
    expect(updateBaselineOrRawValueForMetric).not.toHaveBeenCalled();
    expect(issueRestatementForReview).not.toHaveBeenCalled();
    expect(toastWarning).toHaveBeenCalledWith('No restatement changes to save.');
  });

  it('stays in Restatement edit mode after a no-change save and allows subsequent edits', async () => {
    let metric: ReviewMetricsPageData['topMetrics'][number]['l1Metrics'][number] | undefined;
    await openRestatementModal((metrics) => { metric = metrics[0]; });
    metric!.rawValue = 12;
    fixture.componentInstance.toggleRestatement();
    await render();

    expect(fixture.nativeElement.querySelector('[data-restatement-modal]')).not.toBeNull();
    confirmRestatement();
    await render();
    expect(updateBaselineOrRawValueForMetric).toHaveBeenCalledExactlyOnceWith('42', [{
      MetricId: 2, Baseline: null, RawValue: 12, RiskPercentage: 20,
      RestatementComment: 'Restatement comment',
    }], 7);
  });

  it('requires a restatement comment before calling either service', async () => {
    await openRestatementModal();
    confirmRestatement('   ');
    expect(toastError).toHaveBeenCalledWith('Comment is required for Restatement');
    expect(updateBaselineOrRawValueForMetric).not.toHaveBeenCalled();
    expect(issueRestatementForReview).not.toHaveBeenCalled();
  });

  it('closing the restatement comment modal does not save changes', async () => {
    await openRestatementModal();
    fixture.nativeElement.querySelector('[data-restatement-close]').click();
    await render();
    expect(fixture.nativeElement.querySelector('[data-restatement-modal]')).toBeNull();
    expect(updateBaselineOrRawValueForMetric).not.toHaveBeenCalled();
    expect(issueRestatementForReview).not.toHaveBeenCalled();

    fixture.componentInstance.toggleRestatement();
    await render();
    expect(fixture.nativeElement.querySelector('[data-restatement-modal]')).not.toBeNull();
  });

  it('preserves the restatement comment and enables retry after an API error', async () => {
    const response = new Subject<{ data: never[]; status: number; success: boolean }>();
    issueRestatementForReview.mockReturnValue(response);
    await openRestatementModal();
    confirmRestatement();
    response.error(new Error('Restatement failed'));
    await render();

    expect(toastError).toHaveBeenCalledWith('Failed to confirm the restatement. Please try again.');
    expect(fixture.nativeElement.querySelector('[data-restatement-modal]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-restatement-comment]').value).toBe(' Restatement comment ');
    expect(fixture.nativeElement.querySelector('[data-restatement-confirm]').disabled).toBe(false);
  });

  function confirmRecall(comment = 'Recall comment'): void {
    const input = fixture.nativeElement.querySelector('[data-recall-comment]') as HTMLInputElement;
    input.value = comment;
    input.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('[data-recall-confirm]').click();
  }

  it.each([null, 4])('opens the modal immediately and requests metric stage on Confirm with page stage %s', async (pageStageId) => {
    fixture.componentRef.setInput('stageId', pageStageId);
    await render();
    fixture.componentInstance.recallAction(review.topMetrics[0]);
    fixture.componentInstance.recallAction(review.topMetrics[0]);
    await render();

    expect(getCurrentMetricStages).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[data-recall-modal]')).not.toBeNull();

    confirmRecall();
    confirmRecall();
    await render();
    expect(getCurrentMetricStages).toHaveBeenCalledExactlyOnceWith([42], 3, 1);
    expect(recallTopLevelMetric).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[data-recall-confirm]').disabled).toBe(true);

    stages.next({ data: [], status: 200, success: true });
    await render();

    expect(recallTopLevelMetric).toHaveBeenCalledExactlyOnceWith({
      ReviewId: 42, TopLevelMetricCode: 'CV1', Recallcomment: 'Recall comment', UserId: 7,
    });
    expect(fixture.nativeElement.querySelector('[data-recall-modal]')).toBeNull();
  });

  it('requires a comment before requesting current stages', async () => {
    await render();
    fixture.componentInstance.recallAction(review.topMetrics[0]);
    await render();
    confirmRecall('   ');

    expect(getCurrentMetricStages).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith('Comment is required to recall the review metric');
    expect(recallTopLevelMetric).not.toHaveBeenCalled();
  });

  it('closing the modal does not request stages', async () => {
    await render();
    fixture.componentInstance.recallAction(review.topMetrics[0]);
    await render();
    fixture.nativeElement.querySelector('[data-recall-close]').click();
    await render();

    expect(getCurrentMetricStages).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[data-recall-modal]')).toBeNull();
  });

  it('keeps the modal open on a stage request error and allows retry', async () => {
    await render();
    fixture.componentInstance.recallAction(review.topMetrics[0]);
    await render();
    confirmRecall();
    stages.error(new Error('Network error'));
    await render();

    expect(fixture.nativeElement.querySelector('[data-recall-modal]')).not.toBeNull();
    expect(toastError).toHaveBeenCalled();
    expect(recallTopLevelMetric).not.toHaveBeenCalled();

    stages = new Subject<ApiResponse<unknown>>();
    confirmRecall();
    expect(getCurrentMetricStages).toHaveBeenCalledTimes(2);
  });

  it('keeps the modal open without recalling when the stage API reports failure', async () => {
    await render();
    fixture.componentInstance.recallAction(review.topMetrics[0]);
    await render();
    confirmRecall();
    stages.next({ data: null, status: 400, success: false, message: 'Stages unavailable' });
    await render();

    expect(fixture.nativeElement.querySelector('[data-recall-modal]')).not.toBeNull();
    expect(toastError).toHaveBeenCalledWith('Stages unavailable');
    expect(recallTopLevelMetric).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[data-recall-confirm]').disabled).toBe(false);
  });

  it('keeps Confirm disabled through the recall request and allows retry on recall failure', async () => {
    const recallResponse = new Subject<{ data: never[]; status: number; success: boolean }>();
    recallTopLevelMetric.mockReturnValue(recallResponse);
    await render();
    fixture.componentInstance.recallAction(review.topMetrics[0]);
    await render();
    confirmRecall();
    stages.next({ data: [], status: 200, success: true });
    await render();

    expect(fixture.nativeElement.querySelector('[data-recall-confirm]').disabled).toBe(true);
    fixture.nativeElement.querySelector('[data-recall-close]').click();
    await render();
    expect(fixture.nativeElement.querySelector('[data-recall-modal]')).not.toBeNull();

    recallResponse.error(new Error('Recall failed'));
    await render();

    expect(toastError).toHaveBeenCalledWith('Failed to recall review metric CV1');
    expect(fixture.nativeElement.querySelector('[data-recall-modal]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-recall-confirm]').disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('[data-recall-comment]').value).toBe('Recall comment');
  });

  it('waits for metrics, opens the matching category and child, and scrolls to its end', async () => {
    await render();
    expect(scrollIntoView).not.toHaveBeenCalled();

    reviews.next(review);
    await render();

    const row = fixture.nativeElement.querySelector('[data-review-metric-code="CV1.2"]');
    expect(fixture.componentInstance.detailsExpanded()).toBe(true);
    expect(row.getAttribute('data-expanded')).toBe('true');
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ behavior: 'smooth', block: 'end' });
    expect(scrollIntoView.mock.instances[0]).toBe(row);
  });

  it('focuses a new query value without recreating the component', async () => {
    reviews.next(review);
    await render();
    scrollIntoView.mockClear();

    queryParams.next(convertToParamMap({ tlm: 'CV1.1' }));
    await render();

    const row = fixture.nativeElement.querySelector('[data-review-metric-code="CV1.1"]');
    expect(row.getAttribute('data-expanded')).toBe('true');
    expect(scrollIntoView.mock.instances[0]).toBe(row);
  });

  it('opens all children when tlm identifies a top-level metric', async () => {
    queryParams.next(convertToParamMap({ tlm: 'CV1' }));
    reviews.next(review);
    await render();

    expect(fixture.nativeElement.querySelectorAll('[data-expanded="true"]').length).toBe(2);
    expect(scrollIntoView.mock.instances[0].tagName).toBe('ARTICLE');
  });

  it.each([{}, { tlm: 'missing' }])('ignores absent or unmatched metric codes: %j', async (params) => {
    queryParams.next(convertToParamMap(params));
    reviews.next(review);
    await render();

    expect(fixture.componentInstance.detailsExpanded()).toBe(false);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('does not scroll again on a routine data refresh', async () => {
    reviews.next(review);
    await render();
    scrollIntoView.mockClear();

    reviews.next({ ...review });
    await render();

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});