import { signal } from '@angular/core';

export function createBulkLaunchUiStore() {
  const currentStep         = signal(0);
  const selectedProjectIds  = signal<string[]>([]);
  const reviewPeriod        = signal('');
  const reviewerAssignments = signal<Record<string, string>>({});

  function toggleProject(id: string): void {
    selectedProjectIds.update(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    );
  }

  return { currentStep, selectedProjectIds, reviewPeriod, reviewerAssignments, toggleProject };
}

export type BulkLaunchUiStore = ReturnType<typeof createBulkLaunchUiStore>;
