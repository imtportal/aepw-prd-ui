import { createEvidenceUiStore } from './evidence-ui.store';

describe('createEvidenceUiStore', () => {
  it('has default initial state', () => {
    const s = createEvidenceUiStore();
    expect(s.searchQuery()).toBe('');
    expect(s.selectedStatus()).toBe('all');
    expect(s.selectedFileType()).toBe('all');
    expect(s.currentPage()).toBe(1);
  });

  it('signals are writable', () => {
    const s = createEvidenceUiStore();
    s.searchQuery.set('test');
    expect(s.searchQuery()).toBe('test');
    s.selectedStatus.set('pending');
    expect(s.selectedStatus()).toBe('pending');
  });
});
