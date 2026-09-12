# -*- coding: utf-8 -*-
"""Oh! You Fancy Focaccia — design canvas generator.

Identity notes (deliberately NOT Sugar Haus):
  type    Bodoni Moda (the Italian didone) + EB Garamond + Italianno,
          against Sugar Haus's Playfair/Lora/Work Sans.
  anatomy centred label masthead, oval cartouches, an enamel market sign,
          a bill of fare with leader dots, a dimple motif — against
          Sugar Haus's left-logo navbar and centred card grids.
  loader  the ingredient list proves itself (Farina, Acqua, Olio, Sale,
          Tempo) while dimples press into the dough — against Sugar
          Haus's typewriter terminal.
"""
import os, json, html, re
OUT = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(os.path.dirname(OUT), "menu.json"), encoding="utf-8") as _fh:
    MENU_CATALOG = json.load(_fh)
CATALOG_PRICES = {item["name"]: item["price"] for item in MENU_CATALOG}
ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV",
         "XVI","XVII","XVIII","XIX","XX","XXI","XXII","XXIII","XXIV","XXV","XXVI","XXVII",
         "XXVIII","XXIX","XXX","XXXI","XXXII","XXXIII","XXXIV","XXXV"]

def fare(n, title, desc, price=True, extra=""):
    label = html.unescape(re.sub(r"<[^>]+>", "", title))
    price = CATALOG_PRICES.get(label) if price else None
    price_html = f'<span class="fare-price">${price:g}</span>' if price is not None else ''
    return f"""<div class="fare"{extra}><span class="fare-n">{n}</span><div class="fare-b">
      <p class="fare-t"><span>{title}</span>{price_html}</p><p class="fare-d">{desc}</p></div></div>"""


FONTS = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
         # Nothing in the stylesheet asks for a weight above 700, and italic
         # Bodoni is only ever set at 500, so the axes are cut to what is
         # actually drawn instead of shipping the whole range.
         'family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..500'
         # Asking for named instances makes Google serve a whole separate
         # font file per weight — five files, 223KB of latin. A variable
         # range covering the same weights is two files, 90KB.
         '&amp;family=EB+Garamond:ital,wght@0,400..600;1,400..500'
         '&amp;family=Italianno&amp;display=swap">')

