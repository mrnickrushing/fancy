import { describe, expect, it } from 'vitest';
import { maskDateInput, toIsoFromMasked } from './dateInput';

describe('maskDateInput', () => {
  it('adds the slashes as you type', () => {
    expect(maskDateInput('1')).toBe('1');
    expect(maskDateInput('12')).toBe('12');
    expect(maskDateInput('123')).toBe('12/3');
    expect(maskDateInput('1231')).toBe('12/31');
    expect(maskDateInput('123120')).toBe('12/31/20');
    expect(maskDateInput('12312026')).toBe('12/31/2026');
  });

  it('never leaves a trailing slash, so backspace deletes a digit', () => {
    // Typing "12" then deleting would otherwise land on "12/" and stick.
    expect(maskDateInput('12')).toBe('12');
    expect(maskDateInput('1231')).toBe('12/31');
  });

  it('ignores anything that is not a digit, and stops at eight', () => {
    expect(maskDateInput('12/31/2026')).toBe('12/31/2026');
    expect(maskDateInput('ab12cd31ef2026')).toBe('12/31/2026');
    expect(maskDateInput('123120261234')).toBe('12/31/2026');
  });
});

describe('toIsoFromMasked', () => {
  it('converts a complete date', () => {
    expect(toIsoFromMasked('12/31/2026')).toBe('2026-12-31');
    expect(toIsoFromMasked('  01/05/2027 ')).toBe('2027-01-05');
  });

  it('refuses a partial date', () => {
    expect(toIsoFromMasked('12/31')).toBeNull();
    expect(toIsoFromMasked('')).toBeNull();
    expect(toIsoFromMasked('12/31/26')).toBeNull();
  });

  it('refuses a day that does not exist, which Date would roll over', () => {
    expect(toIsoFromMasked('02/31/2026')).toBeNull();
    expect(toIsoFromMasked('13/01/2026')).toBeNull();
    expect(toIsoFromMasked('00/10/2026')).toBeNull();
  });

  it('accepts a real leap day and refuses a false one', () => {
    expect(toIsoFromMasked('02/29/2028')).toBe('2028-02-29');
    expect(toIsoFromMasked('02/29/2026')).toBeNull();
  });
});
