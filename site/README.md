# Building the site

`public/` is **generated output, committed on purpose.** Railway only runs
`npm start`, so nothing needs Python at build time and a deploy cannot fail on
a missing interpreter.

The regeneration script is called `build:site`, **not `build`** — nixpacks
auto-runs any script literally named `build`, and the Node image has no
`python3`. Naming it `build` failed the first deploy with `sh: 1: python3: not
found`. Leave the name alone.

To change the site, edit the design source and regenerate locally, then commit
the result:

```bash
npm run build:site
npm test
git add public && git commit
```

## How it fits together

| | |
|---|---|
| `design/_build.py` | The single source of content and design tokens. Also emits the `.dc.html` canvas artboards |
| `site/pages.py` | The pages that only exist on the live site — the order page, the admin and its sign-in — composed from the same masthead, tokens and furniture, plus the CSS for forms, the cart, the calendar and the admin tables |
| `site/static/` | The scripts those pages run (`order.js`, `admin.js`, …). Each is its own file so the server can keep a CSP with no inline scripts |
| `site/build_site.py` | Turns all of that into servable pages: real hrefs, real image paths, responsive rules, head metadata, a loading screen that runs once, and the review form appended to the reviews page |
| `public/` | The generated site Railway serves |
| `server.js` | Express: the static site, the `/api` the order page and admin talk to, sessions, rate limits, CSP |
| `db.js` | Postgres — schema, the menu, orders and their items, payments, days off, reviews, settings, admin credentials |
| `mail.js` | The branded emails, and the one `send` that goes quiet rather than failing when Resend is not configured |

Editing `public/` directly will be overwritten on the next build.

## The order book

The site takes orders the way Amanda already does — as requests she confirms —
rather than charging cards:

1. A customer picks items and quantities from the bill of fare (`/api/menu`,
   which is whatever the admin's Menu tab says is available), chooses market
   pickup on a Wednesday or Saturday, or delivery / shipping on any day, and
   sends the order. The server checks the date against the notice period and
   the days off, snapshots the items by name and price — and, when the order
   ships, the flat shipping fee from the Settings tab — and emails a thank-you
   that confirms nothing.
2. The bakery gets a notice with a one-tap accept / decline link, or works the
   order from `/admin`: accept, set the total, record payments as they come in
   (the status follows the money), send the confirmation or a receipt, mark it
   completed.

The standing menu is shared from the root `menu.json` catalog. Amanda can
still add seasonal or quote-on-request items from the admin, but the generated
Bill of Fare and the initial database menu start from the same names,
descriptions, and prices.

## Two things the canvas does that a web server cannot

1. **Bare image filenames.** Artboards write `src="hero-garden.webp"` and the
   canvas runtime resolves it from the document's own file table. The builder
   rewrites these to `./img/…`.
2. **A looping loading screen.** The canvas version loops forever so it can be
   seen on an artboard. The site version runs once, is skippable by click or
   keypress, self-dismisses after 4s so nobody is ever trapped, and sets a
   `sessionStorage` flag so it does not replay as you move between pages.

One thing the admin pages do that the others do not: they carry
`<base href="/">`. `/admin/login` has a directory segment, so relative asset
paths would otherwise resolve under `/admin/` and hit the sign-in guard.