TOKENS = """
:root{
  --xs:.78rem; --sm:.94rem; --base:1.08rem; --lg:1.35rem;
  --xl:2.1rem; --xxl:3.2rem; --xxxl:4.6rem;
  --s1:.25rem;--s2:.5rem;--s3:.75rem;--s4:1rem;--s5:1.25rem;--s6:1.5rem;
  --s8:2rem;--s10:2.5rem;--s12:3rem;--s16:4rem;--s20:5rem;--s24:6rem;--s32:8rem;

  --burgundy:#8E1B1B; --burgundy-mid:#71 1616; --burgundy-deep:#4A0E0E;
  --burgundy-ink:#2A0B0B;
  --olive:#4E6023; --olive-deep:#33401A; --olive-pale:#E4E7D0;
  --gold:#B8862F; --gold-pale:#EFE0BE;
  /* --gold is an ornament colour: at 2.9:1 on paper it must never carry
     text you are meant to read. --gold-read is the same hue at 4.9:1. */
  --gold-read:#8A6420;
  --paper:#F4EFE2; --paper-2:#FBF8EF; --paper-3:#EAE1CB; --paper-4:#DED2B4;
  --rule:#CBBB97; --rule-soft:#DED2B4;
  --ink:#33190F; --ink-soft:#6E4staging;
  --crust:#C98A45;

  --r-sm:2px; --r-md:3px; --r-lg:4px; --r-oval:50%;
  --ease:cubic-bezier(.19,1,.22,1);
  --sh-sm:0 1px 2px oklch(.25 .05 40/.10);
  --sh-md:0 6px 22px oklch(.25 .05 40/.13);
  --sh-lg:0 18px 52px oklch(.25 .05 40/.18);
  --wide:1240px; --mid:900px; --narrow:680px;
  --serif:'Bodoni Moda',Didot,'Bodoni MT',Georgia,serif;
  --body:'EB Garamond',Garamond,Georgia,serif;
  --script:'Italianno','Snell Roundhand',cursive;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:var(--body);
  -webkit-text-size-adjust:100%;text-size-adjust:100%;
  font-size:var(--base);line-height:1.72;-webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;font-feature-settings:"liga","kern"}
h1,h2,h3,h4{font-family:var(--serif);line-height:1.1;font-weight:600;text-wrap:balance}
p{text-wrap:pretty}
img,svg{display:block;max-width:100%}
a{color:var(--burgundy);text-decoration:none}
a:hover{color:var(--burgundy-deep)}
ul{list-style:none}

/* ── keyboard focus: one visible ring everywhere, never the UA default ── */
:focus-visible{outline:2px solid var(--burgundy);outline-offset:3px;border-radius:var(--r-sm)}
.btn-fill:focus-visible,.enamel :focus-visible,
footer :focus-visible,.splash :focus-visible{outline-color:var(--gold-pale)}

/* visually hidden, still read aloud */
.vh{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;
  overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}

/* laid-paper grain, warmer and finer than a flat fill */
.grain{position:relative}
.grain::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:.55;
  background-image:radial-gradient(oklch(.42 .07 45/.05) .5px,transparent .5px),
    repeating-linear-gradient(93deg,oklch(.42 .07 45/.022) 0 1px,transparent 1px 4px);
  background-size:3px 3px,auto}

.wrap{max-width:var(--wide);margin:0 auto;padding-inline:var(--s10)}
.mid{max-width:var(--mid);margin:0 auto;padding-inline:var(--s10)}
.narrow{max-width:var(--narrow);margin:0 auto;padding-inline:var(--s8)}

/* ── small caps label, the house voice ── */
.caps{font-family:var(--serif);font-size:var(--xs);font-weight:600;
  letter-spacing:.34em;text-transform:uppercase}

/* ── vertical spine rail (label-edge motif) ── */
.spine{position:absolute;top:0;bottom:0;width:52px;display:flex;
  align-items:center;justify-content:center}
.spine[aria-hidden="true"]{pointer-events:none}
.spine span{writing-mode:vertical-rl;font-family:var(--serif);font-size:.68rem;
  font-weight:600;letter-spacing:.44em;text-transform:uppercase;
  color:var(--burgundy);opacity:.42}
.spine-l{left:0}
.spine-r{right:0;transform:rotate(180deg)}

/* ── oval cartouche, echoing the logo's ring ── */
.oval{border-radius:50%/50%;border:2px solid var(--burgundy);position:relative}
.oval::before{content:'';position:absolute;inset:7px;border:1px solid var(--burgundy);
  opacity:.45;border-radius:50%/50%;pointer-events:none}

/* ── buttons ── */
.btn{display:inline-flex;align-items:center;justify-content:center;
  min-height:52px;padding:.9rem 2.3rem;font-family:var(--serif);font-size:var(--xs);
  font-weight:600;letter-spacing:.28em;text-transform:uppercase;
  border-radius:var(--r-sm);transition:all 280ms var(--ease);cursor:pointer}
.btn-fill{background:var(--burgundy);color:var(--paper-2);border:1px solid var(--burgundy)}
.btn-fill:hover{background:var(--burgundy-deep);border-color:var(--burgundy-deep);
  color:var(--paper-2);letter-spacing:.32em}
.btn-line{background:transparent;color:var(--burgundy);border:1px solid var(--burgundy)}
.btn-line:hover{background:var(--burgundy);color:var(--paper-2);letter-spacing:.32em}
.btn-pale{background:transparent;color:var(--gold-pale);border:1px solid oklch(.85 .07 80/.5)}
.btn-pale:hover{background:var(--gold-pale);color:var(--burgundy-ink);letter-spacing:.32em}

/* ══ masthead ══════════════════════════════════════════════════════
   The header shrinks to a slim bar once you start reading. Nothing here
   is an inline style, so the responsive sheet can restyle it by class. */
.mast{background:var(--paper);border-bottom:1px solid var(--rule);
  padding-block:var(--s6) 0;position:sticky;top:0;z-index:50}
.mast-in{text-align:center}
.brand-row{display:flex;align-items:center;justify-content:center;gap:var(--s6);
  position:relative}
.brand-mark{width:68px;height:68px;border-radius:50%;flex-shrink:0;
  transition:width 260ms var(--ease),height 260ms var(--ease)}
.brand-word{display:block}
.brand-script{font-family:var(--script);font-size:3.7rem;line-height:.8;
  color:var(--burgundy);transition:font-size 260ms var(--ease)}
.brand-caps{font-family:var(--serif);font-size:1.52rem;font-weight:700;
  letter-spacing:.4em;text-transform:uppercase;color:var(--ink);
  margin-top:.36rem;padding-left:.4em;transition:font-size 260ms var(--ease)}

.nav-rail{display:flex;justify-content:center;flex-wrap:wrap;gap:var(--s8);
  margin-top:var(--s6);border-top:1px solid var(--rule-soft)}
.nav-link{color:var(--ink);opacity:.72;padding-block:.75rem;
  border-bottom:1px solid transparent;transition:opacity 200ms var(--ease)}
.nav-link:hover{opacity:1;color:var(--burgundy)}
.nav-link.is-current{color:var(--burgundy);opacity:1;border-bottom-color:var(--burgundy)}

/* the slim bar: brand and links on one row, ~64px instead of ~185px */
.mast.is-shrunk{padding-block:0}
.mast.is-shrunk .mast-in{display:flex;align-items:center;justify-content:space-between;
  gap:var(--s8);max-width:var(--wide);margin-inline:auto;padding:var(--s2) var(--s10);
  text-align:left}
.mast.is-shrunk .brand-row{gap:var(--s4)}
.mast.is-shrunk .brand-row > svg{display:none}
.mast.is-shrunk .brand-mark{width:40px;height:40px}
.mast.is-shrunk .brand-script{font-size:1.95rem}
.mast.is-shrunk .brand-caps{font-size:.66rem;letter-spacing:.28em;margin-top:.1rem}
.mast.is-shrunk .nav-rail{margin-top:0;border-top:0;gap:var(--s6);flex-wrap:nowrap}
.mast.is-shrunk .nav-link{padding-block:1.15rem;font-size:.72rem;letter-spacing:.24em}

/* the hamburger: only ever visible where the rail cannot fit */
.nav-toggle{display:none;width:44px;height:44px;align-items:center;justify-content:center;
  background:none;border:1px solid var(--rule);border-radius:var(--r-sm);
  color:var(--burgundy);cursor:pointer;flex-shrink:0}
.nav-bars{display:block;width:20px}
.nav-bars i{display:block;height:1.5px;background:currentColor;border-radius:1px;
  transition:transform 240ms var(--ease),opacity 200ms var(--ease)}
.nav-bars i + i{margin-top:5px}
.nav-toggle[aria-expanded="true"] .nav-bars i:nth-child(1){transform:translateY(6.5px) rotate(45deg)}
.nav-toggle[aria-expanded="true"] .nav-bars i:nth-child(2){opacity:0}
.nav-toggle[aria-expanded="true"] .nav-bars i:nth-child(3){transform:translateY(-6.5px) rotate(-45deg)}

.nav-drawer{display:none;background:var(--paper);border-top:1px solid var(--rule-soft)}
.drawer-nav{display:grid;grid-template-columns:1fr}
.drawer-link{display:flex;align-items:center;min-height:52px;padding-inline:var(--s6);
  color:var(--ink);opacity:.8;border-bottom:1px solid var(--rule-soft)}
.drawer-link.is-current{color:var(--burgundy);opacity:1;
  box-shadow:inset 3px 0 0 var(--burgundy);background:var(--paper-2)}
.drawer-link.is-order{color:var(--burgundy);opacity:1;font-weight:700;
  background:var(--gold-pale)}
.drawer-link.is-order::after{content:'\\2192';margin-left:auto;font-size:1rem}

/* ── section furniture ── */
.sec{padding-block:var(--s24);position:relative}
.kicker{display:flex;align-items:center;gap:var(--s4);justify-content:center;
  color:var(--burgundy);margin-bottom:var(--s5)}
.kicker::before,.kicker::after{content:'';display:block;height:1px;width:54px;
  background:currentColor;opacity:.4}
.kicker-l{justify-content:flex-start}
.kicker-l::before{display:none}
.h-sec{font-size:var(--xl);text-align:center;margin-bottom:var(--s5)}
.lede{font-size:var(--lg);color:var(--ink);opacity:.72;max-width:52ch;margin:0 auto;
  text-align:center;line-height:1.62;font-style:italic}

/* ── dimple rule: the focaccia motif as a divider ── */
.dimples{display:flex;justify-content:center;align-items:center;gap:11px;
  margin-block:var(--s10)}
.dimples i{display:block;width:7px;height:7px;border-radius:50%;
  background:var(--burgundy);opacity:.3}
.dimples i:nth-child(4){width:11px;height:11px;opacity:.62;background:var(--gold)}

/* ── bill of fare ── */
.fare{display:flex;align-items:baseline;gap:var(--s4);padding-block:var(--s5);
  border-bottom:1px solid var(--rule-soft)}
.fare-n{font-family:var(--serif);font-size:var(--sm);color:var(--gold-read);
  font-weight:600;width:var(--fare-n,34px);flex-shrink:0;letter-spacing:.1em;
  white-space:nowrap}
/* The bill of fare runs to XXXIV now. 34px fits about as far as XII, and
   past that the numerals ran straight into the titles beside them, so the
   courses get a column wide enough for the longest. In em, so it tracks
   whatever face is actually serving rather than a pixel guess made against
   the fallback. The home page board stops at V and keeps the narrow one. */
.course{--fare-n:4.4em}
.fare-b{flex-grow:1}
.fare-t{font-family:var(--serif);font-size:var(--lg);font-weight:600;
  display:flex;align-items:baseline;gap:var(--s3)}
.fare-t::after{content:'';flex-grow:1;border-bottom:1.5px dotted var(--rule);
  transform:translateY(-4px)}
.fare-price{font-size:.78em;white-space:nowrap;color:var(--burgundy);font-weight:700}
/* the description is read, not decorated: roman, a size up, and lifted
   out of the low-contrast range italic at .72 opacity put it in */
.fare-d{font-size:1rem;opacity:.82;max-width:70ch;margin-top:var(--s2);
  line-height:1.6}

/* ── enamel market sign ── */
.enamel-lead{font-family:var(--serif);font-size:3.1rem;font-weight:600;
  line-height:1.18;color:#F6E6C6}
.enamel{background:var(--burgundy);color:var(--gold-pale);
  border-block:6px double oklch(.85 .07 80/.42);padding-block:var(--s12);
  text-align:center;position:relative;overflow:hidden}
.enamel::before{content:'';position:absolute;inset:0;opacity:.09;
  background-image:radial-gradient(#fff .7px,transparent .7px);background-size:5px 5px}

/* ── plate: framed card with a hairline inset, not a rounded box ── */
.plate{background:var(--paper-2);border:1px solid var(--rule);padding:var(--s8);
  position:relative;transition:transform 320ms var(--ease),box-shadow 320ms var(--ease)}
.plate::before{content:'';position:absolute;inset:6px;border:1px solid var(--rule);
  opacity:.4;pointer-events:none}
.plate:hover{transform:translateY(-5px);box-shadow:var(--sh-lg)}
.plate h3{font-size:var(--lg);margin-bottom:var(--s3)}
.plate p{font-size:var(--sm);opacity:.76;line-height:1.74}
.grid{display:grid;gap:var(--s6)}
.g2{grid-template-columns:repeat(2,minmax(0,1fr))}
.g3{grid-template-columns:repeat(3,minmax(0,1fr))}
.g4{grid-template-columns:repeat(4,minmax(0,1fr))}

/* roman numeral */
.roman{font-family:var(--serif);font-size:2.6rem;font-weight:400;color:var(--gold);
  line-height:1;margin-bottom:var(--s4);font-style:italic}

/* real photography, framed like a plate */
.shot{position:relative;overflow:hidden;border:1px solid var(--rule);
  background:var(--paper-3);margin:0}
.shot img{width:100%;height:100%;object-fit:cover;display:block}
.shot::after{content:'';position:absolute;inset:8px;
  border:1px solid oklch(1 0 0/.34);pointer-events:none}
.shot-oval{border-radius:50%/50%;border:2px solid var(--burgundy);
  box-shadow:var(--sh-lg)}
.shot-oval::after{inset:9px;border:1px solid oklch(1 0 0/.42);border-radius:50%/50%}

/* placeholder slot — only where no photograph exists yet */
.slot{position:relative;background:linear-gradient(152deg,#EDE2C6,#E3D4B0 52%,#D8C69C);
  border:1px solid var(--rule);overflow:hidden;display:flex;
  align-items:center;justify-content:center}
.slot::before{content:'';position:absolute;inset:9px;border:1px solid oklch(.42 .07 45/.2);
  pointer-events:none}
.slot-cap{position:absolute;bottom:15px;left:0;right:0;text-align:center;
  font-family:var(--serif);font-size:.64rem;font-weight:600;letter-spacing:.26em;
  text-transform:uppercase;color:oklch(.40 .05 45/.6)}

/* ══ hero ═════════════════════════════════════════════════════════ */
.hero{position:relative;background:var(--paper);padding-block:var(--s20);overflow:hidden}
.hero-grid{position:relative;display:grid;grid-template-columns:1.05fr .95fr;
  gap:var(--s16);align-items:center}
.hero-h{font-size:var(--xxxl);font-weight:700;line-height:1.02;margin-bottom:var(--s5)}
.hero-lede{font-size:var(--lg);opacity:.78;max-width:40ch;margin-bottom:var(--s8);
  line-height:1.58}
/* both calls to action on one line, and the order one first — stacked
   buttons pushed the second below the fold on a 900px-tall laptop */
.hero-cta{display:flex;gap:var(--s4);flex-wrap:wrap}
.hero-cta .btn{flex:0 1 auto;min-width:14rem;padding-inline:var(--s6)}
.hero-shot{position:relative;display:flex;justify-content:center}
.hero-rule{position:absolute;bottom:-16px;left:50%;transform:translateX(-50%)}
@media (min-width:641px){.hero-cta{flex-wrap:nowrap}}

/* ══ gallery ═══════════════════════════════════════════════════════ */
.gal-course{margin-bottom:var(--s16)}
.gal-head{display:flex;align-items:baseline;gap:var(--s5);margin-bottom:var(--s8);
  border-bottom:1px solid var(--rule);padding-bottom:var(--s4);flex-wrap:wrap}
.gal-title{font-size:var(--lg);text-align:left}
.gal-fill{flex-grow:1}
.gal-count{opacity:.72;font-size:.66rem;color:var(--ink)}
.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));
  gap:var(--s8) var(--s6)}
.gal-item{display:flex;flex-direction:column;min-width:0}
.gal-wide{grid-column:span 2}
.gal-open{display:block;width:100%;padding:0;border:0;background:none;cursor:zoom-in}
.gal-shot{display:block;aspect-ratio:4/5}
.gal-wide .gal-shot{aspect-ratio:8/5}
.gal-shot img{transition:transform 620ms var(--ease)}
.gal-open:hover .gal-shot img{transform:scale(1.035)}
.gal-cap{padding-top:var(--s4);border-top:1px solid var(--rule-soft);margin-top:var(--s3)}
.gal-name{font-size:.72rem;color:var(--ink)}
.gal-note{font-size:var(--sm);opacity:.82;margin-top:var(--s1);line-height:1.55}
@media (max-width:640px){.gal-wide{grid-column:span 1}}

/* ══ bill of fare courses ══════════════════════════════════════ */
.course{margin-bottom:var(--s20)}
.course-grid{display:grid;grid-template-columns:1fr;gap:var(--s12);align-items:start}
.course-grid.has-aside{grid-template-columns:1fr 300px}
@media (max-width:900px){.course-grid.has-aside{grid-template-columns:1fr}}

/* ══ contact: real directions in place of the map placeholder ════════ */
.directions{font-style:normal;margin-top:var(--s8);padding-top:var(--s6);
  border-top:1px solid var(--rule);text-align:center}
.dir-line{font-size:var(--sm);opacity:.86;line-height:1.7}
.dir-link{font-size:.7rem;border-bottom:1px solid currentColor;padding-bottom:2px}

/* ══ three voices on the home page, not one ═════════════════════════ */
.home-quotes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
  gap:var(--s6);margin-top:var(--s12)}
.hq{background:var(--paper-2);border:1px solid var(--rule);padding:var(--s6);
  border-top:3px solid var(--burgundy)}
.hq p{font-family:var(--serif);font-size:1.06rem;font-style:italic;line-height:1.55}
.hq cite{display:block;margin-top:var(--s4);color:var(--burgundy);font-style:normal;
  font-size:.66rem}
@media (max-width:820px){.home-quotes{grid-template-columns:1fr;gap:var(--s4)}}

/* ══ footer ═══════════════════════════════════════════════════════ */
.ftr-cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--s12);
  border-top:1px solid oklch(1 0 0/.13);padding-top:var(--s12)}
.ftr-bot{border-top:1px solid oklch(1 0 0/.13);margin-top:var(--s12);padding-top:var(--s6);
  display:flex;justify-content:space-between;gap:var(--s6)}
/* ══ two-column compositions ══════════════════════════════════════ */
.duo{display:grid;gap:var(--s16)}
.duo-a{grid-template-columns:1.15fr .85fr}
.duo-top{align-items:start}
.duo-b{grid-template-columns:.9fr 1.1fr;align-items:center}
.duo-c{grid-template-columns:1fr 1fr;align-items:start}

.ftr-script{font-family:var(--script);font-size:2.9rem;line-height:.8;color:#EBD3AE}
.ftr-caps{font-family:var(--serif);font-size:1.05rem;font-weight:700;letter-spacing:.36em;
  text-transform:uppercase;color:#D8BFA0;margin-top:.4rem;padding-left:.36em}

/* ══ lightbox ═════════════════════════════════════════════════════ */
/* The dialog fills the viewport and stays transparent; the plate itself is
   the panel inside it. Centring a <dialog> by its own box fights the UA
   margin rules the moment the content is taller than max-height. */
.lb{width:100%;max-width:100%;height:100%;max-height:100%;inset:0;margin:0;
  border:0;padding:0;background:none;overflow:hidden}
.lb::backdrop{background:oklch(.14 .04 30/.86)}
/* the dim lives on the stage as well as on ::backdrop, so it is painted
   even where the backdrop pseudo-element is not honoured */
.lb-stage{display:grid;place-items:center;width:100%;height:100%;padding:var(--s10);
  background:oklch(.14 .04 30/.86)}
.lb-panel{position:relative;width:min(1040px,100%);background:var(--paper-2);
  box-shadow:var(--sh-lg);max-height:100%;display:flex;flex-direction:column}
.lb-fig{display:flex;flex-direction:column;min-height:0}
.lb-fig img{display:block;width:100%;min-height:0;max-height:70vh;object-fit:contain;
  background:var(--burgundy-ink)}
.lb-cap{padding:var(--s5) var(--s6);border-top:1px solid var(--rule);text-align:left;
  display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:var(--s8)}
.lb-cap > .caps{grid-column:1;grid-row:1}
.lb-note{font-size:var(--sm);opacity:.82;margin-top:var(--s1);grid-column:1;grid-row:2}
/* the point of the gallery: you can order the thing you are looking at */
.lb-order{grid-column:2;grid-row:1 / 3;white-space:nowrap;align-self:center}
.lb-close,.lb-nav{position:absolute;z-index:2;display:flex;align-items:center;
  justify-content:center;width:44px;height:44px;background:var(--paper-2);
  border:1px solid var(--rule);border-radius:50%;font-family:var(--serif);
  font-size:1.4rem;line-height:1;color:var(--burgundy);cursor:pointer;
  box-shadow:var(--sh-md)}
.lb-close{top:-16px;right:-16px;font-size:1.5rem}
.lb-nav{top:50%;transform:translateY(-50%)}
.lb-prev{left:-16px}
.lb-next{right:-16px}
@media (max-width:720px){
  .lb-stage{padding:0}
  .lb-panel{width:100%;height:100%;justify-content:center}
  .lb-fig img{max-height:56vh}
  .lb-close{top:var(--s3);right:var(--s3)}
  .lb-prev{left:var(--s3)}
  .lb-next{right:var(--s3)}
  .lb-cap{grid-template-columns:1fr;row-gap:var(--s4);padding:var(--s4) var(--s5)}
  .lb-order{grid-column:1;grid-row:auto;width:100%;text-align:center}
}
"""
TOKENS = TOKENS.replace("#71 1616", "#711616").replace("--ink-soft:#6E4staging;", "--ink-soft:#6E4432;")

