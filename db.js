// Oh! You Fancy Focaccia — the order book.
//
// Postgres, one pool. The schema is created on start and every migration is
// an ALTER ... IF NOT EXISTS, so a fresh database and a year-old one both come
// up the same way with no migration tooling to run.
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// The bill of fare, as it stands on the Our Breads page. Seeded once, into an
// empty menu table; after that the admin's Menu tab owns it. Prices are null
// until Amanda enters them — an order for an unpriced item is a request she
// quotes, exactly as every order was before the site could take them.
const MENU_SEED = [
  ['savory',    'Olive & Sun-Dried Tomato Swirl', 'A spiralled round layered with green and kalamata olives, sun-dried tomato, herbs and grated cheese.'],
  ['savory',    'Jalapeño, Olive & Red Onion',    'Our signature round — fresh jalapeño, mixed olives, red onion and herbs across a golden, dimpled crust.'],
  ['savory',    'Roasted Garlic & Sea Salt',      'Olive oil, roasted garlic and flaky salt on a pillowy sourdough crumb.'],
  ['savory',    'Cheesy Jalapeño',                'Melted and bubbling, with jalapeño baked right into the top.'],
  ['sourdough', 'The Country Loaf',               'Naturally leavened with the same starter that lifts the focaccia — mixed the day before, left to rise slow, and baked dark.'],
  ['sweet',     'Cinnamon Swirl with Vanilla Drizzle', 'A whole pan of cinnamon-laced focaccia pulled apart in golden ridges and finished with a vanilla glaze.'],
  ['sweet',     'Honey Focaccia Bites',           'Pull-apart bites, boxed and drizzled with Chetco Gold raw honey.'],
  ['small',     'Jalapeño & Roasted Garlic Muffins', 'Hand-sized, crisp-edged, crowned with jalapeño and toasted garlic.'],
  ['small',     'Peppered Pickle Muffins',        'Brookings Pickled Goodies’ spicy bread-and-butter pickles, infused right into the dough.'],
  ['small',     'Sea Salt Rolls',                 'Soft pull-apart rounds, olive-oil brushed and salt flaked.'],
  ['art',       'Heart Loaf',                     'A little hand-shaped heart. They go fast.'],
  ['art',       'Flower Garden',                  'Hand-painted in vegetables and herbs — a whole garden across the top of the dough.'],
];

const COURSES = { savory: 'Savory', sourdough: 'Sourdough', sweet: 'Sweet', small: 'Muffins & Rolls', art: 'Focaccia Art' };

// What customers are told about paying. Editable from the admin's Settings
// tab; these are only the values a fresh install starts with. Nothing here
// names a payment app or a deposit figure Amanda has not chosen herself.
const SETTINGS_DEFAULTS = {
  deposit_percent: '0',
  payment_instructions: 'We will confirm your order and let you know the total. Payment is taken when you collect at the market, or as arranged for delivery and shipping.',
  pickup_note: 'Brookings-Harbor Farmers Market, Wednesdays and Saturdays from 9am.',
  min_notice_days: '2',
};

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id SERIAL PRIMARY KEY,
      course TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price NUMERIC(10,2),
      available BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      fulfillment TEXT NOT NULL DEFAULT 'pickup',
      needed_date DATE NOT NULL,
      address TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      amount NUMERIC(10,2),
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'website',
      respond_token TEXT NOT NULL,
      idempotency_key TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_idx ON orders(idempotency_key) WHERE idempotency_key IS NOT NULL`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      unit_price NUMERIC(10,2),
      quantity INTEGER NOT NULL CHECK (quantity > 0)
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);`);
  // One row per payment, so a deposit and the balance stay two separate
  // facts with their own dates. orders.paid_amount is the running total,
  // recomputed from this log whenever it changes.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      amount NUMERIC(10,2) NOT NULL,
      note TEXT,
      received_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS payments_order_id_idx ON payments(order_id);`);
  // Transactional email is an outbox, not a best-effort side effect of the
  // request. If Resend is unavailable after an order is saved, the message
  // remains available for retry instead of disappearing.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_outbox (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      recipient TEXT NOT NULL,
      reply_to TEXT,
      subject TEXT NOT NULL,
      html TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS email_outbox_due_idx ON email_outbox(status, next_attempt_at);`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blocks (
      id SERIAL PRIMARY KEY,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      review TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_credentials (
      id INTEGER PRIMARY KEY DEFAULT 1,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT admin_credentials_single_row CHECK (id = 1)
    );
  `);
  await seedMenu();
}

async function seedMenu() {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM menu_items`);
  if (rows[0].n > 0) return;
  const values = [];
  const rowsSql = MENU_SEED.map(([course, name, description], i) => {
    values.push(course, name, description, i);
    const offset = i * 4;
    return `($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4})`;
  });
  await pool.query(
    `INSERT INTO menu_items (course, name, description, sort_order) VALUES ${rowsSql.join(',')}`,
    values
  );
}

