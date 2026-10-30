import { FormControl } from '@angular/forms';
import { noWhitespace, minLengthTrimmed, positiveNumber, aepwEmail } from './validators';

describe('validators', () => {
  describe('noWhitespace', () => {
    it('returns error for whitespace-only string', () => {
      expect(noWhitespace(new FormControl('   '))).toEqual({ noWhitespace: true });
    });
    it('returns null for valid string', () => {
      expect(noWhitespace(new FormControl('hello'))).toBeNull();
    });
    it('returns null for empty string (use Validators.required separately)', () => {
      expect(noWhitespace(new FormControl(''))).toBeNull();
    });
    it('returns null for null value', () => {
      expect(noWhitespace(new FormControl(null))).toBeNull();
    });
  });

  describe('minLengthTrimmed', () => {
    it('returns error when trimmed length is less than min', () => {
      expect(minLengthTrimmed(5)(new FormControl('  hi  '))).toEqual({ minLengthTrimmed: { required: 5, actual: 2 } });
    });
    it('returns null when trimmed length meets min', () => {
      expect(minLengthTrimmed(3)(new FormControl('hello'))).toBeNull();
    });
    it('returns null for null value', () => {
      expect(minLengthTrimmed(3)(new FormControl(null))).toBeNull();
    });
  });

  describe('positiveNumber', () => {
    it('returns error for negative number', () => {
      expect(positiveNumber(new FormControl(-1))).toEqual({ positiveNumber: true });
    });
    it('returns error for zero', () => {
      expect(positiveNumber(new FormControl(0))).toEqual({ positiveNumber: true });
    });
    it('returns null for positive number', () => {
      expect(positiveNumber(new FormControl(5))).toBeNull();
    });
    it('returns null for null value', () => {
      expect(positiveNumber(new FormControl(null))).toBeNull();
    });
  });

  describe('aepwEmail', () => {
    it('returns error for invalid email', () => {
      expect(aepwEmail(new FormControl('not-an-email'))).toEqual({ email: true });
    });
    it('returns null for valid email', () => {
      expect(aepwEmail(new FormControl('user@aepw.org'))).toBeNull();
    });
    it('returns null for empty value', () => {
      expect(aepwEmail(new FormControl(''))).toBeNull();
    });
  });
});
