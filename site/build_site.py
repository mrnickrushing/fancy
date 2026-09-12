# -*- coding: utf-8 -*-
"""Emit the deployable static site from the design canvas source.

The canvas artboards in ../design are Claude Design components — they carry an
<x-dc> wrapper and a support.js shim and are not servable pages. This script
reuses their content and token system and emits real HTML into public/:
nav links that go somewhere, responsive rules, a working loading screen, and
the head metadata a live site needs.

    python3 site/build_site.py
"""
import os, re, sys, shutil, json, hashlib

ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESIGN = os.path.join(ROOT, "design")
PUBLIC = os.path.join(ROOT, "public")
sys.path.insert(0, DESIGN)

import _build as D  # noqa: E402  (importing regenerates the .dc.html artboards; harmless)
import pages as P   # noqa: E402  (the order page and the admin — served, never on the canvas)

EMAIL = "info@ohyoufancyfocaccia.com"
FB    = "https://www.facebook.com/profile.php?id=61584072034572"

PAGES = [
    ("index.html",   D.HOME,    "Oh! You Fancy Focaccia — Artisan Focaccia in Brookings, Oregon",
     "Small-batch organic focaccia and sourdough, baked by hand in Brookings, Oregon. Find us "
     "at the Brookings-Harbor Farmers Market, Wednesdays and Saturdays, 9am 'til sold out."),
    ("about.html",   D.ABOUT,   "About — Oh! You Fancy Focaccia",
     "A small-batch focaccia and sourdough bakery on the southern Oregon coast, run by Amanda."),
    ("breads.html",  D.BREADS,  "The Bill of Fare — Oh! You Fancy Focaccia",
     "Sourdough loaves, savory and sweet focaccia, focaccia muffins and focaccia art, baked with organic ingredients."),
    ("gallery.html", D.GALLERY, "Gallery — Oh! You Fancy Focaccia",
     "Thirty-one bakes, straight from the tray and straight from the market table."),
    ("reviews.html", D.REVIEWS, "Reviews — Oh! You Fancy Focaccia",
     "100% recommend across 9 reviews. What our customers say."),
    ("contact.html", D.CONTACT, "Contact — Oh! You Fancy Focaccia",
     "Questions, delivery, shipping, or something particular for an occasion."),
    ("order.html",   P.ORDER,   "Order — Oh! You Fancy Focaccia",
     "Order focaccia and sourdough for market pickup, local delivery or shipping. We confirm every order by email."),
    ("policies.html", P.POLICIES, "Policies — Oh! You Fancy Focaccia",
     "Ordering, allergen, privacy, and contact policies for Oh! You Fancy Focaccia."),
]

UTILITY_PAGES = [("404.html", P.NOT_FOUND, "Page not found — Oh! You Fancy Focaccia")]

# Served by the order book, never linked from the site and never indexed.
ADMIN_PAGES = [
    ("admin.html",       P.ADMIN,       "The Order Book — Oh! You Fancy Focaccia"),
    ("admin-login.html", P.ADMIN_LOGIN, "Sign In — Oh! You Fancy Focaccia"),
]

# Which script each page carries. Every script is its own file so the
# server can keep a CSP without unsafe-inline.
# Which scripts each page carries, in load order. Every script is its own
# file so the server can keep a CSP without unsafe-inline. nav.js runs the
# masthead drawer and the shrink-on-scroll on every public page.
NAV_JS = ["nav.js"]
SCRIPTS = {"index.html": NAV_JS + ["splash.js"], "order.html": NAV_JS + ["order.js"],
           "reviews.html": NAV_JS + ["reviews.js"], "about.html": NAV_JS,
           "breads.html": NAV_JS, "gallery.html": NAV_JS, "contact.html": NAV_JS,
           "policies.html": NAV_JS, "404.html": NAV_JS,
           "admin.html": ["admin.js"], "admin-login.html": ["admin-login.js"]}

