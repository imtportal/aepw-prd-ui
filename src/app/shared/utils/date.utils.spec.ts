import { formatDateTime } from './date.utils';

describe('formatDateTime', () => {
  it('formats ISO string to "DD Mon HH:MM" in UTC', () => {
    expect(formatDateTime('2025-07-18T14:32:00')).toBe('18 Jul 14:32');
  });

  it('zero-pads single-digit day and time components', () => {
    expect(formatDateTime('2025-01-05T09:03:00')).toBe('05 Jan 09:03');
  });
});
