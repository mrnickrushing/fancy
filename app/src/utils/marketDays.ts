// "Come Wednesday. Come Saturday. Come early." — the two days the stall is
// open, as Sunday-indexed weekdays.
export const MARKET_DAYS = [3, 6];

type DayOff = { start_date: string; end_date: string };

function iso(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function isBlocked(date: string, blocks: DayOff[]): boolean {
  return blocks.some((b) => date >= b.start_date.slice(0, 10) && date <= b.end_date.slice(0, 10));
}

// The next market days Amanda could actually promise: far enough out to give
// her the notice she has set, and not inside a stretch she has marked off.
// She is never held to these — step two takes any date she picks — but they
// are what she wants nine times out of ten, and they save her the calendar.
export function nextMarketDays(
  today: string,
  minNoticeDays: number,
  blocks: DayOff[] = [],
  count = 2,
): string[] {
  const out: string[] = [];
  const cursor = new Date(`${today}T12:00:00`);
  cursor.setDate(cursor.getDate() + Math.max(0, minNoticeDays));
  for (let i = 0; i < 120 && out.length < count; i += 1) {
    const date = iso(cursor);
    if (MARKET_DAYS.includes(cursor.getDay()) && !isBlocked(date, blocks)) out.push(date);
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

// The soonest day anything can be promised at all, market day or not — what
// the item sheet quotes when Amanda is asked "when could I have it?".
export function earliestDate(today: string, minNoticeDays: number): string {
  const d = new Date(`${today}T12:00:00`);
  d.setDate(d.getDate() + Math.max(0, minNoticeDays));
  return iso(d);
}
