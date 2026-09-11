import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ordersApi from '../api/orders';
import type { ManualOrderInput, Order, OrderEditInput, OrderStatus, PaymentStatus } from '../api/types';

export const ORDERS_KEY = ['orders'] as const;

export function useOrders() {
  return useQuery({ queryKey: ORDERS_KEY, queryFn: ordersApi.listOrders });
}

// Every order already arrives complete in the list, so the detail screen reads
// from that cache instead of asking for one order again.
export function useOrder(id: number) {
  const query = useOrders();
  return {
    ...query,
    data: query.data?.find((o) => o.id === id),
  };
}

export function useOrderActions() {
  const qc = useQueryClient();
  // A customer is a grouping of orders, so anything that touches an order can
  // change the customer list too.
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ORDERS_KEY });
    qc.invalidateQueries({ queryKey: ['customers'] });
  };
  const mutation = <TArgs extends unknown[]>(fn: (...args: TArgs) => Promise<unknown>) =>
    useMutation({ mutationFn: (args: TArgs) => fn(...args), onSuccess: invalidate });

  return {
    invalidate,
    create: useMutation({
      mutationFn: (input: ManualOrderInput) => ordersApi.createOrder(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, patch }: { id: number; patch: OrderEditInput }) => ordersApi.updateOrder(id, patch),
      onSuccess: invalidate,
    }),
    respond: useMutation({
      mutationFn: ({ id, action }: { id: number; action: 'accept' | 'decline' }) =>
        ordersApi.respondToOrder(id, action),
      onSuccess: invalidate,
    }),
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: number; status: OrderStatus }) => ordersApi.setOrderStatus(id, status),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: number) => ordersApi.deleteOrder(id), onSuccess: invalidate }),
    setAmount: useMutation({
      mutationFn: ({ id, amount }: { id: number; amount: number | null }) => ordersApi.setOrderAmount(id, amount),
      onSuccess: invalidate,
    }),
    addPayment: useMutation({
      mutationFn: ({ id, amount, note }: { id: number; amount: number; note?: string }) =>
        ordersApi.addPayment(id, { amount, note }),
      onSuccess: invalidate,
    }),
    removePayment: useMutation({
      mutationFn: (paymentId: number) => ordersApi.deletePayment(paymentId),
      onSuccess: invalidate,
    }),
    setPaymentStatus: useMutation({
      mutationFn: ({ id, paymentStatus }: { id: number; paymentStatus: PaymentStatus }) =>
        ordersApi.setPaymentStatus(id, paymentStatus),
      onSuccess: invalidate,
    }),
    sendConfirmation: useMutation({ mutationFn: (id: number) => ordersApi.sendConfirmation(id) }),
    sendReceipt: useMutation({
      mutationFn: ({ id, paymentId }: { id: number; paymentId?: number }) => ordersApi.sendReceipt(id, paymentId),
    }),
    sendEmail: useMutation({
      mutationFn: ({ id, subject, message }: { id: number; subject: string; message: string }) =>
        ordersApi.sendEmail(id, subject, message),
    }),
  };
}

export type { Order };
