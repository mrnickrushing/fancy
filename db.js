// Oh! You Fancy Focaccia — the order book.
//
// Postgres, one pool. The schema is created on start and every migration is
// an ALTER ... IF NOT EXISTS, so a fresh database and a year-old one both come
// up the same way with no migration tooling to run.
const { Pool } = require('pg');
const crypto = require('crypto');
const MENU_CATALOG = require('./menu.json');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// The bill of fare is shared by the database seed and the generated public
// menu. Existing installations keep Amanda's edits; missing catalog entries
// are added once on startup so the two customer-facing paths cannot drift.
const MENU_SEED = MENU_CATALOG.map(({ course, name, description, price, image }) => [course, name, description, price, image || null]);

const COURSES = { savory: 'Savory', sourdough: 'Sourdough', sweet: 'Sweet', small: 'Focaccia Muffins', art: 'Focaccia Art' };

// What customers are told about paying. Editable from the admin's Settings
// tab; these are only the values a fresh install starts with. Nothing here
// names a payment app or a deposit figure Amanda has not chosen herself.
const SETTINGS_DEFAULTS = {
  deposit_percent: '0',
  payment_instructions: 'We will confirm your order and let you know the total. Payment is taken when you collect at the market, or as arranged for delivery and shipping.',
  pickup_note: 'Brookings-Harbor Farmers Market, Wednesdays and Saturdays from 9am.',
  min_notice_days: '2',
  // A flat fee added to every shipped order, whatever is in the box. Editable
  // from the admin, so a change in postage does not need a deploy.
  shipping_fee: '10.00',
  // How Amanda is paid. The Venmo handle is hers; Apple Pay is a yes/no,
  // because she takes it but has no separate destination to publish. Clearing
  // both takes the block out of the emails entirely.
  venmo_handle: 'OHYOUFANCYFOCACCIA',
  apple_pay_accepted: '1',
};

// Prices Amanda has corrected since the catalog was written down. Applied
// once, and only to a row still carrying the old figure — so a price she has
// since set herself in the admin is never overwritten by a migration.
//
// The hand-painted ones only. "The Everything Focaccia" is in the same course
// but it is seeds, onion and garlic rather than a painting, and stays at 15.
const PRICE_CORRECTIONS = [
  ['Flower Garden with a Bee', 15, 25],
  ['Flower Garden', 15, 25],
];

// A later round. The first round's marker has already fired on the live
// database, so adding to the list above would never run; each round needs
// its own marker.
const PRICE_CORRECTIONS_2 = [
  ['Classic Artisan Celtic Salted Sourdough', 15, 10],
  ['The Country Loaf', 15, 10],
];

