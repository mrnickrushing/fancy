import type { Order, OrderItem } from '../api/types';

export type Bench = {
  // The line that stands for the day, kept whole so its photograph can be
  // found the same way every other line's is.
  item: OrderItem;
  quantity: number;
  date: string;
  isToday: boolean;
};

const COUNTED = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

export function spellCount(n: number): string {
  return n >= 1 && n <= COUNTED.length ? COUNTED[n - 1] : String(n);
}

// What is on the bench: the bake most wanted on the next day Amanda has
// anything to make. Derived rather than chosen, so there is no photograph for
// her to pick every morning before the app tells her anything.
//
// Declined and cancelled orders are not work. Completed ones are work already
// done, and an order still pending is work she has not agreed to — but it is
// the day she is about to be asked about, so it counts.
export function benchBake(orders: Order[], today: string): Bench | null {
  const live = orders.filter(
    (o) => (o.status === 'accepted' || o.status === 'pending') && o.needed_date.slice(0, 10) >= today,
  );
  if (!live.length) return null;

  const date = live.reduce((min, o) => (o.needed_date.slice(0, 10) < min ? o.needed_date.slice(0, 10) : min), '9999-12-31');
  const onTheDay = live.filter((o) => o.needed_date.slice(0, 10) === date);

  const tally = new Map<string, { item: OrderItem; quantity: number }>();
  for (const order of onTheDay) {
    for (const item of order.items) {
      const seen = tally.get(item.name);
      if (seen) seen.quantity += item.quantity;
      else tally.set(item.name, { item, quantity: item.quantity });
    }
  }
  if (!tally.size) return null;

  // Most wanted wins; a tie is settled by name so the hero does not shuffle
  // between two equal bakes every time the list is refetched.
  const best = [...tally.values()].sort(
    (a, b) => b.quantity - a.quantity || a.item.name.localeCompare(b.item.name),
  )[0];

  return { item: best.item, quantity: best.quantity, date, isToday: date === today };
}