NAV = {"Home": "./", "About": "./about.html", "Our Breads": "./breads.html", "Order": "./order.html",
       "Gallery": "./gallery.html", "Reviews": "./reviews.html", "Contact": "./contact.html",
       "Policies": "./policies.html"}

# link text -> destination, for buttons and inline links the artboards left as "#"
LINKS = {
    "See the Bill of Fare": "./breads.html",
    "The Full Bill of Fare": "./breads.html",
    "Find Us at the Market": "./contact.html",
    "Entra": "./",
    "Order for Pickup": "./order.html",
    "Place an Order": "./order.html",
    "View the Order Page": "./order.html",
    EMAIL: f"mailto:{EMAIL}",
    "Oh! You Fancy Focaccia": FB,
    "Facebook": FB,
    "Rushing Technologies": "https://rushingtechnologies.com",
    # the build credit in the footer; rewrite_links gives it target=_blank

    "Write to Us": f"mailto:{EMAIL}",
    "Read the Reviews": "./reviews.html",
}

def rewrite_assets(html):
    """Canvas artboards reference images by bare filename — the runtime resolves
    them from the document's own file table. A real server needs a real path."""
    html = re.sub(r'\bsrc="([a-z0-9-]+\.(?:webp|png|jpg|svg))"', r'src="./img/\1"', html)
    html = re.sub(r'data-src="([a-z0-9-]+\.(?:webp|png|jpg|svg))"', r'data-src="./img/\1"', html)
    html = re.sub(r'url\(\./([a-z0-9-]+\.(?:webp|png|jpg|svg))\)', r'url(./img/\1)', html)
    return html

def rewrite_links(html):
    """Point every href="#" at something real, by the link's own text."""
    def sub(m):
        attrs, text = m.group(1), m.group(2)
        label = re.sub(r"<[^>]+>", "", text).strip()
        dest = NAV.get(label) or LINKS.get(label)
        if dest is None:
            # the masthead wordmark and footer emblem are unlabelled — send them home
            dest = "./" if ("brand" in attrs or "<img" in text or "focaccia" in text.lower()) else "./"
        ext = ' target="_blank" rel="noopener"' if dest.startswith("http") else ""
        return f'<a href="{dest}"{attrs}{ext}>{text}</a>'
    return re.sub(r'<a href="#"([^>]*)>(.*?)</a>', sub, html, flags=re.S)

