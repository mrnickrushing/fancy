import { describe, expect, it } from 'vitest';
import { balanceDue } from './payment';

describe('balanceDue', () => {
  it('is zero once the order is paid, whatever the numbers say', () => {
    expect(balanceDue(0, 40, 'paid')).toBe(0);
    expect(balanceDue('10.00', '40.00', 'paid')).toBe(0);
  });

  it('is the remainder when part of it has been paid', () => {
    expect(balanceDue('15.00', '40.00', 'deposit_paid')).toBe(25);
    expect(balanceDue(0, 40, 'unpaid')).toBe(40);
  });

  // An order Amanda has not priced yet is not an order with nothing owing.
  it('is unknown when there is no total', () => {
    expect(balanceDue(0, null, 'unpaid')).toBeNull();
    expect(balanceDue(0, '', 'unpaid')).toBeNull();
    expect(balanceDue(0, 0, 'unpaid')).toBeNull();
  });

  it('never goes negative when someone overpays', () => {
    expect(balanceDue('50.00', '40.00', 'deposit_paid')).toBe(0);
  });

  it('reads Postgres numeric strings', () => {
    expect(balanceDue('7.50', '30.00', 'deposit_paid')).toBe(22.5);
  });
});