// Amanda spotted a name that had gone out singular while every other muffin
// was plural. Renaming it in the catalog alone would not fix the live row:
// ensureCatalogItems inserts any catalog name it cannot find, so the site
// would end up showing both the old row and a new one. This runs before it.
const NAME_CORRECTIONS = [
  ['The Plain Jane Celtic Salted Focaccia Muffin',
   'The Plain Jane Celtic Salted Focaccia Muffins'],
];

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
  // Snapshotted at order time like the item prices above it: raising the fee
  // next month must not silently reprice an order already taken.
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10,2) NOT NULL DEFAULT 0`);
  // A gift order: no automatic email goes to the address on it, because that
  // address may be the person the bread is a surprise for.
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_gift BOOLEAN NOT NULL DEFAULT false`);
  // The order page shows customers what a bake looks like; the file lives in
  // public/img and the column holds only its name.
  await pool.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image TEXT`);
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
      sending_at TIMESTAMPTZ,
      sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`ALTER TABLE email_outbox ADD COLUMN IF NOT EXISTS sending_at TIMESTAMPTZ`);
  await pool.query(`CREATE INDEX IF NOT EXISTS email_outbox_due_idx ON email_outbox(status, next_attempt_at);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS email_outbox_sending_idx ON email_outbox(sending_at) WHERE status = 'sending';`);
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
  // Amanda's phone, so a new order can reach her away from the laptop. The
  // app re-registers on every launch, which is what last_seen_at records.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS push_tokens (
      token TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await seedMenu();
  await applyNameCorrections();   // before ensureCatalogItems, or it inserts a duplicate
  await ensureCatalogItems();
  await backfillMenuPrices();
  await alignMenuToCatalog();
  await backfillMenuImages();
  await dropBloodSugarClaim();
  await applyPriceCorrections('menu_price_corrections_1', PRICE_CORRECTIONS);
  await applyPriceCorrections('menu_price_corrections_2', PRICE_CORRECTIONS_2);
  await applyImageAdditions('menu_image_additions_1', IMAGE_ADDITIONS);
  await applyImageAdditions('menu_image_additions_2', IMAGE_ADDITIONS_2);
  await applyDescriptionCorrections();
  await applyImageReplacements();
}

async function applyPriceCorrections(marker, corrections) {
  const done = await pool.query(`SELECT 1 FROM settings WHERE key = $1`, [marker]);
  if (done.rowCount) return;
  let changed = 0;
  for (const [name, from, to] of corrections) {
    // matched on the old price as well as the name, so a price Amanda has
    // already set herself is left alone
    const { rowCount } = await pool.query(
      `UPDATE menu_items SET price = $3 WHERE name = $1 AND price = $2`,
      [name, from, to]
    );
    changed += rowCount;
  }
  await pool.query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ($1, '1', now()) ON CONFLICT (key) DO NOTHING`, [marker]
  );
  if (changed) console.log(`menu: corrected ${changed} price(s)`);
}

// A photograph swapped for a different one. IMAGE_ADDITIONS only ever fills
// a NULL, so a row that already has a picture needs its old value naming —
// which also means a photograph Amanda has chosen herself is left alone.
const IMAGE_REPLACEMENTS = [
  ['Cinnamon Swirl Artisan Sourdough', 'classic-sourdough.webp', 'cinnamon-swirl-sourdough.webp'],
];

async function applyImageReplacements() {
  const done = await pool.query(
    `SELECT 1 FROM settings WHERE key = 'menu_image_replacements_1'`);
  if (done.rowCount) return;
  let changed = 0;
  for (const [name, from, to] of IMAGE_REPLACEMENTS) {
    const { rowCount } = await pool.query(
      `UPDATE menu_items SET image = $3 WHERE name = $1 AND image = $2`,
      [name, from, to]
    );
    changed += rowCount;
  }
  await pool.query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ('menu_image_replacements_1', '1', now()) ON CONFLICT (key) DO NOTHING`
  );
  if (changed) console.log(`menu: swapped ${changed} photograph(s)`);
}

// Two rows predate the catalog entirely — they are in no menu.json, so
// nothing in the build can reach them — and both still described themselves
// as pull-apart, which is the wording Amanda asked to be rid of. Matched on
// the exact old sentence, so a description she has since written herself is
// left alone, and once only.
const DESCRIPTION_CORRECTIONS = [
  ['Honey Focaccia Bites',
   'Pull-apart bites, boxed and drizzled with Chetco Gold raw honey.',
   'Boxed and drizzled with Chetco Gold raw honey.'],
  ['Sea Salt Rolls',
   'Soft pull-apart rounds, olive-oil brushed and salt flaked.',
   'Soft rounds, olive-oil brushed and salt flaked.'],
];

async function applyDescriptionCorrections() {
  const done = await pool.query(
    `SELECT 1 FROM settings WHERE key = 'menu_description_corrections_1'`);
  if (done.rowCount) return;
  let changed = 0;
  for (const [name, from, to] of DESCRIPTION_CORRECTIONS) {
    const { rowCount } = await pool.query(
      `UPDATE menu_items SET description = $3 WHERE name = $1 AND description = $2`,
      [name, from, to]
    );
    changed += rowCount;
  }
  await pool.query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ('menu_description_corrections_1', '1', now()) ON CONFLICT (key) DO NOTHING`
  );
  if (changed) console.log(`menu: reworded ${changed} description(s)`);
}

