import { signal } from '@angular/core';

export type ReportingView = 'overview' | 'program' | 'project';

export function createReportingUiStore() {
  const activeView         = signal<ReportingView>('overview');
  const selectedMetricCode = signal<string | null>(null);
  const mapZoom            = signal(4);
  const showProjectList    = signal(false);

  return { activeView, selectedMetricCode, mapZoom, showProjectList };
}

export type ReportingUiStore = ReturnType<typeof createReportingUiStore>;
