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
import os, json
OUT = os.path.dirname(os.path.abspath(__file__))

FONTS = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
         'family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..700'
         '&amp;family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500'
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
  font-size:var(--base);line-height:1.72;-webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;font-feature-settings:"liga","kern"}
h1,h2,h3,h4{font-family:var(--serif);line-height:1.1;font-weight:600;text-wrap:balance}
p{text-wrap:pretty}
img,svg{display:block;max-width:100%}
a{color:var(--burgundy);text-decoration:none}
a:hover{color:var(--burgundy-deep)}
ul{list-style:none}

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
.fare-n{font-family:var(--serif);font-size:var(--sm);color:var(--gold);
  font-weight:600;width:34px;flex-shrink:0;letter-spacing:.1em}
.fare-b{flex-grow:1}
.fare-t{font-family:var(--serif);font-size:var(--lg);font-weight:600;
  display:flex;align-items:baseline;gap:var(--s3)}
.fare-t::after{content:'';flex-grow:1;border-bottom:1.5px dotted var(--rule);
  transform:translateY(-4px)}
.fare-d{font-size:var(--sm);opacity:.72;max-width:70ch;margin-top:var(--s2);
  font-style:italic}

/* ── enamel market sign ── */
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
  justify-content:center;overflow:hidden;
  background:radial-gradient(ellipse 92% 80% at 50% 42%,#5C1414 0%,#3A0C0C 46%,#240808 100%)}}
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

.ing-rail{{position:relative;height:96px;margin-top:var(--s8)}}
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

def logo_badge(size=200, draw=True):
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
  <img src="logo.webp" alt="Oh! You Fancy Focaccia" class="mark"
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
  <div class="frame"></div>
  {CORNER % 'tl'}{CORNER % 'tr'}{CORNER % 'bl'}{CORNER % 'br'}
  <div class="vig"></div>
  <div class="load-in">
    {logo_badge(214)}
    <div class="mark" style="margin-top:var(--s6)">
      <p style="font-family:var(--script);font-size:4.6rem;line-height:.78;color:#F2DFC0">Oh! You Fancy</p>
      <p style="font-family:var(--serif);font-size:2.2rem;font-weight:700;letter-spacing:.3em;
        text-transform:uppercase;color:#F2DFC0;margin-top:.55rem;padding-left:.3em">Focaccia</p>
    </div>

    <div class="ing-rail">
      {''.join(f'<div class="ing"><p class="ing-w">{w}</p><p class="ing-g">{g}</p></div>' for w,g in INGREDIENTS)}
    </div>

    <div class="dim-rail"><i></i><i></i><i></i><i></i><i></i></div>

    <div class="tag-line" style="margin-top:var(--s10)">
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

NAV = ["Home","About","Our Breads","Gallery","Reviews","Contact"]

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
    links = "".join(
      f'<a href="#" style="{"color:var(--burgundy);border-bottom:1px solid var(--burgundy)" if n==active else "color:var(--ink);opacity:.72"}" class="caps">{n}</a>'
      for n in NAV)
    return f"""<div style="background:var(--burgundy-ink);color:var(--gold-pale);
  text-align:center;padding:.55rem" class="caps">
  Brookings-Harbor Farmers Market &#183; Wednesdays &amp; Saturdays &#183; 9am &#8216;til sold out</div>
<header style="background:var(--paper);border-bottom:1px solid var(--rule);
  padding-block:var(--s8) 0;position:sticky;top:0;z-index:50;
  backdrop-filter:blur(12px)">
  <div style="text-align:center">
    <div style="display:flex;align-items:center;justify-content:center;gap:var(--s6)">
      {olive_rule(120)}
      <img src="logo.webp" alt="" style="width:62px;height:62px;border-radius:50%;flex-shrink:0">
      <a href="#" style="display:block">
        <p style="font-family:var(--script);font-size:2.9rem;line-height:.76;color:var(--burgundy)">Oh! You Fancy</p>
        <p style="font-family:var(--serif);font-size:1.18rem;font-weight:700;letter-spacing:.38em;
          text-transform:uppercase;color:var(--ink);margin-top:.32rem;padding-left:.38em">Focaccia</p>
      </a>
      {olive_rule(120,True)}
    </div>
    <nav style="display:flex;justify-content:center;gap:var(--s8);margin-top:var(--s6);
      border-top:1px solid var(--rule-soft);padding-block:var(--s4)">{links}</nav>
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
    <p style="font-family:var(--serif);font-size:3.1rem;font-weight:600;line-height:1.18;
      color:#F6E6C6">{lines}</p>
    {f'<p class="caps" style="color:oklch(.82 .09 75/.66);margin-top:var(--s5)">{small}</p>' if small else ''}
  </div>
</section>"""

def shot(src, h, alt="", cls="", extra=""):
    """A real photograph, framed like a plate."""
    return (f'<figure class="shot {cls}" style="height:{h}px;{extra}">'
            f'<img src="{src}" alt="{alt}"></figure>')

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
    <p style="font-family:var(--script);font-size:2.9rem;line-height:.8;color:#EBD3AE">Oh! You Fancy</p>
    <p style="font-family:var(--serif);font-size:1.05rem;font-weight:700;letter-spacing:.36em;
      text-transform:uppercase;color:#D8BFA0;margin-top:.4rem;padding-left:.36em">Focaccia</p>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--s12);
    border-top:1px solid oklch(1 0 0/.13);padding-top:var(--s12)">
    <div><p class="caps" style="color:#C9A46A;margin-bottom:var(--s4)">The Bakery</p>
      <p style="font-size:var(--sm);opacity:.82;max-width:36ch">Artisan focaccia baked by hand in Brookings, Oregon. Organic ingredients, a living sourdough starter, and small batches that sell out.</p></div>
    <div><p class="caps" style="color:#C9A46A;margin-bottom:var(--s4)">Explore</p>
      <ul style="display:flex;flex-direction:column;gap:.5rem;font-size:var(--sm)">
      {''.join(f'<li><a href="#" style="color:#D8BFA0">{n}</a></li>' for n in NAV[1:])}</ul></div>
    <div><p class="caps" style="color:#C9A46A;margin-bottom:var(--s4)">Find Us</p>
      <p style="font-size:var(--sm);opacity:.82">Brookings-Harbor Farmers Market<br>Wednesdays &amp; Saturdays<br>9am &#8216;til sold out</p>
      <p style="margin-top:var(--s4);font-size:var(--sm)"><a href="#" style="color:#EBD3AE">ohyoufancyfocaccia@gmail.com</a></p>
      <p style="margin-top:var(--s2);font-size:var(--sm)"><a href="#" style="color:#EBD3AE">Facebook</a></p></div>
  </div>
  <div style="border-top:1px solid oklch(1 0 0/.13);margin-top:var(--s12);padding-top:var(--s6);
    display:flex;justify-content:space-between;gap:var(--s6)">
    <p class="caps" style="color:oklch(.72 .05 60/.72);font-size:.66rem">&#169; 2026 Oh! You Fancy Focaccia</p>
    <p class="caps" style="color:oklch(.72 .05 60/.72);font-size:.66rem">Pane &#183; Amore &#183; Sempre</p>
  </div>
</div></footer>"""

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
PROC = [("I","Bend","The dough comes together slow. Organic flour, water, and a starter that has been going a while."),
        ("II","Snap","Air gets folded in, not beaten out. This is where the crumb is decided."),
        ("III","Stretch","Out to the corners by hand, never pressed flat by a machine."),
        ("IV","Fold","Rested, dimpled, drowned in good olive oil, and into the oven.")]

HOME = masthead("Home") + f"""
<section style="position:relative;background:var(--paper);padding-block:var(--s24);overflow:hidden">
  <div class="spine spine-l"><span>Brookings &#183; Oregon</span></div>
  <div class="spine spine-r"><span>Est. on the Chetco</span></div>
  <div class="wrap" style="position:relative;display:grid;grid-template-columns:1fr 1fr;
    gap:var(--s20);align-items:center">
    <div>
      <p class="caps kicker kicker-l" style="color:var(--olive)">Artisan Breads</p>
      <h1 style="font-size:var(--xxxl);font-weight:700;line-height:1.02;margin-bottom:var(--s6)">
        One bread,<br><span style="font-style:italic;font-weight:500">endlessly</span><br>argued over.</h1>
      <p style="font-size:var(--lg);opacity:.78;max-width:40ch;margin-bottom:var(--s8);line-height:1.62">
        We make focaccia. Only focaccia &#8212; savory and sweet, dimpled and blistered,
        organic through and through, and every loaf shaped by hand on the southern Oregon coast.</p>
      <div style="display:flex;gap:var(--s4);flex-wrap:wrap">
        <a href="#" class="btn btn-fill">See the Bill of Fare</a>
        <a href="#" class="btn btn-line">Find Us at the Market</a>
      </div>
    </div>
    <div style="position:relative;display:flex;justify-content:center">
      {shot("hero-garden.webp",530,"Focaccia painted in herbs and vegetables","shot-oval","width:430px")}
      <div style="position:absolute;bottom:-16px;left:50%;transform:translateX(-50%)">
        {olive_rule(190)}</div>
    </div>
  </div>
</section>

{enamel("Il Mercato","Wednesdays &amp; Saturdays<br>9am &#8216;til sold out",
  "Brookings-Harbor Farmers Market &#183; Port of Brookings Harbor", bg="wide-slab.webp")}

<section class="sec" style="background:var(--paper-3)">
  <div class="wrap">
    <p class="caps kicker">Il Processo</p>
    <h2 class="h-sec">Bend, snap, stretch, fold</h2>
    <p class="lede">Four moves, in that order, every time. It is the whole method and it takes all day.</p>
    {dimple_rule()}
    <div class="grid g4">
      {''.join(f'''<div class="plate"><p class="roman">{r}</p><h3>{t}</h3><p>{d}</p></div>'''
               for r,t,d in PROC)}
    </div>
  </div>
</section>

<section class="sec" style="background:var(--paper)">
  <div class="wrap" style="display:grid;grid-template-columns:1.15fr .85fr;gap:var(--s16);
    align-items:start">
    <div>
      <p class="caps kicker kicker-l">From the Board</p>
      <h2 style="font-size:var(--xl);margin-bottom:var(--s3);text-align:left">What we are baking</h2>
      <p style="opacity:.74;font-style:italic;margin-bottom:var(--s8)">The board turns over with the season and with whatever our neighbours are growing.</p>
      <div class="fare"><span class="fare-n">I</span><div class="fare-b">
        <p class="fare-t"><span>Olive &amp; Sun-Dried Tomato Swirl</span></p>
        <p class="fare-d">Green and kalamata olives, sun-dried tomato, herbs, grated cheese. Crisp at the edge, soft through the middle.</p></div></div>
      <div class="fare"><span class="fare-n">II</span><div class="fare-b">
        <p class="fare-t"><span>Jalape&#241;o, Olive &amp; Red Onion</span></p>
        <p class="fare-d">The round people recognise us by. Golden, dimpled, generous.</p></div></div>
      <div class="fare"><span class="fare-n">III</span><div class="fare-b">
        <p class="fare-t"><span>Cinnamon Swirl, Vanilla Drizzle</span></p>
        <p class="fare-d">A whole pan pulled apart in ridges and glazed while still warm.</p></div></div>
      <div class="fare"><span class="fare-n">IV</span><div class="fare-b">
        <p class="fare-t"><span>Peppered Pickle Muffins</span></p>
        <p class="fare-d">Brookings Pickled Goodies&#8217; spicy bread-and-butter pickles folded straight into the dough.</p></div></div>
      <div class="fare" style="border-bottom:none"><span class="fare-n">V</span><div class="fare-b">
        <p class="fare-t"><span>Hearts &amp; Flower Gardens</span></p>
        <p class="fare-d">Focaccia painted in vegetables and herbs. Almost too pretty to tear into.</p></div></div>
      <div style="margin-top:var(--s8)"><a href="#" class="btn btn-line">The Full Bill of Fare</a></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:var(--s6)">
      {shot("savory-round.webp",330,"Jalapeno, olive and red onion focaccia")}
      {shot("sweet-cinnamon.webp",300,"Cinnamon swirl focaccia with vanilla drizzle")}
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
    <p class="caps" style="opacity:.5;margin-top:var(--s6);font-size:.68rem">100% recommend &#183; 9 reviews</p>
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
        <p style="font-size:var(--sm);opacity:.74">Award-winning raw honey from the Chetco River, over our focaccia bites.</p></div></div>
      <div style="display:flex;gap:var(--s5);align-items:baseline;padding-block:var(--s5);
        border-bottom:1px solid var(--rule-soft)">
        <span class="fare-n">&#8212;</span><div><h3 style="font-size:var(--lg)">The Dawg House</h3>
        <p style="font-size:var(--sm);opacity:.74">Monica builds her sandwiches on our bread, two stalls down.</p></div></div>
      <div style="display:flex;gap:var(--s5);align-items:baseline;padding-block:var(--s5);
        border-bottom:1px solid var(--rule-soft)">
        <span class="fare-n">&#8212;</span><div><h3 style="font-size:var(--lg)">Shalom Coffee Roasting</h3>
        <p style="font-size:var(--sm);opacity:.74">Our market neighbours, and the right cup beside a warm piece.</p></div></div>
    </div>
  </div>
</section>

<section style="background:var(--paper-3);padding-block:var(--s20);text-align:center;
  border-top:1px solid var(--rule)">
  <div class="narrow">
    <div style="display:flex;justify-content:center;margin-bottom:var(--s6)">{olive_rule(190)}</div>
    <h2 style="font-size:var(--xl);margin-bottom:var(--s4)">Come Wednesday. Come early.</h2>
    <p style="opacity:.76;margin-bottom:var(--s8);font-style:italic">
      We bake small and we sell out. Questions, delivery or shipping &#8212; just write.</p>
    <a href="#" class="btn btn-fill">ohyoufancyfocaccia@gmail.com</a>
    <p style="margin-top:var(--s10);font-family:var(--script);font-size:2.6rem;color:var(--burgundy)">
      Love always, Oh! You Fancy Focaccia</p>
  </div>
</section>
""" + FOOTER

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
("Savory and sweet both","There are so many options when it comes to focaccia. We are still finding new ones."),
("Baked with love","The one ingredient we cannot buy and will not skip. Our customers taste it, and they say so.")]

ABOUT = masthead("About") + head_band("La Nostra Storia","Welcome to Oh! You Fancy Focaccia",
  "A small-batch bakery on the southern Oregon coast, run by Amanda &#8212; doing what she loves, where she loves to be.") + f"""
<section class="sec" style="background:var(--paper)">
  <div class="wrap" style="display:grid;grid-template-columns:.9fr 1.1fr;gap:var(--s16);align-items:center">
    <div style="display:flex;flex-direction:column;align-items:center;gap:var(--s4)">
      {shot("art-garden.webp",500,"A flower garden painted across focaccia","shot-oval","width:400px")}
      <p class="caps" style="font-size:.62rem;opacity:.5;text-align:center">
        [PORTRAIT OF AMANDA &#8212; if she would like one here]</p>
    </div>
    <div>
      <p class="caps kicker kicker-l">From Our Kitchen</p>
      <h2 style="font-size:var(--xl);text-align:left;margin-bottom:var(--s6)">From our kitchen<br>to your table</h2>
      <p style="opacity:.8;margin-bottom:var(--s5)">Oh! You Fancy Focaccia is a family-run bakery in Brookings, Oregon, on the Curry County coast.</p>
      <p style="opacity:.8;margin-bottom:var(--s5)">What started as a love of bread became a booth at the Brookings-Harbor Farmers Market &#8212; and then loaves going out to neighbours, friends, and folks far enough away that we had to start shipping.</p>
      <p style="opacity:.8;margin-bottom:var(--s5)">We bake savory and sweet focaccia with organic ingredients: olives and garlic and jalape&#241;o, sun-dried tomato and herbs, cinnamon and honey. We infuse our neighbours&#8217; pickles and drizzle our neighbours&#8217; honey.</p>
      <p style="opacity:.8;margin-bottom:var(--s8)">Every Wednesday and Saturday the crates come out, the gold paper bags get filled, and we hand out samples until the last loaf is gone.</p>
      <div style="border-left:2px solid var(--burgundy);padding-left:var(--s6)">
        <p style="font-style:italic">Thank you to our customers, our friends, our family, and our Father in Heaven for supporting our small business.</p>
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

{enamel("Trovaci","Wednesdays &amp; Saturdays<br>9am &#8216;til sold out","ohyoufancyfocaccia@gmail.com")}
""" + FOOTER

# ══ OUR BREADS ════════════════════════════════════════════════════════
def fare(n, title, desc):
    return f"""<div class="fare"><span class="fare-n">{n}</span><div class="fare-b">
      <p class="fare-t"><span>{title}</span></p><p class="fare-d">{desc}</p></div></div>"""

def course(title, ital, rows, cap):
    return f"""<div style="margin-bottom:var(--s20)">
  <div style="display:grid;grid-template-columns:1fr 300px;gap:var(--s12);align-items:start">
    <div>
      <p class="caps" style="color:var(--olive);margin-bottom:var(--s2)">{ital}</p>
      <h2 style="font-size:var(--xl);text-align:left;margin-bottom:var(--s2)">{title}</h2>
      <div style="width:64px;height:2px;background:var(--burgundy);margin-bottom:var(--s4)"></div>
      {''.join(rows)}
    </div>
    {shot(cap[0], 360, cap[1])}
  </div>
</div>"""

BREADS = masthead("Our Breads") + head_band("La Lista","The Bill of Fare",
  "What comes out of the oven changes with the season, and with whatever our neighbours are growing.") + f"""
<section class="sec" style="background:var(--paper)">
  <div class="wrap">
    {course("Savory","I Salati",[
      fare("I","Olive &amp; Sun-Dried Tomato Swirl","A spiralled round layered with green and kalamata olives, sun-dried tomato, herbs and grated cheese. Crisp at the edges, soft through the middle."),
      fare("II","Jalape&#241;o, Olive &amp; Red Onion","Our signature round &#8212; fresh jalape&#241;o, mixed olives, red onion and herbs across a golden, dimpled crust."),
      fare("III","Roasted Garlic &amp; Sea Salt","Simple and perfect. Olive oil, roasted garlic and flaky salt on a pillowy sourdough crumb."),
      fare("IV","Cheesy Jalape&#241;o","Melted and bubbling, with jalape&#241;o baked right into the top."),
    ],("savory-round.webp","Jalapeno, olive and red onion focaccia"))}
    {course("Sweet","I Dolci",[
      fare("V","Cinnamon Swirl with Vanilla Drizzle","A whole pan of cinnamon-laced focaccia pulled apart in golden ridges and finished with a vanilla glaze."),
      fare("VI","Honey Focaccia Bites","Pull-apart bites, boxed and drizzled with award-winning Chetco Gold raw honey from right here on the Chetco River."),
    ],("sweet-cinnamon.webp","Cinnamon swirl focaccia with vanilla drizzle"))}
    {course("Muffins &amp; Rolls","I Piccoli",[
      fare("VII","Jalape&#241;o &amp; Roasted Garlic","Hand-sized, crisp-edged, crowned with jalape&#241;o and toasted garlic."),
      fare("VIII","Peppered Pickle","Made with Brookings Pickled Goodies&#8217; spicy bread-and-butter pickles infused right into the dough. Organic ingredients only."),
      fare("IX","Sea Salt Rolls","Soft pull-apart rounds, olive-oil brushed and salt flaked."),
    ],("muffins-jalapeno.webp","Jalapeno and roasted garlic focaccia muffins"))}
    {course("Focaccia Art","L&#8217;Arte",[
      fare("X","Heart Loaves","Little hand-shaped hearts. They go fast."),
      fare("XI","Flower Gardens","Hand-painted in vegetables and herbs &#8212; a whole garden across the top of the dough."),
      fare("XII","Seasonal &amp; Custom","Tell us the occasion. We have made a great many things that were never on a list."),
    ],("heart-loaf.webp","A hand-shaped focaccia heart"))}
  </div>
</section>

<section class="sec" style="background:var(--paper-3);border-block:1px solid var(--rule)">
  <div class="wrap">
    <p class="caps kicker">Come Si Mangia</p>
    <h2 class="h-sec">Our customers are more<br>inventive than we are</h2>
    {dimple_rule()}
    <div class="grid g4">
      <div class="plate"><h3>As pizza</h3><p style="font-style:italic">&#8220;It was delicious the way it is, but turning it into a pizza was super fast and easy.&#8221;</p></div>
      <div class="plate"><h3>As a sandwich</h3><p>Go see Monica at The Dawg House &#8212; she builds hers on our focaccia at the market.</p></div>
      <div class="plate"><h3>As toast</h3><p>Avocado, feta and heirloom tomatoes on a thick slice. A customer sent us that one.</p></div>
      <div class="plate"><h3>As it comes</h3><p>Warm, torn by hand, with good olive oil. Honestly the best way.</p></div>
    </div>
    <div style="max-width:660px;margin:var(--s16) auto 0;padding:var(--s10);
      background:var(--paper-2);border:1px dashed var(--rule);text-align:center">
      <p class="caps" style="color:var(--burgundy);margin-bottom:var(--s3)">Prices</p>
      <p style="opacity:.76;font-style:italic">[PRICES TO BE SUPPLIED] &#8212; ask at the market, or write for delivery and shipping.</p>
    </div>
  </div>
</section>
""" + FOOTER

# ══ GALLERY ═══════════════════════════════════════════════════════════
GAL = [
 ("swirl-jalapeno.webp","Jalape&#241;o Cheese Swirl","Spiralled, layered and blistered at the edge.",300),
 ("heart-loaf.webp","Heart Loaf","Little hand-shaped hearts. They go fast.",300),
 ("art-garden.webp","Flower Garden","Painted in herbs and vegetables, one stem at a time.",395),
 ("sweet-cinnamon.webp","Cinnamon Swirl","A whole pan, pulled apart in ridges and glazed.",430),
 ("savory-round.webp","Jalape&#241;o, Olive &amp; Red Onion","The round people recognise us by.",300),
 ("honey-bites.webp","Honey Bites","Boxed, and drizzled with Chetco Gold raw honey.",360),
 ("olive-slab.webp","Olive Slab","Green and kalamata, pressed into the dimples.",400),
 ("muffins-jalapeno.webp","Jalape&#241;o &amp; Garlic Muffins","Hand-sized, crowned with toasted garlic.",300),
 ("lemon-pepper.webp","Lemon Pepper &amp; Garlic","Cracked pepper, lemon zest, plenty of oil.",300),
 ("rosemary-slab.webp","Rosemary &amp; Sea Salt","The plain one. Hardest to get right.",390),
 ("cheesy-jalapeno.webp","Cheesy Jalape&#241;o","Melted, bubbling, baked right into the top.",280),
 ("herb-rolls.webp","Herb Rolls","Sage, rosemary and garlic, pulled apart warm.",300),
 ("olive-tomato.webp","Olive &amp; Sun-Dried Tomato","Crisp at the edge, soft through the middle.",300),
 ("skillet.webp","Skillet Focaccia","Baked in cast iron, green with herbs.",240),
 ("sea-salt-round.webp","Sea Salt Round","Olive-oil brushed, salt flaked, still warm.",300),
 ("parm-muffins.webp","Garlic Parmesan Muffins","Crisp-edged and golden all over.",300)]

GALLERY = masthead("Gallery") + head_band("La Galleria","Fresh From the Oven",
  "Straight from the tray, and straight from the market table.") + f"""
<section class="sec" style="background:var(--paper)">
  <div class="wrap">
    <div style="columns:3;column-gap:var(--s6)">
      {''.join(f'''<figure style="break-inside:avoid;margin-bottom:var(--s8)">
        <div class="shot" style="height:{h}px"><img src="{f}" alt="{n}"></div>
        <figcaption style="padding-top:var(--s4);border-top:1px solid var(--rule-soft);margin-top:var(--s3)">
          <p class="caps" style="font-size:.68rem">{n}</p>
          <p style="font-size:var(--sm);opacity:.72;font-style:italic;margin-top:var(--s1)">{c}</p>
        </figcaption></figure>''' for f,n,c,h in GAL)}
    </div>
  </div>
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
      {quote("Who has tried the Focaccia from the Brookings Farmers market?? They have sweet and savory flavors. The samples were amazing so I bought the &#8216;Oh you Fancy.&#8217; It was delicious the way it is but turning into a pizza was super fast and easy. Go see Amanda, you will love it.","A neighbour in Brookings")}
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
("Do you deliver?","Yes &#8212; around Brookings and Harbor. Write to us and we will sort out the details."),
("Do you ship?","We do. Send us a note and let us know where you are."),
("Are your ingredients organic?","We bake with organic ingredients, and we say so on every loaf we are proud of."),
("Can you make something custom?","Tell us the occasion. We have made hearts, flower gardens, and plenty of things that were never on a menu."),
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
  <div class="wrap" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--s16);align-items:start">
    <div>
      <p class="caps kicker kicker-l">Get in Touch</p>
      <div style="margin-top:var(--s4)">
        {contact_row(IC_MAIL,"Email","The fastest way to reach us. We answer every message.","ohyoufancyfocaccia@gmail.com")}
        {contact_row(IC_FB,"Facebook","That is where the fresh bakes get posted first.","Oh! You Fancy Focaccia")}
        {contact_row(IC_PIN,"Where We Are","Brookings, Oregon &#8212; on the southern Oregon coast, in Curry County.")}
      </div>
      <div style="margin-top:var(--s8);padding:var(--s6);background:var(--paper-2);
        border:1px dashed var(--rule)">
        <p class="caps" style="color:var(--burgundy);margin-bottom:var(--s2);font-size:.68rem">Telephone</p>
        <p style="opacity:.74;font-size:var(--sm);font-style:italic">[PHONE NUMBER &#8212; if you want one public]</p>
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
        <p style="opacity:.74;font-size:var(--sm);margin-top:var(--s6);font-style:italic">
          Port of Brookings Harbor. Come early and come hungry &#8212; there are always samples, and we do sell out.</p>
        {slot(180,'Map &#183; Port of Brookings Harbor')}
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
  <div class="frame" style="inset:18px"></div>
  <div class="vig"></div>
  <div class="load-in">
    {logo_badge(150)}
    <div class="mark" style="margin-top:var(--s5)">
      <p style="font-family:var(--script);font-size:3.1rem;line-height:.78;color:#F2DFC0">Oh! You Fancy</p>
      <p style="font-family:var(--serif);font-size:1.4rem;font-weight:700;letter-spacing:.3em;
        text-transform:uppercase;color:#F2DFC0;margin-top:.45rem;padding-left:.3em">Focaccia</p>
    </div>
    <div class="ing-rail" style="height:76px;margin-top:var(--s6)">
      {''.join(f'<div class="ing"><p class="ing-w" style="font-size:1.85rem">{w}</p><p class="ing-g" style="font-size:.6rem">{g}</p></div>' for w,g in INGREDIENTS)}
    </div>
    <div class="dim-rail" style="gap:13px">{'<i></i>'*5}</div>
    <div class="tag-line" style="margin-top:var(--s8)">
      <p style="font-family:var(--serif);font-size:.66rem;font-weight:600;letter-spacing:.36em;
        text-transform:uppercase;color:#D9A94E">Pane &#183; Amore &#183; Sempre</p></div>
    <div class="enter" style="margin-top:var(--s6)"><a href="#" class="btn btn-pale">Entra</a></div>
  </div>
</div>"""

MOBILE = f"""
<div style="background:var(--burgundy-ink);color:var(--gold-pale);text-align:center;
  padding:.5rem .5rem" class="caps" style="font-size:.58rem">
  Wed &amp; Sat &#183; 9am &#8216;til sold out</div>
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
    One bread,<br><span style="font-style:italic;font-weight:500">endlessly</span><br>argued over.</h1>
  <p style="text-align:center;opacity:.78;margin-bottom:var(--s6)">We make focaccia. Only focaccia &#8212; dimpled, blistered, organic, and shaped by hand.</p>
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
  <h2 style="font-size:1.85rem;text-align:center;margin-bottom:var(--s8)">What we are baking</h2>
  {fare("I","Olive &amp; Sun-Dried Tomato Swirl","Olives, sun-dried tomato, herbs, grated cheese.")}
  {fare("II","Jalape&#241;o, Olive &amp; Red Onion","The round people recognise us by.")}
  {fare("III","Cinnamon Swirl, Vanilla Drizzle","Pulled apart in ridges and glazed while warm.")}
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
  <h2 style="font-size:1.7rem;margin-bottom:var(--s4)">Come Wednesday.<br>Come early.</h2>
  <p style="opacity:.76;font-style:italic;margin-bottom:var(--s6)">We bake small and we sell out.</p>
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
  ("Gallery",     GALLERY,  1440, 3400, ""),
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
  {"file":"Gallery.dc.html","x":0,"y":11380,"w":1440,"h":3400,"title":"Gallery","print":"flow"},
  {"file":"Reviews.dc.html","x":1560,"y":11380,"w":1440,"h":3300,"title":"Reviews","print":"flow"},
  {"file":"Contact.dc.html","x":0,"y":14940,"w":1440,"h":3700,"title":"Contact","print":"flow"}],
 "annotations":[
  {"id":"loader","x":-480,"y":0,"w":400,"text":"LOADING SCREEN — animates live, on a 9s loop.\n\nThe ring strokes itself on like a stamp pressed into a label, then the five things focaccia is made of arrive in turn — Farina, Acqua, Olio d'Oliva, Sale, Tempo — while a dimple presses into the dough for each one. That row of dimples IS the progress bar.\n\nSugar Haus types a terminal; this proofs dough."},
  {"id":"identity","x":-480,"y":330,"w":400,"text":"OWN IDENTITY, not a Sugar Haus reskin.\n\nType: Bodoni Moda — the Italian didone — with EB Garamond and Italianno. Sugar Haus uses Playfair/Lora/Work Sans.\n\nAnatomy: centred label masthead, oval cartouches, an enamel market sign, a bill of fare with dotted leaders, vertical spine rails. Sugar Haus uses a left-logo navbar and centred card grids."},
  {"id":"gaps","x":-480,"y":700,"w":400,"text":"Palette is the logo's: burgundy #8E1B1B, olive #4E6023, gold #B8862F, paper #F4EFE2.\n\nEvery tan panel is a photo slot. Bracketed text marks the two facts we do not have — prices and a phone number. Nothing invented."}],
 "launch":{"view":"canvas"}}
with open(os.path.join(OUT,"canvas.json"),"w",encoding="utf-8") as f:
    json.dump(canvas,f,indent=2)
print("  wrote canvas.json")