function toIsoDate(d) {
  if (!d) return '';
  if (typeof d === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? d : parsed.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

// ── settings ────────────────────────────────────────────────────────────
async function getSettings() {
  const { rows } = await pool.query(`SELECT key, value FROM settings`);
  const out = { ...SETTINGS_DEFAULTS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}

async function setSettings(patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in SETTINGS_DEFAULTS)) continue;
    await pool.query(
      `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`,
      [key, String(value)]
    );
  }
  return getSettings();
}

// ── menu ────────────────────────────────────────────────────────────────
async function listMenu({ availableOnly = false } = {}) {
  const { rows } = await pool.query(
    `SELECT * FROM menu_items ${availableOnly ? 'WHERE available' : ''} ORDER BY sort_order, id`
  );
  return rows;
}

async function getMenuItems(ids) {
  if (!ids.length) return [];
  const { rows } = await pool.query(`SELECT * FROM menu_items WHERE id = ANY($1::int[])`, [ids]);
  return rows;
}

async function createMenuItem({ course, name, description, price, available }) {
  const { rows: last } = await pool.query(`SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM menu_items`);
  const { rows } = await pool.query(
    `INSERT INTO menu_items (course, name, description, price, available, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [course, name, description || null, price ?? null, available !== false, last[0].n]
  );
  return rows[0];
}

const MENU_EDITABLE = { course: 'course', name: 'name', description: 'description', price: 'price', available: 'available', sortOrder: 'sort_order' };

async function updateMenuItem(id, fields) {
  const sets = [];
  const values = [id];
  for (const [key, column] of Object.entries(MENU_EDITABLE)) {
    if (!Object.prototype.hasOwnProperty.call(fields, key)) continue;
    values.push(fields[key]);
    sets.push(`${column} = $${values.length}`);
  }
  if (!sets.length) {
    const { rows } = await pool.query(`SELECT * FROM menu_items WHERE id = $1`, [id]);
    return rows[0] || null;
  }
  const { rows } = await pool.query(`UPDATE menu_items SET ${sets.join(', ')} WHERE id = $1 RETURNING *`, values);
  return rows[0] || null;
}

async function deleteMenuItem(id) {
  const { rows } = await pool.query(`DELETE FROM menu_items WHERE id = $1 RETURNING id`, [id]);
  return rows[0] || null;
}

// ── availability ────────────────────────────────────────────────────────
async function listBlocks() {
  const { rows } = await pool.query(`SELECT * FROM blocks ORDER BY start_date`);
  return rows;
}

async function getBlockedRanges() {
  const rows = await listBlocks();
  return rows.map((r) => ({ id: r.id, start: toIsoDate(r.start_date), end: toIsoDate(r.end_date), reason: r.reason }));
}

async function isDateBlocked(iso) {
  const ranges = await getBlockedRanges();
  return ranges.some((r) => iso >= r.start && iso <= r.end);
}

async function createBlock({ startDate, endDate, reason }) {
  const { rows } = await pool.query(
    `INSERT INTO blocks (start_date, end_date, reason) VALUES ($1,$2,$3) RETURNING *`,
    [startDate, endDate, reason || null]
  );
  return rows[0];
}

async function deleteBlock(id) {
  await pool.query(`DELETE FROM blocks WHERE id = $1`, [id]);
}

// ── orders ──────────────────────────────────────────────────────────────
// Items are snapshotted by name and price at the time of ordering, so a
// later menu edit never rewrites what a customer actually asked for.
async function createOrder(order, items) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const respondToken = crypto.randomBytes(20).toString('hex');
    const { rows } = await client.query(
      `INSERT INTO orders (first_name, last_name, email, phone, fulfillment, needed_date, address, notes, source, respond_token, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id, respond_token`,
      [order.firstName, order.lastName, order.email || null, order.phone || null,
       order.fulfillment, order.neededDate, order.address || null, order.notes || null,
       order.source || 'website', respondToken, order.idempotencyKey || null]
    );
    const saved = rows[0];
    if (items.length) {
      const values = [];
      const rowsSql = items.map((it, i) => {
        values.push(saved.id, it.menuItemId ?? null, it.name, it.unitPrice ?? null, it.quantity);
        const offset = i * 5;
        return `($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4},$${offset + 5})`;
      });
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, name, unit_price, quantity) VALUES ${rowsSql.join(',')}`,
        values
      );
    }
    await client.query('COMMIT');
    return saved;
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505' && order.idempotencyKey) {
      const { rows } = await pool.query('SELECT id, respond_token FROM orders WHERE idempotency_key = $1', [order.idempotencyKey]);
      if (rows[0]) return { ...rows[0], duplicate: true };
    }
    throw err;
  } finally {
    client.release();
  }
}

