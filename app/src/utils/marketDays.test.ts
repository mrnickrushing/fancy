import { describe, expect, it } from 'vitest';
import { earliestDate, isBlocked, nextMarketDays } from './marketDays';

// 2026-09-12 is a Saturday.
const SAT = '2026-09-12';

describe('nextMarketDays', () => {
  it('offers the next Wednesday and Saturday once the notice is served', () => {
    expect(nextMarketDays(SAT, 2, [])).toEqual(['2026-09-16', '2026-09-19']);
  });

  it('never offers a day inside the notice period, today included', () => {
    expect(nextMarketDays(SAT, 0, [])[0]).toBe(SAT);
    expect(nextMarketDays(SAT, 1, [])[0]).toBe('2026-09-16');
  });

  it('steps over a stretch she has marked off', () => {
    const blocks = [{ start_date: '2026-09-14', end_date: '2026-09-20' }];
    expect(nextMarketDays(SAT, 2, blocks)).toEqual(['2026-09-23', '2026-09-26']);
  });
});

describe('isBlocked', () => {
  it('counts both ends of the stretch', () => {
    const blocks = [{ start_date: '2026-09-14T00:00:00.000Z', end_date: '2026-09-16T00:00:00.000Z' }];
    expect(isBlocked('2026-09-14', blocks)).toBe(true);
    expect(isBlocked('2026-09-16', blocks)).toBe(true);
    expect(isBlocked('2026-09-17', blocks)).toBe(false);
  });
});

describe('earliestDate', () => {
  it('is today plus the notice she asks for', () => {
    expect(earliestDate(SAT, 2)).toBe('2026-09-14');
    expect(earliestDate(SAT, 0)).toBe(SAT);
  });
});
