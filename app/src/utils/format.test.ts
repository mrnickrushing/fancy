import { describe, expect, it } from 'vitest';
import { fmtMoney, fmtNumericDate, toIsoDate, toNumber } from './format';

describe('fmtMoney', () => {
  it('formats numbers and Postgres numeric strings alike', () => {
    expect(fmtMoney(15)).toBe('$15.00');
    expect(fmtMoney('15.00')).toBe('$15.00');
    expect(fmtMoney('7.5')).toBe('$7.50');
  });

  it('shows a dash rather than $0.00 when there is no figure', () => {
    expect(fmtMoney(null)).toBe('—');
    expect(fmtMoney(undefined)).toBe('—');
    expect(fmtMoney('')).toBe('—');
    expect(fmtMoney('not money')).toBe('—');
  });
});

describe('toNumber', () => {
  it('falls back to zero rather than NaN', () => {
    expect(toNumber('12.50')).toBe(12.5);
    expect(toNumber(null)).toBe(0);
    expect(toNumber('nonsense')).toBe(0);
  });
});

// A business date is a day, not a moment. Parsed carelessly, "2026-09-16"
// becomes the 15th anywhere west of UTC — which is to say, in Brookings.
describe('business dates', () => {
  it('keeps the day it was given', () => {
    expect(fmtNumericDate('2026-09-16')).toBe('09/16/2026');
    expect(fmtNumericDate('2026-01-01')).toBe('01/01/2026');
  });

  it('survives a full timestamp', () => {
    expect(fmtNumericDate('2026-09-16T00:00:00.000Z')).toBe('09/16/2026');
  });

  it('round-trips through toIsoDate', () => {
    const d = new Date(2026, 8, 16, 12, 0, 0);
    expect(toIsoDate(d)).toBe('2026-09-16');
    expect(fmtNumericDate(toIsoDate(d))).toBe('09/16/2026');
  });
});
