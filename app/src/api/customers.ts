import { api } from './client';
import type { Customer } from './types';

export async function listCustomers(): Promise<Customer[]> {
  const { data } = await api.get<{ customers: Customer[] }>('/api/admin/customers');
  return data.customers;
}

// This deletes the customer's orders too — the customer is only a grouping of
// them, so there is nothing left to keep once they are gone.
export async function deleteCustomer(customerKey: string): Promise<void> {
  await api.delete(`/api/admin/customers/${encodeURIComponent(customerKey)}`);
}
