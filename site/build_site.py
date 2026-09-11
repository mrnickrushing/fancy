# -*- coding: utf-8 -*-
"""Emit the deployable static site from the design canvas source.

The canvas artboards in ../design are Claude Design components — they carry an
<x-dc> wrapper and a support.js shim and are not servable pages. This script
reuses their content and token system and emits real HTML into public/:
nav links that go somewhere, responsive rules, a working loading screen, and
the head metadata a live site needs.

    python3 site/build_site.py
"""
import os, re, sys, shutil

ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESIGN = os.path.join(ROOT, "design")
PUBLIC = os.path.join(ROOT, "public")
sys.path.insert(0, DESIGN)

import _build as D  # noqa: E402  (importing regenerates the .dc.html artboards; harmless)

EMAIL = "ohyoufancyfocaccia@gmail.com"
FB    = "https://www.facebook.com/profile.php?id=61584072034572"

PAGES = [
    ("index.html",   D.HOME,    "Oh! You Fancy Focaccia — Artisan Focaccia in Brookings, Oregon",
     "Small-batch organic focaccia, baked by hand in Brookings, Oregon. Find us at the "
     "Brookings-Harbor Farmers Market, Wednesdays and Saturdays, 9am 'til sold out."),
    ("about.html",   D.ABOUT,   "About — Oh! You Fancy Focaccia",
     "A small-batch bakery on the southern Oregon coast, run by Amanda."),
    ("breads.html",  D.BREADS,  "The Bill of Fare — Oh! You Fancy Focaccia",
     "Savory and sweet focaccia, muffins, rolls and focaccia art, baked with organic ingredients."),
    ("gallery.html", D.GALLERY, "Gallery — Oh! You Fancy Focaccia",
     "Twenty-nine bakes, straight from the tray and straight from the market table."),
    ("reviews.html", D.REVIEWS, "Reviews — Oh! You Fancy Focaccia",
     "100% recommend across 9 reviews. What our customers say."),
    ("contact.html", D.CONTACT, "Contact — Oh! You Fancy Focaccia",
     "Questions, delivery, shipping, or something particular for an occasion."),
]

NAV = {"Home": "./", "About": "./about.html", "Our Breads": "./breads.html",
       "Gallery": "./gallery.html", "Reviews": "./reviews.html", "Contact": "./contact.html"}

# link text -> destination, for buttons and inline links the artboards left as "#"
LINKS = {
    "See the Bill of Fare": "./breads.html",
    "The Full Bill of Fare": "./breads.html",
    "Find Us at the Market": "./contact.html",
    "Entra": "./",
    EMAIL: f"mailto:{EMAIL}",
    "Oh! You Fancy Focaccia": FB,
    "Write to Us": f"mailto:{EMAIL}",
}

def rewrite_assets(html):
    """Canvas artboards reference images by bare filename — the runtime resolves
    them from the document's own file table. A real server needs a real path."""
    html = re.sub(r'src="([a-z0-9-]+\.(?:webp|png|jpg|svg))"', r'src="./img/\1"', html)
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
img{max-width:100%;height:auto}
.wrap,.mid,.narrow{width:100%}

/* masthead nav scrolls rather than wrapping into a mess */
.nav-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.nav-scroll::-webkit-scrollbar{display:none}

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
  .wrap[style*="grid-template-columns"]{grid-template-columns:1fr!important;gap:var(--s10)!important}
  div[style*="grid-template-columns:1fr 300px"],
  div[style*="grid-template-columns:1fr 340px"]{grid-template-columns:1fr!important}
  [style*="columns:4"]{columns:2!important}
  [style*="columns:3"]{columns:2!important}
  .oval,.shot-oval{width:100%!important;max-width:420px;margin-inline:auto}
}
@media (max-width:640px){
  :root{--xxxl:2.6rem;--xxl:2rem;--xl:1.55rem;--lg:1.2rem;--base:1rem}
  .wrap,.mid,.narrow{padding-inline:var(--s5)}
  .g2,.g3,.g4{grid-template-columns:1fr}
  [style*="columns:2"],[style*="columns:4"],[style*="columns:3"]{columns:1!important}
  .sec{padding-block:var(--s12)}
  .btn{width:100%;padding-inline:var(--s5)}
  .enamel{padding-block:var(--s10)}
  .enamel p[style*="font-size:3.1rem"]{font-size:1.9rem!important}
  .fare-t{flex-wrap:wrap}
  .fare-t::after{display:none}
  footer div[style*="grid-template-columns:repeat(3"]{grid-template-columns:1fr!important;gap:var(--s8)!important}
  .ftr-bot,footer div[style*="justify-content:space-between"]{flex-direction:column;gap:var(--s3)}
}
/* masthead on a phone: the flanking olive rules have nowhere to go, and the
   nav has to scroll horizontally rather than wrap into a broken stack */
