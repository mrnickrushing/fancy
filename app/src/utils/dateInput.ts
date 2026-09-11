// MM/DD/YYYY as you type. The separator is never left trailing, so backspace
// always deletes a digit instead of a slash that reappears immediately.
export function maskDateInput(value: string): string {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// Returns YYYY-MM-DD, or null when the text is not a real calendar date. The
// round-trip catches 02/31 and friends, which Date happily rolls over.
export function toIsoFromMasked(value: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value ?? '').trim());
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  const month = Number(mm), day = Number(dd), year = Number(yyyy);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}
