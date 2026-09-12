import { API_URL } from '../api/client';
import type { MenuItem, OrderItem } from '../api/types';

// The photographs are the website's own, served from /img by the same origin
// the order book comes from. Nothing is bundled: a bake Amanda re-shoots
// changes on her phone as soon as it changes on the site.
export function photoUrl(image: string | null | undefined): string | null {
  if (!image) return null;
  return `${API_URL}/img/${image}`;
}

// An order line snapshots the name and the price it was sold at, so the
// photograph has to be found again. By id first; by name second, because a
// bake taken off the menu leaves its old orders pointing at nothing.
export function itemPhoto(item: Pick<OrderItem, 'menu_item_id' | 'name'>, menu: MenuItem[] | undefined): string | null {
  if (!menu?.length) return null;
  const byId = item.menu_item_id !== null ? menu.find((m) => m.id === item.menu_item_id) : undefined;
  const match = byId ?? menu.find((m) => m.name === item.name);
  return photoUrl(match?.image);
}