@media (max-width:820px){
  header .brand-row > svg{display:none}
  header nav{justify-content:flex-start!important;flex-wrap:nowrap!important;
    padding-inline:var(--s5)!important;gap:var(--s6)!important}
  header nav a{white-space:nowrap;flex-shrink:0}
}
@media (max-width:640px){
  .ribbon,header > div:first-child{font-size:.62rem!important;letter-spacing:.16em!important}
  header nav{gap:var(--s5)!important}
  /* the script wordmark is too wide for a phone beside the emblem */
  header .brand-row p[style*="var(--script)"]{font-size:2.1rem!important}
  header .brand-row p[style*="text-transform:uppercase"]{font-size:.84rem!important;
    letter-spacing:.26em!important}
  header .brand-row img{width:48px!important;height:48px!important}
  header .brand-row{gap:var(--s4)!important;padding-inline:var(--s4)}
}
@media print{.splash{display:none!important}}
"""

# ── loading screen, for real this time ───────────────────────────────
# The canvas version loops forever so it can be seen on an artboard. Here it
# runs once, can be skipped, and does not replay as you move around the site.
SPLASH_CSS = """
.splash{position:fixed;inset:0;z-index:999;display:flex;align-items:center;justify-content:center;
  overflow:hidden;background:radial-gradient(ellipse 92% 80% at 50% 42%,#5C1414,#3A0C0C 46%,#240808);
  transition:opacity .85s var(--ease),visibility .85s var(--ease)}
.splash[hidden]{opacity:0;visibility:hidden;pointer-events:none;display:flex}
.splash::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:.4;
  background-image:radial-gradient(oklch(.9 .08 75/.10) .6px,transparent .6px);background-size:4px 4px}
.splash .vig{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse 68% 60% at 50% 46%,transparent 40%,oklch(.12 .05 30/.62))}
.splash .frame{position:absolute;inset:28px;border:1px solid oklch(.85 .07 80/.22)}
.splash .frame::before{content:'';position:absolute;inset:9px;border:1px solid oklch(.85 .07 80/.11)}
.splash-in{position:relative;z-index:2;text-align:center;padding-inline:var(--s6)}
.splash-mark{opacity:0;transform:translateY(9px);transition:opacity .9s var(--ease),transform .9s var(--ease)}
.splash-mark.on{opacity:1;transform:none}
.splash-ring circle.draw{stroke-dasharray:604;stroke-dashoffset:604;
  transition:stroke-dashoffset 1.5s var(--ease)}
