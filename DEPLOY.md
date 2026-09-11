# Deployment

**Live:** https://ohyoufancyfocaccia.com — `www` redirects to the apex.
**Admin:** https://ohyoufancyfocaccia.com/admin

| | |
|---|---|
| Railway project | `oh-you-fancy-focaccia` |
| Services | `web` (this repo, branch `main`) and `Postgres` (`postgres:16-alpine`, volume at `/var/lib/postgresql/data`) |
| Environment | `production` |
| Registrar & DNS | Cloudflare |

Merges to `main` deploy themselves.

## Variables on `web`

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `postgresql://${{Postgres.POSTGRES_USER}}:${{Postgres.POSTGRES_PASSWORD}}@${{Postgres.RAILWAY_PRIVATE_DOMAIN}}:5432/${{Postgres.POSTGRES_DB}}` — a reference, so it follows the database service |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | The first sign-in. Read only until the first successful sign-in stores a hash in the database; after that the password is changed from the admin's Settings tab and these are ignored |
| `CANONICAL_HOST` | `ohyoufancyfocaccia.com` — turns on the `www` → apex redirect |
| `BASE_URL` | Absolute origin for the "review & respond" link in the order email |
| `BAKERY_INBOX` | Where new-order notices go |
| `EMAIL_FROM` | The sender. Must be on a domain verified in Resend |
| `RESEND_API_KEY` | **Not set yet.** Without it, orders still save and the admin works, but nothing is emailed — the Settings tab says so |

The `Postgres` service carries `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` and
`PGDATA=/var/lib/postgresql/data/pgdata` (the official image needs the data
directory one level under the mount).

## Turning email on

1. In Resend, add and verify `ohyoufancyfocaccia.com` (the DNS records go in
   Cloudflare, DNS-only).
2. Create an API key and set it as `RESEND_API_KEY` on `web`.

That is all — the code sends the moment the key exists. Until then the order form
still confirms to the customer on screen and the order lands in the admin.

## DNS

Both records are CNAMEs to the Railway service. Cloudflare flattens the apex
one. The `www` record is DNS-only; the apex was created proxied and works
because Cloudflare terminates TLS in front of Railway's own certificate.

## Database

The schema is created and migrated on start (`db.js#initSchema`), so a new
Postgres comes up ready and an old one gains columns without any tooling. The
menu is seeded from the bill of fare once, into an empty table; after that the
admin owns it.

There is no backup job yet. Railway's volume snapshots are the safety net.

## Build

`public/` is committed generated output. Railway only runs `npm start` — no
Python at build time. See `site/README.md`, particularly why the regeneration
script is called `build:site` and not `build`.

## Running it locally

```bash
docker run -d --rm --name fancy-pg -e POSTGRES_PASSWORD=test -e POSTGRES_DB=fancy -p 55432:5432 postgres:16-alpine
DATABASE_URL=postgres://postgres:test@localhost:55432/fancy ADMIN_USERNAME=amanda ADMIN_PASSWORD=whatever npm start
```

Tests that need the database run only when `TEST_DATABASE_URL` is set — never
point it at a real database, the suite truncates tables:

```bash
TEST_DATABASE_URL=postgres://postgres:test@localhost:55432/fancy npm test -- --test-concurrency=1
```