# ══ LOADER ════════════════════════════════════════════════════════════
# Sugar Haus types a terminal. This one proofs dough: the five things
# focaccia is made of arrive in turn while dimples press in as progress.
CYCLE = 9.0
INGREDIENTS = [("Farina","flour"),("Acqua","water"),("Olio d&#8217;Oliva","olive oil"),
               ("Sale","salt"),("Tempo","time")]

def _pct(t): return round(t / CYCLE * 100, 2)

_kf = []
for i in range(5):
    s = 1.6 + i * 0.8          # word arrives
    e = s + 0.8                # and hands over
    last = (i == 4)
    out = "100" if last else f"{_pct(e)}"
    tail = "" if last else f"{_pct(e)}%,100%{{opacity:0;transform:translateY(-7px)}}"
    _kf.append(f"@keyframes ing{i}{{0%,{_pct(s)}%{{opacity:0;transform:translateY(7px)}}"
               f"{_pct(s+0.22)}%,{_pct(e-0.12)}%{{opacity:1;transform:none}}{tail}}}")
for i in range(5):
    t = 1.8 + i * 0.8          # dimple presses in
    _kf.append(f"@keyframes dim{i}{{0%,{_pct(t)}%{{transform:scale(.4);opacity:.22;"
               f"background:transparent;box-shadow:inset 0 0 0 1px currentColor}}"
               f"{_pct(t+0.3)}%,100%{{transform:scale(1);opacity:1;background:currentColor;"
               f"box-shadow:inset 0 1px 2px oklch(0 0 0/.35)}}}}")
KEYFRAMES = "\n".join(_kf)

LOADER_CSS = f"""
.stage{{position:relative;min-height:900px;display:flex;align-items:center;
  justify-content:center;overflow:hidden;background:#240808}}
/* the courtyard photograph sits under a burgundy wash: present, never competing */
.scene{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 45%}}
.wash{{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,oklch(.40 .14 28/.50) 0%,oklch(.33 .13 28/.64) 46%,
    oklch(.22 .10 28/.86) 100%)}}
.stage::after{{content:'';position:absolute;inset:0;pointer-events:none;opacity:.4;
  background-image:radial-gradient(oklch(.9 .08 75/.10) .6px,transparent .6px);
  background-size:4px 4px}}
.vig{{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse 68% 60% at 50% 46%,transparent 40%,oklch(.12 .05 30/.62) 100%)}}
.corner{{position:absolute;opacity:.4}}
.c-tl{{top:42px;left:42px}} .c-tr{{top:42px;right:42px;transform:scaleX(-1)}}
.c-bl{{bottom:42px;left:42px;transform:scaleY(-1)}}
.c-br{{bottom:42px;right:42px;transform:scale(-1)}}
.frame{{position:absolute;inset:30px;border:1px solid oklch(.85 .07 80/.22);pointer-events:none}}
.frame::before{{content:'';position:absolute;inset:9px;
  border:1px solid oklch(.85 .07 80/.11)}}

.load-in{{position:relative;text-align:center;z-index:2;padding-inline:var(--s8)}}

/* ring strokes itself on, like a stamp pressed into the label */
.ring circle.draw,.ring path.draw{{stroke-dasharray:var(--len);stroke-dashoffset:var(--len);
  animation:draw {CYCLE}s var(--ease) infinite}}
@keyframes draw{{0%{{stroke-dashoffset:var(--len)}}
  {_pct(1.3)}%,100%{{stroke-dashoffset:0}}}}

.mark{{opacity:0;animation:mark {CYCLE}s var(--ease) infinite}}
@keyframes mark{{0%,{_pct(0.85)}%{{opacity:0;transform:translateY(9px)}}
  {_pct(1.7)}%,100%{{opacity:1;transform:none}}}}

.ing-rail{{position:relative;height:96px;margin-top:var(--s6)}}
.ing{{position:absolute;inset:0;opacity:0}}
{"".join(f'.ing:nth-child({i+1}){{animation:ing{i} {CYCLE}s var(--ease) infinite}}' for i in range(5))}
.ing-w{{font-family:var(--serif);font-size:2.5rem;font-weight:500;font-style:italic;
  color:#F2DFC0;line-height:1.15}}
.ing-g{{font-family:var(--serif);font-size:.66rem;font-weight:600;letter-spacing:.4em;
  text-transform:uppercase;color:oklch(.78 .08 70/.62);margin-top:var(--s2)}}

.dim-rail{{display:flex;justify-content:center;gap:16px;color:#D9A94E;margin-top:var(--s6)}}
.dim-rail i{{display:block;width:12px;height:12px;border-radius:50%}}
{"".join(f'.dim-rail i:nth-child({i+1}){{animation:dim{i} {CYCLE}s var(--ease) infinite;animation-fill-mode:both}}' for i in range(5))}

.tag-line{{opacity:0;animation:tagl {CYCLE}s var(--ease) infinite}}
@keyframes tagl{{0%,{_pct(5.8)}%{{opacity:0;transform:translateY(8px)}}
  {_pct(6.5)}%,100%{{opacity:1;transform:none}}}}
.enter{{opacity:0;animation:ent {CYCLE}s var(--ease) infinite}}
@keyframes ent{{0%,{_pct(6.4)}%{{opacity:0;transform:translateY(8px)}}
  {_pct(7.1)}%,100%{{opacity:1;transform:none}}}}
.skip{{position:absolute;bottom:46px;left:0;right:0;text-align:center;opacity:0;
  animation:ent {CYCLE}s var(--ease) infinite}}

@media (prefers-reduced-motion:reduce){{
  .ring circle.draw,.ring path.draw,.mark,.ing,.dim-rail i,.tag-line,.enter,.skip
    {{animation:none!important;opacity:1!important;stroke-dashoffset:0!important;
     transform:none!important}}
  .ing{{position:relative;display:none}} .ing:last-child{{display:block}}
  .dim-rail i{{background:currentColor}}
}}
{KEYFRAMES}
"""

CORNER = """<svg class="corner c-%s" width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
<path d="M6 54V14a8 8 0 018-8h40" fill="none" stroke="#D9A94E" stroke-width="1.2"/>
<path d="M6 62V14a14 14 0 0114-14h42" fill="none" stroke="#D9A94E" stroke-width=".6" opacity=".55"/>
<g fill="none" stroke="#8FA05E" stroke-width="1.15" stroke-linecap="round">
<path d="M20 20c14 0 26 4 36 11"/>
<path d="M28 20c-2-5 0-9 4-11 2 4 1 8-4 11z"/>
<path d="M40 24c-2-5 0-9 4-11 2 4 1 8-4 11z"/>
<path d="M34 24c3-4 8-4 11-1-3 3-8 4-11 1z"/></g>
<ellipse cx="58" cy="33" rx="3.6" ry="4.8" transform="rotate(30 58 33)" fill="#8FA05E"/>
<circle cx="6" cy="6" r="2.6" fill="#D9A94E" opacity=".8"/></svg>"""

def logo_badge(size=200, draw=True, src="logo.webp"):
    """The real label, with the gold ring stroking on around it."""
    ring = f'''<svg width="{size}" height="{size}" viewBox="0 0 200 200" aria-hidden="true"
  class="ring" style="position:absolute;inset:0">
<circle cx="100" cy="100" r="96"{' class="draw" style="--len:604"' if draw else ''}
  fill="none" stroke="#D9A94E" stroke-width="1.5" transform="rotate(-90 100 100)"
  stroke-linecap="round"/>
<circle cx="100" cy="100" r="91" fill="none" stroke="#D9A94E" stroke-width=".5" opacity=".4"/>
</svg>'''
    return f'''<div style="position:relative;width:{size}px;height:{size}px;margin:0 auto">
  {ring}
  <img src="{src}" alt="Oh! You Fancy Focaccia" class="mark"
    style="position:absolute;inset:{int(size*0.075)}px;width:{int(size*0.85)}px;
    height:{int(size*0.85)}px;border-radius:50%">
</div>'''

def ring_badge(size=132, draw=True):
    d = ' class="draw" style="--len:365"' if draw else ''
    d2 = ' class="draw" style="--len:150"' if draw else ''
    return f"""<svg class="ring" width="{size}" height="{size}" viewBox="0 0 140 140" aria-hidden="true"
  style="margin:0 auto">
<circle cx="70" cy="70" r="58"{d} fill="none" stroke="#D9A94E" stroke-width="1.6"
  transform="rotate(-90 70 70)" stroke-linecap="round"/>
<circle cx="70" cy="70" r="50" fill="none" stroke="#D9A94E" stroke-width=".6" opacity=".45"/>
<g class="mark">
<path d="M70 45c-9 5.5-14 12.6-14 21.4 0 8.2 5.8 14.8 14 20.6 8.2-5.8 14-12.4 14-20.6C84 57.6 79 50.5 70 45z"
  fill="none" stroke="#8FA05E" stroke-width="1.5"/>
<path d="M70 51v36" stroke="#8FA05E" stroke-width="1.1" opacity=".7"/>
<ellipse cx="60.5" cy="65" rx="4" ry="5.2" transform="rotate(-24 60.5 65)" fill="#8FA05E"/>
<ellipse cx="79.5" cy="71" rx="4" ry="5.2" transform="rotate(-24 79.5 71)" fill="#8FA05E"/>
</g></svg>"""

