import { describe, expect, it } from 'vitest';
import { nextAct, orderTimeline } from './timeline';
import type { Order, OrderItem } from '../api/types';

function item(over: Partial<OrderItem> = {}): OrderItem {
  return { id: 1, menu_item_id: 1, name: 'Rosemary Slab', unit_price: '15.00', quantity: 1, ...over };
}

function order(over: Partial<Order> = {}): Order {
  return {
    id: 1482, first_name: 'Marisol', last_name: 'Reyes', email: null, phone: null,
    fulfillment: 'pickup', needed_date: '2026-09-19', address: null, notes: null,
    status: 'accepted', amount: '45.00', payment_status: 'unpaid', paid_amount: '0',
    shipping_fee: '0', source: 'website', respond_token: 't',
    created_at: '2026-09-08T19:12:00.000Z', items: [item()], payments: [], ...over,
  };
}

describe('orderTimeline', () => {
  it('runs asked → accepted → money → handover', () => {
    expect(orderTimeline(order()).map((s) => s.key)).toEqual(['asked', 'answer', 'money', 'handover']);
  });

  it('says where the order came from', () => {
    expect(orderTimeline(order())[0].detail).toMatch(/From the website/);
    expect(orderTimeline(order({ source: 'manual' }))[0].detail).toMatch(/Written in by you/);
  });

  it('leaves the answer undone while the order is pending', () => {
    const [, answer] = orderTimeline(order({ status: 'pending' }));
    expect(answer.title).toBe('Waiting on you');
    expect(answer.state).toBe('todo');
  });

  // Half paid is neither done nor undone, and the figure that matters is what
  // is left.
  it('marks a deposit as part done, and says what is still owed', () => {
    const [, , money] = orderTimeline(order({ payment_status: 'deposit_paid', paid_amount: '15.00' }));
    expect(money.state).toBe('part');
    expect(money.detail).toBe('$15.00 of $45.00 · $30.00 still owed');
  });

  it('closes out a paid order', () => {
    const [, , money] = orderTimeline(order({ payment_status: 'paid', paid_amount: '45.00' }));
    expect(money.state).toBe('done');
  });

  // A refused order should not show two greyed steps of work that will never
  // happen.
  it('stops at the refusal for a declined or cancelled order', () => {
    expect(orderTimeline(order({ status: 'declined' })).map((s) => s.title)).toEqual(['Asked for', 'Declined']);
    expect(orderTimeline(order({ status: 'cancelled' })).map((s) => s.title)).toEqual(['Asked for', 'Cancelled']);
  });

  it('marks the handover done once the order is finished', () => {
    const steps = orderTimeline(order({ status: 'completed', payment_status: 'paid', paid_amount: '45.00' }));
    expect(steps[3].state).toBe('done');
    expect(steps[3].detail).not.toMatch(/Wanted/);
  });

  // An order with no total is not an order that owes nothing.
  it('does not read an unpriced order as paid up', () => {
    const [, , money] = orderTimeline(order({ amount: null }));
    expect(money.title).toBe('Nothing paid yet');
    expect(money.detail).toBe('No total set yet.');
  });
});

describe('nextAct', () => {
  it('asks for an answer first', () => {
    expect(nextAct(order({ status: 'pending' }))).toBe('accept');
  });

  it('asks for the money while any is outstanding', () => {
    expect(nextAct(order())).toBe('payment');
    expect(nextAct(order({ paid_amount: '15.00', payment_status: 'deposit_paid' }))).toBe('payment');
  });

  it('asks for the handover once it is paid', () => {
    expect(nextAct(order({ payment_status: 'paid', paid_amount: '45.00' }))).toBe('handover');
  });

  // An order with no total yet cannot be chased for money, so the next thing
  // is to hand it over — the total is set from the money panel below.
  it('falls through to the handover when there is no total to owe against', () => {
    expect(nextAct(order({ amount: null }))).toBe('handover');
  });

  it('wants nothing from a finished, declined or cancelled order', () => {
    expect(nextAct(order({ status: 'completed' }))).toBeNull();
    expect(nextAct(order({ status: 'declined' }))).toBeNull();
    expect(nextAct(order({ status: 'cancelled' }))).toBeNull();
  });
});
