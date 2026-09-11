import axios from 'axios';
import Constants from 'expo-constants';
import { encode as base64encode } from 'base-64';

// Set at build time by EXPO_PUBLIC_API_URL, forwarded through app.config.ts as
// `extra.apiUrl`, and finally the live site — so a build that was handed
// nothing still reaches a real server instead of localhost.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ||
  'https://ohyoufancyfocaccia.com';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

let authHeader: string | null = null;
let unauthorizedHandler: (() => void | Promise<void>) | null = null;

export function setBasicAuth(username: string, password: string) {
  authHeader = 'Basic ' + base64encode(`${username}:${password}`);
}
export function clearAuth() {
  authHeader = null;
}
export function hasAuth() {
  return authHeader !== null;
}
export function setUnauthorizedHandler(handler: (() => void | Promise<void>) | null) {
  unauthorizedHandler = handler;
}

// There is no session to carry, so the credentials go out on every request.
api.interceptors.request.use((config) => {
  if (authHeader) config.headers.Authorization = authHeader;
  return config;
});

// A 401 anywhere means the password changed under us, so the stored
// credentials are dropped and the login screen says why. The sign-in probe
// opts out: a wrong password there should be an inline error on the form, not
// a "your session expired" notice for a session that never existed.
api.interceptors.response.use(
  (response) => response,
  async (err) => {
    if (
      axios.isAxiosError(err) &&
      err.response?.status === 401 &&
      hasAuth() &&
      err.config?.headers?.['X-Skip-Auth-Expiry'] !== '1'
    ) {
      await unauthorizedHandler?.();
    }
    return Promise.reject(err);
  },
);

// The server's errors are always { error }, so surface that rather than
// axios's own "Request failed with status code 400".
export function errorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: string } | undefined)?.error || err.message || fallback;
  }
  return fallback;
}
