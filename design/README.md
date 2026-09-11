# Design canvas — Oh! You Fancy Focaccia

Claude Design canvas: https://claude.ai/code/artifact/5d1189ca-a7c9-44df-8bb8-09626aadff5d

Nine artboards — **Loading screen** (desktop + phone), Home (desktop + phone),
About, Bill of Fare, Gallery, Reviews, Contact.

## Files

| Path | What it is |
|---|---|
| `_build.py` | Generates every artboard from one shared token system. **Edit this, not the `.dc.html` files** — they are output and get overwritten. |
| `*.dc.html` | Generated artboards, one per page |
| `canvas.json` | Canvas layout, artboard positions, sticky notes |
| `oh-you-fancy-focaccia.html` | The seeded canvas that was published |

Rebuild with `python3 _build.py`, then re-seed and republish to the same URL.

## Palette — taken from the logo

| Token | Hex | Use |
|---|---|---|
| `--burgundy` | `#8E1B1B` | Primary. Headings, buttons, rules, quote band |
| `--burgundy-deep` | `#5C0F0F` | Footer ground |
| `--olive` | `#4E6023` | Secondary. Ornaments, tags, "Pane · Amore · Sempre" |
| `--gold` | `#C08A2E` | Numerals, small accents |
| `--bg` | `#F5EDD8` | Parchment page ground |
| `--surface` | `#FBF5E6` | Cards |
| `--offset` | `#EFE4C8` | Alternating section bands |
| `--text` | `#3B1A14` | Body copy, deep espresso with a red undertone |

Type: **Bodoni Moda** (display — the Italian didone, matching the logo's high-contrast
FOCACCIA lettering), **EB Garamond** (body), **Italianno** (the "Oh! You Fancy" flourish).

## Its own identity — where it departs from Sugar Haus

Sugar Haus is the quality bar, not the template. Deliberate divergences:

| | Sugar Haus | Oh! You Fancy Focaccia |
|---|---|---|
| Type | Playfair Display / Lora / Work Sans | Bodoni Moda / EB Garamond / Italianno |
| Masthead | Left logo, right nav bar | Centred label masthead, nav on a rule beneath |
| Cards | Rounded surfaces, soft shadow | Square `.plate` with a hairline inset frame |
| Menu | Priced product cards | Bill of fare with dotted leaders and roman numerals |
| Section mark | Eyebrow with flanking rules | Dimple rule — the focaccia motif |
| Edges | — | Vertical spine rails with rotated letterspaced type |
| Shape | Rounded rectangles | Oval cartouches echoing the logo's ring |
| Dark band | — | Enamel market sign, double-ruled |
| Loading | Typewriter terminal | Ingredients proving while dimples press in |

What was taken is the *standard*: staged reveal on load, a considered type ramp,
motion that is orchestrated rather than scattered, and copy written for this business
rather than filled in.

## Loading screen

`Loader.dc.html` / `LoaderPhone.dc.html` — animates live on a 9-second loop.

1. The ring strokes itself on (`stroke-dashoffset`), like a stamp pressed into a label
2. The wordmark rises
3. The five things focaccia is made of arrive in turn — **Farina, Acqua, Olio d'Oliva,
   Sale, Tempo** — each with its English gloss
4. A dimple presses into the dough for each one. That row of dimples *is* the progress bar
5. `Pane · Amore · Sempre` settles, then **Entra**

Honours `prefers-reduced-motion`: animation is disabled and the resolved state shown.

## Deliberate gaps

Marked in brackets on the artboards, not invented:

- `[PRICES TO BE SUPPLIED]` — Our Breads
- `[PHONE NUMBER — if you want one public]` — Contact

Every tan panel is a photo slot. Replace with Amanda's real photography before the
site goes live.
