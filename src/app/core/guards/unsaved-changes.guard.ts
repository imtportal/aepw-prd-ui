import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

import { UnsavedChangesService } from '../services/unsaved-changes.service';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component?.hasUnsavedChanges?.()) {
    return true;
  }

  const unsavedChangesService = inject(UnsavedChangesService);

  return unsavedChangesService.confirm();
};
