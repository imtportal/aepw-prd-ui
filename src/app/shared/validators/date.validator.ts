import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const endDateAfterStartValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const start = control.get('startDate')?.value;
  const end = control.get('endDate')?.value;

  if (!start || !end) {
    return null;
  }

  return new Date(end) < new Date(start) ? { endBeforeStart: true } : null;
};