# ── responsive rules ─────────────────────────────────────────────────
# The artboards are fixed 1440 desktop compositions. These are the rules
# that make the same markup survive a phone.
RESPONSIVE = """
html{overflow-x:clip}
img{max-width:100%;height:auto}
.wrap,.mid,.narrow{width:100%}

.skip-link{position:fixed;left:var(--s4);top:var(--s4);z-index:1000;transform:translateY(-180%);background:var(--burgundy);color:var(--paper);padding:.7rem 1rem;border-radius:var(--r-sm);font-family:var(--serif);font-weight:600}
.skip-link:focus{transform:translateY(0)}

@media (max-width:1100px){
  .spine{display:none}
  .wrap{padding-inline:var(--s6)}
  :root{--xxxl:3.4rem;--xxl:2.5rem;--xl:1.8rem}
}
@media (max-width:900px){
  .g4{grid-template-columns:repeat(2,minmax(0,1fr))}
  .g3{grid-template-columns:repeat(2,minmax(0,1fr))}
  .sec{padding-block:var(--s16)}
  /* every two-column composition stacks */
  .duo{grid-template-columns:1fr;gap:var(--s10)}
  .ftr-cols{grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s10)}
  .hero-grid{grid-template-columns:1fr!important;gap:var(--s10)!important}
  .oval,.shot-oval{width:100%!important;max-width:420px;margin-inline:auto}
}
@media (max-width:640px){
  :root{--xxxl:2.6rem;--xxl:2rem;--xl:1.55rem;--lg:1.2rem;--base:1rem}
  .wrap,.mid,.narrow{padding-inline:var(--s5)}
  .g2,.g3,.g4{grid-template-columns:1fr}
  .sec{padding-block:var(--s12)}
  .btn{width:100%;padding-inline:var(--s5)}
  .hero{padding-block:var(--s12)}
  .hero-cta .btn{min-width:0;width:100%}
  .enamel{padding-block:var(--s10)}
  .enamel-lead{font-size:1.9rem}
  .fare-t{flex-wrap:wrap}
  .fare-t::after{display:none}
  .gal{grid-template-columns:1fr}
  .ftr-cols{grid-template-columns:1fr;gap:var(--s8)}
  .ftr-bot{flex-direction:column;gap:var(--s3)}
}

/* ── masthead: rail above, drawer below ──────────────────────────────
   The horizontal rail measured 833px of links inside a 390px viewport,
   so four of the eight destinations sat off-screen behind a scrollbar
   that had been hidden. Under 900px the rail is replaced outright by a
   button and a full-width drawer. */
@media (max-width:900px){
  .brand-row > svg{display:none}
  html.js .nav-rail{display:none}
  html.js .nav-toggle{display:inline-flex}
  .nav-drawer[data-open="1"]{display:block}
  .mast-in{padding-block:var(--s3)}
  /* with the script blocked there is no drawer to open, so the rail stays
     and is allowed a visible scrollbar rather than a hidden one */
  html:not(.js) .nav-rail{overflow-x:auto;flex-wrap:nowrap;justify-content:flex-start;
    padding-inline:var(--s5)}
  html:not(.js) .nav-link{white-space:nowrap;flex-shrink:0}
}
@media (max-width:640px){
  .brand-script{font-size:2.9rem}
  .brand-caps{font-size:1.02rem;letter-spacing:.28em}
  .brand-mark{width:54px;height:54px}
  .brand-row{gap:var(--s4);padding-inline:var(--s4)}
}
@media print{.splash{display:none!important}}
"""