// Photographs added to a bake that already has a live row. backfillMenuImages
// has already fired on the live database and only ever filled a NULL, so a
// picture arriving later needs its own marker to reach the order page.
//
// Matched on the image still being absent, so one Amanda has chosen herself
// is never replaced.
const IMAGE_ADDITIONS = [
  ['The Country Loaf', 'country-loaf.webp'],
];

// A later round, for the same reason the price corrections needed one: the
// first round's marker has already fired on the live database.
const IMAGE_ADDITIONS_2 = [
  ['Peppered Pickle Focaccia Muffins', 'peppered-pickle-muffins.webp'],
];

async function applyImageAdditions(marker, additions) {
  const done = await pool.query(`SELECT 1 FROM settings WHERE key = $1`, [marker]);
  if (done.rowCount) return;
  let changed = 0;
  for (const [name, image] of additions) {
    const { rowCount } = await pool.query(
      `UPDATE menu_items SET image = $2 WHERE name = $1 AND image IS NULL`,
      [name, image]
    );
    changed += rowCount;
  }
  await pool.query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ($1, '1', now()) ON CONFLICT (key) DO NOTHING`, [marker]
  );
  if (changed) console.log(`menu: gave ${changed} bake(s) a photograph`);
}

// Renames the live row rather than letting ensureCatalogItems add a second
// one beside it. Once only, and only where the old name is still there.
async function applyNameCorrections() {
  const done = await pool.query(
    `SELECT 1 FROM settings WHERE key = 'menu_name_corrections_1'`);
  if (done.rowCount) return;
  let changed = 0;
  for (const [from, to] of NAME_CORRECTIONS) {
    const { rowCount } = await pool.query(
      `UPDATE menu_items SET name = $2
        WHERE name = $1 AND NOT EXISTS (SELECT 1 FROM menu_items m WHERE m.name = $2)`,
      [from, to]
    );
    changed += rowCount;
  }
  await pool.query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ('menu_name_corrections_1', '1', now()) ON CONFLICT (key) DO NOTHING`
  );
  if (changed) console.log(`menu: renamed ${changed} bake(s)`);
}

