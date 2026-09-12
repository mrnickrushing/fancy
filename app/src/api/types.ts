// The shapes the server actually sends. Postgres NUMERIC columns arrive as
// strings, not numbers, and that is reflected here rather than papered over —
// `price` and `amount` are money, and money is never a float in transit.

export type Course = 'savory' | 'sourdough' | 'sweet' | 'small' | 'art';

// Mirrors db.js COURSES.
export const COURSE_LABELS: Record<Course, string> = {
  savory: 'Savory',
  sourdough: 'Sourdough',
  sweet: 'Sweet',
  small: 'Focaccia Muffins',
  art: 'Focaccia Art',
};
export const COURSE_ORDER: Course[] = ['savory', 'sourdough', 'sweet', 'small', 'art'];

export type Fulfillment = 'pickup' | 'delivery' | 'shipping';

// Mirrors mail.js FULFILLMENT_LABELS, so the app and the emails call the same
// thing by the same name.
export const FULFILLMENT_LABELS: Record<Fulfillment, string> = {
  pickup: 'Pickup at the Brookings-Harbor Farmers Market',
  delivery: 'Local delivery (Brookings / Harbor)',
  shipping: 'Shipping',
};
// The same three, short enough for a list row.
export const FULFILLMENT_SHORT: Record<Fulfillment, string> = {
  pickup: 'Market pickup',
  delivery: 'Local delivery',
  shipping: 'Shipping',
};

export type OrderStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid' | 'refunded';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  deposit_paid: 'Deposit paid',
  paid: 'Paid',
  refunded: 'Refunded',
};

export type OrderItem = {
  id: number;
  menu_item_id: number | null;
  name: string;
  unit_price: string | null;
  quantity: number;
};

export type Payment = {
  id: number;
  amount: string;
  note: string | null;
  received_at: string;
};

export type Order = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  fulfillment: Fulfillment;
  needed_date: string;
  address: string | null;
  notes: string | null;
  status: OrderStatus;
  amount: string | null;
  payment_status: PaymentStatus;
  paid_amount: string;
  // Flat, snapshotted when the order was taken; 0 for pickup and delivery.
  shipping_fee: string;
  source: string;
  respond_token: string;
  created_at: string;
  items: OrderItem[];
  payments: Payment[];
};

export type MenuItem = {
  id: number;
  course: Course;
  name: string;
  description: string | null;
  price: string | null;
  available: boolean;
  sort_order: number;
  image: string | null;
};

export type Block = {
  id: number;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
};

// Derived from the orders table, keyed on email-or-phone the same way the
// server groups them.
export type Customer = {
  customer_key: string;
  email: string | null;
  first_name: string;
  last_name: string;
  phone: string | null;
  order_count: number;
  total_spent: string;
  last_order_at: string;
};

export type Review = {
  id: number;
  name: string;
  rating: number;
  review: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export type Settings = {
  deposit_percent: string;
  shipping_fee: string;
  payment_instructions: string;
  pickup_note: string;
  min_notice_days: string;
};

// { pending: 2, failed: 1, … } — whatever states the outbox currently holds.
export type EmailOutbox = Record<string, number>;

export type OrderItemInput = { id: number; quantity: number };

export type ManualOrderInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  fulfillment: Fulfillment;
  neededDate: string;
  address?: string;
  notes?: string;
  items: OrderItemInput[];
};

export type OrderEditInput = Partial<Omit<ManualOrderInput, 'items'>>;

export type MenuItemInput = {
  course: Course;
  name: string;
  description?: string;
  price?: string | number | null;
  image?: string | null;
  available?: boolean;
};
