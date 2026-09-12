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
process.env.ADMIN_RATE_LIMIT = '1000';
process.env.REVIEWER_USERNAME = 'test-reviewer';
process.env.REVIEWER_PASSWORD = 'test-reviewer-password';
process.env.API_RATE_LIMIT = '100000';
process.env.BASE_URL = 'https://base-url.test';
delete process.env.RESEND_API_KEY;   // no email in tests; the code path is exercised via mail.send's result

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const fs = require('node:fs');
const path = require('node:path');
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

// Every date that reaches a customer or a push notification comes out of
// Postgres, and pg parses DATE into a Date object. Passing only strings here
// is why a push went out reading "Mon Sep 28 2026 00:00:00 GMT+0000".
test('a date straight out of Postgres formats like a date', () => {
  assert.equal(mail.formatDate(new Date(2026, 8, 28)), 'Monday, 09-28-2026');
  assert.equal(mail.formatDate(new Date(2027, 1, 3)), 'Wednesday, 02-03-2027');
  assert.equal(mail.formatDate(''), '');
  assert.equal(mail.formatDate(null), '');
});

test('email roles keep public correspondence separate from order notices', () => {
  assert.equal(mail.INFO_EMAIL, 'info@ohyoufancyfocaccia.com');
  assert.equal(mail.BAKERY_INBOX, mail.INFO_EMAIL);
  assert.equal(mail.ORDERS_INBOX, 'orders@ohyoufancyfocaccia.com');
  assert.match(mail.buildThankYou({ first_name: 'Jane', items: [], email: 'jane@example.com' }, {
    payment_instructions: 'We will confirm your order.',
  }).html, /info@ohyoufancyfocaccia\.com/);
});

// Phone is optional, so an order without one is the ordinary case. The
// customer's emails used to drop their three "who" rows by position, which
// took the date with them the moment a row above was missing.
test('customer emails keep the date and the notes, with or without a phone', () => {
  const base = {
    first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com',
    fulfillment: 'pickup', needed_date: '2027-02-03',
    notes: 'No olives please, allergy', items: [],
  };
  const shapes = {
    'with a phone': { ...base, phone: '555-0100' },
    'without a phone': base,
    'phone but no email': { ...base, email: '', phone: '555-0100' },
    'delivery, with an address': { ...base, fulfillment: 'delivery', address: '12 Chetco Ave' },
  };
  for (const [shape, o] of Object.entries(shapes)) {
    for (const [which, built] of [
      ['thank-you', mail.buildThankYou(o, { payment_instructions: 'x' })],
      ['confirmation', mail.buildConfirmation(o, { payment_instructions: 'x', pickup_note: 'y', deposit_percent: '0' })],
    ]) {
      assert.match(built.html, /02-03-2027/, `${which}, ${shape}: no date`);
      assert.match(built.html, /No olives please, allergy/, `${which}, ${shape}: no notes`);
      // and still not reading their own name and address back at them
      assert.doesNotMatch(built.html, /Jane Doe/, `${which}, ${shape}: repeats their name`);
    }
    assert.match(mail.buildBakeryNotice({ ...o, id: 1 }, 'https://x').html, /No olives please, allergy/,
      `bakery notice, ${shape}: no notes`);
  }
});

// These two build their rows by hand rather than from an order.
test('the receipt and the review notice still fill their tables', () => {
  const receipt = mail.buildReceipt({
    first_name: 'Jane', amount: 45, paid_amount: 20, payment_status: 'partial',
    items: [{ name: 'The Italiano', quantity: 3, unit_price: 15 }],
  }, { amount: 20 });
  assert.match(receipt.html, /This payment/);
  assert.match(receipt.html, /\$20\.00/);
  assert.doesNotMatch(receipt.html, /undefined/);
  const notice = mail.buildReviewNotice({ name: 'Sam', rating: 5, review: 'Wonderful' });
  assert.match(notice.html, /Sam/);
  assert.match(notice.html, /5\/5/);
  assert.doesNotMatch(notice.html, /undefined/);
});

// The logo goes on everything; the payment block only on the emails a customer
// might actually pay from.
const MAIL_O = { first_name: 'Jane', items: [], email: 'j@example.com', needed_date: '2027-02-03', fulfillment: 'pickup' };
const MAIL_SETTINGS = { payment_instructions: 'x', pickup_note: 'y', deposit_percent: '0' };

