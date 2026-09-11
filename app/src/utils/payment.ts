import { toNumber } from './format';

export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid' | 'refunded';

// What is still owed, or null when there is no total to owe against — an
// order Amanda has not priced yet is not an order with a balance of zero.
export function balanceDue(
  paid: number | string | null | undefined,
  total: number | string | null | undefined,
  status: PaymentStatus,
): number | null {
  if (status === 'paid') return 0;
  const amount = total === null || total === undefined || total === '' ? null : toNumber(total);
  if (amount === null || !(amount > 0)) return null;
  return Math.max(amount - toNumber(paid), 0);
}
