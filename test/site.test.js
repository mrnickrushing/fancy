const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../server');
const catalog = require('../menu.json');

const PAGES = ['/', '/about.html', '/breads.html', '/gallery.html', '/reviews.html', '/contact.html'];

test('health check responds', async () => {
  const res = await request(app).get('/healthz');
  assert.strictEqual(res.status, 200);
});

test('readiness makes database absence explicit', async () => {
  const res = await request(app).get('/readyz');
  assert.strictEqual(res.status, 503);
  assert.equal(res.body.reason, 'database_not_configured');
});

test('every page serves', async () => {
  for (const p of PAGES) {
    const res = await request(app).get(p);
    assert.strictEqual(res.status, 200, `${p} returned ${res.status}`);
    assert.match(res.text, /Oh! You Fancy Focaccia/, `${p} missing the brand`);
  }
});

test('extensionless urls resolve', async () => {
  const res = await request(app).get('/about');
  assert.strictEqual(res.status, 200);
});

test('the loading screen is on the home page only', async () => {
  assert.match((await request(app).get('/')).text, /id="splash"/);
  assert.doesNotMatch((await request(app).get('/about.html')).text, /id="splash"/);
});

test('the loading screen carries the courtyard photograph, not a flat wash', async () => {
  const res = await request(app).get('/');
  assert.match(res.text, /<img class="scene"[^>]*splash-scene\.webp/, 'the courtyard photograph is missing');
  assert.match(res.text, /class="wash"/, 'the burgundy wash over the scene is missing');
  assert.doesNotMatch(res.text, /\.splash\{[^}]*radial-gradient/,
    'the splash fell back to a flat gradient');
});

test('reduced motion mutes the scene, which the script turns on regardless', async () => {
  const css = (await request(app).get('/style.css')).text;
  const block = css.slice(css.indexOf('@media (prefers-reduced-motion:reduce)'));
  assert.ok(block, 'no reduced-motion block at all');
  assert.match(block.slice(0, block.indexOf('}\n}') + 3), /\.splash \.scene[^}]*transition:none/,
    'the scene keeps its 12s drift for reduced-motion visitors');
});

test('every splash mark is driven, not just the first', async () => {
  const page = (await request(app).get('/')).text;
  const marks = page.match(/class="splash-mark"/g) || [];
  assert.ok(marks.length >= 2, `expected the badge and the wordmark, found ${marks.length}`);
  // querySelector would light the badge and leave the wordmark invisible forever
  const js = (await request(app).get('/splash.js')).text;
  assert.match(js, /querySelectorAll\('\.splash-mark'\)/);
});

test('the bill of fare lists the sourdough', async () => {
  const res = await request(app).get('/breads.html');
  assert.match(res.text, /Sourdough/);
  assert.match(res.text, /The Country Loaf/);
});

test('the public standing menu exposes every catalog item and price', async () => {
  const res = await request(app).get('/breads.html');
  const text = res.text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, '&');
  for (const item of catalog) {
    assert.ok(text.includes(item.name), `missing catalog item: ${item.name}`);
    assert.ok(text.includes(`$${item.price}`), `missing catalog price for: ${item.name}`);
  }
});

test('no unresolved placeholder links survive', async () => {
  for (const p of PAGES) {
    const res = await request(app).get(p);
    assert.doesNotMatch(res.text, /href="#"/, `${p} still has a dead link`);
  }
});

test('assets and crawl files serve', async () => {
  for (const a of ['/style.css', '/splash.js', '/nav.js', '/img/logo.webp', '/favicon.ico', '/site.webmanifest', '/img/splash-scene.webp', '/robots.txt', '/sitemap.xml']) {
    assert.strictEqual((await request(app).get(a)).status, 200, `${a} missing`);
  }
});

