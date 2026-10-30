import { createReviewDetailUiStore } from './review-detail-ui.store';

describe('createReviewDetailUiStore', () => {
  it('has default initial state', () => {
    const s = createReviewDetailUiStore();
    expect(s.activeTab()).toBe('metrics');
    expect(s.expandedMetric()).toBeNull();
    expect(s.commentDraft()).toBe('');
  });

  it('activeTab can be changed', () => {
    const s = createReviewDetailUiStore();
    s.activeTab.set('evidence');
    expect(s.activeTab()).toBe('evidence');
  });
});