# ── loading screen, for real this time ───────────────────────────────
# The canvas version loops forever so it can be seen on an artboard. Here it
# runs once, can be skipped, and does not replay as you move around the site.
SPLASH_CSS = """
.splash{position:fixed;inset:0;z-index:999;display:flex;align-items:center;justify-content:center;
  overflow:hidden;background:#240808;
  transition:opacity .85s var(--ease),visibility .85s var(--ease)}
/* the courtyard drifts in and settles, the way a curtain lifts on it */
.splash .scene{position:absolute;inset:0;width:100%;height:100%;opacity:0;transform:scale(1.07);
  object-fit:cover;object-position:50% 45%;
  transition:opacity 1.8s var(--ease),transform 12s linear}
.splash .scene.on{opacity:1;transform:scale(1)}
.splash-badge{position:relative;margin:0 auto;
  /* the label is the picture on this screen, so it takes as much of the
     viewport as the column below it can spare */
  width:min(460px,40vh,80vw);height:min(460px,40vh,80vw)}
.splash .wash{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,oklch(.40 .14 28/.50) 0%,oklch(.33 .13 28/.64) 46%,
    oklch(.22 .10 28/.86) 100%)}
.splash[hidden]{opacity:0;visibility:hidden;pointer-events:none;display:flex}
/* a safety net for viewports too short for the column — never a visible bar */
.splash{overflow-y:auto;scrollbar-width:none}
.splash::-webkit-scrollbar{display:none}
.splash-in{margin-block:auto;padding-block:var(--s8) 76px}  /* room for the skip line */
.splash::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:.4;
  background-image:radial-gradient(oklch(.9 .08 75/.10) .6px,transparent .6px);background-size:4px 4px}
.splash .vig{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse 68% 60% at 50% 46%,transparent 40%,oklch(.12 .05 30/.62))}
.splash .frame{position:absolute;inset:28px;border:1px solid oklch(.85 .07 80/.22)}
.splash .frame::before{content:'';position:absolute;inset:9px;border:1px solid oklch(.85 .07 80/.11)}
.splash-in{position:relative;z-index:2;text-align:center;padding-inline:var(--s6)}
.splash-script{font-family:var(--script);font-size:4.6rem;line-height:.78;color:#F2DFC0}
.splash-caps{font-family:var(--serif);font-size:2.2rem;font-weight:700;letter-spacing:.3em;
  text-transform:uppercase;color:#F2DFC0;margin-top:.55rem;padding-left:.3em}
.splash-mark{opacity:0;transform:translateY(9px);transition:opacity .9s var(--ease),transform .9s var(--ease)}
.splash-mark.on{opacity:1;transform:none}
.splash-ring circle.draw{stroke-dasharray:604;stroke-dashoffset:604;
  transition:stroke-dashoffset 1.5s var(--ease)}
.splash-ring.on circle.draw{stroke-dashoffset:0}
.ing-rail{position:relative;height:96px;margin-top:var(--s6)}
.ing{position:absolute;inset:0;opacity:0;transform:translateY(7px);
  transition:opacity .42s var(--ease),transform .42s var(--ease)}
.ing.on{opacity:1;transform:none}
.ing.gone{opacity:0;transform:translateY(-7px)}
.ing-w{font-family:var(--serif);font-size:2.5rem;font-weight:500;font-style:italic;color:#F2DFC0;line-height:1.15}
.ing-g{font-family:var(--serif);font-size:.66rem;font-weight:600;letter-spacing:.4em;
  text-transform:uppercase;color:oklch(.78 .08 70/.62);margin-top:var(--s2)}
.dim-rail{display:flex;justify-content:center;gap:16px;color:#D9A94E;margin-top:var(--s6)}
.dim-rail i{display:block;width:12px;height:12px;border-radius:50%;background:transparent;
  box-shadow:inset 0 0 0 1px currentColor;opacity:.22;transform:scale(.4);
  transition:all .45s var(--ease)}
.dim-rail i.on{background:currentColor;opacity:1;transform:scale(1);
  box-shadow:inset 0 1px 2px oklch(0 0 0/.35)}
.splash-tag,.splash-enter{opacity:0;transform:translateY(8px);
  transition:opacity .7s var(--ease),transform .7s var(--ease)}
.splash-tag.on,.splash-enter.on{opacity:1;transform:none}
.splash-skip{position:absolute;bottom:38px;left:0;right:0;text-align:center;opacity:0;
  transition:opacity .7s var(--ease)}
.splash-skip.on{opacity:1}
body.splashing{overflow:hidden}
@media (max-width:640px){
  .ing-w{font-size:1.8rem}.ing-rail{height:76px;margin-top:var(--s6)}
  .splash .frame{inset:16px}
  .splash-script{font-size:3.1rem}
  .splash-caps{font-size:1.3rem}
  .splash-tag{margin-top:var(--s6)!important}
  .splash-enter{margin-top:var(--s6)!important}
  /* a phone has no keyboard to press, and the line only crowds the button */
  .splash-skip{display:none}
  .splash-in{padding-block:var(--s6)}
}
/* a small old phone (360x640) is the tightest case there is */
@media (max-width:640px) and (max-height:700px){
  .ing-rail{height:62px;margin-top:var(--s4)}
  .splash-script{font-size:2.6rem}
  .splash-caps{font-size:1.1rem}
  .splash-tag{margin-top:var(--s4)!important}
  .splash-enter{margin-top:var(--s4)!important}
  .splash-in{padding-block:var(--s4)}
}
/* a laptop lid is often shorter than the column is tall — give it back.
   Phones are handled above; this is only for short, wide screens. */
@media (min-width:641px) and (max-height:860px){
  .splash-badge{width:min(460px,36vh);height:min(460px,36vh)}
  .ing-rail{height:76px;margin-top:var(--s5)}
  .splash-script{font-size:3.8rem}
  .splash-tag{margin-top:var(--s5)!important}
  .splash-enter{margin-top:var(--s5)!important}
  .splash-in{padding-block:var(--s5) 64px}
}
@media (prefers-reduced-motion:reduce){
  /* the script adds .on regardless, so the scene needs muting here or a
     reduced-motion visitor still gets the twelve-second drift */
  .splash .scene,.splash .scene.on{transition:none;transform:none}
  .splash-ring circle.draw{stroke-dashoffset:0}
  .splash-mark,.ing,.splash-tag,.splash-enter,.splash-skip{transition:none}
}
"""

