import { cn } from './cn';

describe('cn', () => {
  it('merges class strings', () => {
    expect(cn('px-2', 'py-2')).toBe('px-2 py-2');
  });

  it('resolves Tailwind conflicts — last wins', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('ignores falsy values', () => {
    expect(cn('px-2', false && 'py-2', undefined)).toBe('px-2');
  });
});
