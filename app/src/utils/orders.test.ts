import { describe, expect, it } from 'vitest';
import { filterAndSortOrders, itemCount, itemsSubtotal } from './orders';
import type { Order, OrderItem } from '../api/types';

function item(over: Partial<OrderItem> = {}): OrderItem {
  return { id: 1, menu_item_id: 1, name: 'Rosemary Slab', unit_price: '15.00', quantity: 1, ...over };
}

function order(over: Partial<Order> = {}): Order {
  return {
    id: 1,
    first_name: 'Ada',
    last_name: 'Byron',
    email: 'ada@example.com',
    phone: null,
    fulfillment: 'pickup',
    needed_date: '2026-10-07',
    address: null,
    notes: null,
    status: 'pending',
    amount: null,
    payment_status: 'unpaid',
    paid_amount: '0',
    shipping_fee: '0',
    source: 'website',
    respond_token: 't',
    created_at: '2026-09-01T10:00:00.000Z',
    items: [item()],
    payments: [],
    ...over,
  };
}

describe('filterAndSortOrders', () => {
  const orders = [
    order({ id: 1, first_name: 'Ada', last_name: 'Byron', email: 'ada@example.com', status: 'pending', needed_date: '2026-10-07', created_at: '2026-09-01T10:00:00.000Z' }),
    order({ id: 2, first_name: 'Grace', last_name: 'Hopper', email: 'grace@example.com', status: 'accepted', needed_date: '2026-09-20', created_at: '2026-09-03T10:00:00.000Z' }),
    order({ id: 3, first_name: 'Alan', last_name: 'Turing', email: 'alan@example.com', status: 'completed', needed_date: '2026-11-01', created_at: '2026-09-02T10:00:00.000Z' }),
  ];

  it('keeps everything when the filter is all', () => {
    expect(filterAndSortOrders(orders, 'all', '', 'needed')).toHaveLength(3);
  });

  it('narrows to one status', () => {
    const out = filterAndSortOrders(orders, 'pending', '', 'needed');
    expect(out.map((o) => o.id)).toEqual([1]);
  });

  it('sorts by the day the bake is wanted', () => {
    expect(filterAndSortOrders(orders, 'all', '', 'needed').map((o) => o.id)).toEqual([2, 1, 3]);
  });

  it('sorts newest first, and by surname', () => {
    expect(filterAndSortOrders(orders, 'all', '', 'recent').map((o) => o.id)).toEqual([2, 3, 1]);
    expect(filterAndSortOrders(orders, 'all', '', 'name').map((o) => o.id)).toEqual([1, 2, 3]);
  });

  it('searches the name, the email and the notes', () => {
    expect(filterAndSortOrders(orders, 'all', 'hopper', 'needed').map((o) => o.id)).toEqual([2]);
    expect(filterAndSortOrders(orders, 'all', 'ADA@', 'needed').map((o) => o.id)).toEqual([1]);
  });

  // Searching "sourdough" should find the sourdough orders, not nothing.
  it('searches what was actually ordered', () => {
    const withSourdough = [
      order({ id: 9, first_name: 'Edith', last_name: 'Clarke', items: [item({ name: 'Classic Sourdough' })] }),
      ...orders,
    ];
    expect(filterAndSortOrders(withSourdough, 'all', 'sourdough', 'needed').map((o) => o.id)).toEqual([9]);
  });
});

describe('itemCount', () => {
  it('adds the quantities, not the lines', () => {
    expect(itemCount(order({ items: [item({ quantity: 2 }), item({ id: 2, quantity: 3 })] }))).toBe(5);
  });
});

describe('itemsSubtotal', () => {
  it('multiplies each line out', () => {
    expect(itemsSubtotal(order({ items: [item({ quantity: 2 }), item({ id: 2, unit_price: '10.00', quantity: 1 })] }))).toBe(40);
  });

  // A quote-on-request bake has no price, and must not read as free.
  it('is unknown when nothing on the order is priced', () => {
    expect(itemsSubtotal(order({ items: [item({ unit_price: null })] }))).toBeNull();
  });

  it('skips the unpriced lines when some of them are priced', () => {
    expect(itemsSubtotal(order({ items: [item({ quantity: 1 }), item({ id: 2, unit_price: null, quantity: 4 })] }))).toBe(15);
  });
});