LOADER = f"""
<div class="stage">
  <img class="scene" src="splash-scene.webp" alt="">
  <div class="wash"></div>
  <div class="frame"></div>
  {CORNER % 'tl'}{CORNER % 'tr'}{CORNER % 'bl'}{CORNER % 'br'}
  <div class="vig"></div>
  <div class="load-in">
    {logo_badge(420, src="logo-splash.webp")}
    <div class="mark" style="margin-top:var(--s6)">
      <p style="font-family:var(--script);font-size:4.6rem;line-height:.78;color:#F2DFC0">Oh! You Fancy</p>
      <p style="font-family:var(--serif);font-size:2.2rem;font-weight:700;letter-spacing:.3em;
        text-transform:uppercase;color:#F2DFC0;margin-top:.55rem;padding-left:.3em">Focaccia</p>
    </div>

    <div class="ing-rail">
      {''.join(f'<div class="ing"><p class="ing-w">{w}</p><p class="ing-g">{g}</p></div>' for w,g in INGREDIENTS)}
    </div>

    <div class="dim-rail"><i></i><i></i><i></i><i></i><i></i></div>

    <div class="tag-line" style="margin-top:var(--s8)">
      <p style="font-family:var(--serif);font-size:.78rem;font-weight:600;letter-spacing:.46em;
        text-transform:uppercase;color:#D9A94E">Pane &#183; Amore &#183; Sempre</p>
    </div>

    <div class="enter" style="margin-top:var(--s8)">
      <a href="#" class="btn btn-pale">Entra</a>
    </div>
  </div>
  <div class="skip"><p style="font-family:var(--serif);font-size:.62rem;font-weight:600;
    letter-spacing:.34em;text-transform:uppercase;color:oklch(.78 .08 70/.4)">
    Press any key to skip</p></div>
</div>
"""

NAV = ["Home","About","Our Breads","Order","Gallery","Reviews","Contact","Policies"]

# Amanda's Oregon Domestic Kitchen license, shown in the footer of every page
# because a home-kitchen bakery is worth being open about. Set the number and
# it appears; leave it empty and the line does not render at all, so the site
# can never publish a half-filled license.
LICENSE = {"number": "AG-L1104331DKB", "expires": "06/2028"}

def license_line():
    if not LICENSE["number"]:
        return ""
    # The number and the expiry each stay whole: left to wrap freely the line
    # breaks after the separator and orphans "\u00b7 expires" at the end of a row.
    expires = (f'<span style="white-space:nowrap"> &#183; expires {LICENSE["expires"]}</span>'
               if LICENSE["expires"] else '')
    return ('\n      <p style="font-size:var(--xs);opacity:.62;margin-top:var(--s4);max-width:36ch">'
            f'Oregon Domestic Kitchen Bakery License '
            f'<span style="white-space:nowrap">No. {LICENSE["number"]}</span>{expires}</p>\n      ')

def olive_rule(w=190, flip=False):
    t = ' transform="scale(-1,1) translate(-190,0)"' if flip else ''
    return f"""<svg width="{w}" height="34" viewBox="0 0 190 34" aria-hidden="true">
<g{t} fill="none" stroke="#4E6023" stroke-width="1.2" stroke-linecap="round">
<path d="M2 17C40 17 82 14 126 9"/>
<path d="M36 17c-3-5-1-9 3-11 2 4 1 9-3 11z"/>
<path d="M56 15c-3-5-2-9 2-11 2 4 2 9-2 11z"/>
<path d="M76 13c-3-5-2-9 2-11 2 4 2 9-2 11z"/>
<path d="M46 18c3-4 8-4 11-1-3 4-8 5-11 1z"/>
<path d="M66 16c3-4 8-4 11-1-3 4-8 5-11 1z"/></g>
<g{t} fill="#4E6023">
<ellipse cx="116" cy="10" rx="4" ry="5.2" transform="rotate(28 116 10)"/>
<ellipse cx="130" cy="7" rx="4" ry="5.2" transform="rotate(28 130 7)" opacity=".68"/></g></svg>"""

def dimple_rule():
    return '<div class="dimples"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'

def masthead(active):
    """The sticky header.

    Everything is on a real class rather than an inline style, so the
    responsive sheet can shrink the header on scroll and swap the
    eight-link rail for a drawer on a phone without having to match
    substrings of `style=`.
    """
    def link(n, drawer=False):
        cur = ' aria-current="page"' if n == active else ''
        base = "drawer-link" if drawer else "nav-link"
        cls = base + (" is-current" if n == active else "")
        # Order is what the site is for, so it reads as the one live action
        # in the drawer rather than the fourth of eight equal words.
        if drawer and n == "Order":
            cls += " is-order"
        return f'<a href="#" class="{cls} caps"{cur}>{n}</a>'

    links  = "".join(link(n) for n in NAV)
    drawer = "".join(link(n, True) for n in NAV)
    return f"""<header class="mast">
  <div class="mast-in">
    <div class="brand-row">
      {olive_rule(120)}
      <img src="logo.webp" alt="" class="brand-mark" width="68" height="68">
      <a href="#" class="brand-word">
        <p class="brand-script">Oh! You Fancy</p>
        <p class="brand-caps">Focaccia</p>
      </a>
      {olive_rule(120,True)}
      <button type="button" class="nav-toggle" id="nav-toggle" aria-expanded="false"
        aria-controls="nav-drawer"><span class="nav-bars" aria-hidden="true"><i></i><i></i><i></i></span><span class="vh">Menu</span></button>
    </div>
    <nav class="nav-rail" aria-label="Main">{links}</nav>
  </div>
  <div class="nav-drawer" id="nav-drawer" hidden>
    <nav class="drawer-nav" aria-label="Main menu">{drawer}</nav>
  </div>
</header>"""

def enamel(title, lines, small=None, bg=None):
    layer = (f'<div style="position:absolute;inset:0;background-image:url(./{bg});'
             f'background-size:cover;background-position:center;opacity:.24;'
             f'filter:grayscale(.3) contrast(1.05)"></div>'
             f'<div style="position:absolute;inset:0;background:'
             f'linear-gradient(90deg,#8E1B1B 0%,oklch(.36 .13 25/.72) 50%,#8E1B1B 100%)"></div>') if bg else ''
    return f"""<section class="enamel">
  {layer}
  <div class="narrow" style="position:relative;z-index:2">
    <p class="caps" style="color:oklch(.82 .09 75/.72);margin-bottom:var(--s5)">{title}</p>
    <p class="enamel-lead">{lines}</p>
    {f'<p class="caps" style="color:oklch(.82 .09 75/.66);margin-top:var(--s5)">{small}</p>' if small else ''}
  </div>
</section>"""

# ── intrinsic image sizes, without a third-party decoder ───────────────
# Every <img> should declare width and height so the browser reserves the
# box before the bytes land. Reading the WebP header directly keeps the
# build dependency-free — CI runs a bare python3.
IMG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "img")
_SIZES = {}

