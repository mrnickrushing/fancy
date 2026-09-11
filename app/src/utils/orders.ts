import type { Order } from '../api/types';

export type OrderFilter = 'all' | 'pending' | 'accepted' | 'completed' | 'declined' | 'cancelled';
export type OrderSort = 'needed' | 'recent' | 'name';

function haystack(order: Order): string {
  return [
    order.first_name,
    order.last_name,
    order.email ?? '',
    order.phone ?? '',
    order.notes ?? '',
    ...order.items.map((i) => i.name),
  ]
    .join(' ')
    .toLowerCase();
}

// Searching an order includes what was ordered, not just who ordered it —
// "sourdough" should find the sourdough orders.
export function filterAndSortOrders(
  orders: Order[],
  filter: OrderFilter,
  query: string,
  sort: OrderSort,
): Order[] {
  const q = query.trim().toLowerCase();
  const out = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (!q) return true;
    return haystack(o).includes(q);
  });

  return out.sort((a, b) => {
    if (sort === 'needed') return a.needed_date.localeCompare(b.needed_date);
    if (sort === 'name') {
      return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
    }
    return b.created_at.localeCompare(a.created_at);
  });
}

export function itemCount(order: Order): number {
  return order.items.reduce((n, i) => n + i.quantity, 0);
}

// What the order is worth if Amanda has not set a total yet: the catalog
// prices, which is what she would otherwise add up by hand. Unpriced items
// contribute nothing, so a quote-on-request bake does not silently read as
// free.
export function itemsSubtotal(order: Order): number | null {
  let total = 0;
  let priced = false;
  for (const item of order.items) {
    if (item.unit_price === null) continue;
    priced = true;
    total += Number(item.unit_price) * item.quantity;
  }
  return priced ? total : null;
}
