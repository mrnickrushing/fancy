// A date the server sends is a business date, not a moment: parsing
// "2026-09-16" without the explicit noon would land on the 15th for anyone
// west of UTC, which is to say for Amanda.
function parseBusinessDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const iso = String(value).slice(0, 10);
  return new Date(`${iso}T12:00:00`);
}

export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return parseBusinessDate(value).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function fmtNumericDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = parseBusinessDate(value);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

export function toIsoDate(value: Date): string {
  const mm = String(value.getMonth() + 1).padStart(2, '0');
  const dd = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${mm}-${dd}`;
}

// created_at is a real timestamp, so it is shown in the phone's own zone.
export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

// Postgres NUMERIC arrives as a string, and an unpriced item arrives as null.
export function fmtMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `$${n.toFixed(2)}`;
}

export function toNumber(value: number | string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function fmtStars(rating: number): string {
  const n = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}
