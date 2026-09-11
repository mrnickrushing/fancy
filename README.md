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
| `app/` | The same order book as an Expo app for Amanda's phone — accept an order at the market, and hear about a new one as it arrives. See `app/README.md` |
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

## Client handoff checks

- Confirm the market address, seasonal schedule, delivery area, shipping destinations, allergen wording, and organic-ingredient wording with Amanda before publishing.
- Verify Resend domain authentication and the `info@` / `orders@` forwarding paths in Railway (`DEPLOY.md`).
- Keep the public bill of fare and the admin menu aligned; `menu.json` is the shared standing-menu source and the database migration adds missing catalog rows without overwriting Amanda's edits.
- A real portrait of Amanda, a market-stall photograph, and a confirmed map/location image are the final brand assets that would make the handoff feel complete.