test('every email carries the logo, and only the money ones carry the payment block', () => {
  const paid = { ...MAIL_SETTINGS, venmo_handle: '@amanda-bakes', apple_pay_accepted: '1' };
  const customer = [
    mail.buildThankYou(MAIL_O, paid),
    mail.buildConfirmation(MAIL_O, paid),
    mail.buildReceipt({ ...MAIL_O, amount: 40, paid_amount: 40, payment_status: 'paid' }, { amount: 40 }, paid),
    mail.buildPlain('Hello', 'A note', paid),
  ];
  const toAmanda = [
    mail.buildBakeryNotice({ ...MAIL_O, id: 1 }, 'https://x'),
    mail.buildReviewNotice({ name: 'Sam', rating: 5, review: 'Lovely' }),
  ];

  for (const built of [...customer, ...toAmanda]) {
    assert.match(built.html, /img\/email-logo\.png/, 'no logo');
    // The wordmark stays for anyone whose client blocks images.
    assert.match(built.html, /Oh! You Fancy/);
  }
  for (const built of customer) {
    assert.match(built.html, /How to pay/);
    assert.match(built.html, /https:\/\/venmo\.com\/u\/amanda-bakes/);
    assert.match(built.html, /Apple&nbsp;Pay/);
  }
  for (const built of toAmanda) assert.doesNotMatch(built.html, /How to pay/);
});

test('the payment block stays out until there is something to put in it', () => {
  const empty = { ...MAIL_SETTINGS, venmo_handle: '', apple_pay_accepted: '' };
  assert.doesNotMatch(mail.buildThankYou(MAIL_O, empty).html, /How to pay/);
  // either one on its own is enough
  assert.match(mail.buildThankYou(MAIL_O, { ...empty, apple_pay_accepted: '1' }).html, /How to pay/);
  assert.match(mail.buildThankYou(MAIL_O, { ...empty, venmo_handle: 'amanda' }).html, /How to pay/);
});

test('the bakery ships with her Venmo and Apple Pay already on', () => {
  assert.equal(db.SETTINGS_DEFAULTS.venmo_handle, 'OHYOUFANCYFOCACCIA');
  assert.equal(db.SETTINGS_DEFAULTS.apple_pay_accepted, '1');
  const html = mail.buildThankYou(MAIL_O, { ...MAIL_SETTINGS, ...db.SETTINGS_DEFAULTS }).html;
  assert.match(html, /venmo\.com\/u\/OHYOUFANCYFOCACCIA/);
  assert.match(html, /Apple&nbsp;Pay/);
});

test('a Venmo handle is understood however it is written down', () => {
  for (const given of ['amanda-bakes', '@amanda-bakes', 'https://venmo.com/u/amanda-bakes']) {
    const html = mail.buildThankYou(MAIL_O, { ...MAIL_SETTINGS, venmo_handle: given }).html;
    assert.match(html, /https:\/\/venmo\.com\/u\/amanda-bakes/, given);
    assert.match(html, /@amanda-bakes/, given);
  }
});

