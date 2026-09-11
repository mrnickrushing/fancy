import { api } from './client';

export async function registerPushToken(token: string): Promise<void> {
  await api.post('/api/admin/push-token', { token });
}

// The token identifies the device, so it has to travel with the request even
// though this is a DELETE.
export async function unregisterPushToken(token: string): Promise<void> {
  await api.delete('/api/admin/push-token', { data: { token } });
}