async function seedMenu() {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM menu_items`);
  if (rows[0].n > 0) return;
  const values = [];
  const rowsSql = MENU_SEED.map(([course, name, description, price, image], i) => {
    values.push(course, name, description, price, image, i);
    const offset = i * 6;
    return `($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4},$${offset + 5},$${offset + 6})`;
  });
  await pool.query(
    `INSERT INTO menu_items (course, name, description, price, image, sort_order) VALUES ${rowsSql.join(',')}`,
    values
  );
}

async function ensureCatalogItems() {
  const values = [];
  const rowsSql = MENU_SEED.map(([course, name, description, price, image], i) => {
    values.push(course, name, description, price, image, i);
    const offset = i * 6;
    return `($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4},$${offset + 5},$${offset + 6})`;
  });
  await pool.query(
    `INSERT INTO menu_items (course, name, description, price, image, sort_order)
    SELECT v.course, v.name, v.description, v.price::numeric, v.image, v.sort_order::integer
     FROM (VALUES ${rowsSql.join(',')}) AS v(course, name, description, price, image, sort_order)
     WHERE NOT EXISTS (SELECT 1 FROM menu_items m WHERE m.name = v.name)`,
    values
  );
}

// Older installations may have menu rows with NULL prices from before the
// standing catalog was finalized. Fill only those blanks from MENU_SEED.
//
// Once only, and never on top of a price that is already set. Clearing a
// price in the admin is how Amanda marks something quote-on-request, so a
// backfill that ran on every boot would undo that choice the next time the
// service restarted. The marker lives outside SETTINGS_DEFAULTS because it
// is bookkeeping, not a setting anyone should see in the Settings tab.
async function backfillMenuPrices() {
  const done = await pool.query(
    `SELECT 1 FROM settings WHERE key = 'menu_prices_backfilled'`
  );
  if (done.rowCount) return;
  // MENU_SEED is the price list, so match the live rows against it by name
  // rather than deriving a price from the course. The honey bites are $2
  // despite being a sweet, and a by-course rule would quietly charge $15.
  const seeded = await pool.query(
    `UPDATE menu_items m SET price = v.price
       FROM (SELECT unnest($1::text[]) AS name, unnest($2::numeric[]) AS price) v
      WHERE m.name = v.name AND m.price IS NULL`,
    [MENU_SEED.map(([, name]) => name), MENU_SEED.map(([, , , price]) => price)]
  );
  // Anything Amanda added herself is not in the seed; fall back to the rule.
  const rest = await pool.query(
    `UPDATE menu_items SET price = CASE WHEN course = 'small' THEN 2 ELSE 15 END
      WHERE price IS NULL`
  );
  await pool.query(
    `INSERT INTO settings (key, value, updated_at) VALUES ('menu_prices_backfilled', '1', now())
     ON CONFLICT (key) DO NOTHING`
  );
  const n = seeded.rowCount + rest.rowCount;
  if (n) console.log(`menu: priced ${n} item(s) that had none`);
}

// The image column arrives on rows that were seeded before it existed, so
// fill it from the catalog by name. Once only, and never over a value that is
// already set: clearing an image in the admin is how Amanda takes down a photo
// she no longer likes, and a backfill on every boot would put it straight back.
// The Pow Cacao shipped with a line saying the coconut sugar in it would not
// spike your blood sugar the way refined sugar does. That is a health claim on
// a food product from a licensed kitchen, and coconut sugar is still mostly
// sucrose, so it comes off the menu.
//
// It has to be done here as well as in the catalog: the live rows were seeded
// before the wording changed, and ensureCatalogItems only inserts bakes that
// are missing — it never rewrites a description. Matched on the exact old
// sentence so a line Amanda has since written herself is left alone, and once
// only, so a wording she chooses later is not overwritten on the next boot.
const POW_CACAO_CLAIM =
  'A decadent chocolate focaccia dessert, sweetened with coconut sugar so it ' +
  'doesn\u2019t spike your blood sugar like regular refined sugar does.';
const POW_CACAO_REPLACEMENT =
  'A decadent chocolate focaccia dessert, sweetened with coconut sugar rather ' +
  'than refined sugar.';

async function dropBloodSugarClaim() {
  const done = await pool.query(
    `SELECT 1 FROM settings WHERE key = 'pow_cacao_claim_dropped'`
  );
  if (done.rowCount) return;
  const { rowCount } = await pool.query(
    `UPDATE menu_items SET description = $1 WHERE description = $2`,
    [POW_CACAO_REPLACEMENT, POW_CACAO_CLAIM]
  );
  await pool.query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ('pow_cacao_claim_dropped', '1', now()) ON CONFLICT (key) DO NOTHING`
  );
  if (rowCount) console.log('menu: took the blood-sugar claim off The Pow Cacao');
}

