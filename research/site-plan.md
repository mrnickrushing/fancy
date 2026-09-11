# Site plan — Oh! You Fancy Focaccia

Built in Gamma, structured after **Sugar Haus** (`mrnickrushing/sugarhaus`), with the
ordering flow removed at the client's request.

## Structure mapping

Sugar Haus ships these public pages (`sugarhaus/public/`):
`index · about · gallery · pricing · reviews · contact · order`

| Sugar Haus | Oh! You Fancy Focaccia | Note |
|---|---|---|
| `index.html` — hero → How to Order (4 steps) → What We Create (6 tiles) → CTA | **Home** — hero → Where to Find Us (4) → What We Bake (6) → Local partners → CTA | "How to Order" became "Where to Find Us" since there's no ordering |
| `about.html` — Welcome → Baking Philosophy (6) → Kitchen to Celebration → CTA | **About** — Welcome → Our Baking Philosophy (6) → From Our Kitchen to Your Table → CTA | Same skeleton |
| `pricing.html` — Price List by category | **Our Breads** — menu by category, **no prices** | No price data exists publicly; nothing was invented. Add prices once Amanda supplies them |
| `gallery.html` | **Gallery** | |
| `reviews.html` — reviews + submit form | **Reviews** — real reviews only, no submit form | Submission form omitted with ordering |
| `contact.html` — contact → message form → FAQ | **Contact** — email/Facebook → market details → FAQ | Form replaced with a plain email prompt |
| `order.html` | *(omitted)* | Per client instruction |

## Theme

Gamma theme **`cornfield`** — olive green, mustard, sand beige, cream, parchment;
vintage / classic / organic. Chosen to match the logo's cream parchment ground and
olive accents. The logo's deep burgundy comes through in imagery and headings rather
than the theme palette.

Image direction given to Gamma: overhead editorial food photography on white Carrara
marble, soft natural daylight, blistered golden crust, flaky sea salt and fresh herbs,
cream / olive-green / burgundy palette — matching the client's own product photos.

## Content rules applied

Every factual claim traces to `facebook-research.md`. Specifically **not** invented:

- No prices anywhere
- No phone number
- No street address presented as a storefront — the site says plainly "Not yet" to
  *Do you have a storefront?* and points at the market
- No opening hours beyond "Wednesdays & Saturdays, 9am 'til sold out"
- No Instagram handle (still unknown — see open questions)
- Reviews reproduced verbatim; no invented reviewers, ratings, or dates

## Still to do

Blocked on Amanda (full list in `facebook-research.md`):

1. Prices → populate the Our Breads page
2. Confirm which market and the winter schedule
3. Phone number, if she wants one public
4. Instagram handle
5. Shipping cost, destinations, lead time
6. Delivery area
7. Real product photography to replace Gamma's AI images
8. Confirm the "organic" wording is legally accurate for her