const ORDER_WITH_ITEMS = `
  SELECT o.*,
    COALESCE(i.items, '[]'::json) AS items,
    COALESCE(p.payments, '[]'::json) AS payments
  FROM orders o
  LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object('id', x.id, 'menu_item_id', x.menu_item_id, 'name', x.name,
                                      'unit_price', x.unit_price, 'quantity', x.quantity) ORDER BY x.id) AS items
    FROM order_items x WHERE x.order_id = o.id
  ) i ON true
  LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object('id', y.id, 'amount', y.amount, 'note', y.note, 'received_at', y.received_at)
                    ORDER BY y.received_at DESC, y.id DESC) AS payments
    FROM payments y WHERE y.order_id = o.id
  ) p ON true`;

async function getOrder(id) {
  const { rows } = await pool.query(`${ORDER_WITH_ITEMS} WHERE o.id = $1`, [id]);
  return rows[0] || null;
}

async function listOrders() {
  const { rows } = await pool.query(`${ORDER_WITH_ITEMS} ORDER BY o.created_at DESC`);
  return rows;
}

const ORDER_EDITABLE = {
  firstName: 'first_name', lastName: 'last_name', email: 'email', phone: 'phone',
  fulfillment: 'fulfillment', neededDate: 'needed_date', address: 'address', notes: 'notes',
};

async function updateOrder(id, fields) {
  const sets = [];
  const values = [id];
  for (const [key, column] of Object.entries(ORDER_EDITABLE)) {
    if (!Object.prototype.hasOwnProperty.call(fields, key)) continue;
    const raw = fields[key];
    const value = typeof raw === 'string' ? raw.trim() : raw;
    values.push(value === '' || value === undefined ? null : value);
    sets.push(`${column} = $${values.length}`);
  }
  if (sets.length) {
    await pool.query(`UPDATE orders SET ${sets.join(', ')} WHERE id = $1`, values);
  }
  return getOrder(id);
}

async function setOrderStatus(id, status) {
  await pool.query(`UPDATE orders SET status = $2 WHERE id = $1`, [id, status]);
  return getOrder(id);
}