async function backfillMenuImages() {
  const done = await pool.query(
    `SELECT 1 FROM settings WHERE key = 'menu_images_backfilled'`
  );
  if (done.rowCount) return;
  const withImage = MENU_SEED.filter(([, , , , image]) => image);
  const { rowCount } = await pool.query(
    `UPDATE menu_items m SET image = v.image
       FROM (SELECT unnest($1::text[]) AS name, unnest($2::text[]) AS image) v
      WHERE m.name = v.name AND m.image IS NULL`,
    [withImage.map(([, name]) => name), withImage.map(([, , , , image]) => image)]
  );
  await pool.query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ('menu_images_backfilled', '1', now()) ON CONFLICT (key) DO NOTHING`
  );
  if (rowCount) console.log(`menu: gave ${rowCount} bake(s) their photo`);
}

// The order menu was seeded from research names before Amanda sent her own,
// so the live rows and the gallery drifted into two different lists: of the
// thirty-one bakes on the gallery only two could actually be ordered. The
// catalog is now built from her names, and ensureCatalogItems() above puts a
// row on the order page for every bake in it. This is the other half of that
// move: retiring the nine research names she renamed, and putting what is
// left in the order the catalog lists it.
//
// Named one by one rather than "anything missing from the catalog", because
// that description also fits a bake Amanda added herself in the admin. These
// nine are the rows the seed put there, each with a successor in the catalog
// under her own name for it.
const SUPERSEDED_MENU_NAMES = [
  'Olive & Sun-Dried Tomato Swirl',      // -> Olive & Sun-Dried Tomato
  'Roasted Garlic & Sea Salt',           // -> The Roasted Garlic Boss
  'Cheesy Jalapeño',                     // -> The Jalapeño n Chedda n Garlic
  'Cinnamon Swirl with Vanilla Drizzle', // -> The Brown Buttered Cinnamon Roll
  'Honey Focaccia Muffins',              // -> The Hot Honey
  'Jalapeño & Roasted Garlic Muffins',   // -> The Jalapeño, Garlic and Onion Focaccia Muffins
  'Peppered Pickle Muffins',             // -> Peppered Pickle Focaccia Muffins
  'Sea Salt Focaccia Muffins',           // -> The Plain Jane Celtic Salted Focaccia Muffins
  'Heart Loaf',                          // -> The Everything Focaccia
  'The Classic Sourdough',               // -> Cinnamon Swirl Artisan Sourdough
];

// Marked unavailable rather than deleted, so past orders keep the item they
// referenced and Amanda can put any of them back from the admin. The same
// pass puts the surviving rows in catalog order: the ones already there were
// numbered by the old twelve-item seed, so without this the order page lists
// a course in a different order from the numbered bill of fare on the breads
// page. Anything she added herself keeps its own number and sorts after.
//
// Once only, guarded by a marker, so a row she puts back or reorders herself
// is not undone by the next restart.
async function alignMenuToCatalog() {
  const done = await pool.query(
    `SELECT 1 FROM settings WHERE key = 'menu_catalog_v3_synced'`
  );
  if (done.rowCount) return;
  const { rowCount: retired } = await pool.query(
    `UPDATE menu_items SET available = false
      WHERE available AND name = ANY($1::text[])`,
    [SUPERSEDED_MENU_NAMES]
  );
  await pool.query(
    `UPDATE menu_items m SET sort_order = v.ord - 1
       FROM unnest($1::text[]) WITH ORDINALITY AS v(name, ord)
      WHERE m.name = v.name AND m.sort_order IS DISTINCT FROM v.ord - 1`,
    [MENU_SEED.map(([, name]) => name)]
  );
  await pool.query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ('menu_catalog_v3_synced', '1', now()) ON CONFLICT (key) DO NOTHING`
  );
  if (retired) console.log(`menu: retired ${retired} renamed bake(s)`);
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