SPLASH_JS = """
(function(){
  var s=document.getElementById('splash'); if(!s) return;
  // only on a first arrival — moving between pages should not replay it
  try{ if(sessionStorage.getItem('oyff-seen')){ s.remove(); return; } }catch(e){}
  document.body.classList.add('splashing');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ings=[].slice.call(s.querySelectorAll('.ing')),
      dims=[].slice.call(s.querySelectorAll('.dim-rail i')),
      ring=s.querySelector('.splash-ring'),
      marks=[].slice.call(s.querySelectorAll('.splash-mark')),
      scene=s.querySelector('.scene'),
      tag=s.querySelector('.splash-tag'), ent=s.querySelector('.splash-enter'),
      skip=s.querySelector('.splash-skip'), timers=[], done=false;
  function at(ms,fn){ timers.push(setTimeout(fn,reduced?Math.min(ms,120):ms)); }
  function enter(){
    if(done) return; done=true;
    timers.forEach(clearTimeout);
    try{ sessionStorage.setItem('oyff-seen','1'); }catch(e){}
    s.hidden=true; document.body.classList.remove('splashing');
    setTimeout(function(){ s.remove(); },900);
    document.removeEventListener('keydown',enter);
  }
  // fade the photograph in once it has decoded, never half-painted
  function showScene(){ requestAnimationFrame(function(){ scene.classList.add('on'); }); }
  if(scene){ if(scene.complete && scene.naturalWidth) showScene();
             else scene.addEventListener('load',showScene); }
  // The loader is a brand hello, not a gate. The choreography is short and
  // the way out appears before the visitor has finished reading the page.
  at(60,function(){ ring.classList.add('on'); });
  at(320,function(){ marks.forEach(function(m){ m.classList.add('on'); }); });
  ings.forEach(function(el,i){
    at(900+i*500,function(){ el.classList.add('on'); });
    if(i<ings.length-1) at(900+(i+1)*500,function(){ el.classList.remove('on'); el.classList.add('gone'); });
  });
  dims.forEach(function(el,i){ at(1020+i*500,function(){ el.classList.add('on'); }); });
  at(1400,function(){ tag.classList.add('on'); });
  at(1600,function(){ ent.classList.add('on'); skip.classList.add('on'); });
  at(4000,enter);                        // never trap anyone behind it
  ent.addEventListener('click',function(e){ e.preventDefault(); enter(); });
  s.addEventListener('click',enter);
  document.addEventListener('keydown',enter);
})();
"""

