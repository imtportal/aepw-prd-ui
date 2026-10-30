import { signal } from '@angular/core';

export type ReviewDetailTab = 'metrics' | 'evidence' | 'audit';

export function createReviewDetailUiStore() {
  const activeTab      = signal<ReviewDetailTab>('metrics');
  const expandedMetric = signal<string | null>(null);
  const commentDraft   = signal('');
  const showFlagDialog = signal(false);

  return { activeTab, expandedMetric, commentDraft, showFlagDialog };
}

export type ReviewDetailUiStore = ReturnType<typeof createReviewDetailUiStore>;
