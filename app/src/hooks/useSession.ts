import { useQuery } from '@tanstack/react-query';
import { getSession } from '../api/session';
import { useAuthStore } from '../store/auth';

// Only once signed in: asking while the login screen is up would 401 and trip
// the session-expired handler for a session that never existed.
export function useSession() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['session'],
    queryFn: getSession,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

// Anything that changes an order should be off for the review account, rather
// than offered and then refused by the server.
export function useReadOnly(): boolean {
  const { data } = useSession();
  return Boolean(data?.readOnly);
}