SPLASH_HTML = """
<div class="splash" id="splash" role="dialog" aria-label="Welcome to Oh! You Fancy Focaccia">
  <img class="scene" src="./img/splash-scene.webp" alt="" fetchpriority="high" decoding="async">
  <div class="wash"></div><div class="frame"></div><div class="vig"></div>
  <div class="splash-in">
    <div class="splash-badge">
      <svg class="splash-ring" viewBox="0 0 200 200" aria-hidden="true"
        style="position:absolute;inset:0;width:100%;height:100%">
        <circle cx="100" cy="100" r="96" class="draw" fill="none" stroke="#D9A94E" stroke-width="1.5"
          transform="rotate(-90 100 100)" stroke-linecap="round"/>
        <circle cx="100" cy="100" r="91" fill="none" stroke="#D9A94E" stroke-width=".5" opacity=".4"/>
      </svg>
      <img src="./img/logo-splash.webp" alt="Oh! You Fancy Focaccia" class="splash-mark"
        width="840" height="840"
        style="position:absolute;inset:7.5%;width:85%;height:85%;border-radius:50%">
    </div>
    <div class="splash-mark" style="margin-top:var(--s6)">
      <p class="splash-script">Oh! You Fancy</p>
      <p class="splash-caps">Focaccia</p>
    </div>
    <div class="ing-rail">
      <div class="ing"><p class="ing-w">Farina</p><p class="ing-g">flour</p></div>
      <div class="ing"><p class="ing-w">Acqua</p><p class="ing-g">water</p></div>
      <div class="ing"><p class="ing-w">Olio d&#8217;Oliva</p><p class="ing-g">olive oil</p></div>
      <div class="ing"><p class="ing-w">Sale</p><p class="ing-g">salt</p></div>
      <div class="ing"><p class="ing-w">Tempo</p><p class="ing-g">time</p></div>
    </div>
    <div class="dim-rail"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="splash-tag" style="margin-top:var(--s8)">
      <p style="font-family:var(--serif);font-size:.78rem;font-weight:600;letter-spacing:.46em;
        text-transform:uppercase;color:#D9A94E">Pane &#183; Amore &#183; Sempre</p>
    </div>
    <div class="splash-enter" style="margin-top:var(--s8)">
      <a href="./" class="btn btn-pale">Entra</a>
    </div>
  </div>
  <div class="splash-skip"><p style="font-family:var(--serif);font-size:.62rem;font-weight:600;
    letter-spacing:.34em;text-transform:uppercase;color:oklch(.78 .08 70/.4)">
    Press any key to skip</p></div>
</div>
"""


