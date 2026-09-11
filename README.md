# Oh! You Fancy Focaccia

Website and order book for **Oh! You Fancy Focaccia** — a small-batch organic
focaccia and sourdough bakery in Brookings, Oregon, run by Amanda. She sells at
the Brookings-Harbor Farmers Market and ships and delivers.

**Live:** https://ohyoufancyfocaccia.com · **Admin:** `/admin`

## Repo layout

| Path | What's in it |
|---|---|
| `design/` | The design source: `_build.py` owns the content and tokens and emits the canvas artboards; `img/` is the prepared photography |
| `site/` | Turns the design into the served site — `build_site.py`, the server-only pages in `pages.py`, their scripts in `static/`. See `site/README.md` |
| `public/` | Generated output, committed. What Railway serves |
| `server.js`, `db.js`, `mail.js` | The order book: API, Postgres, emails |
| `test/` | `site.test.js` needs nothing; `orders.test.js` needs `TEST_DATABASE_URL` |
| `research/` | The research brief everything traces back to — identity, contact, products, reviews, open questions |
| `DEPLOY.md` | Railway, DNS, variables, how to turn email on |

## Working on it

```bash
npm ci
npm run build:site        # regenerate public/ from design/ and site/
npm test                  # the static-site suite
```

For the order book locally, and the database-backed tests, see `DEPLOY.md`.

## Still to come from Amanda

- Prices — entered per item in the admin's Menu tab; unpriced items are quoted on confirmation
- A Resend API key, so the emails actually send (`DEPLOY.md`)
- A sourdough photograph for the bill of fare, and a portrait for the About page if she wants one
