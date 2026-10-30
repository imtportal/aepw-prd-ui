import {
  ReviewListDto,
  ReviewItem,
  ReviewDetail,
  MetricRow,
  ApprovalStage,
  ReviewWorkflowStage,
} from './review.model';

describe('review.model', () => {
  it('ReviewListDto shape is correct', () => {
    const r: ReviewListDto = {
      reviewId:             1,
      projectId:            101,
      project:              'Solar Ghana',
      pm:                   'Alice',
      recipient:            'GreenCorp',
      stage:                'Data Collection',
      dataCompletionPct:    80,
      evidenceConfirmedPct: 12,
      updatedAt:            '2026-05-01',
    };
    expect(r.stage).toBe('Data Collection');
    expect(r.dataCompletionPct).toBe(80);
  });

  it('ReviewItem shape is correct', () => {
    const ri: ReviewItem = {
      reviewId:             1,
      projectId:            101,
      projectName:          'Solar Ghana',
      periodCode:           'Q1 2026',
      currentApprovalStage: 'Reviewer',
      pm:                   'Alice',
      reviewer:             'Bob',
      leadReviewer:         'Carol',
      finalApprover:        'Dan',
      pmStatus:             'Approved',
      reviewerStatus:       'Pending',
      leadStatus:           'Pending',
      finalStatus:          'Pending',
      totalMetrics:         20,
      approvedMetrics:      10,
      rejectedMetrics:      2,
      recycledMetrics:      1,
      materialFlags:        0,
      evidenceComplete:     true,
      lastActivity:         '2026-05-10',
    };
    expect(ri.pmStatus).toBe('Approved');
    expect(ri.currentApprovalStage).toBe('Reviewer');
  });

  it('ReviewWorkflowStage covers all dashboard stages', () => {
    const stages: ReviewWorkflowStage[] = [
      'Due',
      'Draft',
      'Data Collection',
      'Evidence Collection',
      'Validation',
      'Approval',
      'Closed',
    ];
    expect(stages.length).toBe(7);
  });

  it('ApprovalStage covers all approval sub-stages', () => {
    const stages: ApprovalStage[] = [
      'PM Review',
      'Reviewer',
      'Lead Reviewer',
      'Final Approval',
      'Complete',
    ];
    expect(stages.length).toBe(5);
  });

  it('MetricRow finalStatus is optional', () => {
    const row: MetricRow = {
      reviewMetricId:   1,
      metricId:         1,
      metricCode:       'MW-01',
      metricName:       'Waste Collected',
      categoryCode:         'MW',
      unit:             'tonnes',
      reportedValue:    '500',
      pmStatus:         'Approved',
      reviewStatus:     'Approved',
      leadStatus:       'Pending',
      evidenceUploaded: 0,
      evidenceRequired: 0,
      evidenceFiles:    [],
    };
    expect(row.finalStatus).toBeUndefined();

    const rowWithFinal: MetricRow = { ...row, finalStatus: 'Approved' };
    expect(rowWithFinal.finalStatus).toBe('Approved');
  });

  it('MetricRow optional fields are optional', () => {
    const row: MetricRow = {
      reviewMetricId:    2,
      metricId:          2,
      metricCode:        'MW-02',
      metricName:        'Waste Recycled',
      categoryCode:          'MW',
      unit:              'tonnes',
      reportedValue:     '1,250',
      pmStatus:          'Approved',
      reviewStatus:      'Pending',
      leadStatus:        'Pending',
      isTopLevel:        true,
      parentCode:        undefined,
      optional:          true,
      validationWarning: 'Exceeds expected range',
      evidenceUploaded:  2,
      evidenceRequired:  5,
      evidenceFiles:     [],
    };
    expect(row.isTopLevel).toBe(true);
    expect(row.optional).toBe(true);
    expect(row.validationWarning).toBe('Exceeds expected range');
  });

  it('ReviewDetail shape is correct', () => {
    const detail: ReviewDetail = {
      reviewId:    1,
      projectId:   101,
      projectName: 'Solar Ghana',
      periodCode:  'Q1 2026',
      stage:       'Approval',
      metrics:     [],
      comments:    [],
    };
    expect(detail.stage).toBe('Approval');
    expect(detail.metrics).toEqual([]);
    expect(Array.isArray(detail.comments)).toBe(true);
  });
});