DOC = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
{head_extra}<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#8E1B1B">
<link rel="canonical" href="{canon}">
<meta property="og:url" content="{canon}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Oh! You Fancy Focaccia">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="https://ohyoufancyfocaccia.com/img/hero-garden.webp">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="https://ohyoufancyfocaccia.com/img/hero-garden.webp">
<link rel="manifest" href="./site.webmanifest">
<link rel="icon" href="./favicon.ico" sizes="any">
<link rel="icon" href="./img/logo.webp" type="image/webp">
<link rel="apple-touch-icon" href="./img/logo.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
{fonts}
<link rel="stylesheet" href="./style.css?v={cssv}">
{ld}
</head>
<body>
{splash}
<a class="skip-link" href="#site-content">Skip to content</a>
<div id="site-content">{body}</div>
{script}
</body>
</html>
"""

LD_JSON = """<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Bakery",
  "name": "Oh! You Fancy Focaccia",
  "url": "https://ohyoufancyfocaccia.com/",
  "description": "Small-batch organic focaccia and sourdough baked by hand in Brookings, Oregon.",
  "image": "https://ohyoufancyfocaccia.com/img/hero-garden.webp",
  "email": "info@ohyoufancyfocaccia.com",
  "priceRange": "$$",
  "hasMenu": "https://ohyoufancyfocaccia.com/breads.html",
  "sameAs": ["https://www.facebook.com/profile.php?id=61584072034572"],
  "servesCuisine": "Italian",
  "areaServed": {"@type":"City", "name":"Brookings"},
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Brookings",
    "addressRegion": "OR",
    "addressCountry": "US"
  },
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Wednesday", "Saturday"],
    "opens": "09:00",
    "description": "Brookings-Harbor Farmers Market, 9am until sold out"
  }]
}
</script>"""

def build():
    if os.path.isdir(PUBLIC):
        shutil.rmtree(PUBLIC)
    os.makedirs(os.path.join(PUBLIC, "img"))

    for f in sorted(os.listdir(os.path.join(DESIGN, "img"))):
        if f == "favicon.ico":
            continue
        shutil.copy2(os.path.join(DESIGN, "img", f), os.path.join(PUBLIC, "img", f))
    shutil.copy2(os.path.join(DESIGN, "img", "favicon.ico"), os.path.join(PUBLIC, "favicon.ico"))

    with open(os.path.join(PUBLIC, "style.css"), "w", encoding="utf-8") as fh:
        fh.write(D.TOKENS + RESPONSIVE + SPLASH_CSS + P.FORMS_CSS)
    # kept out of the document so the server can run a CSP without unsafe-inline scripts
    with open(os.path.join(PUBLIC, "splash.js"), "w", encoding="utf-8") as fh:
        fh.write(SPLASH_JS.strip() + "\n")
    with open(os.path.join(PUBLIC, "site.webmanifest"), "w", encoding="utf-8") as fh:
        fh.write(json.dumps({
            "name": "Oh! You Fancy Focaccia",
            "short_name": "Fancy Focaccia",
            "start_url": "/",
            "display": "standalone",
            "background_color": "#F4EFE2",
            "theme_color": "#8E1B1B",
            "icons": [{"src": "/img/logo.webp", "sizes": "512x512", "type": "image/webp"}],
        }, indent=2) + "\n")
    static = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
    for f in sorted(os.listdir(static)):
        shutil.copy2(os.path.join(static, f), os.path.join(PUBLIC, f))

    # style.css and the scripts are served under fixed names, and Cloudflare
    # caches those at its own edge TTL — four hours — regardless of the five
    # minutes the origin asks for. A CSS fix therefore reached nobody until the
    # edge felt like it, and in the meantime a returning visitor got new HTML
    # with old CSS. Versioning the URL sidesteps the question: a changed file
    # is a changed address, and an address that has never been requested cannot
    # be stale.
    versions = {}

    def asset_version(name):
        if name not in versions:
            with open(os.path.join(PUBLIC, name), "rb") as fh:
                versions[name] = hashlib.md5(fh.read()).hexdigest()[:8]
        return versions[name]

    base = "https://ohyoufancyfocaccia.com/"
    all_pages = PAGES + [(f, b, t, "") for f, b, t in ADMIN_PAGES] + [(f, b, t, "") for f, b, t in UTILITY_PAGES]
    for fname, body, title, desc in all_pages:
        if fname == "reviews.html":
            # the review form and the live reviews sit before the closing sign
            body = body.replace('<section class="enamel">', P.REVIEW_FORM + '<section class="enamel">', 1)
        html = rewrite_assets(rewrite_links(body))
        is_home = fname == "index.html"
        is_admin = fname.startswith("admin")
        is_utility = fname in {f for f, *_ in UTILITY_PAGES}
        head_extra = ""
        if is_home:
            head_extra = '<link rel="preload" as="image" href="./img/splash-scene.webp" fetchpriority="high">\n'
        if is_admin:
            # /admin/login has a directory segment, so relative asset paths
            # would resolve under /admin/ and hit the auth guard
            head_extra = '<base href="/">\n<meta name="robots" content="noindex,nofollow">\n'
        if is_utility:
            head_extra += '<meta name="robots" content="noindex">\n'
        scripts = SCRIPTS.get(fname, [])
        page = DOC.format(
            title=title, desc=desc or title,
            canon=base + ("" if is_home else fname),
            fonts=D.FONTS.replace("&amp;", "&"),
            ld=LD_JSON if is_home else "",
            head_extra=head_extra,
            splash=SPLASH_HTML if is_home else "",
            body=html,
            script="\n".join(f'<script src="./{j}?v={asset_version(j)}" defer></script>' for j in scripts),
            cssv=asset_version("style.css"),
        )
        with open(os.path.join(PUBLIC, fname), "w", encoding="utf-8") as fh:
            fh.write(page)
        print(f"  {fname:<14}{len(page)//1024}KB")

    with open(os.path.join(PUBLIC, "robots.txt"), "w") as fh:
        fh.write(f"User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /respond/\nSitemap: {base}sitemap.xml\n")
    urls = "".join(
        f"  <url><loc>{base}{'' if f=='index.html' else f}</loc></url>\n" for f, *_ in PAGES)
    with open(os.path.join(PUBLIC, "sitemap.xml"), "w") as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                 '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                 f'{urls}</urlset>\n')
    print(f"  robots.txt, sitemap.xml, {len(os.listdir(os.path.join(PUBLIC,'img')))} images")

if __name__ == "__main__":
    build()
