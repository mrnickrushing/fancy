import { describe, expect, it } from 'vitest';
import { benchBake, spellCount } from './today';
import type { Order, OrderItem } from '../api/types';

function item(over: Partial<OrderItem> = {}): OrderItem {
  return { id: 1, menu_item_id: 1, name: 'Rosemary Slab', unit_price: '15.00', quantity: 1, ...over };
}

function order(over: Partial<Order> = {}): Order {
  return {
    id: 1, first_name: 'Ada', last_name: 'Byron', email: null, phone: null,
    fulfillment: 'pickup', needed_date: '2026-09-19', address: null, notes: null,
    status: 'accepted', amount: null, payment_status: 'unpaid', paid_amount: '0',
    shipping_fee: '0', is_gift: false, source: 'website', respond_token: 't',
    created_at: '2026-09-01T10:00:00.000Z', items: [item()], payments: [], ...over,
  };
}

describe('benchBake', () => {
  it('is nothing when the book is empty', () => {
    expect(benchBake([], '2026-09-12')).toBeNull();
  });

  it('takes the soonest day that still has work on it', () => {
    const bench = benchBake(
      [
        order({ id: 1, needed_date: '2026-09-26', items: [item({ name: 'Late Loaf', quantity: 9 })] }),
        order({ id: 2, needed_date: '2026-09-19', items: [item({ name: 'Flower Garden', quantity: 2 })] }),
      ],
      '2026-09-12',
    );
    expect(bench?.item.name).toBe('Flower Garden');
    expect(bench?.date).toBe('2026-09-19');
    expect(bench?.isToday).toBe(false);
  });

  it('adds the same bake up across the day’s orders, and says when it is today', () => {
    const bench = benchBake(
      [
        order({ id: 1, needed_date: '2026-09-12', items: [item({ name: 'Flower Garden', quantity: 3 })] }),
        order({ id: 2, needed_date: '2026-09-12', items: [item({ name: 'Flower Garden', quantity: 1 }), item({ id: 2, name: 'Olive You', quantity: 3 })] }),
      ],
      '2026-09-12',
    );
    expect(bench?.item.name).toBe('Flower Garden');
    expect(bench?.quantity).toBe(4);
    expect(bench?.isToday).toBe(true);
  });

  // A declined order is not work, and a day gone by is not the bench.
  it('ignores declined and cancelled orders, and everything in the past', () => {
    expect(
      benchBake(
        [
          order({ id: 1, status: 'declined', needed_date: '2026-09-15' }),
          order({ id: 2, status: 'cancelled', needed_date: '2026-09-16' }),
          order({ id: 3, needed_date: '2026-09-01' }),
        ],
        '2026-09-12',
      ),
    ).toBeNull();
  });

  it('counts an order she has not answered yet, because that is the day she is about to be asked about', () => {
    const bench = benchBake([order({ status: 'pending', needed_date: '2026-09-14' })], '2026-09-12');
    expect(bench?.date).toBe('2026-09-14');
  });

  // Two bakes wanted equally must not trade places between refetches.
  it('settles a tie by name rather than by list order', () => {
    const a = benchBake(
      [order({ items: [item({ name: 'Zest Loaf', quantity: 2 }), item({ id: 2, name: 'Anise Slab', quantity: 2 })] })],
      '2026-09-12',
    );
    const b = benchBake(
      [order({ items: [item({ name: 'Anise Slab', quantity: 2 }), item({ id: 2, name: 'Zest Loaf', quantity: 2 })] })],
      '2026-09-12',
    );
    expect(a?.item.name).toBe('Anise Slab');
    expect(b?.item.name).toBe('Anise Slab');
  });
});

describe('spellCount', () => {
  it('writes the small numbers out and leaves the big ones as figures', () => {
    expect(spellCount(4)).toBe('four');
    expect(spellCount(12)).toBe('twelve');
    expect(spellCount(13)).toBe('13');
  });
});
