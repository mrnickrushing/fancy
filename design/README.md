# Design canvas — Oh! You Fancy Focaccia

Claude Design canvas: https://claude.ai/code/artifact/5d1189ca-a7c9-44df-8bb8-09626aadff5d

Seven artboards — Home, Home (mobile), About, Our Breads, Gallery, Reviews, Contact.

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

Type: **Playfair Display** (display + letterspaced micro-labels), **Lora** (body),
**Pinyon Script** (the "Oh! You Fancy" wordmark only).

## What came from Sugar Haus

Structure and system values were lifted from `mrnickrushing/sugarhaus`
(`public/style.css`, `public/base.css`) rather than invented:

- Spacing scale, `0.375 / 0.625 / 1 / 1.5rem` radii, `cubic-bezier(.16,1,.3,1)` easing
- Warm `oklch` shadow ramp, 1200px content width
- The eyebrow label with flanking hairlines, card lift on hover, page-hero radial glow,
  sticky blurred header, full-width ribbon banner, pill tags
- Page anatomy: hero → four-step block → six category cards → proof → CTA → footer

Its rose/sage/chocolate palette was replaced with the logo's burgundy/olive/gold, and
the ordering flow was dropped per the client.

## Deliberate gaps

Marked in brackets on the artboards, not invented:

- `[PRICES TO BE SUPPLIED]` — Our Breads
- `[PHONE NUMBER — if you want one public]` — Contact

Every tan panel is a photo slot. Replace with Amanda's real photography before the
site goes live.
