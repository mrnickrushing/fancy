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
