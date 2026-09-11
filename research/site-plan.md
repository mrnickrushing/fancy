# Site plan — Oh! You Fancy Focaccia

Built in Gamma, structured after **Sugar Haus** (`mrnickrushing/sugarhaus`), then
extended into a production site with a public request flow and private admin.

The historical planning notes below describe the original Gamma brief. The current
repository is the source of truth for shipped behavior.

## Structure mapping

Sugar Haus ships these public pages (`sugarhaus/public/`):
`index · about · gallery · pricing · reviews · contact · order`

| Sugar Haus | Oh! You Fancy Focaccia | Note |
|---|---|---|
| `index.html` — hero → How to Order (4 steps) → What We Create (6 tiles) → CTA | **Home** — hero → Where to Find Us (4) → What We Bake (6) → Local partners → CTA | Current site also links directly into the request flow |
| `about.html` — Welcome → Baking Philosophy (6) → Kitchen to Celebration → CTA | **About** — Welcome → Our Baking Philosophy (6) → From Our Kitchen to Your Table → CTA | Same skeleton |
| `pricing.html` — Price List by category | **Our Breads** — menu by category with standing prices | Prices are shared with the order database through the root `menu.json` catalog |
| `gallery.html` | **Gallery** | |
| `reviews.html` — reviews + submit form | **Reviews** — real reviews plus a submission form | Submissions are moderated through the admin workflow |
| `contact.html` — contact → message form → FAQ | **Contact** — email/Facebook → market details → FAQ | Form replaced with a plain email prompt |
| `order.html` | **Order** — request form with availability, delivery, and shipping choices | A request is confirmed by Amanda before it becomes final |

## Theme

Gamma theme **`cornfield`** — olive green, mustard, sand beige, cream, parchment;
vintage / classic / organic. Chosen to match the logo's cream parchment ground and
olive accents. The logo's deep burgundy comes through in imagery and headings rather
than the theme palette.

Image direction given to Gamma: overhead editorial food photography on white Carrara
marble, soft natural daylight, blistered golden crust, flaky sea salt and fresh herbs,
cream / olive-green / burgundy palette — matching the client's own product photos.

## Current implementation status

- Standing menu prices live in `menu.json` and are used by both the public menu and
  database seed/backfill logic.
- Public requests, email outbox delivery, admin order management, review moderation,
  readiness checks, generated sitemap/robots files, and operational smoke/backup
  scripts are implemented.
- Dates shown in customer-facing site copy and admin views use month-day-year format.

## Content rules applied

Every factual claim traces to `facebook-research.md`. Specifically **not** invented:

- Prices are shown only for the standing catalog; custom and seasonal requests are
  confirmed individually.
- No phone number
- No street address presented as a storefront — the site says plainly "Not yet" to
  *Do you have a storefront?* and points at the market
- No opening hours beyond "Wednesdays & Saturdays, 9am 'til sold out"
- No Instagram handle (still unknown — see open questions)
- Reviews reproduced verbatim; no invented reviewers, ratings, or dates

## Client handoff confirmations

Blocked on Amanda (full list in `facebook-research.md`):

1. Confirm the market address/name and current/winter schedule
2. Confirm delivery area, shipping destinations, cost, and lead time
3. Confirm allergen language and whether "organic" is legally accurate
4. Confirm the public contact/social details and final policy copy
5. Verify Resend, Cloudflare forwarding, Railway variables, and one controlled
   production order end to end
6. Replace remaining placeholder/illustrative art with approved product, portrait,
   market-stall, and location photography where desired

## Built sites

Two versions exist. The burgundy one is current.

### v2 — Wine (current)

Gamma project: https://gamma.app/docs/ylw3afpzf13ni90

| Page | Link |
|---|---|
| Home | https://gamma.app/docs/ylw3afpzf13ni90 |
| About | https://gamma.app/docs/ekcmflpp20yzluh |
| Our Breads | https://gamma.app/docs/82z69wo0icx0u7i |
| Gallery | https://gamma.app/docs/mye6ijqfba91y3w |
| Reviews | https://gamma.app/docs/9hdghh7ewkzfkiu |
| Contact | https://gamma.app/docs/xxundg2qfpaj20j |

Theme `wine` resolved to: burgundy page ground (`#421424`), burgundy cards
(`#5C2438`), **peach/salmon headings (`#FFB393`)** and pale peach body text
(`#F4CAB8`), Brygada 1918 headings over **Montserrat** body.

Art direction was reversed for the dark ground — chiaroscuro Italian still life on
aged walnut and terracotta with cream linen and olive branches, rather than v1's
bright white marble, which would have clashed.

**Known gap against the logo.** The burgundy ground is right, but the theme's peach
type is not the logo's cream, the Montserrat body font fights the vintage-label
feel, and there is no olive green anywhere. Theme colors and fonts are not settable
through the Gamma API — only the theme choice is — so these four edits have to be
made by hand in the Gamma editor (free):

1. Heading color `#FFB393` → cream `#F6EBD4`
2. Body color `#F4CAB8` → same cream
3. Body font Montserrat → Brygada 1918 (matches the headings)
4. Accent → olive green `#626C3B`

Gamma credits: v1 cost 147, v2 cost 135. **48 remaining** — not enough for another
full six-page rebuild (~135), so further changes are editor-side until credits are
topped up.

### v1 — Cornfield

Gamma project: https://gamma.app/docs/6tbw727dyqwduw4

| Page | Link |
|---|---|
| Home | https://gamma.app/docs/6tbw727dyqwduw4 |
| About | https://gamma.app/docs/1ez900palxvrl93 |
| Our Breads | https://gamma.app/docs/60ra33utj91nu0r |
| Gallery | https://gamma.app/docs/nxbm8m84fpobfu9 |
| Reviews | https://gamma.app/docs/zfuizz6aduazdw8 |
| Contact | https://gamma.app/docs/w4bumgv83qtrvcp |

Theme resolved to: cream parchment cards (`#F6EBD4`), dark brown type (`#403011`),
olive green primary (`#626C3B`) on a goldenrod page ground (`#F1C064`), set in
Brygada 1918 (serif). Close to the logo on parchment and olive; the logo's deep
burgundy is not in the theme palette and would need setting by hand in the Gamma
editor if it should carry through.
