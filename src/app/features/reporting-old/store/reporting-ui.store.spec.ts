import { createReportingUiStore } from './reporting-ui.store';

describe('createReportingUiStore', () => {
  it('has default initial state', () => {
    const s = createReportingUiStore();
    expect(s.activeView()).toBe('overview');
    expect(s.selectedMetricCode()).toBeNull();
    expect(s.mapZoom()).toBe(4);
  });

  it('signals are writable', () => {
    const s = createReportingUiStore();
    s.activeView.set('program');
    s.selectedMetricCode.set('MW1.1');
    s.mapZoom.set(6);
    expect(s.activeView()).toBe('program');
    expect(s.selectedMetricCode()).toBe('MW1.1');
    expect(s.mapZoom()).toBe(6);
  });
});
