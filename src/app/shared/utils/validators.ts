import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function noWhitespace(control: AbstractControl): ValidationErrors | null {
  const val = control.value as string;
  if (val === null || val === undefined || val === '') return null;
  return val.trim().length === 0 ? { noWhitespace: true } : null;
}

export function minLengthTrimmed(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = control.value as string;
    if (val === null || val === undefined) return null;
    const trimmed = val.trim().length;
    return trimmed < min ? { minLengthTrimmed: { required: min, actual: trimmed } } : null;
  };
}

export function positiveNumber(control: AbstractControl): ValidationErrors | null {
  const val = control.value;
  if (val === null || val === undefined) return null;
  return Number(val) > 0 ? null : { positiveNumber: true };
}

export function aepwEmail(control: AbstractControl): ValidationErrors | null {
  const val = control.value as string;
  if (!val) return null;
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRe.test(val) ? null : { email: true };
}
