import * as SecureStore from 'expo-secure-store';
import { api, setBasicAuth, clearAuth } from './client';

// Basic auth needs the password on every request, so it has to be kept. The
// keychain is the one place that is acceptable.
const CRED_KEY = 'ohyoufancy.admin.credentials';

type StoredCreds = { username: string; password: string };

async function persistCredentials(creds: StoredCreds) {
  await SecureStore.setItemAsync(CRED_KEY, JSON.stringify(creds));
}

// There is no sign-in endpoint: the server checks Basic on every /api/admin
// request, so a successful read *is* the sign-in. X-Skip-Auth-Expiry marks
// this as the probe, so a wrong password shows on the form instead of
// tripping the global session-expired handler.
export async function login(username: string, password: string): Promise<void> {
  setBasicAuth(username, password);
  try {
    await api.get('/api/admin/orders', { headers: { 'X-Skip-Auth-Expiry': '1' } });
  } catch (err) {
    clearAuth();
    throw err;
  }
  await persistCredentials({ username, password });
}

export async function restoreSession(): Promise<string | null> {
  const raw = await SecureStore.getItemAsync(CRED_KEY);
  if (!raw) return null;
  try {
    const creds = JSON.parse(raw) as StoredCreds;
    setBasicAuth(creds.username, creds.password);
    return creds.username;
  } catch {
    await SecureStore.deleteItemAsync(CRED_KEY);
    return null;
  }
}

export async function logout(): Promise<void> {
  clearAuth();
  await SecureStore.deleteItemAsync(CRED_KEY);
}

export const expireSession = logout;

// Re-persisting matters: without it the phone would keep sending the old
// password and sign itself out on the next request.
export async function changePassword(
  username: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.post('/api/admin/password', { currentPassword, newPassword });
  setBasicAuth(username, newPassword);
  await persistCredentials({ username, password: newPassword });
}
