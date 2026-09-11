const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../server');

const PAGES = ['/', '/about.html', '/breads.html', '/gallery.html', '/reviews.html', '/contact.html'];

test('health check responds', async () => {
  const res = await request(app).get('/healthz');
  assert.strictEqual(res.status, 200);
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

test('the loading screen carries the hill scene, not a flat wash', async () => {
  const res = await request(app).get('/');
  assert.match(res.text, /<svg class="scene"/, 'the drawn scene is missing');
  assert.match(res.text, /class="wash"/, 'the burgundy wash over the scene is missing');
  assert.doesNotMatch(res.text, /\.splash\{[^}]*radial-gradient/,
    'the splash fell back to a flat gradient');
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

test('no unresolved placeholder links survive', async () => {
  for (const p of PAGES) {
    const res = await request(app).get(p);
    assert.doesNotMatch(res.text, /href="#"/, `${p} still has a dead link`);
  }
});

test('assets and crawl files serve', async () => {
  for (const a of ['/style.css', '/splash.js', '/img/logo.webp', '/robots.txt', '/sitemap.xml']) {
    assert.strictEqual((await request(app).get(a)).status, 200, `${a} missing`);
  }
});

test('images are cached hard, html is not', async () => {
  const img = await request(app).get('/img/logo.webp');
  assert.match(img.headers['cache-control'], /immutable/);
  const html = await request(app).get('/index.html');
  assert.doesNotMatch(html.headers['cache-control'] || '', /immutable/);
});

test('unknown paths fall back to the home page, not a crash', async () => {
  const res = await request(app).get('/no-such-page');
  assert.strictEqual(res.status, 404);
  assert.match(res.text, /Oh! You Fancy Focaccia/);
});

test('canonical redirect stays off until CANONICAL_HOST is set', async () => {
  // the module was loaded without the variable, so www must still serve
  const res = await request(app).get('/').set('Host', 'www.ohyoufancyfocaccia.com');
  assert.strictEqual(res.status, 200);
});
