# Building the site

`public/` is **generated output, committed on purpose.** Railway only runs
`npm start`, so nothing needs Python at build time and a deploy cannot fail on
a missing interpreter.

To change the site, edit the design source and regenerate:

```bash
python3 site/build_site.py   # or: npm run build
npm test
```

## How it fits together

| | |
|---|---|
| `design/_build.py` | The single source of content and design tokens. Also emits the `.dc.html` canvas artboards |
| `site/build_site.py` | Turns that same content into servable pages: real hrefs, real image paths, responsive rules, head metadata, and a loading screen that runs once |
| `public/` | The generated site Railway serves |
| `server.js` | Express, static files, CSP, compression, `/healthz` |

Editing `public/` directly will be overwritten on the next build.

## Two things the canvas does that a web server cannot

1. **Bare image filenames.** Artboards write `src="hero-garden.webp"` and the
   canvas runtime resolves it from the document's own file table. The builder
   rewrites these to `./img/…`.
2. **A looping loading screen.** The canvas version loops forever so it can be
   seen on an artboard. The site version runs once, is skippable by click or
   keypress, self-dismisses after 11s so nobody is ever trapped, and sets a
   `sessionStorage` flag so it does not replay as you move between pages.