async function setOrderAmount(id, amount) {
  await pool.query(`UPDATE orders SET amount = $2 WHERE id = $1`, [id, amount]);
  return recomputeOrderPayment(id);
}

async function deleteOrder(id) {
  const { rows } = await pool.query(`DELETE FROM orders WHERE id = $1 RETURNING id`, [id]);
  return rows[0] || null;
}

// Status follows the money: nothing paid is unpaid, part of the total is a
// deposit, the whole total is paid. A refund is a deliberate decision, so
// recomputing never overwrites it.
async function recomputeOrderPayment(orderId) {
  await pool.query(
    `UPDATE orders o
     SET paid_amount = t.paid,
         payment_status = CASE
           WHEN o.payment_status = 'refunded' THEN 'refunded'
           WHEN t.paid <= 0 THEN 'unpaid'
           WHEN o.amount IS NOT NULL AND o.amount > 0 AND t.paid >= o.amount THEN 'paid'
           ELSE 'deposit_paid'
         END
     FROM (SELECT COALESCE(SUM(amount), 0) AS paid FROM payments WHERE order_id = $1) t
     WHERE o.id = $1`,
    [orderId]
  );
  return getOrder(orderId);
}

async function addPayment(orderId, { amount, note, receivedAt }) {
  await pool.query(
    `INSERT INTO payments (order_id, amount, note, received_at) VALUES ($1, $2, $3, COALESCE($4::timestamptz, now()))`,
    [orderId, amount, note && String(note).trim() ? String(note).trim() : null, receivedAt || null]
  );
  return recomputeOrderPayment(orderId);
}

async function getPayment(paymentId) {
  const { rows } = await pool.query(`SELECT * FROM payments WHERE id = $1`, [paymentId]);
  return rows[0] || null;
}

async function deletePayment(paymentId) {
  const { rows } = await pool.query(`DELETE FROM payments WHERE id = $1 RETURNING order_id`, [paymentId]);
  if (!rows[0]) return null;
  return recomputeOrderPayment(rows[0].order_id);
}