.splash-ring.on circle.draw{stroke-dashoffset:0}
.ing-rail{position:relative;height:96px;margin-top:var(--s8)}
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
  .ing-w{font-size:1.8rem}.ing-rail{height:76px}
  .splash .frame{inset:16px}
}
@media (prefers-reduced-motion:reduce){
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
      ring=s.querySelector('.splash-ring'), mark=s.querySelector('.splash-mark'),
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
  at(60,function(){ ring.classList.add('on'); });
  at(420,function(){ mark.classList.add('on'); });
  ings.forEach(function(el,i){
    at(1300+i*760,function(){ el.classList.add('on'); });
    if(i<ings.length-1) at(1300+(i+1)*760,function(){ el.classList.remove('on'); el.classList.add('gone'); });
  });
  dims.forEach(function(el,i){ at(1480+i*760,function(){ el.classList.add('on'); }); });
  at(5300,function(){ tag.classList.add('on'); });
  at(5750,function(){ ent.classList.add('on'); skip.classList.add('on'); });
  at(11000,enter);                       // never trap anyone behind it
  ent.addEventListener('click',function(e){ e.preventDefault(); enter(); });
  s.addEventListener('click',enter);
  document.addEventListener('keydown',enter);
})();
"""

SPLASH_HTML = """
<div class="splash" id="splash" role="dialog" aria-label="Welcome to Oh! You Fancy Focaccia">
  <div class="frame"></div><div class="vig"></div>
  <div class="splash-in">
    <div style="position:relative;width:214px;height:214px;margin:0 auto">
      <svg class="splash-ring" width="214" height="214" viewBox="0 0 200 200" aria-hidden="true"
        style="position:absolute;inset:0">
        <circle cx="100" cy="100" r="96" class="draw" fill="none" stroke="#D9A94E" stroke-width="1.5"
          transform="rotate(-90 100 100)" stroke-linecap="round"/>
        <circle cx="100" cy="100" r="91" fill="none" stroke="#D9A94E" stroke-width=".5" opacity=".4"/>
      </svg>
      <img src="./img/logo.webp" alt="Oh! You Fancy Focaccia" class="splash-mark"
        width="182" height="182"
        style="position:absolute;inset:16px;width:182px;height:182px;border-radius:50%">
    </div>
    <div class="splash-mark" style="margin-top:var(--s6)">
      <p style="font-family:var(--script);font-size:4.6rem;line-height:.78;color:#F2DFC0">Oh! You Fancy</p>
      <p style="font-family:var(--serif);font-size:2.2rem;font-weight:700;letter-spacing:.3em;
        text-transform:uppercase;color:#F2DFC0;margin-top:.55rem;padding-left:.3em">Focaccia</p>
    </div>
    <div class="ing-rail">
      <div class="ing"><p class="ing-w">Farina</p><p class="ing-g">flour</p></div>
      <div class="ing"><p class="ing-w">Acqua</p><p class="ing-g">water</p></div>
      <div class="ing"><p class="ing-w">Olio d&#8217;Oliva</p><p class="ing-g">olive oil</p></div>
      <div class="ing"><p class="ing-w">Sale</p><p class="ing-g">salt</p></div>
      <div class="ing"><p class="ing-w">Tempo</p><p class="ing-g">time</p></div>
    </div>
    <div class="dim-rail"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="splash-tag" style="margin-top:var(--s10)">
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
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#8E1B1B">
<link rel="canonical" href="{canon}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Oh! You Fancy Focaccia">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="./img/hero-garden.webp">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="./img/logo.webp" type="image/webp">
<link rel="apple-touch-icon" href="./img/logo.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
{fonts}
<link rel="stylesheet" href="./style.css">
{ld}
</head>
<body>
{splash}
{body}
{script}
</body>
</html>
"""

LD_JSON = """<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Bakery",
  "name": "Oh! You Fancy Focaccia",
  "description": "Small-batch organic focaccia baked by hand in Brookings, Oregon.",
  "email": "ohyoufancyfocaccia@gmail.com",
  "sameAs": ["https://www.facebook.com/profile.php?id=61584072034572"],
  "servesCuisine": "Italian",
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
        shutil.copy2(os.path.join(DESIGN, "img", f), os.path.join(PUBLIC, "img", f))

    with open(os.path.join(PUBLIC, "style.css"), "w", encoding="utf-8") as fh:
        fh.write(D.TOKENS + RESPONSIVE + SPLASH_CSS)
    # kept out of the document so the server can run a CSP without unsafe-inline scripts
    with open(os.path.join(PUBLIC, "splash.js"), "w", encoding="utf-8") as fh:
        fh.write(SPLASH_JS.strip() + "\n")

    base = "https://ohyoufancyfocaccia.up.railway.app/"
    for fname, body, title, desc in PAGES:
        html = rewrite_assets(rewrite_links(body))
        # the masthead nav needs to scroll on narrow screens
        html = html.replace('<nav style="display:flex;justify-content:center;gap:var(--s8);',
                            '<nav class="nav-scroll" style="display:flex;justify-content:center;gap:var(--s8);')
        html = html.replace('<div style="display:flex;align-items:center;justify-content:center;gap:var(--s6)">',
                            '<div class="brand-row" style="display:flex;align-items:center;justify-content:center;gap:var(--s6)">', 1)
        is_home = fname == "index.html"
        page = DOC.format(
            title=title, desc=desc,
            canon=base + ("" if is_home else fname),
            fonts=D.FONTS.replace("&amp;", "&"),
            ld=LD_JSON if is_home else "",
            splash=SPLASH_HTML if is_home else "",
            body=html,
            script='<script src="./splash.js" defer></script>' if is_home else "",
        )
        with open(os.path.join(PUBLIC, fname), "w", encoding="utf-8") as fh:
            fh.write(page)
        print(f"  {fname:<14}{len(page)//1024}KB")

    with open(os.path.join(PUBLIC, "robots.txt"), "w") as fh:
        fh.write(f"User-agent: *\nAllow: /\nSitemap: {base}sitemap.xml\n")
    urls = "".join(
        f"  <url><loc>{base}{'' if f=='index.html' else f}</loc></url>\n" for f, *_ in PAGES)
    with open(os.path.join(PUBLIC, "sitemap.xml"), "w") as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                 '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                 f'{urls}</urlset>\n')
    print(f"  robots.txt, sitemap.xml, {len(os.listdir(os.path.join(PUBLIC,'img')))} images")

if __name__ == "__main__":
    build()
