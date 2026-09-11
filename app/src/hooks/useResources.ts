import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as blocksApi from '../api/blocks';
import * as customersApi from '../api/customers';
import * as reviewsApi from '../api/reviews';
import * as settingsApi from '../api/settings';
import type { Settings } from '../api/types';

export function useBlocks() {
  return useQuery({ queryKey: ['blocks'], queryFn: blocksApi.listBlocks });
}

export function useBlockActions() {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: ['blocks'] });
  return {
    create: useMutation({
      mutationFn: (input: { startDate: string; endDate: string; reason?: string }) =>
        blocksApi.createBlock(input),
      onSuccess,
    }),
    remove: useMutation({ mutationFn: (id: number) => blocksApi.deleteBlock(id), onSuccess }),
  };
}

export function useCustomers() {
  return useQuery({ queryKey: ['customers'], queryFn: customersApi.listCustomers });
}

export function useCustomerActions() {
  const qc = useQueryClient();
  return {
    remove: useMutation({
      mutationFn: (customerKey: string) => customersApi.deleteCustomer(customerKey),
      // Deleting a customer deletes their orders, so both lists are stale.
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['customers'] });
        qc.invalidateQueries({ queryKey: ['orders'] });
      },
    }),
  };
}

export function useReviews() {
  return useQuery({ queryKey: ['reviews'], queryFn: reviewsApi.listReviews });
}

export function useReviewActions() {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: ['reviews'] });
  return {
    approve: useMutation({ mutationFn: (id: number) => reviewsApi.approveReview(id), onSuccess }),
    reject: useMutation({ mutationFn: (id: number) => reviewsApi.rejectReview(id), onSuccess }),
    remove: useMutation({ mutationFn: (id: number) => reviewsApi.deleteReview(id), onSuccess }),
  };
}

export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: settingsApi.getSettings });
}

export function useSettingsActions() {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: ['settings'] });
  return {
    save: useMutation({
      mutationFn: (patch: Partial<Settings>) => settingsApi.updateSettings(patch),
      onSuccess,
    }),
    retryEmails: useMutation({ mutationFn: () => settingsApi.retryEmailOutbox(), onSuccess }),
  };
}