// ── email outbox ────────────────────────────────────────────────────────
async function queueEmail({ orderId = null, kind, to, replyTo = null, subject, html }) {
  const { rows } = await pool.query(
    `INSERT INTO email_outbox (order_id, kind, recipient, reply_to, subject, html)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [orderId, kind, to, replyTo, subject, html]
  );
  return rows[0];
}

// Claim rows inside a transaction so two app workers do not send the same
// message. A failed worker can be retried after its short sending lease.
async function claimDueEmails(limit = 10) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `WITH picked AS (
         SELECT id FROM email_outbox
         WHERE status IN ('pending', 'failed')
           AND next_attempt_at <= now()
           AND attempts < 5
         ORDER BY id
         FOR UPDATE SKIP LOCKED
         LIMIT $1
       )
       UPDATE email_outbox e
       SET status = 'sending', attempts = e.attempts + 1
       FROM picked
       WHERE e.id = picked.id
       RETURNING e.*`, [limit]
    );
    await client.query('COMMIT');
    return rows;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function markEmailSent(id) {
  await pool.query(
    `UPDATE email_outbox SET status = 'sent', sent_at = now(), last_error = NULL WHERE id = $1`, [id]
  );
}

async function markEmailFailed(id, error) {
  await pool.query(
    `UPDATE email_outbox
     SET status = CASE WHEN attempts >= 5 THEN 'dead' ELSE 'failed' END,
         last_error = $2,
         next_attempt_at = now() + CASE WHEN attempts >= 5 THEN interval '1 day' ELSE interval '5 minutes' END
     WHERE id = $1`, [id, String(error || 'Email delivery failed').slice(0, 500)]
  );
}

async function emailOutboxSummary() {
  const { rows } = await pool.query(
    `SELECT status, COUNT(*)::int AS count FROM email_outbox GROUP BY status`
  );
  return Object.fromEntries(rows.map((r) => [r.status, r.count]));
}

async function retryFailedEmails() {
  const { rowCount } = await pool.query(
    `UPDATE email_outbox SET status = 'pending', attempts = 0, last_error = NULL, next_attempt_at = now()
     WHERE status IN ('failed', 'dead')`
  );
  return rowCount;
}

async function setPaymentStatus(id, paymentStatus) {
  await pool.query(`UPDATE orders SET payment_status = $2 WHERE id = $1`, [id, paymentStatus]);
  return getOrder(id);
}

// Customers are derived from orders. Identity is the email when there is one
// and the phone otherwise; grouping on email alone would fold every
// phone-only customer into a single NULL row.
async function getCustomers() {
  const { rows } = await pool.query(`
    SELECT COALESCE(email, phone) AS customer_key,
      (ARRAY_AGG(email ORDER BY created_at DESC))[1] AS email,
      (ARRAY_AGG(first_name ORDER BY created_at DESC))[1] AS first_name,
      (ARRAY_AGG(last_name ORDER BY created_at DESC))[1] AS last_name,
      (ARRAY_AGG(phone ORDER BY created_at DESC))[1] AS phone,
      COUNT(*)::int AS order_count,
      COALESCE(SUM(amount), 0) AS total_spent,
      MAX(created_at) AS last_order_at
    FROM orders
    WHERE email IS NOT NULL OR phone IS NOT NULL
    GROUP BY COALESCE(email, phone)
    ORDER BY last_order_at DESC`);
  return rows;
}

async function deleteCustomer(customerKey) {
  await pool.query(`DELETE FROM orders WHERE COALESCE(email, phone) = $1`, [customerKey]);
}

// ── reviews ─────────────────────────────────────────────────────────────
async function createReview({ name, rating, review }) {
  const { rows } = await pool.query(
    `INSERT INTO reviews (name, rating, review) VALUES ($1,$2,$3) RETURNING *`, [name, rating, review]);
  return rows[0];
}
async function listApprovedReviews() {
  const { rows } = await pool.query(`SELECT id, name, rating, review, created_at FROM reviews WHERE status = 'approved' ORDER BY created_at DESC`);
  return rows;
}
async function listAllReviews() {
  const { rows } = await pool.query(`SELECT * FROM reviews ORDER BY created_at DESC`);
  return rows;
}
async function setReviewStatus(id, status) {
  const { rows } = await pool.query(`UPDATE reviews SET status = $2 WHERE id = $1 RETURNING *`, [id, status]);
  return rows[0] || null;
}
async function deleteReview(id) {
  await pool.query(`DELETE FROM reviews WHERE id = $1`, [id]);
}

// ── admin credentials ───────────────────────────────────────────────────
async function getAdminCredentials() {
  const { rows } = await pool.query(`SELECT * FROM admin_credentials WHERE id = 1`);
  return rows[0] || null;
}
async function setAdminCredentials(username, passwordHash) {
  await pool.query(
    `INSERT INTO admin_credentials (id, username, password_hash, updated_at) VALUES (1, $1, $2, now())
     ON CONFLICT (id) DO UPDATE SET username = $1, password_hash = $2, updated_at = now()`,
    [username, passwordHash]);
}

module.exports = {
  pool, initSchema, toIsoDate, COURSES, SETTINGS_DEFAULTS,
  getSettings, setSettings,
  listMenu, getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem,
  listBlocks, getBlockedRanges, isDateBlocked, createBlock, deleteBlock,
  createOrder, getOrder, listOrders, updateOrder, setOrderStatus, setOrderAmount, deleteOrder,
  addPayment, getPayment, deletePayment, setPaymentStatus, recomputeOrderPayment,
  queueEmail, claimDueEmails, markEmailSent, markEmailFailed, emailOutboxSummary, retryFailedEmails,
  getCustomers, deleteCustomer,
  createReview, listApprovedReviews, listAllReviews, setReviewStatus, deleteReview,
  getAdminCredentials, setAdminCredentials,
};