// The emails point at this by absolute URL. It is generated into design/img
// and copied by the build, because build_site rmtree's public/ — a file put
// straight into public/ is gone on the next rebuild, which is what happened.
test('the logo the emails point at is actually served', async () => {
  const mail = require('../mail');
  const html = mail.buildThankYou(
    { first_name: 'Jane', items: [], email: 'jane@example.com' },
    { payment_instructions: 'x' },
  ).html;
  const src = /<img src="([^"]+)"/.exec(html);
  assert.ok(src, 'the email carries no logo at all');
  const pathname = new URL(src[1]).pathname;
  const res = await request(app).get(pathname);
  assert.strictEqual(res.status, 200, `${pathname} is not served`);
  assert.match(res.headers['content-type'] || '', /image\/png/);
});

// The fee arrives with /api/availability and refreshes on a timer. Redrawing
// only the calendar leaves a cart totalled before it landed short by the fee —
// the customer sees one number and is charged another.
test('the order page re-totals once availability lands', async () => {
  const js = (await request(app).get('/order.js')).text;
  const start = js.indexOf('async function loadAvailability');
  assert.ok(start > -1, 'loadAvailability is gone');
  const body = js.slice(start, js.indexOf('\n  }', start) + 4);
  assert.match(body, /renderCal\(\)/);
  assert.match(body, /renderCart\(\)/, 'loadAvailability never re-totals the cart');
});

// A radio survives a reload; the address field only appeared on a change
// event. Delivery restored as checked with the address box still hidden meant
// the form demanded an address the customer could not see.
test('the order page shows the address box for the fulfillment it loaded with', async () => {
  const js = (await request(app).get('/order.js')).text;
  assert.match(js, /function syncFulfillment\(\)/, 'the sync is gone');
  // called at start-up, not only from the change handler
  const atLoad = /\n\s*syncFulfillment\(\);\s*\n\s*loadMenu\(\)/.test(js);
  assert.ok(atLoad, 'syncFulfillment never runs on load');
  assert.match(js, /syncFulfillment\(\);[\s\S]{0,40}\}\);/, 'the change handler no longer syncs');
});

// iOS Safari zooms the whole page when a focused field is under 16px. The
// admin's compact table inputs were 15, so every tap on a total or a payment
// amount zoomed in and had to be pinched back out.
test('the admin fields do not make Safari zoom on a phone', async () => {
  const css = (await request(app).get('/style.css')).text;
  // There are several max-width:900px blocks, so find the rule and check the
  // block it actually sits in rather than assuming it is the first one.
  const at = css.indexOf('.adm input,.adm select,.adm textarea{font-size:16px}');
  assert.ok(at > -1, 'admin fields are under 16px again, which makes Safari zoom');
  const media = css.lastIndexOf('@media', at);
  assert.match(css.slice(media, media + 40), /max-width/,
    'the 16px rule is not inside a small-screen block');
  // and Safari should not inflate body text when the phone is turned
  assert.match(css, /-webkit-text-size-adjust:100%/);
});

test('social metadata and install metadata are present', async () => {
  const html = (await request(app).get('/')).text;
  assert.match(html, /name="twitter:image"/);
  assert.match(html, /rel="manifest" href="\.\/site\.webmanifest"/);
  assert.match(html, /rel="icon" href="\.\/favicon\.ico"/);
});

test('images are cached hard, html is not', async () => {
  const img = await request(app).get('/img/logo.webp');
  assert.match(img.headers['cache-control'], /immutable/);
  const html = await request(app).get('/index.html');
  assert.doesNotMatch(html.headers['cache-control'] || '', /immutable/);
});

test('unknown paths return the customer-friendly 404 page', async () => {
  const res = await request(app).get('/no-such-page');
  assert.strictEqual(res.status, 404);
  assert.match(res.text, /That page wandered off/);
});

test('canonical redirect stays off until CANONICAL_HOST is set', async () => {
  // the module was loaded without the variable, so www must still serve
  const res = await request(app).get('/').set('Host', 'www.ohyoufancyfocaccia.com');
  assert.strictEqual(res.status, 200);
});
