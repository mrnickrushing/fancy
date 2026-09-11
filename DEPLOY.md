# Deployment

**Live:** https://ohyoufancyfocaccia.com (pending the apex DNS record — see below)
**Railway fallback:** https://web-production-65c85.up.railway.app

| | |
|---|---|
| Railway project | `oh-you-fancy-focaccia` |
| Service | `web` |
| Environment | `production` |
| Source | `mrnickrushing/fancy`, branch `claude/youthful-babbage-mc1nbr` |
| Registrar & DNS | Cloudflare |

## DNS

Both records must be **DNS only — proxy off (grey cloud)**. Railway issues its own
certificate and validates ownership by reaching the host directly; Cloudflare's
proxy sits in front of that and the certificate never issues.

| Name | Type | Value | Status |
|---|---|---|---|
| `www` | CNAME | `ewc2pjy7.up.railway.app` | created, propagated |
| `@` (apex) | CNAME | `jv2pgstd.up.railway.app` | **still to create** |

Cloudflare flattens apex CNAMEs automatically, so a CNAME at the root is fine
here — no ALIAS record needed.

## After the apex record exists

Once both certificates report issued, set the canonical host so `www` and the
apex stop competing for the same pages:

```
CANONICAL_HOST=ohyoufancyfocaccia.com
```

as a Railway service variable. The redirect is deliberately inert until that is
set — turning it on while the apex is missing would send the only working
hostname into a dead one.

## Branch

The service tracks the feature branch so the site could go live before review.
Once the PR merges, repoint it at `main` in Railway → service → Settings →
Source, so merges deploy themselves.

## Build

`public/` is committed generated output. Railway only runs `npm start` — no
Python at build time. See `site/README.md`, particularly why the regeneration
script is called `build:site` and not `build`.
