import { api } from './client';
import type { Review } from './types';

export async function listReviews(): Promise<Review[]> {
  const { data } = await api.get<{ reviews: Review[] }>('/api/admin/reviews');
  return data.reviews;
}

export async function approveReview(id: number): Promise<Review> {
  const { data } = await api.post<{ ok: true; review: Review }>(`/api/admin/reviews/${id}/approve`);
  return data.review;
}

export async function rejectReview(id: number): Promise<Review> {
  const { data } = await api.post<{ ok: true; review: Review }>(`/api/admin/reviews/${id}/reject`);
  return data.review;
}

export async function deleteReview(id: number): Promise<void> {
  await api.delete(`/api/admin/reviews/${id}`);
}
