import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewDetailPageComponent } from './review-detail-page.component';
import { ReviewService } from '../../services/review.service';
import { EvidenceService } from '../../../evidence/services/evidence.service';
import { AuditService } from '../../../audit/services/audit.service';

// Uses real in-memory services (no mocks needed — all data is synchronous mock data).
// Project '2023-0042' (Hydra) has metrics in MW, CV, EE, MC, SB categories.
// Project '2024-0031' (EcoSchools) has metrics only in EE and SB categories.
const HYDRA_ID   = '2023-0042';
const SCHOOLS_ID = '2024-0031';

describe('ReviewDetailPageComponent', () => {
  let fixture: ComponentFixture<ReviewDetailPageComponent>;
  let component: ReviewDetailPageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewDetailPageComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ReviewDetailPageComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', HYDRA_ID);
    fixture.detectChanges();
  });

  describe('tabData()', () => {
    it('derives category tabs + approval tab from reviewDetail metrics', () => {
      const ids = component.tabData().map(t => t.id);
      expect(ids).toContain('MW');
      expect(ids[ids.length - 1]).toBe('approval');
    });

    it('last tab is always "Approval & Comments"', () => {
      const last = component.tabData()[component.tabData().length - 1];
      expect(last.label).toBe('Approval & Comments');
    });

    it('returns empty array when reviewDetail is null (unknown id)', () => {
      fixture.componentRef.setInput('id', 'UNKNOWN');
      fixture.detectChanges();
      expect(component.tabData()).toEqual([]);
    });

    it('includes badgeClass for known categories', () => {
      const mwTab = component.tabData().find(t => t.id === 'MW');
      expect(mwTab).toBeDefined();
      expect(mwTab!.badgeClass).toContain('aepw-blue');
    });

    it('each category tab has evUploaded and evRequired as non-negative numbers', () => {
      const tabs = component.tabData();
      tabs.filter(t => t.id !== 'approval').forEach(t => {
        expect(typeof t.evUploaded).toBe('number');
        expect(t.evUploaded).toBeGreaterThanOrEqual(0);
        expect(typeof t.evRequired).toBe('number');
        expect(t.evRequired).toBeGreaterThan(0);
      });
    });
  });

  describe('activeTab (linkedSignal)', () => {
    it('initialises to first category tab', () => {
      expect(component.activeTab()).toBe('MW');
    });

    it('resets to new first tab when id changes to different project', () => {
      component.activeTab.set('approval');
      fixture.componentRef.setInput('id', SCHOOLS_ID);
      fixture.detectChanges();
      expect(component.activeTab()).toBe('EE');
    });
  });

  describe('expandedMetrics', () => {
    it('toggleExpand adds metricCode and returns new Set reference', () => {
      const before = component.expandedMetrics();
      component.toggleExpand('MW1.11');
      const after = component.expandedMetrics();
      expect(after).not.toBe(before);
      expect(after.has('MW1.11')).toBe(true);
    });

    it('toggleExpand removes metricCode when already present', () => {
      component.toggleExpand('MW1.11');
      component.toggleExpand('MW1.11');
      expect(component.expandedMetrics().has('MW1.11')).toBe(false);
    });
  });

  describe('expandAllInCategory', () => {
    it('expands all metrics in category when not all are expanded', () => {
      const mwMetrics = component.activeMetrics(); // MW is the first/active tab
      component.expandAllInCategory('MW');
      for (const m of mwMetrics) {
        expect(component.expandedMetrics().has(m.metricCode)).toBe(true);
      }
    });

    it('collapses all metrics when all are already expanded', () => {
      component.expandAllInCategory('MW');
      component.expandAllInCategory('MW');
      const mwMetrics = component.activeMetrics();
      for (const m of mwMetrics) {
        expect(component.expandedMetrics().has(m.metricCode)).toBe(false);
      }
    });
  });

  describe('loading computed', () => {
    it('is true when ReviewService loading is true', () => {
      const svc = TestBed.inject(ReviewService);
      svc.loading.set(true);
      expect(component.loading()).toBe(true);
      svc.loading.set(false);
    });

    it('is true when EvidenceService loading is true', () => {
      const evidSvc = TestBed.inject(EvidenceService);
      evidSvc.loading.set(true);
      expect(component.loading()).toBe(true);
      evidSvc.loading.set(false);
    });
  });

  describe('error computed', () => {
    it('returns first non-null error from services', () => {
      const svc = TestBed.inject(ReviewService);
      svc.error.set('Review error');
      expect(component.error()).toBe('Review error');
      svc.error.set(null);
    });

    it('returns AuditService error when ReviewService and EvidenceService have none', () => {
      const auditSvc = TestBed.inject(AuditService);
      auditSvc.error.set('Audit error');
      expect(component.error()).toBe('Audit error');
      auditSvc.error.set(null);
    });
  });

  describe('embedded evidence in metrics', () => {
    it('MW1.11 has embedded evidence files', () => {
      const detail = component.reviewDetail();
      const mwMetric = detail!.metrics.find(m => m.metricCode === 'MW1.11');
      expect(mwMetric?.evidenceFiles.length).toBeGreaterThan(0);
    });

    it('MW category evidenceUploaded sums correctly in tabData', () => {
      const mwTab = component.tabData().find(t => t.id === 'MW');
      // MW1.11=3 + MW1.12=2 + MW1.13=4 + MW1.14=0 + MW1.1=0 = 9
      expect(mwTab!.evUploaded).toBe(9);
    });
  });

  describe('activeMetrics', () => {
    it('returns only metrics for the active tab category', () => {
      expect(component.activeTab()).toBe('MW');
      const metrics = component.activeMetrics();
      expect(metrics.every(m => m.categoryCode === 'MW')).toBe(true);
    });
  });

  describe('pendingApprovalCount', () => {
    it('counts Pending statuses from reviewItem', () => {
      // Hydra reviewItem: pmStatus=Approved, reviewerStatus=Pending, leadStatus=Pending, finalStatus=Pending
      expect(component.pendingApprovalCount()).toBe(3);
    });
  });
});
