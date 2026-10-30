import { TestBed } from '@angular/core/testing';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  let svc: ReviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ReviewService);
  });

  it('reviews() returns initial mock list', () => {
    expect(svc.reviews().length).toBeGreaterThan(0);
  });

  it('reviewerQueue() returns initial mock list', () => {
    expect(svc.reviewerQueue().length).toBeGreaterThan(0);
  });

  it('getReviewDetail() returns a ReviewDetail for a known id', () => {
    const id = svc.reviews()[0].projectId;
    const detail = svc.getReviewDetail(id);
    expect(detail).not.toBeNull();
    expect(detail?.projectId).toBe(id);
  });

  it('getReviewDetail() returns null for unknown id', () => {
    expect(svc.getReviewDetail(9999)).toBeNull();
  });

  it('updateMetricStatus() mutates pmStatus on the correct metric', () => {
    const id = svc.reviews()[0].projectId;
    const detail = svc.getReviewDetail(id)!;
    const metricCode = detail.metrics[0].metricCode;
    svc.updateMetricStatus(id, metricCode, 'pmStatus', 'Approved');
    const updated = svc.getReviewDetail(id)!;
    expect(updated.metrics[0].pmStatus).toBe('Approved');
  });

  it('loading signal is false by default', () => {
    expect(svc.loading()).toBe(false);
  });

  it('error signal is null by default', () => {
    expect(svc.error()).toBeNull();
  });

  it('getReviewDetail() returns detail with comments array', () => {
    const id = svc.reviews()[0].projectId;
    const detail = svc.getReviewDetail(id)!;
    expect(Array.isArray(detail.comments)).toBe(true);
  });

  it('updateApprovalStep() changes the correct status field on the matching ReviewItem', () => {
    const projectId = svc.reviewerQueue()[0].projectId;
    svc.updateApprovalStep(projectId, 'reviewerStatus', 'approved');
    const updated = svc.reviewerQueue().find(r => r.projectId === projectId)!;
    expect(updated.reviewerStatus).toBe('Approved');
  });

  it('updateApprovalStep() does not affect other ReviewItems', () => {
    const items = svc.reviewerQueue();
    if (items.length < 2) return;
    const otherProjectId = items[1].projectId;
    svc.updateApprovalStep(items[0].projectId, 'pmStatus', 'rejected');
    const other = svc.reviewerQueue().find(r => r.projectId === otherProjectId)!;
    expect(other.pmStatus).not.toBe('Rejected');
  });

  it('addComment() appends comment to the correct ReviewDetail', () => {
    const projectId = svc.reviews()[0].projectId;
    svc.addComment(projectId, 'Test comment text');
    const detail = svc.getReviewDetail(projectId)!;
    expect(detail.comments.length).toBe(1);
    expect(detail.comments[0].body).toBe('Test comment text');
    expect(detail.comments[0].reviewCommentId).toBeTruthy();
  });

  it('addComment() does not affect other ReviewDetails', () => {
    const projects = svc.reviews();
    if (projects.length < 2) return;
    svc.addComment(projects[0].projectId, 'Only first');
    const other = svc.getReviewDetail(projects[1].projectId)!;
    expect(other.comments.length).toBe(0);
  });

  describe('bulkLaunch()', () => {
    it('sets stage to "Data Collection" for each supplied projectId', () => {
      const reviews = svc.reviews();
      // find two reviews that are not already at Data Collection
      const targets = reviews.filter(r => r.stage !== 'Data Collection').slice(0, 2);
      expect(targets.length).toBeGreaterThanOrEqual(1);

      const ids = targets.map(r => r.projectId);
      svc.bulkLaunch(ids);

      ids.forEach(id => {
        const updated = svc.reviews().find(r => r.projectId === id)!;
        expect(updated.stage).toBe('Data Collection');
      });
    });

    it('leaves reviews not in the supplied list unchanged', () => {
      const reviews = svc.reviews();
      const first = reviews[0];
      const rest  = reviews.slice(1);

      svc.bulkLaunch([first.projectId]);

      rest.forEach((orig, i) => {
        const after = svc.reviews().find(r => r.projectId === orig.projectId)!;
        expect(after.stage).toBe(orig.stage);
      });
    });
  });

  describe('createReview()', () => {
    const payload = {
      projectId:     'AEPW-TEST-001',
      projectName:   'Test Project',
      period:        'Q3 2025',
      metricCodes:   ['MW1.11'],
      riskOverrides: {} as Record<string, never>,
      status:        'draft' as const,
    };

    it('returns a number', () => {
      const id = svc.createReview(payload);
      expect(typeof id).toBe('number');
    });

    it('adds a new review to reviews() with stage "Draft"', () => {
      const before = svc.reviews().length;
      svc.createReview(payload);
      const after = svc.reviews();
      expect(after.length).toBe(before + 1);
      expect(after[after.length - 1].stage).toBe('Draft');
    });

    it('each call returns a distinct ID', () => {
      const id1 = svc.createReview(payload);
      const id2 = svc.createReview(payload);
      expect(id1).not.toBe(id2);
    });
  });
});
