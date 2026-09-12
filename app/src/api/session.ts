import { api } from './client';

export type Session = {
  username: string | null;
  // True for Apple's App Review sign-in: sample data, and every write refused.
  readOnly: boolean;
};

export async function getSession(): Promise<Session> {
  const { data } = await api.get<Session>('/api/admin/session');
  return data;
}
