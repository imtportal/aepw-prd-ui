import { createBulkLaunchUiStore } from './bulk-launch-ui.store';

describe('createBulkLaunchUiStore', () => {
  it('has default initial state', () => {
    const s = createBulkLaunchUiStore();
    expect(s.currentStep()).toBe(0);
    expect(s.selectedProjectIds()).toEqual([]);
    expect(s.reviewPeriod()).toBe('');
  });

  it('toggleProject adds and removes project ids', () => {
    const s = createBulkLaunchUiStore();
    s.toggleProject('P001');
    expect(s.selectedProjectIds()).toContain('P001');
    s.toggleProject('P001');
    expect(s.selectedProjectIds()).not.toContain('P001');
  });
});