test('the order book (requires Postgres)', { skip: !HAS_DB }, async (t) => {
  await db.initSchema();
  let menu, admin;

  t.beforeEach(async () => {
    // The menu is reseeded too, so a test that prices, renames or removes an
    // item cannot leak into the next one.
    await db.pool.query('TRUNCATE email_outbox, payments, order_items, orders, blocks, reviews, settings, admin_credentials, menu_items, push_tokens RESTART IDENTITY CASCADE');
    await db.initSchema();
    menu = await db.listMenu();
    const login = await request(app).post('/admin/login').send({ username: 'test-admin', password: 'test-password' });
    admin = cookieOf(login);
  });

  await t.test('every bake in the catalog can be ordered, at the catalog price', async () => {
    const res = await request(app).get('/api/menu');
    assert.equal(res.status, 200);
    // Every bake on the gallery, not just the ones the first seed happened to
    // carry: the two lists drifted once and the order page lost all but two.
    const orderable = new Set(res.body.items.map((i) => i.name));
    for (const [, name] of db.MENU_SEED) {
      assert.ok(orderable.has(name), `${name} is on the menu but cannot be ordered`);
    }
    // Nothing ships unpriced any more, so nothing falls back to "quoted".
    // Checked against MENU_SEED rather than a by-course rule: the honey bites
    // are $2 despite being a sweet, and a rule would not have caught that.
    const expected = new Map(db.MENU_SEED.map(([, name, , price]) => [name, price]));
    for (const i of res.body.items) {
      assert.ok(expected.has(i.name), `${i.name} is not in MENU_SEED`);
      assert.equal(Number(i.price), expected.get(i.name), `${i.name} priced wrong`);
    }
    assert.equal(res.body.courses.savory, 'Savory');
  });

  // Amanda: "the painter focaccias, the ones with herb flowers and bees, are
  // $25 not $15". Changing menu.json alone would only move the printed bill of
  // fare — the order form reads the database, and would have gone on charging
  // fifteen.
  await t.test('the painted focaccias were corrected to $25, and only them', async () => {
    const priceOf = async (name) => {
      const { rows } = await db.pool.query('SELECT price FROM menu_items WHERE name = $1', [name]);
      return rows[0] ? Number(rows[0].price) : null;
    };
    // a fresh database seeds them at the corrected price
    assert.equal(await priceOf('Flower Garden'), 25);
    assert.equal(await priceOf('Flower Garden with a Bee'), 25);
    // the seeded, not-painted one in the same course is untouched
    assert.equal(await priceOf('The Everything Focaccia'), 15);

    // what production looked like: the row still at the old figure
    await db.pool.query(`UPDATE menu_items SET price = 15 WHERE name = 'Flower Garden'`);
    await db.pool.query(`DELETE FROM settings WHERE key = 'menu_price_corrections_1'`);
    await db.initSchema();
    assert.equal(await priceOf('Flower Garden'), 25, 'the correction did not reach the database');

    // and a figure she set herself is left alone by it
    await db.pool.query(`UPDATE menu_items SET price = 18 WHERE name = 'Flower Garden'`);
    await db.pool.query(`DELETE FROM settings WHERE key = 'menu_price_corrections_1'`);
    await db.initSchema();
    assert.equal(await priceOf('Flower Garden'), 18, 'a price she set herself was overwritten');
  });

  await t.test('the rename migration retires the old names and nothing else', async () => {
    // What production looks like before the deploy: rows under the research
    // names, plus one Amanda added herself in the admin.
    await db.pool.query(
      `INSERT INTO menu_items (course, name, description, price, sort_order)
       VALUES ('art','Heart Loaf','',15,90),
              ('small','Sea Salt Focaccia Muffins','',2,91),
              ('savory','Market Special','Whatever is best this week',15,92)`
    );
    await db.pool.query(`DELETE FROM settings WHERE key = 'menu_catalog_v2_synced'`);
    await db.initSchema();

    const byName = new Map((await db.pool.query(
      `SELECT name, available FROM menu_items`
    )).rows.map((r) => [r.name, r.available]));
    assert.equal(byName.get('Heart Loaf'), false);
    assert.equal(byName.get('Sea Salt Focaccia Muffins'), false);
    // Named one by one for exactly this reason — hers is not in the catalog
    // either, and a "retire anything missing" rule would have taken it too.
    assert.equal(byName.get('Market Special'), true);

    // and the surviving rows come out in catalog order, so the order page
    // reads down a course the same way the numbered bill of fare does.
    const live = await db.listMenu({ availableOnly: true });
    const catalog = db.MENU_SEED.map(([, name]) => name);
    assert.deepEqual(
      live.map((r) => r.name).filter((n) => catalog.includes(n)),
      catalog
    );

    // And she can put one back: the marker stops the next restart undoing it.
    await db.pool.query(`UPDATE menu_items SET available = true WHERE name = 'Heart Loaf'`);
    await db.initSchema();
    const { rows } = await db.pool.query(`SELECT available FROM menu_items WHERE name = 'Heart Loaf'`);
    assert.equal(rows[0].available, true);
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
    // The app holds no cookie at all, so it presents Basic on every request.
    // The two schemes are additive: taking Basic away locks the app out.
    await t.test('the app signs in with Basic on every request', async () => {
      const basic = (u, p) => `Basic ${Buffer.from(`${u}:${p}`).toString('base64')}`;
      assert.equal((await request(app).get('/api/admin/orders').set('Authorization', basic('test-admin', 'test-password'))).status, 200);
      assert.equal((await request(app).get('/api/admin/orders').set('Authorization', basic('test-admin', 'nope'))).status, 401);
      assert.equal((await request(app).get('/api/admin/orders').set('Authorization', basic('nobody', 'test-password'))).status, 401);
      assert.equal((await request(app).get('/api/admin/orders').set('Authorization', 'Basic not-base64')).status, 401);
    });
    // Changing it from the Settings tab has to move the app over too, and a
    // password may itself contain a colon.
    await t.test('a changed password is the app password, colon and all', async () => {
      const basic = (u, p) => `Basic ${Buffer.from(`${u}:${p}`).toString('base64')}`;
      const res = await request(app).post('/api/admin/password').set('Cookie', admin)
        .send({ currentPassword: 'test-password', newPassword: 'has:a:colon' });
      assert.equal(res.status, 200);
      assert.equal((await request(app).get('/api/admin/orders').set('Authorization', basic('test-admin', 'has:a:colon'))).status, 200);
      assert.equal((await request(app).get('/api/admin/orders').set('Authorization', basic('test-admin', 'test-password'))).status, 401);
    });
  });

  // Shipping is the one charge the customer meets before Amanda has priced
  // anything, so it has to be right on the order page and right on the order.
  await t.test('shipping is a flat fee, snapshotted', async (t) => {
    const B = (req) => req.set('Authorization', `Basic ${Buffer.from('test-admin:test-password').toString('base64')}`);
    const shippedOrder = (over = {}) => ({
      firstName: 'Ada', lastName: 'Byron', email: 'ada@example.com',
      fulfillment: 'shipping', neededDate: dateOffset(6), address: '1 Long Road, Denver CO',
      items: [{ id: menu[0].id, quantity: 2 }], ...over,
    });

    await t.test('the order page is told the fee, so nobody meets it first in an email', async () => {
      const res = await request(app).get('/api/availability');
      assert.equal(res.status, 200);
      assert.equal(res.body.shippingFee, 10);
    });

    await t.test('it lands on shipped orders and on nothing else', async () => {
      const ship = await request(app).post('/api/order').send(shippedOrder());
      assert.equal(ship.status, 201);
      assert.equal(Number((await db.getOrder(ship.body.orderId)).shipping_fee), 10);

      const pickup = await request(app).post('/api/order').send(good());
      assert.equal(pickup.status, 201);
      assert.equal(Number((await db.getOrder(pickup.body.orderId)).shipping_fee), 0);

      const deliver = await request(app).post('/api/order').send(shippedOrder({
        fulfillment: 'delivery', email: 'del@example.com',
      }));
      assert.equal(deliver.status, 201);
      assert.equal(Number((await db.getOrder(deliver.body.orderId)).shipping_fee), 0);
    });

    // The whole reason it is a column and not a lookup.
    await t.test('raising the fee does not reprice an order already taken', async () => {
      const before = await request(app).post('/api/order').send(shippedOrder());
      assert.equal(before.status, 201);

      const put = await B(request(app).put('/api/admin/settings')).send({ shipping_fee: 25 });
      assert.equal(put.status, 200);
      assert.equal(put.body.settings.shipping_fee, '25.00');

      assert.equal(Number((await db.getOrder(before.body.orderId)).shipping_fee), 10);
      const after = await request(app).post('/api/order').send(shippedOrder({ email: 'later@example.com' }));
      assert.equal(Number((await db.getOrder(after.body.orderId)).shipping_fee), 25);
    });

    await t.test('an order taken by hand is charged it too', async () => {
      const res = await B(request(app).post('/api/admin/orders')).send(shippedOrder());
      assert.equal(res.status, 201);
      assert.equal(Number(res.body.order.shipping_fee), 10);
    });

    // The fee is a snapshot, so editing the order has to move it deliberately.
    await t.test('changing how an order is fulfilled moves the fee with it', async () => {
      const S = { payment_instructions: 'x', pickup_note: 'y', deposit_percent: '0' };
      const made = await request(app).post('/api/order').send(shippedOrder());
      const id = made.body.orderId;
      assert.equal(Number((await db.getOrder(id)).shipping_fee), 10);

      const toPickup = await B(request(app).patch(`/api/admin/orders/${id}`)).send({ fulfillment: 'pickup' });
      assert.equal(toPickup.status, 200);
      let order = await db.getOrder(id);
      assert.equal(Number(order.shipping_fee), 0, 'a pickup kept the shipping fee');
      assert.doesNotMatch(mail.buildConfirmation(order, S).html, />Shipping</,
        'the confirmation still bills shipping on a pickup');

      const back = await B(request(app).patch(`/api/admin/orders/${id}`)).send({ fulfillment: 'shipping', address: '1 Long Road' });
      assert.equal(back.status, 200);
      order = await db.getOrder(id);
      assert.equal(Number(order.shipping_fee), 10, 'moving back to shipping charged nothing');
      assert.match(mail.buildConfirmation(order, S).html, />Shipping</);
    });

    await t.test('the fee is the server\'s to set, not the request\'s', async () => {
      const made = await request(app).post('/api/order').send(good());
      const res = await B(request(app).patch(`/api/admin/orders/${made.body.orderId}`))
        .send({ notes: 'nothing to see', shippingFee: 999, shipping_fee: 999 });
      assert.equal(res.status, 200);
      assert.equal(Number((await db.getOrder(made.body.orderId)).shipping_fee), 0);
    });

    await t.test('delivery and shipping edits require an address', async () => {
      const made = await request(app).post('/api/order').send(good());
      const id = made.body.orderId;
      const delivery = await B(request(app).patch(`/api/admin/orders/${id}`)).send({ fulfillment: 'delivery' });
      assert.equal(delivery.status, 400);
      const shipping = await B(request(app).patch(`/api/admin/orders/${id}`)).send({ fulfillment: 'shipping' });
      assert.equal(shipping.status, 400);
      const ok = await B(request(app).patch(`/api/admin/orders/${id}`)).send({ fulfillment: 'delivery', address: '1 Long Road' });
      assert.equal(ok.status, 200);
    });

    await t.test('admin edits enforce the notes limit', async () => {
      const made = await request(app).post('/api/order').send(good());
      const res = await B(request(app).patch(`/api/admin/orders/${made.body.orderId}`)).send({ notes: 'x'.repeat(2001) });
      assert.equal(res.status, 400);
    });

    await t.test('the fee has to be an amount', async () => {
      for (const bad of [-1, 1001, 'free']) {
        assert.equal((await B(request(app).put('/api/admin/settings')).send({ shipping_fee: bad })).status, 400);
      }
    });
  });

  // She should not be adding up her own bill of fare.
  await t.test('the total works itself out', async (t) => {
    const B = (req) => req.set('Authorization', `Basic ${Buffer.from('test-admin:test-password').toString('base64')}`);
    const goodsOf = (order) => order.items.reduce((n, i) => n + Number(i.unit_price) * i.quantity, 0);

    await t.test('a website order arrives already totalled', async () => {
      const res = await request(app).post('/api/order').send(good());
      assert.equal(res.status, 201);
      const order = await db.getOrder(res.body.orderId);
      assert.equal(Number(order.amount), goodsOf(order));
      assert.equal(order.payment_status, 'unpaid');
    });

    await t.test('a shipped order has the fee in its total', async () => {
      const res = await request(app).post('/api/order').send({
        firstName: 'Ada', lastName: 'Byron', email: 'ada@example.com',
        fulfillment: 'shipping', neededDate: dateOffset(6), address: '1 Long Road',
        items: [{ id: menu[0].id, quantity: 2 }],
      });
      assert.equal(res.status, 201);
      const order = await db.getOrder(res.body.orderId);
      assert.equal(Number(order.amount), goodsOf(order) + 10);
    });

    await t.test('an order taken by hand is totalled the same way', async () => {
      const res = await B(request(app).post('/api/admin/orders')).send(good());
      assert.equal(res.status, 201);
      assert.equal(Number(res.body.order.amount), goodsOf(res.body.order));
    });

    // A partial sum is a wrong total, so there is none.
    await t.test('an item quoted on request leaves the total to her', async () => {
      await db.pool.query('UPDATE menu_items SET price = NULL WHERE id = $1', [menu[0].id]);
      const res = await request(app).post('/api/order').send({ ...good(), items: [{ id: menu[0].id, quantity: 1 }] });
      assert.equal(res.status, 201);
      assert.equal((await db.getOrder(res.body.orderId)).amount, null);
    });

    await t.test('moving an order to shipping and back moves the total with it', async () => {
      const res = await request(app).post('/api/order').send(good());
      const id = res.body.orderId;
      const before = Number((await db.getOrder(id)).amount);
      await B(request(app).patch(`/api/admin/orders/${id}`)).send({ fulfillment: 'shipping', address: '1 Long Road' });
      assert.equal(Number((await db.getOrder(id)).amount), before + 10);
      await B(request(app).patch(`/api/admin/orders/${id}`)).send({ fulfillment: 'pickup' });
      assert.equal(Number((await db.getOrder(id)).amount), before);
    });

    await t.test('a total she set herself is never overwritten', async () => {
      const res = await request(app).post('/api/order').send(good());
      const id = res.body.orderId;
      assert.equal((await B(request(app).post(`/api/admin/orders/${id}/amount`)).send({ amount: 99 })).status, 200);
      await B(request(app).patch(`/api/admin/orders/${id}`)).send({ fulfillment: 'shipping', address: '1 Long Road' });
      assert.equal(Number((await db.getOrder(id)).amount), 99, 'her figure was overwritten');
    });

    await t.test('the thank-you states the total when there is one', async () => {
      const res = await request(app).post('/api/order').send(good());
      const order = await db.getOrder(res.body.orderId);
      assert.match(mail.buildThankYou(order, { payment_instructions: 'x' }).html, /it comes to/);
      assert.match(mail.buildThankYou({ ...order, amount: null }, { payment_instructions: 'x' }).html, /let you know the total/);
    });
  });

  // Apple need a working sign-in for a login-gated app. This one must never
  // reach a real order or a real customer.
  await t.test('the App Review account looks, and touches nothing', async (t) => {
    const R = (req) => req.set('Authorization', `Basic ${Buffer.from('test-reviewer:test-reviewer-password').toString('base64')}`);
    const B = (req) => req.set('Authorization', `Basic ${Buffer.from('test-admin:test-password').toString('base64')}`);

    await t.test('it can sign in, and says what it is', async () => {
      const res = await R(request(app).get('/api/admin/session'));
      assert.equal(res.status, 200);
      assert.equal(res.body.readOnly, true);
      const hers = await B(request(app).get('/api/admin/session'));
      assert.equal(hers.body.readOnly, false);
      assert.equal(hers.body.username, 'test-admin');
    });

    // The whole point: a real customer's name must not reach a reviewer.
    await t.test('it never sees a real order or a real customer', async () => {
      const made = await request(app).post('/api/order').send(good());
      assert.equal(made.status, 201);
      const real = await db.getOrder(made.body.orderId);

      const orders = await R(request(app).get('/api/admin/orders'));
      assert.equal(orders.status, 200);
      const ids = orders.body.orders.map((o) => o.id);
      assert.ok(!ids.includes(real.id), 'a real order reached the reviewer');
      const names = JSON.stringify(orders.body.orders);
      assert.ok(!names.includes(real.first_name) || real.first_name === 'Marguerite',
        'a real customer name reached the reviewer');
      assert.ok(orders.body.orders.length > 0, 'the reviewer sees an empty app');

      const customers = await R(request(app).get('/api/admin/customers'));
      assert.ok(!JSON.stringify(customers.body).includes(real.email), 'a real email reached the reviewer');
    });

    await t.test('every write is refused, by method not by route', async () => {
      const writes = [
        ['post', '/api/admin/orders'],
        ['patch', '/api/admin/orders/1'],
        ['delete', '/api/admin/orders/1'],
        ['post', '/api/admin/orders/1/amount'],
        ['post', '/api/admin/orders/1/respond'],
        ['put', '/api/admin/settings'],
        ['post', '/api/admin/password'],
        ['post', '/api/admin/menu'],
        ['post', '/api/admin/push-token'],
      ];
      for (const [method, route] of writes) {
        const res = await R(request(app)[method](route)).send({});
        assert.equal(res.status, 403, `${method.toUpperCase()} ${route} was not refused`);
        assert.match(res.body.error, /App Review/);
      }
    });

    // A route added later must not quietly start serving real rows to it.
    await t.test('an endpoint it does not know about answers with nothing', async () => {
      const res = await R(request(app).get('/api/admin/email-outbox'));
      assert.equal(res.status, 200);
      assert.deepEqual(res.body, {});
    });

    await t.test('Amanda is unaffected', async () => {
      const res = await B(request(app).get('/api/admin/orders'));
      assert.equal(res.status, 200);
      assert.equal((await B(request(app).put('/api/admin/settings')).send({ min_notice_days: 3 })).status, 200);
    });
  });

  // Amanda's phone. The push is wrapped around the order rather than part of
  // it, so these care as much about Expo being unreachable as about delivery.
  await t.test('push notifications', async (t) => {
    const TOKEN = 'ExpoPushToken[aaaaaaaaaaaaaaaaaaaaaa]';
    const OTHER = 'ExpoPushToken[bbbbbbbbbbbbbbbbbbbbbb]';
    const B = (req) => req.set('Authorization', `Basic ${Buffer.from('test-admin:test-password').toString('base64')}`);
    const realFetch = globalThis.fetch;
    let calls = [];

    // The push is deliberately not awaited by the request, so the assertions
    // wait for it to land rather than assuming it already has.
    const settle = async (check, ms = 2000) => {
      const until = Date.now() + ms;
      for (;;) {
        if (await check()) return true;
        if (Date.now() > until) return false;
        await new Promise((r) => setTimeout(r, 10));
      }
    };

    t.beforeEach(() => {
      calls = [];
      globalThis.fetch = async (url, init) => {
        calls.push({ url, body: JSON.parse(init.body) });
        return { ok: true, json: async () => ({ data: [{ status: 'ok' }] }) };
      };
    });
    t.after(() => { globalThis.fetch = realFetch; });

    await t.test('registering the same device twice is a heartbeat, not a duplicate', async () => {
      assert.equal((await B(request(app).post('/api/admin/push-token')).send({ token: TOKEN })).status, 200);
      assert.equal((await B(request(app).post('/api/admin/push-token')).send({ token: TOKEN })).status, 200);
      assert.deepEqual(await db.listPushTokens(), [TOKEN]);
    });

    await t.test('anything that is not an Expo token is refused rather than stored', async () => {
      for (const bad of ['', '   ', 'not-a-token', 'fcm:abc', 'ExpoPushToken[]']) {
        assert.equal((await B(request(app).post('/api/admin/push-token')).send({ token: bad })).status, 400);
      }
      assert.deepEqual(await db.listPushTokens(), []);
    });

    await t.test('registering needs admin auth', async () => {
      assert.equal((await request(app).post('/api/admin/push-token').send({ token: TOKEN })).status, 401);
      assert.equal((await request(app).delete('/api/admin/push-token').send({ token: TOKEN })).status, 401);
    });

    await t.test('a signed-out device stops receiving them', async () => {
      await B(request(app).post('/api/admin/push-token')).send({ token: TOKEN });
      assert.equal((await B(request(app).delete('/api/admin/push-token')).send({ token: TOKEN })).status, 200);
      assert.deepEqual(await db.listPushTokens(), []);
    });

    await t.test('a website order notifies every registered device, once', async () => {
      await B(request(app).post('/api/admin/push-token')).send({ token: TOKEN });
      await B(request(app).post('/api/admin/push-token')).send({ token: OTHER });
      assert.equal((await request(app).post('/api/order').send(good())).status, 201);
      assert.ok(await settle(() => calls.length === 1), 'expected one call to Expo');
      assert.equal(calls[0].url, 'https://exp.host/--/api/v2/push/send');
      assert.equal(calls[0].body.length, 2);
      assert.deepEqual(calls[0].body.map((m) => m.to).sort(), [TOKEN, OTHER].sort());
      assert.match(calls[0].body[0].title, /New order request/);
      assert.equal(calls[0].body[0].data.type, 'order');
    });

    await t.test('it says nothing to Expo when no device is registered', async () => {
      assert.equal((await request(app).post('/api/order').send(good())).status, 201);
      assert.ok(!(await settle(() => calls.length > 0, 150)), 'expected no call to Expo');
    });

    await t.test('an order still saves when the push service is down', async () => {
      await B(request(app).post('/api/admin/push-token')).send({ token: TOKEN });
      globalThis.fetch = async () => { throw new Error('network down'); };
      assert.equal((await request(app).post('/api/order').send(good())).status, 201);
      assert.deepEqual(await db.listPushTokens(), [TOKEN]);
    });

    await t.test('a device Expo calls dead is dropped; one that merely failed is kept', async () => {
      await B(request(app).post('/api/admin/push-token')).send({ token: TOKEN });
      await B(request(app).post('/api/admin/push-token')).send({ token: OTHER });
      globalThis.fetch = async () => ({
        ok: true,
        json: async () => ({ data: [
          { status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } },
          { status: 'error', message: 'slow down', details: { error: 'MessageRateExceeded' } },
        ] }),
      });
      assert.equal((await request(app).post('/api/order').send(good())).status, 201);
      assert.ok(await settle(async () => (await db.listPushTokens()).length === 1), 'expected the dead token to be dropped');
      assert.deepEqual(await db.listPushTokens(), [OTHER]);
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
    // the snapshot holds what it cost when it was ordered — 15 — and not the
    // 12.50 the menu item was just changed to
    assert.equal(Number(order.items[0].unit_price), 15);
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

  await t.test('the order page is given a photograph for every bake that has one', async () => {
    const res = await request(app).get('/api/menu');
    const byName = new Map(res.body.items.map((i) => [i.name, i.image]));
    for (const [, name, , , image] of db.MENU_SEED) {
      assert.equal(byName.get(name), image ?? null, `${name} has the wrong image`);
    }
    // and the file is really in public/img, not a name that 404s at the customer
    const dir = path.join(__dirname, '..', 'public', 'img');
    for (const image of new Set(res.body.items.map((i) => i.image).filter(Boolean))) {
      assert.ok(fs.existsSync(path.join(dir, image)), `public/img/${image} is missing`);
    }
  });

  await t.test('an image name has to be a file in public/img', async () => {
    const A = (req) => req.set('Cookie', admin);
    const id = menu[0].id;
    // it is written into a src attribute, so the admin must not be able to
    // point it anywhere but our own images
    for (const bad of ['../../../etc/passwd', '/etc/passwd', 'https://example.com/x.webp',
                       'x.webp" onerror="alert(1)', 'nope.svg', '../secret.webp']) {
      const r = await A(request(app).patch(`/api/admin/menu/${id}`)).send({ image: bad });
      assert.equal(r.status, 400, `${bad} was accepted`);
    }
    let r = await A(request(app).patch(`/api/admin/menu/${id}`)).send({ image: 'sea-salt-round.webp' });
    assert.equal(r.status, 200);
    assert.equal(r.body.item.image, 'sea-salt-round.webp');
    // and clearing it is how she takes a photo down
    r = await A(request(app).patch(`/api/admin/menu/${id}`)).send({ image: '' });
    assert.equal(r.status, 200);
    assert.equal(r.body.item.image, null);
  });

  await t.test('rows seeded before the image column get their photograph once', async () => {
    await db.pool.query(`UPDATE menu_items SET image = NULL`);
    await db.pool.query(`DELETE FROM settings WHERE key = 'menu_images_backfilled'`);
    await db.initSchema();
    const { rows } = await db.pool.query(
      `SELECT name, image FROM menu_items WHERE name = ANY($1::text[])`,
      [db.MENU_SEED.filter(([, , , , img]) => img).map(([, name]) => name)]
    );
    assert.ok(rows.length > 25);
    for (const r of rows) assert.ok(r.image, `${r.name} did not get its image back`);

    // and one she clears herself stays cleared through the next restart
    await db.pool.query(`UPDATE menu_items SET image = NULL WHERE name = $1`, [rows[0].name]);
    await db.initSchema();
    const after = await db.pool.query(`SELECT image FROM menu_items WHERE name = $1`, [rows[0].name]);
    assert.equal(after.rows[0].image, null);
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
