// What the App Review account sees.
//
// A reviewer needs a working order book to look at, and Amanda's customers
// never agreed to have their names, phone numbers and home addresses shown to
// a stranger at Apple. So the reviewer signs in and sees this instead: people
// who do not exist, orders that were never placed. Nothing here touches the
// database.
const MENU_CATALOG = require('./menu.json');

const COURSES = { savory: 'Savory', sourdough: 'Sourdough', sweet: 'Sweet', small: 'Focaccia Muffins', art: 'Focaccia Art' };

function dayFromNow(days) {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function timeFromNow(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

const ITEMS = MENU_CATALOG.map((m, i) => ({
  id: i + 1,
  course: m.course,
  name: m.name,
  description: m.description,
  price: m.price == null ? null : Number(m.price).toFixed(2),
  available: true,
  sort_order: i,
  image: m.image || null,
}));

const byName = (name) => ITEMS.find((i) => i.name === name) || ITEMS[0];

function line(id, name, quantity) {
  const item = byName(name);
  return { id, menu_item_id: item.id, name: item.name, unit_price: item.price, quantity };
}

const ORDERS = [
  {
    id: 1041, first_name: 'Marguerite', last_name: 'Ashby',
    email: 'marguerite@example.com', phone: '541-555-0148',
    fulfillment: 'shipping', needed_date: dayFromNow(6),
    address: '1142 Example Ave, Brookings, OR 97415',
    notes: 'Extra rosemary on the slab if you can.',
    status: 'pending', amount: '55.00', payment_status: 'unpaid', paid_amount: '0.00',
    shipping_fee: '10.00', source: 'website', respond_token: 'demo', created_at: timeFromNow(-1),
    items: [line(1, 'Jalapeño, Olive & Red Onion', 2), line(2, 'Classic Sourdough', 1)],
    payments: [],
  },
  {
    id: 1040, first_name: 'Delia', last_name: 'Okonkwo',
    email: 'delia@example.com', phone: null,
    fulfillment: 'delivery', needed_date: dayFromNow(2),
    address: '88 Example Street, Harbor, OR 97415',
    notes: null,
    status: 'accepted', amount: '45.00', payment_status: 'deposit_paid', paid_amount: '20.00',
    shipping_fee: '0.00', source: 'website', respond_token: 'demo', created_at: timeFromNow(-3),
    items: [line(3, 'The Asian Crisp', 3)],
    payments: [{ id: 9001, amount: '20.00', note: 'Deposit', received_at: timeFromNow(-2) }],
  },
  {
    id: 1039, first_name: 'Tomas', last_name: 'Iversen',
    email: null, phone: '541-555-0193',
    fulfillment: 'pickup', needed_date: dayFromNow(-4),
    address: null, notes: 'Collected at the market.',
    status: 'completed', amount: '30.00', payment_status: 'paid', paid_amount: '30.00',
    shipping_fee: '0.00', source: 'manual', respond_token: 'demo', created_at: timeFromNow(-9),
    items: [line(4, 'Tomato, Olive & Onion', 2)],
    payments: [{ id: 9000, amount: '30.00', note: 'Cash at the market', received_at: timeFromNow(-4) }],
  },
];

const CUSTOMERS = [
  { customer_key: 'marguerite@example.com', email: 'marguerite@example.com', first_name: 'Marguerite', last_name: 'Ashby', phone: '541-555-0148', order_count: 4, total_spent: '182.00', last_order_at: timeFromNow(-1) },
  { customer_key: 'delia@example.com', email: 'delia@example.com', first_name: 'Delia', last_name: 'Okonkwo', phone: null, order_count: 2, total_spent: '90.00', last_order_at: timeFromNow(-3) },
  { customer_key: '541-555-0193', email: null, first_name: 'Tomas', last_name: 'Iversen', phone: '541-555-0193', order_count: 1, total_spent: '30.00', last_order_at: timeFromNow(-9) },
];

const REVIEWS = [
  { id: 71, name: 'Harriet Vane', rating: 5, review: 'The jalapeño round did not survive the drive home. Not one bit of it.', status: 'pending', created_at: timeFromNow(-1) },
  { id: 70, name: 'Peter Wimsey', rating: 5, review: 'The sourdough has a crust you can hear from the next room.', status: 'approved', created_at: timeFromNow(-8) },
];

const SETTINGS = {
  deposit_percent: '0',
  payment_instructions: 'We will confirm your order and let you know the total. Payment is taken when you collect at the market, or as arranged for delivery and shipping.',
  pickup_note: 'Brookings-Harbor Farmers Market, Wednesdays and Saturdays from 9am.',
  min_notice_days: '2',
  shipping_fee: '10.00',
  venmo_handle: 'OHYOUFANCYFOCACCIA',
  apple_pay_accepted: '1',
};

// Anything not listed answers with an empty shape rather than falling through
// to the real data — an endpoint added later must be described here before a
// reviewer can see anything from it.
function responseFor(path) {
  if (path === '/orders' || path === '/orders/') return { orders: ORDERS };
  if (path === '/menu') return { courses: COURSES, items: ITEMS };
  if (path === '/customers') return { customers: CUSTOMERS };
  if (path === '/reviews') return { reviews: REVIEWS };
  if (path === '/blocks') return { blocks: [] };
  if (path === '/settings') return { settings: SETTINGS, emailConfigured: true, emailOutbox: {} };
  const payments = /^\/orders\/(\d+)\/payments$/.exec(path);
  if (payments) {
    const order = ORDERS.find((o) => String(o.id) === payments[1]);
    return { payments: order ? order.payments : [] };
  }
  return {};
}

module.exports = { responseFor, ORDERS, CUSTOMERS, REVIEWS, SETTINGS, ITEMS };
