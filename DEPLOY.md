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
| `INFO_EMAIL` | Public contact address and reply-to for customer correspondence |
| `ORDERS_INBOX` | Where new website-order notices go |
| `EMAIL_FROM` | The sender. Must be on a domain verified in Resend |
| `RESEND_API_KEY` | Resend API key for transactional email. Without it, orders still save and the admin works, but nothing is emailed — the Settings tab says so |

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

## Backup and restore

The order book is the production data. Before a release that changes the schema,
take a Railway Postgres snapshot and keep an off-platform dump as well. From a
trusted shell with the production `DATABASE_URL` loaded (never commit it):

```bash
./scripts/backup_db.sh
```

Keep several dated dumps outside the repository and restrict their permissions.
To restore, create a separate empty Postgres database first, verify the dump,
then restore into that database with `pg_restore --clean --if-exists`; do not
run a destructive restore against production until the dump and target have
been independently checked.

After a restore, run the smoke checks below, sign in to `/admin`, verify the
menu and recent orders, and send a controlled test order before switching DNS
or traffic back.

## Release smoke checks

After Railway reports a successful deploy, verify the actual service:

```bash
curl -fsS https://ohyoufancyfocaccia.com/healthz
curl -fsS https://ohyoufancyfocaccia.com/readyz
curl -fsS https://ohyoufancyfocaccia.com/robots.txt
curl -fsS https://ohyoufancyfocaccia.com/sitemap.xml
curl -sSI https://ohyoufancyfocaccia.com/order.html
```

In a browser, walk the order form at phone width and desktop width, submit one
controlled request, confirm it appears in the admin order book, confirm the
customer thank-you and order notice arrive, and verify a duplicate retry with
the same `Idempotency-Key` does not create a second order. Delete or cancel the
controlled order according to the confirmed business policy.

Check `/admin` for the email outbox status after the test. Failed messages can
be retried there once the Resend configuration or domain verification issue is
fixed.

The same route checks are available locally with `BASE_URL=... ./scripts/production_smoke.sh`.
`/readyz` is the database-backed release gate; `/healthz` only confirms that
the process is responding.

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
