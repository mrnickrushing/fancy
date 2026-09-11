import { api } from './client';
import type { Course, MenuItem, MenuItemInput } from './types';

// The admin menu is the whole bill of fare, including anything currently
// marked unavailable — unlike the public /api/menu, which hides those.
export async function listMenu(): Promise<{ courses: Record<Course, string>; items: MenuItem[] }> {
  const { data } = await api.get<{ courses: Record<Course, string>; items: MenuItem[] }>('/api/admin/menu');
  return data;
}

export async function createMenuItem(input: MenuItemInput): Promise<MenuItem> {
  const { data } = await api.post<{ ok: true; item: MenuItem }>('/api/admin/menu', input);
  return data.item;
}

export async function updateMenuItem(id: number, patch: Partial<MenuItemInput>): Promise<MenuItem> {
  const { data } = await api.patch<{ ok: true; item: MenuItem }>(`/api/admin/menu/${id}`, patch);
  return data.item;
}

export async function deleteMenuItem(id: number): Promise<void> {
  await api.delete(`/api/admin/menu/${id}`);
}
