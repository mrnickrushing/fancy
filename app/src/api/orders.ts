import { api } from './client';
import type {
  ManualOrderInput,
  Order,
  OrderEditInput,
  OrderStatus,
  Payment,
  PaymentStatus,
} from './types';

// One request brings back every order with its items and its payment log
// already joined, so a list of forty orders is still one round trip.
export async function listOrders(): Promise<Order[]> {
  const { data } = await api.get<{ orders: Order[] }>('/api/admin/orders');
  return data.orders;
}

// An order Amanda takes in person. The server applies the same validation it
// applies to the website, minus the market-day rule.
export async function createOrder(input: ManualOrderInput): Promise<Order | undefined> {
  const { data } = await api.post<{ ok: true; order?: Order }>('/api/admin/orders', input);
  return data.order;
}

export async function updateOrder(id: number, patch: OrderEditInput): Promise<Order> {
  const { data } = await api.patch<{ ok: true; order: Order }>(`/api/admin/orders/${id}`, patch);
  return data.order;
}

// Accept or decline — the same two answers the email link offers, and only
// while the order is still pending.
export async function respondToOrder(id: number, action: 'accept' | 'decline'): Promise<void> {
  await api.post(`/api/admin/orders/${id}/respond`, { action });
}

export async function setOrderStatus(id: number, status: OrderStatus): Promise<void> {
  await api.post(`/api/admin/orders/${id}/status`, { status });
}

export async function deleteOrder(id: number): Promise<void> {
  await api.delete(`/api/admin/orders/${id}`);
}

// null clears the total again. Setting it re-derives the payment status from
// what has actually been paid.
export async function setOrderAmount(id: number, amount: number | null): Promise<void> {
  await api.post(`/api/admin/orders/${id}/amount`, { amount });
}

export async function listPayments(id: number): Promise<Payment[]> {
  const { data } = await api.get<{ payments: Payment[] }>(`/api/admin/orders/${id}/payments`);
  return data.payments;
}

export async function addPayment(
  id: number,
  input: { amount: number; note?: string; receivedAt?: string },
): Promise<void> {
  await api.post(`/api/admin/orders/${id}/payments`, input);
}

export async function deletePayment(paymentId: number): Promise<void> {
  await api.delete(`/api/admin/payments/${paymentId}`);
}

// Setting this by hand is for the exceptions — a refund, mainly. Ordinary
// deposits and balances come out of the payment log on their own.
export async function setPaymentStatus(id: number, paymentStatus: PaymentStatus): Promise<void> {
  await api.post(`/api/admin/orders/${id}/payment`, { paymentStatus });
}

// `sendAnyway` is for a gift order: the server refuses to email the address
// on one unless it is told the address really does reach the buyer.
export async function sendConfirmation(id: number, sendAnyway = false): Promise<void> {
  await api.post(`/api/admin/orders/${id}/confirmation`, sendAnyway ? { sendAnyway } : {});
}

// Defaults to the most recent payment when none is named.
export async function sendReceipt(id: number, paymentId?: number, sendAnyway = false): Promise<void> {
  await api.post(`/api/admin/orders/${id}/receipt`, {
    ...(paymentId ? { paymentId } : {}),
    ...(sendAnyway ? { sendAnyway } : {}),
  });
}

// True when the server refused because the order is a gift, which is the one
// refusal the app can offer to push through.
export function isGiftRefusal(err: unknown): boolean {
  const res = (err as { response?: { status?: number; data?: { isGift?: boolean } } })?.response;
  return res?.status === 409 && res?.data?.isGift === true;
}

export async function sendEmail(id: number, subject: string, message: string): Promise<void> {
  await api.post(`/api/admin/orders/${id}/email`, { subject, message });
}