def _webp_size(path):
    with open(path, "rb") as fh:
        head = fh.read(32)
    if len(head) < 30 or head[:4] != b"RIFF" or head[8:12] != b"WEBP":
        return None
    kind = head[12:16]
    if kind == b"VP8X":                      # extended: 24-bit canvas size
        return (int.from_bytes(head[24:27], "little") + 1,
                int.from_bytes(head[27:30], "little") + 1)
    if kind == b"VP8 ":                      # lossy: 14-bit dims after the sync code
        return (int.from_bytes(head[26:28], "little") & 0x3FFF,
                int.from_bytes(head[28:30], "little") & 0x3FFF)
    if kind == b"VP8L":                      # lossless: packed 14+14 bits
        bits = int.from_bytes(head[21:25], "little")
        return ((bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1)
    return None

def img_size(src):
    """(width, height) for an image in design/img, or None if unreadable."""
    if src not in _SIZES:
        path = os.path.join(IMG_DIR, os.path.basename(src))
        try:
            _SIZES[src] = _webp_size(path) if src.endswith(".webp") else None
        except OSError:
            _SIZES[src] = None
    return _SIZES[src]

def img_attrs(src, eager=False):
    """The loading and sizing attributes every <img> on the site carries."""
    wh = img_size(src)
    dims = f' width="{wh[0]}" height="{wh[1]}"' if wh else ""
    # above the fold the image is the page; everywhere else it waits its turn
    load = ' fetchpriority="high"' if eager else ' loading="lazy"'
    return f'{dims}{load} decoding="async"'

def shot(src, h, alt="", cls="", extra="", eager=False):
    """A real photograph, framed like a plate."""
    return (f'<figure class="shot {cls}" style="height:{h}px;{extra}">'
            f'<img src="{src}" alt="{alt}"{img_attrs(src, eager)}></figure>')

def slot(h, cap):
    """Placeholder — only where we genuinely have no photograph yet."""
    return f'<div class="slot" style="height:{h}px"><span class="slot-cap">{cap}</span></div>'

FOOTER = f"""<footer style="background:var(--burgundy-ink);color:#D8BFA0;padding-block:var(--s20) var(--s8)">
<div class="wrap">
  <div style="text-align:center;margin-bottom:var(--s16)">
    <div style="display:flex;justify-content:center;margin-bottom:var(--s5)">
      <img src="logo.webp" alt="Oh! You Fancy Focaccia"
        style="width:104px;height:104px;border-radius:50%;
        box-shadow:0 0 0 1px oklch(.82 .09 75/.35),0 0 0 7px oklch(.82 .09 75/.10)">
    </div>
    <p class="ftr-script">Oh! You Fancy</p>
    <p class="ftr-caps">Focaccia</p>
  </div>
  <div class="ftr-cols">
    <div><p class="caps" style="color:#C9A46A;margin-bottom:var(--s4)">The Bakery</p>
      <p style="font-size:var(--sm);opacity:.82;max-width:36ch">Artisan focaccia and sourdough baked by hand in Brookings, Oregon. Organic ingredients, a living starter, and small batches that sell out.</p>{license_line()}</div>
    <div><p class="caps" style="color:#C9A46A;margin-bottom:var(--s4)">Explore</p>
      <ul style="display:flex;flex-direction:column;gap:.5rem;font-size:var(--sm)">
      {''.join(f'<li><a href="#" style="color:#D8BFA0">{n}</a></li>' for n in NAV[1:])}</ul></div>
    <div><p class="caps" style="color:#C9A46A;margin-bottom:var(--s4)">Find Us</p>
      <p style="font-size:var(--sm);opacity:.82">Brookings-Harbor Farmers Market<br>Wednesdays &amp; Saturdays<br>9am &#8216;til sold out</p>
      <p style="margin-top:var(--s4);font-size:var(--sm)"><a href="#" style="color:#EBD3AE">info@ohyoufancyfocaccia.com</a></p>
      <p style="margin-top:var(--s2);font-size:var(--sm)"><a href="#" style="color:#EBD3AE">Facebook</a></p></div>
  </div>
  <div class="ftr-bot">
    <p class="caps" style="color:oklch(.72 .05 60/.72);font-size:.66rem">&#169; 2026 Oh! You Fancy Focaccia</p>
    <p class="caps" style="color:oklch(.72 .05 60/.72);font-size:.66rem">Pane &#183; Amore &#183; Sempre</p>
  </div>
</div></footer>"""

FOOTER_HOME = FOOTER.replace("</div></footer>", """  <p style="text-align:center;margin-top:var(--s5)">
    <a href="./admin" class="caps" style="color:oklch(.72 .05 60/.45);font-size:.62rem">Order Book</a></p>
</div></footer>""")

def page(body, pw, ph, extra_css=""):
    return f"""<!doctype html>
<html>
<head>
<meta charset="utf-8">
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
{FONTS}
<style>{TOKENS}{extra_css}</style>
</helmet>
<div class="grain">
{body}
</div>
</x-dc>
<script data-dc-script data-props='{{"$preview":{{"width":{pw},"height":{ph}}}}}'>
class Component extends DCLogic {{}}
</script>
</body>
</html>"""

# ══ HOME ══════════════════════════════════════════════════════════════
# The five bakes the home page leads with. Named, not written out: the board
# was kept by hand and drifted, so it went on advertising four bakes under
# names the rename had retired, and a customer following it to the bill of
# fare found none of them. Naming them means a rename either carries through
# or fails the build here, which is what the lookup below is for.
FEATURED = [
    "Jalape\u00f1o, Olive & Red Onion",     # the round she is known for
    "Olive & Sun-Dried Tomato",
    "The Brown Buttered Cinnamon Roll",  # photographed alongside
    "Peppered Pickle Focaccia Muffins",
    "The Everything Focaccia",
]

def _featured_board(count=None, indent="      "):
    by_name = {i["name"]: i for i in MENU_CATALOG}
    names = FEATURED[:count] if count else FEATURED
    rows = []
    for n, name in enumerate(names, 1):
        item = by_name[name]     # a KeyError here means a rename orphaned the
                                 # home page; better a failed build than a
                                 # customer chasing a bake that is not there
        last = ' style="border-bottom:none"' if n == len(names) else ""
        rows.append(fare(ROMAN[n - 1], html.escape(item["name"]),
                         html.escape(item["description"]), price=False, extra=last))
    return ("\n" + indent).join(rows)

PROC = [("I","Bend","The dough comes together slow. Organic flour, water, and a starter that has been going on since the silk trade days 900 years ago."),
        ("II","Snap","Air gets folded in, not beaten out. This is where the crumb is decided."),
        ("III","Stretch","Out to the corners by hand, never pressed flat by a machine."),
        ("IV","Fold","Rested, dimpled, drowned in extra virgin cold-pressed organic olive oil, and into the oven.")]

HOME = masthead("Home") + f"""
<section class="hero">
  <div class="spine spine-l" aria-hidden="true"><span>Brookings &#183; Oregon</span></div>
  <div class="spine spine-r" aria-hidden="true"><span>Est. on the Chetco</span></div>
  <div class="wrap hero-grid">
    <div>
      <p class="caps kicker kicker-l" style="color:var(--olive)">Artisan Breads</p>
      <h1 class="hero-h">
        One starter.<br><span style="font-style:italic;font-weight:500">Endless flavor</span><br>possibilities.</h1>
      <p class="hero-lede">
        Focaccia and sourdough from one mother starter &#8212; savory and sweet,
        dimpled and blistered &#8212; made by hand on the southern Oregon coast.</p>
      <div class="hero-cta">
        <a href="#" class="btn btn-fill">Order for Pickup</a>
        <a href="#" class="btn btn-line">See the Bill of Fare</a>
      </div>
    </div>
    <div class="hero-shot">
      {shot("hero-garden.webp",530,"Focaccia painted in herbs and vegetables","shot-oval","width:430px",eager=True)}
      <div class="hero-rule">{olive_rule(190)}</div>
    </div>
  </div>
</section>

{enamel("Il Mercato","Wednesdays &amp; Saturdays<br>9am &#8216;til sold out",
  "Brookings-Harbor Farmers Market &#183; Port of Brookings Harbor", bg="wide-slab.webp")}

<section class="sec" style="background:var(--paper-3)">
  <div class="wrap">
    <p class="caps kicker">Il Processo</p>
    <h2 class="h-sec">Bend, snap, stretch, fold</h2>
    <p class="lede">Four moves, in that order, every time. It is the whole method that consumes the dough days.</p>
    {dimple_rule()}
    <div class="grid g4">
      {''.join(f'''<div class="plate"><p class="roman">{r}</p><h3>{t}</h3><p>{d}</p></div>'''
               for r,t,d in PROC)}
    </div>
  </div>
</section>

<section class="sec" style="background:var(--paper)">
  <div class="wrap duo duo-a duo-top">
    <div>
      <p class="caps kicker kicker-l">From the Board</p>
      <h2 style="font-size:var(--xl);margin-bottom:var(--s3);text-align:left">What we are baking</h2>
      <p style="opacity:.78;margin-bottom:var(--s3)">The board turns over with the season and with the best and freshest our neighbors are growing.</p>
      <p style="font-style:italic;opacity:.78;margin-bottom:var(--s8)">Savory and organic ingredients &#8212; add what you want, leave out what you don&#8217;t.</p>
      {_featured_board()}
      <div style="margin-top:var(--s8)"><a href="#" class="btn btn-line">The Full Bill of Fare</a></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:var(--s6)">
      {shot("savory-round.webp",330,"Jalapeno, olive and red onion focaccia")}
      {shot("sweet-cinnamon.webp",300,"Brown buttered cinnamon roll focaccia")}
    </div>
  </div>
</section>

<section style="background:var(--paper-4);padding-block:var(--s24);position:relative">
  <div class="narrow" style="text-align:center">
    <div style="display:flex;justify-content:center;margin-bottom:var(--s8)">
      <div class="oval" style="width:126px;height:126px;display:flex;align-items:center;
        justify-content:center;background:var(--paper-2)">
        <svg width="40" height="33" viewBox="0 0 46 38" aria-hidden="true">
        <path d="M18 38C8 38 2 31 2 21 2 10 9 2 20 0l2 6c-7 2-11 6-11 11 0 1 0 2 1 3 6-1 11 3 11 9 0 5-3 9-7 9zm24 0c-10 0-16-7-16-17C26 10 33 2 44 0l2 6c-7 2-11 6-11 11 0 1 0 2 1 3 6-1 11 3 11 9 0 5-3 9-7 9z" fill="#8E1B1B" opacity=".42"/></svg>
      </div>
    </div>
    <p style="font-family:var(--serif);font-size:2.3rem;font-style:italic;line-height:1.42;
      margin-bottom:var(--s6)">Best Focaccia I&#8217;ve ever had. She definitely knows what she&#8217;s doing.</p>
    <p class="caps" style="color:var(--burgundy)">TonyandTasha Holden</p>
  </div>
  <div class="wrap home-quotes">
    <blockquote class="hq">
      <p>It&#8217;s fluffy, it&#8217;s fresh, it&#8217;s flavorful. Must try.</p>
      <cite class="caps">Jessica Dora</cite></blockquote>
    <blockquote class="hq">
      <p>This bread is made with love, so delicious that it compliments every meal.</p>
      <cite class="caps">Char Rigg</cite></blockquote>
    <blockquote class="hq">
      <p>Turning it into a pizza was super fast and easy. It was delicious the way it is.</p>
      <cite class="caps">From the market table</cite></blockquote>
  </div>
  <div class="narrow" style="text-align:center">
    <p class="caps" style="opacity:.62;margin-top:var(--s10);font-size:.68rem">100% recommend &#183; 9 reviews</p>
    <p style="margin-top:var(--s6)"><a href="#" class="btn btn-line">Read the Reviews</a></p>
  </div>
</section>

<section class="sec" style="background:var(--paper)">
  <div class="wrap">
    <p class="caps kicker">I Nostri Vicini</p>
    <h2 class="h-sec">We bake with our town</h2>
    <p class="lede">Half of what goes into these loaves comes from someone we know by name.</p>
    {dimple_rule()}
    <div class="grid g2" style="gap:var(--s8) var(--s16);max-width:980px;margin-inline:auto">
      <div style="display:flex;gap:var(--s5);align-items:baseline;padding-block:var(--s5);
        border-bottom:1px solid var(--rule-soft)">
        <span class="fare-n">&#8212;</span><div><h3 style="font-size:var(--lg)">Brookings Pickled Goodies</h3>
        <p style="font-size:var(--sm);opacity:.74">Their spicy bread-and-butter pickles, folded into our muffins.</p></div></div>
      <div style="display:flex;gap:var(--s5);align-items:baseline;padding-block:var(--s5);
        border-bottom:1px solid var(--rule-soft)">
        <span class="fare-n">&#8212;</span><div><h3 style="font-size:var(--lg)">Chetco Gold Raw Honey</h3>
        <p style="font-size:var(--sm);opacity:.74">Award-winning raw honey from the Chetco River, over our honey focaccia muffins.</p></div></div>
      <div style="display:flex;gap:var(--s5);align-items:baseline;padding-block:var(--s5);
        border-bottom:1px solid var(--rule-soft)">
        <span class="fare-n">&#8212;</span><div><h3 style="font-size:var(--lg)">The Dawg House</h3>
        <p style="font-size:var(--sm);opacity:.74">Monica builds her sandwiches on our bread, two stalls down.</p></div></div>
      <div style="display:flex;gap:var(--s5);align-items:baseline;padding-block:var(--s5);
        border-bottom:1px solid var(--rule-soft)">
        <span class="fare-n">&#8212;</span><div><h3 style="font-size:var(--lg)">Sylvia&#8217;s Farm Fresh Produce</h3>
        <p style="font-size:var(--sm);opacity:.74">Her jalape&#241;os and apples, and so much more, go into the focaccia.</p></div></div>
    </div>
  </div>
</section>

<section style="background:var(--paper-3);padding-block:var(--s20);text-align:center;
  border-top:1px solid var(--rule)">
  <div class="narrow">
    <div style="display:flex;justify-content:center;margin-bottom:var(--s6)">{olive_rule(190)}</div>
    <h2 style="font-size:var(--xl);margin-bottom:var(--s4)">Come Wednesday. Come Saturday. Come early.</h2>
    <p style="opacity:.8;margin-bottom:var(--s8)">
      We bake small and we sell out. Questions, delivery or shipping &#8212; just write.</p>
    <a href="#" class="btn btn-fill">info@ohyoufancyfocaccia.com</a>
    <p style="margin-top:var(--s10);font-family:var(--script);font-size:2.6rem;color:var(--burgundy)">
      Love always, Oh! You Fancy Focaccia</p>
  </div>
</section>
""" + FOOTER_HOME

def head_band(kick, title, sub):
    return f"""<section style="background:var(--paper-3);border-bottom:1px solid var(--rule);
  padding-block:var(--s20);text-align:center;position:relative;overflow:hidden">
  <div class="spine spine-l"><span>Oh! You Fancy Focaccia</span></div>
  <div class="spine spine-r"><span>Brookings &#183; Oregon</span></div>
  <div class="narrow" style="position:relative">
    <p class="caps kicker">{kick}</p>
    <h1 style="font-size:var(--xxl);margin-bottom:var(--s5)">{title}</h1>
    <p style="font-size:var(--lg);opacity:.76;font-style:italic;line-height:1.6">{sub}</p>
    <div style="display:flex;justify-content:center;margin-top:var(--s8)">{olive_rule(190)}</div>
  </div>
</section>"""

# ══ ABOUT ═════════════════════════════════════════════════════════════
CREED = [("Organic, all the way down","We bake with organic ingredients because that is what we would feed our own family. Good bread starts long before the oven."),
("A starter with a history","Everything begins with a bubbly sourdough starter. Mama makes the dough, and the dough takes its time."),
("Hands, not machines","No shortcuts and nothing mechanical doing the shaping. Every loaf is worked until it is ready."),
("Small batch, always","We bake what we can bake well. That is why we sell out, and why it is always fresh."),
("Savory and sweet","There are so many options when it comes to focaccia. We create new flavors every month."),
("Baked with love","The one ingredient we cannot buy and will not skip. Our customers taste it, and they say so.")]

ABOUT = masthead("About") + head_band("La Nostra Storia","Welcome to Oh! You Fancy Focaccia",
  "A small-batch bakery on the southern Oregon coast, run by Amanda &#8212; doing what she loves, where she loves to be.") + f"""
<section class="sec" style="background:var(--paper)">
  <div class="wrap duo duo-b">
    <div style="display:flex;flex-direction:column;align-items:center;gap:var(--s4)">
    {shot("amanda-market.webp",500,"Amanda at the farmers market stall","shot-oval","width:400px")}
    </div>
    <div>
      <p class="caps kicker kicker-l">From Our Kitchen</p>
      <h2 style="font-size:var(--xl);text-align:left;margin-bottom:var(--s6)">From our kitchen<br>to your table</h2>
      <p style="opacity:.8;margin-bottom:var(--s5)">Oh! You Fancy Focaccia is a family-run bakery in Brookings, Oregon, on the Curry County coast.</p>
      <p style="opacity:.8;margin-bottom:var(--s5)">What started as a love of bread became a booth at the Brookings-Harbor Farmers Market &#8212; and then loaves going out to neighbors, friends, and folks far enough away that we had to start shipping.</p>
      <p style="opacity:.8;margin-bottom:var(--s5)">We bake savory and sweet focaccia with organic ingredients: olives and garlic and jalape&#241;o, sun-dried tomato and herbs, cinnamon and honey. We infuse our neighbors&#8217; pickles and drizzle our neighbors&#8217; honey.</p>
      <p style="opacity:.8;margin-bottom:var(--s5)">The same mother starter goes into our sourdough loaves &#8212; mixed the day before, left to rise slow, and baked dark alongside everything else.</p>
      <p style="opacity:.8;margin-bottom:var(--s8)">Every Wednesday and Saturday the crates come out, the gold paper bags get filled, and we hand out samples until the last loaf is gone.</p>
      <div style="border-left:2px solid var(--burgundy);padding-left:var(--s6)">
        <p style="opacity:.86">Thank you to our customers, our friends, our family, and our Father in Heaven for supporting our small business.</p>
        <p style="font-family:var(--script);font-size:2.4rem;color:var(--burgundy);margin-top:var(--s3)">Love always, Oh! You Fancy Focaccia</p>
      </div>
    </div>
  </div>
</section>

<section class="sec" style="background:var(--paper-3);border-block:1px solid var(--rule)">
  <div class="wrap">
    <p class="caps kicker">Il Nostro Credo</p>
    <h2 class="h-sec">Six things we will not<br>compromise on</h2>
    {dimple_rule()}
    <div class="grid g3">
      {''.join(f'<div class="plate"><p class="roman">{r}</p><h3>{t}</h3><p>{d}</p></div>' for r,(t,d) in zip(['I','II','III','IV','V','VI'],CREED))}
    </div>
  </div>
</section>

{enamel("Trovaci","Wednesdays &amp; Saturdays<br>9am &#8216;til sold out","info@ohyoufancyfocaccia.com")}
""" + FOOTER

# ══ OUR BREADS ════════════════════════════════════════════════════════

def course(title, ital, rows, cap=None, note=""):
    """A run of the bill of fare. Without a photograph it runs full width —
    better an honest single column than a gap where a picture should be.
    `note` is for something true of the whole course rather than one bake."""
    n = (f'<p style="font-size:var(--sm);font-style:italic;opacity:.78;'
         f'margin-bottom:var(--s5)">{note}</p>') if note else ""
    return f"""<div class="course">
  <div class="course-grid{' has-aside' if cap else ''}">
    <div>
      <p class="caps" style="color:var(--olive);margin-bottom:var(--s2)">{ital}</p>
      <h2 style="font-size:var(--xl);text-align:left;margin-bottom:var(--s2)">{title}</h2>
      <div style="width:64px;height:2px;background:var(--burgundy);margin-bottom:var(--s4)"></div>
      {n}{''.join(rows)}
    </div>
    {shot(cap[0], 360, cap[1]) if cap else ""}
  </div>
</div>"""


# Course display, in the order the bill of fare runs them: the Italian kicker,
# the English heading, the photograph, and anything true of the whole course.
COURSE_VIEW = [
    ("savory",    "I Salati",       "Savory",          ("savory-round.webp", "Jalapeno, olive and red onion focaccia"), ""),
    ("sourdough", "Il Pane",        "Sourdough",       ("plain-swirl.webp", "Classic artisan Celtic salted sourdough"), ""),
    ("sweet",     "I Dolci",        "Sweet",           ("sweet-cinnamon.webp", "Brown buttered cinnamon roll focaccia"),
     "Everything sweet is sweetened with coconut sugar."),
    ("small",     "I Piccoli",      "Focaccia Muffins", ("muffins-jalapeno.webp", "Jalapeno, garlic and onion focaccia muffins"),
     "Every flavor on this list can be baked as a focaccia muffin."),
    ("art",       "L&#8217;Arte",   "Focaccia Art",    ("heart-loaf.webp", "Focaccia baked in a cast iron heart pan"), ""),
]

# Not in the catalog: it has no fixed price and changes with the season, so it
# is written here rather than becoming a standing orderable row.
EXTRA_FARE = {"sweet": [("Seasonal Desserts",
    "Pumpkin pie focaccia when the pumpkins come in, and cranberry walnut at Christmas. "
    "Ask what is on this week, or request one through the order page.")]}

def _bill_of_fare():
    """The bill of fare, built from menu.json so it cannot drift from the
    order page. Numbering runs straight through every course."""
    n, out = 0, []
    for key, ital, title, cap, note in COURSE_VIEW:
        rows = []
        for item in MENU_CATALOG:
            if item["course"] != key:
                continue
            n += 1
            rows.append(fare(ROMAN[n - 1], html.escape(item["name"]), html.escape(item["description"])))
        for name, desc in EXTRA_FARE.get(key, []):
            n += 1
            rows.append(fare(ROMAN[n - 1], html.escape(name), html.escape(desc)))
        if rows:
            out.append(course(title, ital, rows, cap, note=note))
    return "\n".join(out)

BREADS = masthead("Our Breads") + head_band("La Lista","The Bill of Fare",
  "Prices are shown for the standing menu. Seasonal and custom bakes can be requested through the order page and confirmed by Amanda.") + f"""
<section class="sec" style="background:var(--paper)">
  <div class="wrap">
    {_bill_of_fare()}
  </div>
</section>

<section class="sec" style="background:var(--paper-3);border-block:1px solid var(--rule)">
  <div class="wrap">
    <p class="caps kicker">Come Si Mangia</p>
    <h2 class="h-sec">Our customers are more<br>inventive than we are</h2>
    {dimple_rule()}
    <div class="grid g4">
      <div class="plate"><h3>As pizza</h3><p>&#8220;It was delicious the way it is, but turning it into a pizza was super fast and easy.&#8221;</p></div>
      <div class="plate"><h3>As a sandwich</h3><p>Go see Monica at The Dawg House &#8212; she builds hers on our focaccia at the market.</p></div>
      <div class="plate"><h3>As toast</h3><p>Avocado, feta and heirloom tomatoes on a thick slice. A customer sent us that one.</p></div>
      <div class="plate"><h3>As it comes</h3><p>Warm, torn by hand, with extra virgin cold-pressed organic olive oil. Honestly the best way.</p></div>
    </div>
    <div style="max-width:660px;margin:var(--s16) auto 0;padding:var(--s10);
      background:var(--paper-2);border:1px solid var(--rule);text-align:center">
      <p class="caps" style="color:var(--burgundy);margin-bottom:var(--s3)">Ordina</p>
      <p style="opacity:.8;margin-bottom:var(--s6)">Order ahead for market pickup, local delivery or shipping. We confirm every order by email.</p>
      <a href="#" class="btn btn-fill">Place an Order</a>
    </div>
  </div>
</section>
""" + FOOTER

# ══ GALLERY ═══════════════════════════════════════════════════════════
GAL_SECTIONS = [
 ("I Salati","Savory", [
   ("savory-round.webp","Jalape&#241;o, Olive &amp; Red Onion","Specialty made to order.",300),
   ("jalapeno-garlic-round.webp","The Jalape&#241;o, Garlic and Onion Focaccia","Jalape&#241;o, garlic and onion.",300),
   ("jalapeno-dimpled.webp","The Jalape&#241;o n Chedda n Garlic","Jalape&#241;o, cheddar and garlic, baked into a golden dimpled round.",300),
   ("scallion-chili.webp","The Asian Crisp","Crunchy garlics and onions, chili peppers, sesame seeds, mushroom powder, scallions and an agave drizzle.",280),
   ("tomato-olive-round.webp","Tomato, Olive &amp; Onion","Specialty made to order.",300),
   ("olive-tomato.webp","Olive &amp; Sun-Dried Tomato","Specialty made to order.",300),
   ("garlic-herb-round.webp","The Italiano","The true Italian focaccia. Focaccia originated in Rome, Italy, and you can taste it in this loaf. Sage, oregano, thyme, basil and garlic.",280),
   ("lemon-pepper.webp","The Lemon Pepper","Black pepper with lemon extract from Meyer lemons, garlic and onion.",300),
   ("square-focaccia.webp","The Roasted Garlic Boss","True garlic lovers want this one. Roasted garlic, garlic oil and minced garlic.",300)]),
 ("Le Teglie","Slabs &amp; Pans", [
   ("olive-slab.webp","The Mediterranean Olive","Olive variety and sun dried tomatoes.",400),
   ("olive-you.webp","The Olive You","Olive medley, garlic and thyme.",380),
   ("rosemary-slab.webp","The Rosemary and Black Pepper","Rosemary and cracked black pepper, right across the tray.",390),
   ("potato-onion.webp","The Fall Favorite","Roasted potatoes, rosemary, garlic, caramelized onions and Fontina cheese.",380),
   ("pesto-skillet.webp","The Pesto and Cashew Cheese","Basil pesto and cashew cheese, baked in the pan it is served from.",250),
   ("wide-slab.webp","The Focaccia Queen","Tomatoes, cheese, onions, garlic and an olive variety &#8212; Kalamata, pimento and black olives &#8212; with cold pressed olive oil and Celtic sea salt.",250)]),
 ("Le Spirali","Swirls", [
   ("jalapeno-swirl-xl.webp","Jalape&#241;o, Garlic and Chedda Sourdough","Jalape&#241;o, garlic and cheddar wound through a sourdough spiral.",300),
   ("swirl-jalapeno.webp","Jalape&#241;o Swirl","Layer on layer, blistered at the edge.",300),
   ("classic-sourdough.webp","Cinnamon Swirl Artisan Sourdough","Cinnamon wound through the spiral.",300),
   ("garlic-rosemary-sourdough.webp","The Roasted Garlic and Rosemary Sourdough","Roasted garlic and rosemary, wound through the spiral.",300),
   ("plain-swirl.webp","Classic Artisan Celtic Salted Sourdough","Nothing on it but Celtic salt.",300),
   ("caramel-swirl.webp","The Mediterranean Sourdough","Sun dried tomato and olive variety.",300)]),
 ("I Piccoli","Focaccia Muffins", [
   ("muffins-jalapeno.webp","The Jalape&#241;o, Garlic and Onion Focaccia Muffins","Jalape&#241;o, garlic and onion, hand-sized.",300),
   ("parm-muffins.webp","The Roasted Garlic Focaccia Muffins","Roasted garlic, hand-sized.",300),
   ("sea-salt-round.webp","The Plain Jane Celtic Salted Focaccia Muffin","Celtic salt, and nothing else.",300),
   ("herb-rolls.webp","The Italiano Focaccia Muffins","The Italiano in muffin form &#8212; sage, oregano, thyme, basil and garlic.",300)]),
 ("I Dolci","Sweet", [
   ("sweet-cinnamon.webp","The Brown Buttered Cinnamon Roll","Flax seed oil butter. Coconut sugar.",420),
   ("cinnamon-drizzle-2.webp","The Pow Cacao","A decadent chocolate focaccia dessert, sweetened with coconut sugar so it doesn&#8217;t spike your blood sugar like regular refined sugar does.",410),
   ("cinnamon-dark.webp","The Apple Fritter","Apple fritter focaccia dessert.",400),
   ("hot-honey-bites.webp","The Hot Honey","Chili peppers, garlic and local honey from the happiest honey bees.",360)]),
 ("L&#8217;Arte","Focaccia Art", [
   ("heart-loaf.webp","The Everything Focaccia","Poppy seeds, sesame seeds, onion and garlic.",300),
   ("art-garden.webp","Flower Garden with a Bee","Specialty made to order.",395),
   ("hero-garden.webp","Flower Garden","Specialty made to order.",390)]),
]

def gal_block(kicker, title, items):
    """One course of the gallery.

    A real grid rather than CSS `columns`: multi-column left orphaned
    figures and ragged column feet, and a fixed pixel height on every
    tile fought the natural aspect of the photographs. Each tile is now
    a button that opens the plate full size.
    """
    # one hero tile per course, so the grid has a rhythm without turning
    # into the ragged masonry it replaced
    tallest = max(h for *_, h in items)
    hero = next(f for f, n, c, h in items if h == tallest) if len(items) >= 3 else None
    figs = []
    for f, n, c, h in items:
        wide = ' gal-wide' if f == hero else ''
        figs.append(
          f'<figure class="gal-item{wide}">'
          f'<button type="button" class="gal-open" data-src="{f}" data-name="{n}" data-cap="{c}">'
          f'<span class="shot gal-shot"><img src="{f}" alt="{n}"{img_attrs(f)}></span>'
          f'<span class="vh">View {n} larger</span></button>'
          f'<figcaption class="gal-cap">'
          f'<p class="caps gal-name">{n}</p>'
          f'<p class="gal-note">{c}</p>'
          f'</figcaption></figure>')
    return (f'<div class="gal-course">'
      f'<div class="gal-head">'
      f'<p class="caps" style="color:var(--olive)">{kicker}</p>'
      f'<h2 class="gal-title">{title}</h2>'
      f'<span class="gal-fill"></span>'
      f'<p class="caps gal-count">{len(items)} bakes</p></div>'
      f'<div class="gal">{"".join(figs)}</div></div>')

# The plate, full size. A native <dialog> gets the modal semantics, the
# focus trap and Escape for free.
LIGHTBOX = """
<dialog class="lb" id="lightbox" aria-label="Photograph">
  <div class="lb-stage" id="lb-stage">
    <div class="lb-panel">
      <button type="button" class="lb-close" id="lb-close" aria-label="Close">&#215;</button>
      <button type="button" class="lb-nav lb-prev" id="lb-prev" aria-label="Previous photograph">&#8249;</button>
      <button type="button" class="lb-nav lb-next" id="lb-next" aria-label="Next photograph">&#8250;</button>
      <figure class="lb-fig">
        <img id="lb-img" src="" alt="" decoding="async">
        <figcaption class="lb-cap">
          <p class="caps" id="lb-name"></p>
          <p class="lb-note" id="lb-note"></p>
          <a class="btn btn-line lb-order" id="lb-order" href="./order.html">Order this</a>
        </figcaption>
      </figure>
    </div>
  </div>
</dialog>"""

GALLERY = masthead("Gallery") + head_band("La Galleria","Fresh From the Oven",
  "Thirty-one bakes, straight from the tray and straight from the market table.") + f"""
<section class="sec" style="background:var(--paper)">
  <div class="wrap">
    {"".join(gal_block(k,t,items) for k,t,items in GAL_SECTIONS)}
  </div>
  {LIGHTBOX}
</section>

{enamel("Seguici","We post the bakes<br>as they leave the oven","Find us on Facebook as Oh! You Fancy Focaccia")}
""" + FOOTER

# ══ REVIEWS ═══════════════════════════════════════════════════════════
def quote(text, who, size="1.28rem"):
    return f"""<div class="plate" style="padding:var(--s10)">
  <svg width="32" height="26" viewBox="0 0 46 38" aria-hidden="true" style="margin-bottom:var(--s5)">
  <path d="M18 38C8 38 2 31 2 21 2 10 9 2 20 0l2 6c-7 2-11 6-11 11 0 1 0 2 1 3 6-1 11 3 11 9 0 5-3 9-7 9zm24 0c-10 0-16-7-16-17C26 10 33 2 44 0l2 6c-7 2-11 6-11 11 0 1 0 2 1 3 6-1 11 3 11 9 0 5-3 9-7 9z" fill="#8E1B1B" opacity=".32"/></svg>
  <p style="font-family:var(--serif);font-size:{size};font-style:italic;line-height:1.56;
    margin-bottom:var(--s6)">{text}</p>
  <p class="caps" style="color:var(--burgundy);font-size:.68rem">{who}</p></div>"""

REVIEWS = masthead("Reviews") + head_band("Parole Gentili","What Our Customers Say",
  "100% recommend across 9 reviews on Facebook.") + f"""
<section class="sec" style="background:var(--paper)">
  <div class="wrap">
    <p class="caps kicker">Dal Mercato</p>
    <div style="height:var(--s10)"></div>
    <div class="grid g2" style="align-items:start">
      {quote("I stopped at The Dawg House for a sandwich at the Farmer&#8217;s Market today. I received one of the most delicious Italian garden sandwiches I&#8217;ve ever had in my entire existence and it was because she made it with FRESH Focaccia bread from Oh You Fancy Focaccia! It&#8217;s fluffy, it&#8217;s fresh, it&#8217;s flavorful. Must try.","Jessica Dora","1.5rem")}
      <div style="display:flex;flex-direction:column;gap:var(--s6)">
        {quote("Best Focaccia I&#8217;ve ever had. She definitely knows what she&#8217;s doing. Absolutely scrumptious.","TonyandTasha Holden")}
        {quote("This bread is made with love, so delicious that it compliments every meal. Stop and taste her many yummy varieties.","Char Rigg")}
      </div>
    </div>
  </div>
</section>

<section class="sec" style="background:var(--paper-3);border-block:1px solid var(--rule)">
  <div class="wrap">
    <p class="caps kicker">In Paese</p>
    <h2 class="h-sec">Go see Amanda,<br>you will love it</h2>
    {dimple_rule()}
    <div class="grid g2">
      {quote("Who has tried the Focaccia from the Brookings Farmers market?? They have sweet and savory flavors. The samples were amazing so I bought the &#8216;Oh you Fancy.&#8217; It was delicious the way it is but turning into a pizza was super fast and easy. Go see Amanda, you will love it.","A neighbor in Brookings")}
      {quote("OMG! I tried some the other day and it is absolutely the best focaccia I&#8217;ve ever had in my life. My husband agreed.","A market regular")}
      {quote("Super yummy food. Baked with love for sure. So many varieties. Get there early cause this girl sells out quick!","Linnea")}
      {quote("It is the best. My family loved it. All three were gone in a day.","A Brookings customer")}
    </div>
  </div>
</section>

{enamel("Grazie","We read every one,<br>and they mean the world","Thank you to our customers, our friends, our family, and our Father in Heaven")}
""" + FOOTER

# ══ CONTACT ═══════════════════════════════════════════════════════════
FAQ = [("Do you have a storefront?","Not yet. You will find us at the Brookings-Harbor Farmers Market on Wednesdays and Saturdays, and we deliver and ship as well."),
("Where do I pick up?","Brookings-Harbor Farmers Market on Wednesdays and Saturdays from 9am. Amanda confirms the pickup details in the order email."),
("Do you deliver or ship?","Choose delivery or shipping on the order form and include the destination. Amanda confirms availability, timing, and any cost before the order is final."),
("Are your ingredients organic?","We bake with organic ingredients, and we say so on every loaf we are proud of."),
("Can you make something custom?","Tell us the occasion. We have made hearts, flower gardens, and plenty of things that were never on a menu."),
("How do I change or cancel?","Email info@ohyoufancyfocaccia.com as soon as possible; orders are not final until Amanda confirms them."),
("What about allergies?","Tell us in the order notes. We cannot promise an allergen-free kitchen; Amanda will confirm what can be accommodated."),
("How much does it cost?","$15 for any bread, focaccia or sourdough, and $2 each for the muffin-sized focaccia and the honey buns. Delivery and shipping are quoted separately, and the final total is confirmed before payment."),
("What time should I come?","Early. We bake in small batches and we sell out most market days.")]

def contact_row(icon, title, body, link=None):
    return f"""<div style="display:flex;gap:var(--s5);align-items:flex-start;padding-block:var(--s6);
  border-bottom:1px solid var(--rule-soft)">
  <div style="flex-shrink:0;margin-top:3px">{icon}</div>
  <div><h3 style="font-size:var(--lg);margin-bottom:var(--s1)">{title}</h3>
    <p style="font-size:var(--sm);opacity:.74">{body}</p>
    {f'<p style="margin-top:var(--s2)"><a href="#" class="caps" style="font-size:.7rem">{link}</a></p>' if link else ''}
  </div></div>"""

IC_MAIL = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8E1B1B" stroke-width="1.3"><rect x="2" y="5" width="20" height="14"/><path d="M2 7l10 6 10-6"/></svg>'
IC_FB = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8E1B1B" stroke-width="1.3"><path d="M21 12a9 9 0 10-10.4 8.9v-6.3H8.2V12h2.4V9.9c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.5.7-1.5 1.5V12h2.6l-.4 2.6h-2.2v6.3A9 9 0 0021 12z"/></svg>'
IC_PIN = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8E1B1B" stroke-width="1.3"><path d="M12 21s7-5.7 7-11a7 7 0 10-14 0c0 5.3 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>'

CONTACT = masthead("Contact") + head_band("Scrivici","We&#8217;d Love to Hear From You",
  "Questions, delivery, shipping, or something particular for an occasion &#8212; just say hello.") + f"""
<section class="sec" style="background:var(--paper)">
  <div class="wrap duo duo-c">
    <div>
      <p class="caps kicker kicker-l">Get in Touch</p>
      <div style="margin-top:var(--s4)">
        {contact_row(IC_MAIL,"Email","The fastest way to reach us. We answer every message.","info@ohyoufancyfocaccia.com")}
        {contact_row(IC_FB,"Facebook","That is where the fresh bakes get posted first.","Oh! You Fancy Focaccia")}
        {contact_row(IC_PIN,"Where We Are","Brookings, Oregon &#8212; on the southern Oregon coast, in Curry County.")}
      </div>
    </div>

    <div style="background:var(--paper-2);border:1px solid var(--rule);padding:var(--s10);
      position:relative;box-shadow:var(--sh-md)">
      <div style="position:absolute;inset:7px;border:1px solid var(--rule);opacity:.45;
        pointer-events:none"></div>
      <div style="position:relative;text-align:center">
        <div style="display:flex;justify-content:center;margin-bottom:var(--s5)">{olive_rule(170)}</div>
        <p class="caps" style="color:var(--olive);margin-bottom:var(--s3)">Il Mercato</p>
        <h2 style="font-size:var(--lg);margin-bottom:var(--s6)">Brookings-Harbor<br>Farmers Market</h2>
        <div style="border-block:1px solid var(--rule);padding-block:var(--s8)">
          <p style="font-family:var(--serif);font-size:2.5rem;font-weight:600;color:var(--burgundy);
            line-height:1.2">Wednesdays<br><span style="font-style:italic;font-weight:400">&amp;</span> Saturdays</p>
          <p class="caps" style="color:var(--olive);margin-top:var(--s4);font-size:.7rem">9am &#8216;til sold out</p>
        </div>
        <p style="opacity:.8;font-size:var(--sm);margin-top:var(--s6)">
          Port of Brookings Harbor. Come early and come hungry &#8212; there are always samples, and we do sell out.</p>
        <address class="directions">
          <p class="caps" style="color:var(--olive);margin-bottom:var(--s3)">Finding the market</p>
          <p class="dir-line">Brookings-Harbor Farmers Market<br>
            15786 US Highway 101 South<br>Brookings, Oregon 97415</p>
          <p style="margin-top:var(--s5)"><a class="caps dir-link"
            href="https://www.google.com/maps/search/?api=1&amp;query=Brookings-Harbor+Farmers+Market%2C+15786+US+101+S%2C+Brookings%2C+OR+97415"
            target="_blank" rel="noopener">Open in Maps</a></p>
        </address>
      </div>
    </div>
  </div>
</section>

<section class="sec" style="background:var(--paper-3);border-block:1px solid var(--rule)">
  <div class="wrap">
    <p class="caps kicker">Domande</p>
    <h2 class="h-sec">Everything people ask<br>at the stall</h2>
    {dimple_rule()}
    <div class="grid g2">
      {''.join(f'<div class="plate"><h3>{q}</h3><p>{a}</p></div>' for q,a in FAQ)}
    </div>
  </div>
</section>

<section style="background:var(--paper);padding-block:var(--s20);text-align:center">
  <div class="narrow">
    <p style="font-family:var(--script);font-size:3.4rem;color:var(--burgundy);line-height:.9">Pane &#183; Amore &#183; Sempre</p>
    <p class="caps" style="opacity:.55;margin-top:var(--s5);font-size:.68rem">Bread &#183; Love &#183; Always</p>
  </div>
</section>
""" + FOOTER

# ══ MOBILE ════════════════════════════════════════════════════════════
LOADER_M = f"""
<div class="stage" style="min-height:844px">
  <img class="scene" src="splash-scene.webp" alt="">
  <div class="wash"></div>
  <div class="frame" style="inset:18px"></div>
  <div class="vig"></div>
  <div class="load-in">
    {logo_badge(290, src="logo-splash.webp")}
    <div class="mark" style="margin-top:var(--s5)">
      <p style="font-family:var(--script);font-size:3.1rem;line-height:.78;color:#F2DFC0">Oh! You Fancy</p>
      <p style="font-family:var(--serif);font-size:1.4rem;font-weight:700;letter-spacing:.3em;
        text-transform:uppercase;color:#F2DFC0;margin-top:.45rem;padding-left:.3em">Focaccia</p>
    </div>
    <div class="ing-rail" style="height:72px;margin-top:var(--s5)">
      {''.join(f'<div class="ing"><p class="ing-w" style="font-size:1.85rem">{w}</p><p class="ing-g" style="font-size:.6rem">{g}</p></div>' for w,g in INGREDIENTS)}
    </div>
    <div class="dim-rail" style="gap:13px">{'<i></i>'*5}</div>
    <div class="tag-line" style="margin-top:var(--s6)">
      <p style="font-family:var(--serif);font-size:.66rem;font-weight:600;letter-spacing:.36em;
        text-transform:uppercase;color:#D9A94E">Pane &#183; Amore &#183; Sempre</p></div>
    <div class="enter" style="margin-top:var(--s6)"><a href="#" class="btn btn-pale">Entra</a></div>
  </div>
</div>"""

MOBILE = f"""
<header style="background:var(--paper);border-bottom:1px solid var(--rule);
  padding:var(--s6) var(--s5) 0;position:sticky;top:0;z-index:50">
  <div style="display:flex;align-items:flex-start;justify-content:space-between">
    <div style="flex-grow:1;text-align:center;padding-left:44px">
      <p style="font-family:var(--script);font-size:2.2rem;line-height:.78;color:var(--burgundy)">Oh! You Fancy</p>
      <p style="font-family:var(--serif);font-size:.88rem;font-weight:700;letter-spacing:.34em;
        text-transform:uppercase;margin-top:.3rem;padding-left:.34em">Focaccia</p>
    </div>
    <button aria-label="Menu" style="width:44px;height:44px;display:flex;flex-direction:column;
      justify-content:center;gap:6px;align-items:flex-end;background:none;border:none;flex-shrink:0">
      <span style="display:block;width:24px;height:1px;background:var(--burgundy)"></span>
      <span style="display:block;width:24px;height:1px;background:var(--burgundy)"></span>
      <span style="display:block;width:16px;height:1px;background:var(--burgundy)"></span>
    </button>
  </div>
  <div style="border-top:1px solid var(--rule-soft);margin-top:var(--s5);padding-block:var(--s3)">
    <div style="display:flex;justify-content:center">{olive_rule(120)}</div></div>
</header>

<section style="background:var(--paper);padding:var(--s12) var(--s5)">
  <p class="caps kicker" style="color:var(--olive);font-size:.66rem">Artisan Breads</p>
  <h1 style="font-size:2.6rem;line-height:1.04;text-align:center;margin-bottom:var(--s5)">
    One starter.<br><span style="font-style:italic;font-weight:500">Endless flavor</span><br>possibilities.</h1>
  <p style="text-align:center;opacity:.78;margin-bottom:var(--s6)">Focaccia and sourdough from one mother starter &#8212; dimpled, blistered, organic, and made by hand.</p>
  <a href="#" class="btn btn-fill" style="width:100%">See the Bill of Fare</a>
  {shot("hero-garden.webp",340,"Focaccia painted in herbs and vegetables","shot-oval","margin-top:var(--s8)")}
</section>

<section class="enamel" style="padding-block:var(--s10)">
  <div style="position:relative;padding-inline:var(--s5)">
    <p class="caps" style="color:oklch(.82 .09 75/.72);font-size:.62rem;margin-bottom:var(--s3)">Il Mercato</p>
    <p style="font-family:var(--serif);font-size:1.9rem;font-weight:600;line-height:1.2;color:#F6E6C6">
      Wednesdays &amp; Saturdays<br>9am &#8216;til sold out</p>
  </div>
</section>

<section style="background:var(--paper-3);padding:var(--s12) var(--s5)">
  <p class="caps kicker" style="font-size:.66rem">Il Processo</p>
  <h2 style="font-size:1.85rem;text-align:center;margin-bottom:var(--s3)">Bend, snap, stretch, fold</h2>
  {dimple_rule()}
  <div style="display:flex;flex-direction:column;gap:var(--s5)">
    {''.join(f'<div class="plate" style="padding:var(--s6)"><p class="roman" style="font-size:2rem">{r}</p><h3 style="font-size:1.2rem">{t}</h3><p>{d}</p></div>' for r,t,d in PROC[:3])}
  </div>
</section>

<section style="background:var(--paper);padding:var(--s12) var(--s5)">
  <p class="caps kicker" style="font-size:.66rem">From the Board</p>
  <h2 style="font-size:1.85rem;text-align:center;margin-bottom:var(--s3)">What we are baking</h2>
  <p style="font-style:italic;opacity:.78;text-align:center;margin-bottom:var(--s8)">Savory and organic ingredients &#8212; add what you want, leave out what you don&#8217;t.</p>
  {_featured_board(3, indent="  ")}
  <div style="margin-top:var(--s8)"><a href="#" class="btn btn-line" style="width:100%">The Full Bill of Fare</a></div>
</section>

<section style="background:var(--paper-4);padding:var(--s12) var(--s5);text-align:center">
  <p style="font-family:var(--serif);font-size:1.5rem;font-style:italic;line-height:1.46;
    margin-bottom:var(--s4)">Best Focaccia I&#8217;ve ever had. She definitely knows what she&#8217;s doing.</p>
  <p class="caps" style="color:var(--burgundy);font-size:.66rem">TonyandTasha Holden</p>
</section>

<section style="background:var(--paper-3);padding:var(--s12) var(--s5);text-align:center;
  border-top:1px solid var(--rule)">
  <div style="display:flex;justify-content:center;margin-bottom:var(--s5)">{olive_rule(150)}</div>
  <h2 style="font-size:1.7rem;margin-bottom:var(--s4)">Come Wednesday.<br>Come Saturday.<br>Come early.</h2>
  <p style="opacity:.8;margin-bottom:var(--s6)">We bake small and we sell out.</p>
  <a href="#" class="btn btn-fill" style="width:100%">Write to Us</a>
  <p style="margin-top:var(--s8);font-family:var(--script);font-size:2.1rem;color:var(--burgundy)">
    Love always, Oh! You Fancy Focaccia</p>
</section>"""

# ── write ─────────────────────────────────────────────────────────────
PAGES = [
  ("Loader",      LOADER,   1440,  900, LOADER_CSS),
  ("LoaderPhone", LOADER_M,  390,  844, LOADER_CSS),
  ("Main",        HOME,     1440, 5100, ""),
  ("Phone",       MOBILE,    390, 3550, ""),
  ("About",       ABOUT,    1440, 3900, ""),
  ("Breads",      BREADS,   1440, 4900, ""),
  ("Gallery",     GALLERY,  1440, 7600, ""),
  ("Reviews",     REVIEWS,  1440, 3300, ""),
  ("Contact",     CONTACT,  1440, 3700, ""),
]
for name, body, w, h, css in PAGES:
    with open(os.path.join(OUT, f"{name}.dc.html"), "w", encoding="utf-8") as f:
        f.write(page(body, w, h, css))
    print(f"  wrote {name}.dc.html")

canvas = {"artboards":[
  {"file":"Loader.dc.html","x":0,"y":0,"w":1440,"h":900,"title":"Loading screen","print":"fixed"},
  {"file":"LoaderPhone.dc.html","x":1560,"y":0,"w":390,"h":844,"title":"Loading - phone","print":"fixed"},
  {"file":"Main.dc.html","x":0,"y":1060,"w":1440,"h":5100,"title":"Home","print":"flow"},
  {"file":"Phone.dc.html","x":1560,"y":1060,"w":390,"h":3550,"title":"Home - phone","print":"flow"},
  {"file":"About.dc.html","x":0,"y":6320,"w":1440,"h":3900,"title":"About","print":"flow"},
  {"file":"Breads.dc.html","x":1560,"y":6320,"w":1440,"h":4900,"title":"Bill of Fare","print":"flow"},
  {"file":"Gallery.dc.html","x":0,"y":11380,"w":1440,"h":7600,"title":"Gallery","print":"flow"},
  {"file":"Reviews.dc.html","x":1560,"y":11380,"w":1440,"h":3300,"title":"Reviews","print":"flow"},
  {"file":"Contact.dc.html","x":0,"y":19200,"w":1440,"h":3700,"title":"Contact","print":"flow"}],
 "annotations":[
  {"id":"loader","x":-480,"y":0,"w":400,"text":"LOADING SCREEN — animates live, on a 9s loop.\n\nThe ring strokes itself on like a stamp pressed into a label, then the five things focaccia is made of arrive in turn — Farina, Acqua, Olio d'Oliva, Sale, Tempo — while a dimple presses into the dough for each one. That row of dimples IS the progress bar.\n\nBehind it, a Tuscan courtyard photograph sunk under a burgundy wash. Sugar Haus types a terminal; this proofs dough."},
  {"id":"identity","x":-480,"y":330,"w":400,"text":"OWN IDENTITY, not a Sugar Haus reskin.\n\nType: Bodoni Moda — the Italian didone — with EB Garamond and Italianno. Sugar Haus uses Playfair/Lora/Work Sans.\n\nAnatomy: centred label masthead, oval cartouches, an enamel market sign, a bill of fare with dotted leaders, vertical spine rails. Sugar Haus uses a left-logo navbar and centred card grids."},
  {"id":"gaps","x":-480,"y":700,"w":400,"text":"Palette is the logo's: burgundy #8E1B1B, olive #4E6023, gold #B8862F, paper #F4EFE2.\n\nThe standing menu prices are shared from menu.json. Remaining client confirmations are the market schedule/address, delivery and shipping boundaries, allergen/organic wording, and final brand photography."}],
 "launch":{"view":"canvas"}}
with open(os.path.join(OUT,"canvas.json"),"w",encoding="utf-8") as f:
    json.dump(canvas,f,indent=2)
print("  wrote canvas.json")
