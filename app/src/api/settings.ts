import { api } from './client';
import type { EmailOutbox, Settings } from './types';

export type SettingsPayload = {
  settings: Settings;
  emailConfigured: boolean;
  emailOutbox: EmailOutbox;
};

export async function getSettings(): Promise<SettingsPayload> {
  const { data } = await api.get<SettingsPayload>('/api/admin/settings');
  return data;
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const { data } = await api.put<{ ok: true; settings: Settings }>('/api/admin/settings', patch);
  return data.settings;
}

// Anything Resend refused earlier goes back on the queue.
export async function retryEmailOutbox(): Promise<void> {
  await api.post('/api/admin/email-outbox/retry');
}
