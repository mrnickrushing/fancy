// The order book, end to end, against a real Postgres.
//
// Set TEST_DATABASE_URL to run these; without it every test here is skipped
// and the static-site suite still runs. Never the app's own DATABASE_URL —
// this suite truncates tables.
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
// Set outright, never inherited: a developer's shell may carry the real ones.
process.env.ADMIN_USERNAME = 'test-admin';
process.env.ADMIN_PASSWORD = 'test-password';
process.env.WRITE_RATE_LIMIT = '1000';
process.env.LOGIN_RATE_LIMIT = '1000';
process.env.API_RATE_LIMIT = '100000';
process.env.BASE_URL = 'https://base-url.test';
delete process.env.RESEND_API_KEY;   // no email in tests; the code path is exercised via mail.send's result

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const db = require('../db');
const mail = require('../mail');
const app = require('../server');

const HAS_DB = Boolean(process.env.TEST_DATABASE_URL);

// The next market day (Wednesday or Saturday) at least `min` days out.
function marketDay(min) {
  const d = new Date(); d.setUTCHours(12, 0, 0, 0); d.setUTCDate(d.getUTCDate() + min);
  while (![3, 6].includes(d.getUTCDay())) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
function weekday(min) {                       // a day that is not a market day
  const d = new Date(); d.setUTCHours(12, 0, 0, 0); d.setUTCDate(d.getUTCDate() + min);
  while ([3, 6].includes(d.getUTCDay())) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
function dateOffset(days) {
  const d = new Date(); d.setUTCHours(12, 0, 0, 0); d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function cookieOf(res) {
  const c = (res.headers['set-cookie'] || []).find((x) => x.startsWith('oyff_admin='));
  return c ? c.split(';')[0] : null;
}

test('resolveBaseUrl prefers a real origin over loopback', () => {
  const { resolveBaseUrl } = app;
  assert.equal(resolveBaseUrl({ BASE_URL: 'https://ohyoufancyfocaccia.com/' }), 'https://ohyoufancyfocaccia.com');
  assert.equal(resolveBaseUrl({ CANONICAL_HOST: 'ohyoufancyfocaccia.com' }), 'https://ohyoufancyfocaccia.com');
  assert.equal(resolveBaseUrl({ RAILWAY_PUBLIC_DOMAIN: 'x.up.railway.app' }), 'https://x.up.railway.app');
  assert.equal(resolveBaseUrl({}, 4000), 'http://localhost:4000');
});

test('mail dates use the site-wide MM-DD-YYYY format', () => {
  assert.equal(mail.formatDate('2027-02-03'), 'Wednesday, 02-03-2027');
});

test('email roles keep public correspondence separate from order notices', () => {
  assert.equal(mail.INFO_EMAIL, 'info@ohyoufancyfocaccia.com');
  assert.equal(mail.BAKERY_INBOX, mail.INFO_EMAIL);
  assert.equal(mail.ORDERS_INBOX, 'orders@ohyoufancyfocaccia.com');
  assert.match(mail.buildThankYou({ first_name: 'Jane', items: [], email: 'jane@example.com' }, {
    payment_instructions: 'We will confirm your order.',
  }).html, /info@ohyoufancyfocaccia\.com/);
});

test('the order book (requires Postgres)', { skip: !HAS_DB }, async (t) => {
  await db.initSchema();
  let menu, admin;

  t.beforeEach(async () => {
    // The menu is reseeded too, so a test that prices, renames or removes an
    // item cannot leak into the next one.
    await db.pool.query('TRUNCATE email_outbox, payments, order_items, orders, blocks, reviews, settings, admin_credentials, menu_items RESTART IDENTITY CASCADE');
    await db.initSchema();
    menu = await db.listMenu();
    const login = await request(app).post('/admin/login').send({ username: 'test-admin', password: 'test-password' });
    admin = cookieOf(login);
  });

  await t.test('the menu is seeded from the bill of fare, unpriced', async () => {
    const res = await request(app).get('/api/menu');
    assert.equal(res.status, 200);
    assert.ok(res.body.items.length >= 10);
    assert.ok(res.body.items.every((i) => i.price === null));
    assert.equal(res.body.courses.savory, 'Savory');
  });

  await t.test('availability reports market days, notice and blocks', async () => {
    const day = marketDay(10);
    await db.createBlock({ startDate: day, endDate: day, reason: 'away' });
    const res = await request(app).get('/api/availability');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.marketDays, [3, 6]);
    assert.equal(res.body.minNoticeDays, 2);
    assert.deepEqual(res.body.blocked, [{ start: day, end: day }]);
  });

  const good = () => ({
    firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '',
    fulfillment: 'pickup', neededDate: marketDay(3), address: '', notes: 'Extra crispy please',
    items: [{ id: menu[0].id, quantity: 2 }, { id: menu[1].id, quantity: 1 }],
  });

  await t.test('POST /api/order', async (t) => {
    await t.test('refuses an order with nothing in it', async () => {
      const res = await request(app).post('/api/order').send({ ...good(), items: [] });
      assert.equal(res.status, 400); assert.match(res.body.error, /at least one item/);
    });
    await t.test('refuses a missing email, because that is how the order is confirmed', async () => {
      const res = await request(app).post('/api/order').send({ ...good(), email: '' });
      assert.equal(res.status, 400); assert.match(res.body.error, /email/i);
    });
    await t.test('refuses market pickup on a day the market is not on', async () => {
      const res = await request(app).post('/api/order').send({ ...good(), neededDate: weekday(5) });
      assert.equal(res.status, 400); assert.match(res.body.error, /Wednesdays and Saturdays/);
    });
    await t.test('refuses a date inside the notice window', async () => {
      const res = await request(app).post('/api/order').send({ ...good(), fulfillment: 'delivery', address: '1 Main St', neededDate: weekday(0) });
      assert.equal(res.status, 400); assert.match(res.body.error, /days from today/);
    });
    await t.test('never accepts a past date when the notice window is zero', async () => {
      await db.setSettings({ min_notice_days: '0' });
      const res = await request(app).post('/api/order').send({ ...good(), fulfillment: 'delivery', address: '1 Main St', neededDate: dateOffset(-1) });
      assert.equal(res.status, 400); assert.match(res.body.error, /today onwards/);
    });
    await t.test('refuses delivery without an address', async () => {
      const res = await request(app).post('/api/order').send({ ...good(), fulfillment: 'delivery', neededDate: weekday(5) });
      assert.equal(res.status, 400); assert.match(res.body.error, /address/i);
    });
    await t.test('refuses an item that is off the menu', async () => {
      await db.updateMenuItem(menu[0].id, { available: false });
      const res = await request(app).post('/api/order').send(good());
      assert.equal(res.status, 400); assert.match(res.body.error, /not available/);
    });
    await t.test('refuses impossible calendar dates before they reach Postgres', async () => {
      const res = await request(app).post('/api/order').send({ ...good(), fulfillment: 'delivery', address: '1 Main St', neededDate: '2027-02-31' });
      assert.equal(res.status, 400);
      assert.match(res.body.error, /choose a date/i);
    });
    await t.test('refuses a blocked day with 409', async () => {
      const day = marketDay(3);
      await db.createBlock({ startDate: day, endDate: day, reason: 'off' });
      const res = await request(app).post('/api/order').send({ ...good(), neededDate: day });
      assert.equal(res.status, 409);
    });
    await t.test('saves the order with its items snapshotted, and tries the two emails', async (t) => {
      const sent = [];
      t.mock.method(mail, 'send', async (payload) => { sent.push(payload); return { sent: true }; });
      const res = await request(app).post('/api/order').send(good());
      assert.equal(res.status, 201);
      assert.equal(res.body.ok, true);
      assert.equal(res.body.emailSent, true);
      const order = await db.getOrder(res.body.orderId);
      assert.equal(order.status, 'pending');
      assert.equal(order.source, 'website');
      assert.equal(order.items.length, 2);
      assert.equal(order.items[0].quantity, 2);
      assert.equal(order.items[0].name, menu[0].name);
      // one to the bakery with the respond link, one thank-you to the customer
      assert.equal(sent.length, 2);
      const notice = sent.find((m) => m.to === mail.ORDERS_INBOX);
      assert.equal(notice.replyTo, mail.INFO_EMAIL);
      assert.match(notice.html, new RegExp(`https://base-url.test/respond/${order.id}\\?token=${order.respond_token}`));
      const thanks = sent.find((m) => m.to === 'jane@example.com');
      assert.equal(thanks.replyTo, mail.INFO_EMAIL);
      assert.match(thanks.subject, /Thank you/);
      assert.doesNotMatch(thanks.html, /deposit/i, 'the thank-you asks for nothing');
    });
    await t.test('without email configured the order still saves and says so', async () => {
      const res = await request(app).post('/api/order').send(good());
      assert.equal(res.status, 201);
      assert.equal(res.body.emailSent, false);
    });
    await t.test('merges a duplicated item and caps the quantity', async () => {
      const res = await request(app).post('/api/order').send({ ...good(), items: [{ id: menu[0].id, quantity: 60 }] });
      assert.equal(res.status, 400);
      const ok = await request(app).post('/api/order').send({ ...good(), items: [{ id: menu[0].id, quantity: 1 }, { id: menu[0].id, quantity: 2 }] });
      assert.equal(ok.status, 201);
      const order = await db.getOrder(ok.body.orderId);
      assert.equal(order.items.length, 1);
      assert.equal(order.items[0].quantity, 3);
      const tooMany = await request(app).post('/api/order').send({ ...good(), items: [{ id: menu[0].id, quantity: 50 }, { id: menu[0].id, quantity: 1 }] });
      assert.equal(tooMany.status, 400);
    });
    await t.test('retries with the same idempotency key return one order', async () => {
      const key = 'audit-idempotency-key';
      const first = await request(app).post('/api/order').set('Idempotency-Key', key).send(good());
      const second = await request(app).post('/api/order').set('Idempotency-Key', key).send({ ...good(), notes: 'retried after a lost response' });
      assert.equal(first.status, 201);
      assert.equal(second.status, 201);
      assert.equal(second.body.duplicate, true);
      assert.equal(second.body.orderId, first.body.orderId);
    });
  });

  await t.test('the respond link from the email', async () => {
    const created = await request(app).post('/api/order').send(good());
    const order = await db.getOrder(created.body.orderId);
    const bad = await request(app).get(`/respond/${order.id}?token=wrong`);
    assert.equal(bad.status, 404);
    const page = await request(app).get(`/respond/${order.id}?token=${order.respond_token}`);
    assert.equal(page.status, 200);
    assert.match(page.text, /Jane Doe/);
    assert.match(page.text, /respond\.js/);
    const accept = await request(app).post(`/api/orders/${order.id}/respond`).send({ action: 'accept', token: order.respond_token });
    assert.equal(accept.status, 200);
    assert.equal(accept.body.status, 'accepted');
    const again = await request(app).post(`/api/orders/${order.id}/respond`).send({ action: 'decline', token: order.respond_token });
    assert.equal(again.status, 409);
  });

  await t.test('admin sign-in', async (t) => {
    await t.test('a browser visiting the admin is sent to the login form', async () => {
      const res = await request(app).get('/admin').set('Accept', 'text/html');
      assert.equal(res.status, 302);
      assert.equal(res.headers.location, '/admin/login');
      const form = await request(app).get('/admin/login');
      assert.equal(form.status, 200);
      assert.match(form.text, /name="password"/);
    });
    await t.test('the api refuses without a session and does not say which field was wrong', async () => {
      assert.equal((await request(app).get('/api/admin/orders')).status, 401);
      const a = await request(app).post('/admin/login').send({ username: 'test-admin', password: 'nope' });
      const b = await request(app).post('/admin/login').send({ username: 'nobody', password: 'test-password' });
      assert.equal(a.status, 401); assert.equal(b.status, 401);
      assert.equal(a.body.error, b.body.error);
    });
    await t.test('signing in issues an HttpOnly, SameSite cookie that opens the admin', async () => {
      const login = await request(app).post('/admin/login').send({ username: 'test-admin', password: 'test-password' });
      assert.equal(login.status, 200);
      const raw = (login.headers['set-cookie'] || []).find((c) => c.startsWith('oyff_admin='));
      assert.match(raw, /HttpOnly/i); assert.match(raw, /SameSite=Strict/i);
      const page = await request(app).get('/admin').set('Accept', 'text/html').set('Cookie', cookieOf(login));
      assert.equal(page.status, 200);
      assert.match(page.text, /The Order Book/);
      const tls = await request(app).post('/admin/login').set('X-Forwarded-Proto', 'https').send({ username: 'test-admin', password: 'test-password' });
      assert.match((tls.headers['set-cookie'] || []).find((c) => c.startsWith('oyff_admin=')), /Secure/i);
    });
    await t.test('a tampered cookie is refused', async () => {
      const tampered = admin.slice(0, -1) + (admin.endsWith('A') ? 'B' : 'A');
      assert.equal((await request(app).get('/api/admin/orders').set('Cookie', tampered)).status, 401);
    });
    await t.test('changing the password invalidates old sessions', async () => {
      assert.equal((await request(app).get('/api/admin/orders').set('Cookie', admin)).status, 200);
      const res = await request(app).post('/api/admin/password').set('Cookie', admin).send({ currentPassword: 'test-password', newPassword: 'a-new-password' });
      assert.equal(res.status, 200);
      assert.equal((await request(app).get('/api/admin/orders').set('Cookie', admin)).status, 401);
      const relogin = await request(app).post('/admin/login').send({ username: 'test-admin', password: 'a-new-password' });
      assert.equal(relogin.status, 200);
    });
  });

  // One order, worked from arrival to the bin. Linear on purpose: each step
  // depends on the last, and beforeEach would wipe the order between subtests.
  await t.test('the admin works an order through', async (t) => {
    const A = (req) => req.set('Cookie', admin);
    const created = await request(app).post('/api/order').send(good());
    const id = created.body.orderId;

    // listed with its items and an empty payment log
    let r = await A(request(app).get('/api/admin/orders'));
    assert.equal(r.status, 200);
    assert.equal(r.body.orders[0].id, id);
    assert.equal(r.body.orders[0].items.length, 2);
    assert.deepEqual(r.body.orders[0].payments, []);

    // accepted, quoted, and the money followed
    r = await A(request(app).post(`/api/admin/orders/${id}/respond`)).send({ action: 'accept' });
    assert.equal(r.body.order.status, 'accepted');
    r = await A(request(app).post(`/api/admin/orders/${id}/amount`)).send({ amount: '40' });
    assert.equal(Number(r.body.order.amount), 40);
    assert.equal(r.body.order.payment_status, 'unpaid');
    r = await A(request(app).post(`/api/admin/orders/${id}/payments`)).send({ amount: 15, note: 'cash at the stall' });
    assert.equal(r.status, 201);
    assert.equal(r.body.order.payment_status, 'deposit_paid');
    assert.equal(Number(r.body.order.paid_amount), 15);
    r = await A(request(app).post(`/api/admin/orders/${id}/payments`)).send({ amount: 25 });
    assert.equal(r.body.order.payment_status, 'paid');
    // the total cannot drop under what has been paid
    r = await A(request(app).post(`/api/admin/orders/${id}/amount`)).send({ amount: 10 });
    assert.equal(r.status, 400);
    // removing a payment recomputes the status
    const latest = (await db.getOrder(id)).payments[0];
    r = await A(request(app).delete(`/api/admin/payments/${latest.id}`));
    assert.equal(r.body.order.payment_status, 'deposit_paid');
    assert.equal(Number(r.body.order.paid_amount), 15);

    // the sends refuse politely when email is not set up
    r = await A(request(app).post(`/api/admin/orders/${id}/confirmation`));
    assert.equal(r.status, 503);
    assert.match(r.body.error, /RESEND_API_KEY/);

    // and carry the figures when it is
    const sent = [];
    t.mock.method(mail, 'configured', () => true);
    t.mock.method(mail, 'send', async (payload) => { sent.push(payload); return { sent: true }; });
    await A(request(app).put('/api/admin/settings')).send({ deposit_percent: 50 });
    r = await A(request(app).post(`/api/admin/orders/${id}/confirmation`));
    assert.equal(r.status, 200);
    assert.match(sent[0].subject, /confirmed/);
    assert.match(sent[0].html, /\$40\.00/);
    assert.match(sent[0].html, /50% deposit of <strong>\$20\.00/);
    r = await A(request(app).post(`/api/admin/orders/${id}/receipt`));
    assert.equal(r.status, 200);
    assert.match(sent[1].subject, /Payment received/);
    assert.match(sent[1].html, /Balance remaining/);
    r = await A(request(app).post(`/api/admin/orders/${id}/email`)).send({ subject: 'Hi', message: 'Line one\nLine two' });
    assert.equal(r.status, 200);
    assert.match(sent[2].html, /Line one/);

    // refunded is a decision the log never overwrites
    r = await A(request(app).post(`/api/admin/orders/${id}/payment`)).send({ paymentStatus: 'refunded' });
    assert.equal(r.body.order.payment_status, 'refunded');
    r = await A(request(app).post(`/api/admin/orders/${id}/payments`)).send({ amount: 5 });
    assert.equal(r.body.order.payment_status, 'refunded');

    // edited, completed, deleted
    r = await A(request(app).patch(`/api/admin/orders/${id}`)).send({ notes: 'changed', phone: '555-0100' });
    assert.equal(r.body.order.notes, 'changed');
    r = await A(request(app).patch(`/api/admin/orders/${id}`)).send({ email: '', phone: '' });
    assert.equal(r.status, 400);
    r = await A(request(app).post(`/api/admin/orders/${id}/status`)).send({ status: 'completed' });
    assert.equal(r.body.order.status, 'completed');
    r = await A(request(app).delete(`/api/admin/orders/${id}`));
    assert.equal(r.status, 200);
    assert.equal((await A(request(app).delete(`/api/admin/orders/${id}`))).status, 404);
  });

  await t.test('a manual order needs email or phone, not a market day', async () => {
    const A = (req) => req.set('Cookie', admin);
    let r = await A(request(app).post('/api/admin/orders')).send({ ...good(), email: '', phone: '' });
    assert.equal(r.status, 400);
    r = await A(request(app).post('/api/admin/orders')).send({ ...good(), email: '', phone: '555-0100', neededDate: weekday(1) });
    assert.equal(r.status, 201);
    assert.equal(r.body.order.source, 'manual');
    const customers = await A(request(app).get('/api/admin/customers'));
    assert.equal(customers.body.customers[0].customer_key, '555-0100');
  });

  await t.test('the menu is editable, and an edit never rewrites an old order', async () => {
    const A = (req) => req.set('Cookie', admin);
    const created = await request(app).post('/api/order').send(good());
    let r = await A(request(app).patch(`/api/admin/menu/${menu[0].id}`)).send({ price: '12.50', name: 'Renamed' });
    assert.equal(r.status, 200);
    assert.equal(Number(r.body.item.price), 12.5);
    const order = await db.getOrder(created.body.orderId);
    assert.equal(order.items[0].name, menu[0].name);
    assert.equal(order.items[0].unit_price, null);
    r = await A(request(app).post('/api/admin/menu')).send({ course: 'sweet', name: 'Hot Honey Slab', price: 9 });
    assert.equal(r.status, 201);
    r = await A(request(app).post('/api/admin/menu')).send({ course: 'nope', name: 'X' });
    assert.equal(r.status, 400);
    const pub = await request(app).get('/api/menu');
    assert.ok(pub.body.items.find((i) => i.name === 'Hot Honey Slab' && Number(i.price) === 9));
    r = await A(request(app).delete(`/api/admin/menu/${r.body.item?.id || 0}`));
    // the item added above is removed; the order that referenced menu[0] keeps its snapshot
    const after = await db.getOrder(created.body.orderId);
    assert.equal(after.items.length, 2);
  });

  await t.test('blocks, reviews and settings', async () => {
    const A = (req) => req.set('Cookie', admin);
    let r = await A(request(app).post('/api/admin/blocks')).send({ startDate: '2030-01-05', endDate: '2030-01-01' });
    assert.equal(r.status, 400);
    r = await A(request(app).post('/api/admin/blocks')).send({ startDate: '2030-01-01', endDate: '2030-01-05', reason: 'holiday' });
    assert.equal(r.status, 201);

    r = await request(app).post('/api/reviews').send({ name: 'Sam', rating: 5, review: 'Best bread on the coast.' });
    assert.equal(r.status, 201);
    assert.deepEqual((await request(app).get('/api/reviews')).body.reviews, [], 'nothing shows until approved');
    r = await A(request(app).post(`/api/admin/reviews/${r.body.review.id}/approve`));
    assert.equal(r.status, 200);
    const pub = await request(app).get('/api/reviews');
    assert.equal(pub.body.reviews.length, 1);
    assert.equal(pub.body.reviews[0].name, 'Sam');
    r = await request(app).post('/api/reviews').send({ name: 'Bot', rating: 5, review: 'Spam', website: 'https://example.com' });
    assert.equal(r.status, 400);

    r = await A(request(app).put('/api/admin/settings')).send({ deposit_percent: 150 });
    assert.equal(r.status, 400);
    r = await A(request(app).put('/api/admin/settings')).send({ min_notice_days: 4, payment_instructions: 'Cash or card at the stall.' });
    assert.equal(r.status, 200);
    assert.equal((await request(app).get('/api/availability')).body.minNoticeDays, 4);
    assert.equal((await request(app).get('/api/menu')).body.paymentInstructions, 'Cash or card at the stall.');
  });
});