async function createMenuItem({ course, name, description, price, image, available }) {
  const { rows: last } = await pool.query(`SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM menu_items`);
  const { rows } = await pool.query(
    `INSERT INTO menu_items (course, name, description, price, image, available, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [course, name, description || null, price ?? null, image || null, available !== false, last[0].n]
  );
  return rows[0];
}

const MENU_EDITABLE = { course: 'course', name: 'name', description: 'description', price: 'price', image: 'image', available: 'available', sortOrder: 'sort_order' };

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
      `INSERT INTO orders (first_name, last_name, email, phone, fulfillment, needed_date, address, notes, source, respond_token, idempotency_key, shipping_fee, amount, is_gift)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id, respond_token`,
      [order.firstName, order.lastName, order.email || null, order.phone || null,
       order.fulfillment, order.neededDate, order.address || null, order.notes || null,
       order.source || 'website', respondToken, order.idempotencyKey || null,
       order.shippingFee || 0, order.amount ?? null, order.isGift === true]
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
  // Amanda can turn this off once she has spoken to the buyer, which puts the
  // order back on the ordinary email path.
  isGift: 'is_gift',
  // Server-set only. The admin route never copies these out of the request
  // body — it works them out from the fulfillment it is being moved to.
  shippingFee: 'shipping_fee',
  amount: 'amount',
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
// message. A failed worker can be reclaimed after its short sending lease.
// Reclaiming can duplicate a message if the old worker was only slow, but
// that is preferable to permanently losing an order notification.
async function claimDueEmails(limit = 10) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `WITH picked AS (
         SELECT id FROM email_outbox
         WHERE (
           (
             status IN ('pending', 'failed')
             AND next_attempt_at <= now()
           ) OR (
             status = 'sending'
             AND COALESCE(sending_at, created_at) <= now() - interval '15 minutes'
           )
         )
         AND attempts < 5
         ORDER BY id
         FOR UPDATE SKIP LOCKED
         LIMIT $1
       )
       UPDATE email_outbox e
       SET status = 'sending', sending_at = now(), attempts = e.attempts + 1
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
    `UPDATE email_outbox SET status = 'sent', sending_at = NULL, sent_at = now(), last_error = NULL WHERE id = $1`, [id]
  );
}

async function markEmailFailed(id, error) {
  await pool.query(
    `UPDATE email_outbox
     SET status = CASE WHEN attempts >= 5 THEN 'dead' ELSE 'failed' END,
         sending_at = NULL,
         last_error = $2,
         next_attempt_at = now() + CASE
           WHEN attempts >= 5 THEN interval '1 day'
           WHEN attempts = 4 THEN interval '40 minutes'
           WHEN attempts = 3 THEN interval '20 minutes'
           WHEN attempts = 2 THEN interval '10 minutes'
           ELSE interval '5 minutes'
         END
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
    `UPDATE email_outbox SET status = 'pending', attempts = 0, last_error = NULL, sending_at = NULL, next_attempt_at = now()
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

// ── push tokens ─────────────────────────────────────────────────────────
// Registering an already-known token is a heartbeat, not an error, so the
// insert upserts rather than conflicting.
async function savePushToken(token) {
  await pool.query(
    `INSERT INTO push_tokens (token) VALUES ($1)
     ON CONFLICT (token) DO UPDATE SET last_seen_at = now()`, [token]);
}
// Ordered, because the send maps Expo's ticket array back onto this list by
// index to find out which device a failure belongs to.
async function listPushTokens() {
  const { rows } = await pool.query(`SELECT token FROM push_tokens ORDER BY created_at`);
  return rows.map((r) => r.token);
}
async function deletePushToken(token) {
  await pool.query(`DELETE FROM push_tokens WHERE token = $1`, [token]);
}

module.exports = {
  pool, initSchema, toIsoDate, COURSES, SETTINGS_DEFAULTS, MENU_SEED,
  getSettings, setSettings,
  listMenu, getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem,
  listBlocks, getBlockedRanges, isDateBlocked, createBlock, deleteBlock,
  createOrder, getOrder, listOrders, updateOrder, setOrderStatus, setOrderAmount, deleteOrder,
  addPayment, getPayment, deletePayment, setPaymentStatus, recomputeOrderPayment,
  queueEmail, claimDueEmails, markEmailSent, markEmailFailed, emailOutboxSummary, retryFailedEmails,
  getCustomers, deleteCustomer,
  createReview, listApprovedReviews, listAllReviews, setReviewStatus, deleteReview,
  getAdminCredentials, setAdminCredentials,
  savePushToken, listPushTokens, deletePushToken,
};
