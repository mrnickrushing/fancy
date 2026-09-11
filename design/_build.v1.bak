# -*- coding: utf-8 -*-
import os
OUT = os.path.dirname(os.path.abspath(__file__))

FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&amp;family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&amp;family=Pinyon+Script&amp;display=swap">'

TOKENS = """
:root{
  --text-xs:0.8125rem; --text-sm:0.9375rem; --text-base:1.0625rem; --text-lg:1.375rem;
  --text-xl:2rem; --text-2xl:3rem; --text-3xl:4.25rem; --text-hero:6rem;
  --space-1:.25rem;--space-2:.5rem;--space-3:.75rem;--space-4:1rem;--space-5:1.25rem;
  --space-6:1.5rem;--space-8:2rem;--space-10:2.5rem;--space-12:3rem;--space-16:4rem;
  --space-20:5rem;--space-24:6rem;--space-32:8rem;
  --bg:#F5EDD8; --surface:#FBF5E6; --surface-2:#FDFAF1;
  --offset:#EFE4C8; --offset-2:#E7D8B6; --divider:#DCC9A0; --border:#CFBA8E;
  --text:#3B1A14; --muted:#7A4A3A; --faint:#A88A72; --inverse:#FBF5E6;
  --burgundy:#8E1B1B; --burgundy-hover:#731414; --burgundy-deep:#5C0F0F; --burgundy-tint:#F2DED6;
  --olive:#4E6023; --olive-hover:#3D4B1B; --olive-tint:#E3E7CE;
  --gold:#C08A2E; --terracotta:#B5643C;
  --radius-sm:.375rem;--radius-md:.625rem;--radius-lg:1rem;--radius-xl:1.5rem;--radius-full:9999px;
  --ease-out:cubic-bezier(.16,1,.3,1);
  --shadow-sm:0 1px 3px oklch(.2 .04 35/.08);
  --shadow-md:0 4px 16px oklch(.2 .04 35/.10);
  --shadow-lg:0 12px 40px oklch(.2 .04 35/.14);
  --wide:1200px;--default:960px;--narrow:640px;
  --font-display:'Playfair Display',Georgia,serif;
  --font-body:'Lora',Georgia,serif;
  --font-script:'Pinyon Script','Snell Roundhand',cursive;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:var(--font-body);
  font-size:var(--text-base);line-height:1.7;-webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility}
h1,h2,h3,h4{font-family:var(--font-display);line-height:1.14;text-wrap:balance;font-weight:600}
p{text-wrap:pretty}
img,svg{display:block;max-width:100%}
a{color:var(--burgundy);text-decoration:none}
a:hover{color:var(--burgundy-hover)}
ul{list-style:none}

/* paper grain */
.paper{position:relative}
.paper::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:.5;
  background-image:radial-gradient(oklch(.45 .09 35/.055) .5px,transparent .5px);
  background-size:3px 3px}

.wrap{max-width:var(--wide);margin:0 auto;padding-inline:var(--space-8)}
.wrap-narrow{max-width:760px;margin:0 auto;padding-inline:var(--space-8)}

/* ribbon */
.ribbon{background:var(--burgundy);color:var(--inverse);text-align:center;
  padding:.6rem var(--space-4);font-family:var(--font-display);font-size:var(--text-xs);
  font-weight:600;letter-spacing:.19em;text-transform:uppercase}

/* header */
.hdr{position:sticky;top:0;z-index:50;background:color-mix(in oklab,var(--bg) 93%,transparent);
  backdrop-filter:blur(14px);border-bottom:1px solid var(--divider)}
.hdr-in{max-width:var(--wide);margin:0 auto;padding:var(--space-3) var(--space-8);
  display:flex;align-items:center;justify-content:space-between;gap:var(--space-8)}
.brand{display:flex;align-items:center;gap:var(--space-3)}
.brand-txt{display:flex;flex-direction:column;line-height:1}
.brand-script{font-family:var(--font-script);font-size:1.6rem;color:var(--burgundy);
  line-height:.95;margin-bottom:.08em}
.brand-name{font-family:var(--font-display);font-weight:700;font-size:1.04rem;
  letter-spacing:.17em;text-transform:uppercase;color:var(--text)}
.nav{display:flex;align-items:center;gap:var(--space-6)}
.nav a{font-family:var(--font-display);font-size:var(--text-xs);font-weight:600;
  letter-spacing:.15em;text-transform:uppercase;color:var(--muted);padding-block:.4rem}
.nav a:hover{color:var(--burgundy)}
.nav a.on{color:var(--burgundy);border-bottom:1.5px solid var(--burgundy)}

/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.6rem;
  min-height:48px;padding:.85rem 1.9rem;font-family:var(--font-display);
  font-size:var(--text-xs);font-weight:600;letter-spacing:.16em;text-transform:uppercase;
  border-radius:var(--radius-full);transition:all 180ms var(--ease-out);cursor:pointer}
.btn-fill{background:var(--burgundy);color:var(--inverse);border:1.5px solid var(--burgundy)}
.btn-fill:hover{background:var(--burgundy-hover);border-color:var(--burgundy-hover);
  color:var(--inverse);transform:translateY(-2px);box-shadow:var(--shadow-md)}
.btn-line{background:transparent;color:var(--burgundy);border:1.5px solid var(--burgundy)}
.btn-line:hover{background:var(--burgundy);color:var(--inverse);transform:translateY(-2px)}
.btn-olive{background:var(--olive);color:var(--inverse);border:1.5px solid var(--olive)}
.btn-olive:hover{background:var(--olive-hover);color:var(--inverse);transform:translateY(-2px)}

/* section furniture */
.sec{padding-block:var(--space-24)}
.eyebrow{display:flex;align-items:center;justify-content:center;gap:var(--space-3);
  font-family:var(--font-display);font-size:var(--text-xs);font-weight:700;
  letter-spacing:.26em;text-transform:uppercase;color:var(--burgundy);
  margin-bottom:var(--space-5)}
.eyebrow::before,.eyebrow::after{content:'';display:block;height:1px;width:42px;
  background:var(--burgundy);opacity:.45}
.eyebrow-l{justify-content:flex-start}
.eyebrow-l::before{display:none}
.sec-title{font-size:var(--text-xl);color:var(--text);margin-bottom:var(--space-4);
  text-align:center}
.sec-sub{font-size:var(--text-base);color:var(--muted);max-width:58ch;margin:0 auto;
  text-align:center;line-height:1.75}

/* cards */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
  padding:var(--space-8);box-shadow:var(--shadow-sm);
  transition:transform 180ms var(--ease-out),box-shadow 180ms var(--ease-out)}
.card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.card h3{font-size:var(--text-lg);margin-bottom:var(--space-3)}
.card p{font-size:var(--text-sm);color:var(--muted);line-height:1.72}
.grid{display:grid;gap:var(--space-6)}
.g2{grid-template-columns:repeat(2,minmax(0,1fr))}
.g3{grid-template-columns:repeat(3,minmax(0,1fr))}
.g4{grid-template-columns:repeat(4,minmax(0,1fr))}

/* numeral */
.num{font-family:var(--font-display);font-size:var(--text-xs);font-weight:700;
  letter-spacing:.2em;color:var(--gold);margin-bottom:var(--space-3)}

/* tag */
.tag{display:inline-block;font-family:var(--font-display);font-size:.72rem;font-weight:600;
  letter-spacing:.15em;text-transform:uppercase;padding:.3rem .9rem;
  border-radius:var(--radius-full);background:var(--burgundy-tint);color:var(--burgundy)}
.tag-olive{background:var(--olive-tint);color:var(--olive)}

/* photo slot */
.photo{position:relative;background:
  linear-gradient(150deg,#F0E2C4 0%,#E8D6B2 48%,#DFC9A2 100%);
  border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;
  display:flex;align-items:center;justify-content:center}
.photo::before{content:'';position:absolute;inset:10px;border:1px solid oklch(.45 .09 35/.16);
  border-radius:calc(var(--radius-lg) - 5px);pointer-events:none}
.photo-cap{position:absolute;bottom:14px;left:0;right:0;text-align:center;
  font-family:var(--font-display);font-size:.68rem;font-weight:600;letter-spacing:.2em;
  text-transform:uppercase;color:oklch(.42 .06 45/.62)}

/* footer */
.ftr{background:var(--burgundy-deep);color:#E8CFC2;padding-block:var(--space-16) var(--space-8)}
.ftr h4{font-family:var(--font-display);font-size:var(--text-xs);font-weight:700;
  letter-spacing:.2em;text-transform:uppercase;color:#E9BFA8;margin-bottom:var(--space-4)}
.ftr a{color:#E8CFC2}
.ftr a:hover{color:#fff}
.ftr p,.ftr li{font-size:var(--text-sm);line-height:1.8}
.ftr-bot{border-top:1px solid oklch(1 0 0/.13);margin-top:var(--space-12);
  padding-top:var(--space-6);display:flex;justify-content:space-between;gap:var(--space-6);
  font-size:var(--text-xs);color:#C9A architecture}
"""
TOKENS = TOKENS.replace("#C9A architecture", "#C9A192")

# ── Ornaments (inline SVG, engraved vintage-label style) ────────────────
RING = """<svg width="58" height="58" viewBox="0 0 58 58" aria-hidden="true">
<circle cx="29" cy="29" r="27.5" fill="#F5EDD8" stroke="#8E1B1B" stroke-width="2"/>
<circle cx="29" cy="29" r="23.5" fill="none" stroke="#8E1B1B" stroke-width=".8" opacity=".55"/>
<path d="M29 17c-4.6 2.6-7 6.4-7 11 0 4.2 3 7.6 7 10.6 4-3 7-6.4 7-10.6 0-4.6-2.4-8.4-7-11z" fill="none" stroke="#4E6023" stroke-width="1.3"/>
<path d="M29 20.5v17" stroke="#4E6023" stroke-width="1" opacity=".75"/>
<ellipse cx="24.2" cy="27.4" rx="2.1" ry="2.7" transform="rotate(-24 24.2 27.4)" fill="#4E6023" opacity=".9"/>
<ellipse cx="33.8" cy="30.6" rx="2.1" ry="2.7" transform="rotate(-24 33.8 30.6)" fill="#4E6023" opacity=".9"/>
</svg>"""

def olive_branch(w=150, flip=False):
    t = ' transform="scale(-1,1) translate(-150,0)"' if flip else ''
    return f"""<svg width="{w}" height="40" viewBox="0 0 150 40" aria-hidden="true">
<g{t} fill="none" stroke="#4E6023" stroke-width="1.4" stroke-linecap="round">
<path d="M4 20C30 20 62 17 96 12"/>
<path d="M28 20c-3-6-1-11 4-13 2 5 1 10-4 13z"/>
<path d="M46 17c-4-5-3-10 2-13 2 5 2 10-2 13z"/>
<path d="M66 15c-4-5-3-10 2-13 2 5 2 10-2 13z"/>
<path d="M36 21c4-5 9-5 13-1-4 4-9 5-13 1z"/>
<path d="M56 19c4-5 9-5 13-1-4 4-9 5-13 1z"/>
</g>
<g{t} fill="#4E6023">
<ellipse cx="86" cy="13" rx="4.6" ry="6" transform="rotate(28 86 13)"/>
<ellipse cx="99" cy="10" rx="4.6" ry="6" transform="rotate(28 99 10)" opacity=".72"/>
</g></svg>"""

def rule_orn():
    return f"""<div style="display:flex;align-items:center;justify-content:center;gap:18px;margin-block:var(--space-10)">
<span style="display:block;height:1px;width:110px;background:linear-gradient(90deg,transparent,#8E1B1B);opacity:.42"></span>
<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
<path d="M15 3l3.4 8.6L27 15l-8.6 3.4L15 27l-3.4-8.6L3 15l8.6-3.4z" fill="none" stroke="#8E1B1B" stroke-width="1.2"/>
<circle cx="15" cy="15" r="2.6" fill="#C08A2E"/></svg>
<span style="display:block;height:1px;width:110px;background:linear-gradient(270deg,transparent,#8E1B1B);opacity:.42"></span>
</div>"""

# engraved focaccia round, used inside photo slots
def focaccia(size=190):
    return f"""<svg width="{size}" height="{size}" viewBox="0 0 190 190" aria-hidden="true" style="opacity:.5">
<circle cx="95" cy="95" r="72" fill="none" stroke="#8B5A2B" stroke-width="2.2"/>
<circle cx="95" cy="95" r="63" fill="none" stroke="#8B5A2B" stroke-width=".9" opacity=".6"/>
<g fill="#8B5A2B" opacity=".55">
<ellipse cx="76" cy="74" rx="5" ry="4"/><ellipse cx="104" cy="70" rx="4.4" ry="3.6"/>
<ellipse cx="119" cy="92" rx="5" ry="4"/><ellipse cx="108" cy="116" rx="4.6" ry="3.7"/>
<ellipse cx="80" cy="120" rx="5" ry="4"/><ellipse cx="66" cy="98" rx="4.4" ry="3.6"/>
<ellipse cx="95" cy="95" rx="4.6" ry="3.8"/>
</g>
<g stroke="#4E6023" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".8">
<path d="M58 58l16 15"/><path d="M60 64l5-6 6-1"/><path d="M68 70l5-6 6-1"/>
<path d="M132 124l-16-15"/><path d="M130 118l-5 6-6 1"/><path d="M122 112l-5 6-6 1"/>
</g></svg>"""

def photo(h, cap, orn=True):
    inner = focaccia(160) if orn else ''
    return f"""<div class="photo" style="height:{h}px">{inner}<span class="photo-cap">{cap}</span></div>"""

NAVLINKS = [("Home","index"),("About","about"),("Our Breads","breads"),
            ("Gallery","gallery"),("Reviews","reviews"),("Contact","contact")]

def header(active):
    links = "".join(
        f'<a href="#" class="{"on" if k==active else ""}">{n}</a>' for n,k in NAVLINKS)
    return f"""<div class="ribbon">Brookings-Harbor Farmers Market &#183; Wednesdays &amp; Saturdays &#183; 9am &#8216;til sold out</div>
<header class="hdr"><div class="hdr-in">
<div class="brand">{RING}<span class="brand-txt"><span class="brand-script">Oh! You Fancy</span><span class="brand-name">Focaccia</span></span></div>
<nav class="nav">{links}</nav>
</div></header>"""

FOOTER = f"""<footer class="ftr"><div class="wrap">
<div style="display:grid;grid-template-columns:1.7fr 1fr 1fr;gap:var(--space-12)">
  <div>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:var(--space-4)">
      <svg width="46" height="46" viewBox="0 0 58 58" aria-hidden="true">
      <circle cx="29" cy="29" r="27.5" fill="none" stroke="#E9BFA8" stroke-width="2"/>
      <circle cx="29" cy="29" r="23.5" fill="none" stroke="#E9BFA8" stroke-width=".8" opacity=".5"/>
      <path d="M29 17c-4.6 2.6-7 6.4-7 11 0 4.2 3 7.6 7 10.6 4-3 7-6.4 7-10.6 0-4.6-2.4-8.4-7-11z" fill="none" stroke="#E9BFA8" stroke-width="1.3"/>
      <path d="M29 20.5v17" stroke="#E9BFA8" stroke-width="1" opacity=".7"/></svg>
      <span style="display:flex;flex-direction:column;line-height:1">
        <span style="font-family:var(--font-script);font-size:1.7rem;color:#E9BFA8">Oh! You Fancy</span>
        <span style="font-family:var(--font-display);font-weight:700;font-size:1rem;letter-spacing:.18em;text-transform:uppercase;color:#E8CFC2">Focaccia</span>
      </span>
    </div>
    <p style="max-width:44ch;color:#C9A192">Artisan focaccia baked by hand in Brookings, Oregon. Organic ingredients, a living sourdough starter, and small batches that sell out.</p>
    <p style="margin-top:var(--space-5);font-family:var(--font-script);font-size:1.5rem;color:#E9BFA8">Pane &#183; Amore &#183; Sempre</p>
  </div>
  <div><h4>Explore</h4><ul style="display:flex;flex-direction:column;gap:.55rem">
    <li><a href="#">About</a></li><li><a href="#">Our Breads</a></li>
    <li><a href="#">Gallery</a></li><li><a href="#">Reviews</a></li><li><a href="#">Contact</a></li></ul></div>
  <div><h4>Find Us</h4>
    <p style="color:#C9A192">Brookings-Harbor Farmers Market<br>Wednesdays &amp; Saturdays<br>9am &#8216;til sold out</p>
    <p style="margin-top:var(--space-4)"><a href="#">ohyoufancyfocaccia@gmail.com</a></p>
    <p style="margin-top:var(--space-2)"><a href="#">Facebook</a></p></div>
</div>
<div class="ftr-bot"><p>&#169; 2026 Oh! You Fancy Focaccia &#183; Brookings, Oregon</p>
<p>Baked with love. Thank you for shopping local.</p></div>
</div></footer>"""

def page(body, preview_w, preview_h):
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
<style>{TOKENS}</style>
</helmet>
<div class="paper">
{body}
</div>
</x-dc>
<script data-dc-script data-props='{{"$preview":{{"width":{preview_w},"height":{preview_h}}}}}'>
class Component extends DCLogic {{}}
</script>
</body>
</html>"""

# ══ HOME ══════════════════════════════════════════════════════════════
HOME = header("index") + f"""
<section style="background:linear-gradient(165deg,var(--surface-2) 0%,var(--bg) 55%,var(--offset) 100%);
  padding-block:var(--space-24);position:relative;overflow:hidden">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 22% 80%,
    oklch(.42 .16 25/.09),transparent 68%);pointer-events:none"></div>
  <div class="wrap" style="position:relative;display:grid;grid-template-columns:1.06fr .94fr;
    gap:var(--space-16);align-items:center">
    <div>
      <div style="margin-bottom:var(--space-5)">{olive_branch(160)}</div>
      <p style="font-family:var(--font-script);font-size:4.4rem;line-height:.8;color:var(--burgundy);
        margin-bottom:.1em">Oh! You Fancy</p>
      <h1 style="font-size:var(--text-3xl);font-weight:800;letter-spacing:.02em;
        text-transform:uppercase;color:var(--text);margin-bottom:var(--space-5);line-height:.96">Focaccia</h1>
      <p style="font-family:var(--font-display);font-size:var(--text-xs);font-weight:600;
        letter-spacing:.3em;text-transform:uppercase;color:var(--olive);margin-bottom:var(--space-6)">
        Pane &#183; Amore &#183; Sempre</p>
      <p style="font-size:var(--text-lg);color:var(--muted);max-width:46ch;line-height:1.62;
        margin-bottom:var(--space-8)">Artisan focaccia, baked by hand on the southern Oregon coast.
        Organic ingredients, a living sourdough starter, and every loaf bent, snapped, stretched and folded by hand.</p>
      <div style="display:flex;gap:var(--space-4);flex-wrap:wrap">
        <a href="#" class="btn btn-fill">Find Us at the Market</a>
        <a href="#" class="btn btn-line">See Our Breads</a>
      </div>
    </div>
    <div class="photo" style="height:560px;border-radius:var(--radius-xl)">
      {focaccia(260)}<span class="photo-cap">Hero photograph &#183; a whole focaccia, warm</span>
    </div>
  </div>
</section>

<section class="sec" style="background:var(--bg)">
  <div class="wrap">
    <p class="eyebrow">Where to Find Us</p>
    <h2 class="sec-title">We bake in small batches,<br>and we do sell out</h2>
    <p class="sec-sub">Come see us at the market, or let us bring it to you.</p>
    {rule_orn()}
    <div class="grid g4">
      <div class="card"><p class="num">I</p><h3>At the Market</h3>
        <p>Brookings-Harbor Farmers Market, Wednesdays and Saturdays from 9am until the last loaf is gone. Come hungry &#8212; there are always samples.</p></div>
      <div class="card"><p class="num">II</p><h3>Come Early</h3>
        <p>As one of our regulars put it: &#8220;Get there early cause this girl sells out quick.&#8221;</p></div>
      <div class="card"><p class="num">III</p><h3>We Deliver</h3>
        <p>Fresh focaccia brought to you around Brookings and Harbor. Write to us and we&#8217;ll sort out the details.</p></div>
      <div class="card"><p class="num">IV</p><h3>We Ship</h3>
        <p>Can&#8217;t get to the coast? Our breads travel well. Send a note and let us know where you are.</p></div>
    </div>
  </div>
</section>

<section class="sec" style="background:var(--offset);border-block:1px solid var(--divider)">
  <div class="wrap">
    <p class="eyebrow">What Comes Out of the Oven</p>
    <h2 class="sec-title">There are so many options<br>when it comes to focaccia</h2>
    <p class="sec-sub">The board changes with the season, and with whatever our neighbours are growing.</p>
    {rule_orn()}
    <div class="grid g3">
      <div class="card" style="padding:0;overflow:hidden">{photo(210,'Savory focaccia')}
        <div style="padding:var(--space-6)"><span class="tag">Savory</span>
        <h3 style="margin-top:var(--space-3)">Olive, Garlic &amp; Jalape&#241;o</h3>
        <p>Mixed olives, roasted garlic, jalape&#241;o, sun-dried tomato and herbs on a golden, blistered crust.</p></div></div>
      <div class="card" style="padding:0;overflow:hidden">{photo(210,'Sweet focaccia')}
        <div style="padding:var(--space-6)"><span class="tag">Sweet</span>
        <h3 style="margin-top:var(--space-3)">Cinnamon Swirl</h3>
        <p>A whole pan pulled apart in golden ridges and finished with a vanilla glaze.</p></div></div>
      <div class="card" style="padding:0;overflow:hidden">{photo(210,'Focaccia muffins')}
        <div style="padding:var(--space-6)"><span class="tag-olive tag">Hand-sized</span>
        <h3 style="margin-top:var(--space-3)">Focaccia Muffins</h3>
        <p>Jalape&#241;o and roasted garlic, or peppered pickle made with our neighbour&#8217;s pickles.</p></div></div>
      <div class="card" style="padding:0;overflow:hidden">{photo(210,'Focaccia art')}
        <div style="padding:var(--space-6)"><span class="tag">Focaccia Art</span>
        <h3 style="margin-top:var(--space-3)">Hearts &amp; Flower Gardens</h3>
        <p>Hand-painted in vegetables and herbs. Almost too pretty to tear into. Almost.</p></div></div>
      <div class="card" style="padding:0;overflow:hidden">{photo(210,'Swirls and rolls')}
        <div style="padding:var(--space-6)"><span class="tag">Swirls &amp; Rolls</span>
        <h3 style="margin-top:var(--space-3)">Olive &amp; Sun-Dried Tomato</h3>
        <p>Spiralled rounds layered with olives, tomato and herbs. Sea-salted pull-apart rolls.</p></div></div>
      <div class="card" style="padding:0;overflow:hidden">{photo(210,'Seasonal bakes')}
        <div style="padding:var(--space-6)"><span class="tag-olive tag">Seasonal</span>
        <h3 style="margin-top:var(--space-3)">Whatever&#8217;s Fresh</h3>
        <p>Tell us the occasion. We&#8217;ve made a great many things that were never on a list.</p></div></div>
    </div>
  </div>
</section>

<section style="background:var(--burgundy);color:var(--inverse);padding-block:var(--space-24);
  position:relative;overflow:hidden">
  <div style="position:absolute;inset:0;opacity:.07;
    background-image:radial-gradient(#fff .6px,transparent .6px);background-size:4px 4px"></div>
  <div class="wrap-narrow" style="text-align:center;position:relative">
    <svg width="46" height="38" viewBox="0 0 46 38" aria-hidden="true" style="margin:0 auto var(--space-6)">
      <path d="M18 38C8 38 2 31 2 21 2 10 9 2 20 0l2 6c-7 2-11 6-11 11 0 1 0 2 1 3 6-1 11 3 11 9 0 5-3 9-7 9zm24 0c-10 0-16-7-16-17C26 10 33 2 44 0l2 6c-7 2-11 6-11 11 0 1 0 2 1 3 6-1 11 3 11 9 0 5-3 9-7 9z" fill="#E9BFA8" opacity=".55"/></svg>
    <p style="font-family:var(--font-display);font-size:2.1rem;font-style:italic;line-height:1.42;
      color:#FBEDE4;margin-bottom:var(--space-6)">Best Focaccia I&#8217;ve ever had. She definitely knows what she&#8217;s doing. Absolutely scrumptious.</p>
    <p style="font-family:var(--font-display);font-size:var(--text-xs);font-weight:600;
      letter-spacing:.24em;text-transform:uppercase;color:#E9BFA8">TonyandTasha Holden</p>
    <p style="margin-top:var(--space-8);font-family:var(--font-display);font-size:var(--text-xs);
      letter-spacing:.2em;text-transform:uppercase;color:#D6A architecture">100% recommend &#183; 9 reviews</p>
  </div>
</section>

<section class="sec" style="background:var(--bg)">
  <div class="wrap">
    <p class="eyebrow">Baked With Our Neighbours</p>
    <h2 class="sec-title">We bake with our town,<br>not just beside it</h2>
    {rule_orn()}
    <div class="grid g4">
      <div style="text-align:center"><div style="margin:0 auto var(--space-4);width:150px">{olive_branch(150)}</div>
        <h3 style="font-size:var(--text-lg);margin-bottom:var(--space-2)">Brookings Pickled Goodies</h3>
        <p style="font-size:var(--text-sm);color:var(--muted)">Their spicy bread-and-butter pickles go straight into our peppered pickle muffins.</p></div>
      <div style="text-align:center"><div style="margin:0 auto var(--space-4);width:150px">{olive_branch(150,True)}</div>
        <h3 style="font-size:var(--text-lg);margin-bottom:var(--space-2)">Chetco Gold Raw Honey</h3>
        <p style="font-size:var(--text-sm);color:var(--muted)">Award-winning raw honey from the Chetco River, drizzled over our focaccia bites.</p></div>
      <div style="text-align:center"><div style="margin:0 auto var(--space-4);width:150px">{olive_branch(150)}</div>
        <h3 style="font-size:var(--text-lg);margin-bottom:var(--space-2)">The Dawg House</h3>
        <p style="font-size:var(--text-sm);color:var(--muted)">Monica builds her sandwiches on our fresh focaccia at the market.</p></div>
      <div style="text-align:center"><div style="margin:0 auto var(--space-4);width:150px">{olive_branch(150,True)}</div>
        <h3 style="font-size:var(--text-lg);margin-bottom:var(--space-2)">Shalom Coffee Roasting</h3>
        <p style="font-size:var(--text-sm);color:var(--muted)">Our market neighbours, and the right cup beside a warm piece of bread.</p></div>
    </div>
  </div>
</section>

<section style="background:var(--offset-2);padding-block:var(--space-20);text-align:center;
  border-top:1px solid var(--divider)">
  <div class="wrap-narrow">
    <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-4)">Come see us Wednesday or Saturday</h2>
    <p style="color:var(--muted);margin-bottom:var(--space-8);font-size:var(--text-base)">
      Brookings-Harbor Farmers Market, 9am &#8216;til sold out. Questions, delivery or shipping &#8212; just say hello.</p>
    <div style="display:flex;gap:var(--space-4);justify-content:center;flex-wrap:wrap">
      <a href="#" class="btn btn-fill">ohyoufancyfocaccia@gmail.com</a>
      <a href="#" class="btn btn-olive">Find Us on Facebook</a>
    </div>
    <p style="margin-top:var(--space-10);font-family:var(--font-script);font-size:2rem;color:var(--burgundy)">
      Love always, Oh! You Fancy Focaccia</p>
  </div>
</section>
""" + FOOTER
HOME = HOME.replace("#D6A architecture", "#D6A08E")

def page_hero(eyebrow, title, sub):
    return f"""<section style="background:var(--offset);border-bottom:1px solid var(--divider);
  padding-block:var(--space-20);text-align:center;position:relative;overflow:hidden">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 80% at 50% 100%,
    oklch(.42 .16 25/.10),transparent 70%);pointer-events:none"></div>
  <div class="wrap-narrow" style="position:relative">
    <p class="eyebrow">{eyebrow}</p>
    <h1 style="font-size:var(--text-2xl);margin-bottom:var(--space-5)">{title}</h1>
    <p style="color:var(--muted);font-size:var(--text-lg);line-height:1.6">{sub}</p>
    <div style="display:flex;justify-content:center;margin-top:var(--space-8)">{olive_branch(170)}</div>
  </div>
</section>"""

# ══ ABOUT ═════════════════════════════════════════════════════════════
PHIL = [("Organic Ingredients","We bake with organic ingredients because that is what we would want to feed our own family. Good bread starts long before the oven."),
("A Living Starter","Everything begins with a bubbly sourdough starter. Mama makes the dough, and the dough takes its time."),
("Bend, Snap, Stretch &amp; Fold","No shortcuts, and nothing but hands doing the shaping. Every loaf is worked until it is ready."),
("Small Batch, Always","We bake what we can bake well. That is why we sell out &#8212; and why it is always fresh."),
("Savory and Sweet","There are so many options when it comes to focaccia. We are still finding new ones."),
("Baked With Love","The one ingredient we cannot buy and will not skip. Our customers taste it, and they tell us so.")]

ABOUT = header("about") + page_hero("Our Story","Welcome to Oh! You Fancy Focaccia",
  "A small-batch bakery on the southern Oregon coast, run by Amanda &#8212; doing what she loves, where she loves to be.") + f"""
<section class="sec" style="background:var(--bg)">
  <div class="wrap">
    <p class="eyebrow">Our Baking Philosophy</p>
    <h2 class="sec-title">Six things we will not<br>compromise on</h2>
    {rule_orn()}
    <div class="grid g3">
      {''.join(f'<div class="card"><p class="num">{r}</p><h3>{t}</h3><p>{d}</p></div>' for r,(t,d) in zip(['I','II','III','IV','V','VI'],PHIL))}
    </div>
  </div>
</section>

<section class="sec" style="background:var(--offset);border-block:1px solid var(--divider)">
  <div class="wrap" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-16);align-items:center">
    <div class="photo" style="height:520px;border-radius:var(--radius-xl)">{focaccia(230)}
      <span class="photo-cap">Amanda at the market stall</span></div>
    <div>
      <p class="eyebrow eyebrow-l">From Our Kitchen</p>
      <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-6);text-align:left">From our kitchen<br>to your table</h2>
      <p style="color:var(--muted);margin-bottom:var(--space-5)">Oh! You Fancy Focaccia is a family-run bakery in Brookings, Oregon, on the Curry County coast.</p>
      <p style="color:var(--muted);margin-bottom:var(--space-5)">What started as a love of bread became a booth at the Brookings-Harbor Farmers Market &#8212; and then loaves going out to neighbours, friends, and folks far enough away that we had to start shipping.</p>
      <p style="color:var(--muted);margin-bottom:var(--space-5)">We bake savory and sweet focaccia with organic ingredients: olives and garlic and jalape&#241;o, sun-dried tomato and herbs, cinnamon and honey. We infuse our neighbours&#8217; pickles and drizzle our neighbours&#8217; honey.</p>
      <p style="color:var(--muted);margin-bottom:var(--space-8)">Every Wednesday and Saturday the crates come out, the gold paper bags get filled, and we hand out samples until the last loaf is gone.</p>
      <div style="border-left:3px solid var(--burgundy);padding-left:var(--space-6)">
        <p style="font-style:italic;color:var(--text);font-size:var(--text-base)">Thank you to our customers, our friends, our family, and our Father in Heaven for supporting our small business.</p>
        <p style="font-family:var(--font-script);font-size:1.8rem;color:var(--burgundy);margin-top:var(--space-3)">Love always, Oh! You Fancy Focaccia</p>
      </div>
    </div>
  </div>
</section>

<section style="background:var(--bg);padding-block:var(--space-20);text-align:center">
  <div class="wrap-narrow">
    <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-4)">Come find us this week</h2>
    <p style="color:var(--muted);margin-bottom:var(--space-8)">Brookings-Harbor Farmers Market &#183; Wednesdays &amp; Saturdays &#183; 9am &#8216;til sold out</p>
    <a href="#" class="btn btn-fill">ohyoufancyfocaccia@gmail.com</a>
  </div>
</section>
""" + FOOTER

# ══ OUR BREADS ════════════════════════════════════════════════════════
def menu_row(name, desc, tag=None):
    t = f'<span class="tag" style="margin-left:12px;vertical-align:middle">{tag.upper()}</span>' if tag else ''
    return f"""<div style="display:flex;gap:var(--space-6);padding-block:var(--space-6);
  border-bottom:1px solid var(--divider);align-items:flex-start">
  <div style="flex-shrink:0;width:8px;height:8px;border-radius:50%;background:var(--gold);margin-top:14px"></div>
  <div style="flex-grow:1">
    <h3 style="font-size:var(--text-lg);margin-bottom:var(--space-2)">{name}{t}</h3>
    <p style="font-size:var(--text-sm);color:var(--muted);max-width:64ch">{desc}</p>
  </div>
</div>"""

def menu_block(title, rows, photocap):
    return f"""<div style="display:grid;grid-template-columns:1fr 340px;gap:var(--space-12);
  align-items:start;margin-bottom:var(--space-20)">
  <div>
    <h2 style="font-size:var(--text-xl);text-align:left;margin-bottom:var(--space-2)">{title}</h2>
    <div style="width:80px;height:2px;background:var(--burgundy);opacity:.6;margin-bottom:var(--space-4)"></div>
    {''.join(rows)}
  </div>
  {photo(400, photocap)}
</div>"""

BREADS = header("breads") + page_hero("The Board","Our Breads",
  "What comes out of the oven changes with the season, and with whatever our neighbours are growing. Here is what we are known for.") + f"""
<section class="sec" style="background:var(--bg)">
  <div class="wrap">
    {menu_block("Savory Focaccia",[
      menu_row("Olive &amp; Sun-Dried Tomato Swirl","A spiralled round layered with green and kalamata olives, sun-dried tomato, herbs and grated cheese. Crisp at the edges, soft through the middle."),
      menu_row("Jalape&#241;o, Olive &amp; Red Onion","Our signature round &#8212; fresh jalape&#241;o, mixed olives, red onion and herbs across a golden, dimpled crust."),
      menu_row("Roasted Garlic &amp; Sea Salt","Simple and perfect. Olive oil, roasted garlic and flaky salt on a pillowy sourdough crumb."),
      menu_row("Cheesy Jalape&#241;o","Melted and bubbling, with jalape&#241;o baked right into the top."),
    ],"Savory rounds")}

    {menu_block("Sweet Focaccia",[
      menu_row("Cinnamon Swirl with Vanilla Drizzle","A whole pan of cinnamon-laced focaccia pulled apart in golden ridges and finished with a vanilla glaze."),
      menu_row("Honey Focaccia Bites","Pull-apart bites, boxed and drizzled with award-winning Chetco Gold raw honey from right here on the Chetco River."),
    ],"Sweet bakes")}

    {menu_block("Focaccia Muffins",[
      menu_row("Jalape&#241;o &amp; Roasted Garlic","Hand-sized, crisp-edged, crowned with jalape&#241;o and toasted garlic."),
      menu_row("Peppered Pickle","Made with Brookings Pickled Goodies&#8217; spicy bread-and-butter pickles infused right into the dough. Organic ingredients only."),
      menu_row("Sea Salt Rolls","Soft pull-apart rounds, olive-oil brushed and salt flaked."),
    ],"Muffins &amp; rolls")}

    {menu_block("Focaccia Art",[
      menu_row("Heart Loaves","Little hand-shaped hearts. They go fast."),
      menu_row("Flower Gardens","Hand-painted in vegetables and herbs &#8212; a whole garden across the top of the dough."),
      menu_row("Seasonal &amp; Custom","Tell us the occasion. We have made a great many things that were never on a list."),
    ],"Focaccia art")}
  </div>
</section>

<section class="sec" style="background:var(--offset);border-block:1px solid var(--divider)">
  <div class="wrap">
    <p class="eyebrow">How People Eat It</p>
    <h2 class="sec-title">Our customers are more<br>inventive than we are</h2>
    {rule_orn()}
    <div class="grid g4">
      <div class="card"><h3>As pizza</h3><p style="font-style:italic">&#8220;It was delicious the way it is, but turning it into a pizza was super fast and easy.&#8221;</p></div>
      <div class="card"><h3>As a sandwich</h3><p>Go see Monica at The Dawg House &#8212; she builds hers on our focaccia at the market.</p></div>
      <div class="card"><h3>As toast</h3><p>Avocado, feta and heirloom tomatoes on a thick slice. A customer sent us that one.</p></div>
      <div class="card"><h3>As it comes</h3><p>Warm, torn by hand, with good olive oil. Honestly the best way.</p></div>
    </div>
    <div style="text-align:center;margin-top:var(--space-16);padding:var(--space-10);
      background:var(--surface);border:1px dashed var(--border);border-radius:var(--radius-lg);
      max-width:720px;margin-inline:auto">
      <p style="font-family:var(--font-display);font-size:var(--text-xs);font-weight:700;
        letter-spacing:.22em;text-transform:uppercase;color:var(--burgundy);margin-bottom:var(--space-3)">Pricing</p>
      <p style="color:var(--muted)">[PRICES TO BE SUPPLIED] &#8212; ask us at the market, or write for delivery and shipping.</p>
    </div>
  </div>
</section>
""" + FOOTER

# ══ GALLERY ═══════════════════════════════════════════════════════════
GAL_ITEMS = [("Sea Salt Roll","Olive-oil brushed, salt flaked, still warm.",300),
("Olive &amp; Sun-Dried Tomato Swirl","Spiralled, herbed, golden at the edges.",380),
("Cinnamon Swirl","A whole pan, pulled apart in ridges and glazed.",300),
("Jalape&#241;o &amp; Garlic Muffins","Hand-sized, crowned with toasted garlic.",380),
("Jalape&#241;o, Olive &amp; Red Onion Round","The one people recognise us by.",300),
("Honey Bites","Boxed and drizzled with Chetco Gold raw honey.",340),
("Heart Loaf","Little hand-shaped hearts. They go fast.",340),
("At the Market","Crates out, gold bags filled, samples going round.",300)]

GALLERY = header("gallery") + page_hero("The Gallery","A Fancy Little Gallery",
  "Fresh from the oven, and straight from the market table.") + f"""
<section class="sec" style="background:var(--bg)">
  <div class="wrap">
    <div style="columns:3;column-gap:var(--space-6)">
      {''.join(f'''<figure style="break-inside:avoid;margin-bottom:var(--space-6)">
        <div class="photo" style="height:{h}px">{focaccia(140)}<span class="photo-cap">Photograph</span></div>
        <figcaption style="padding-top:var(--space-3)">
          <p style="font-family:var(--font-display);font-size:var(--text-xs);font-weight:700;
            letter-spacing:.16em;text-transform:uppercase;color:var(--text)">{n}</p>
          <p style="font-size:var(--text-sm);color:var(--muted)">{c}</p>
        </figcaption></figure>''' for n,c,h in GAL_ITEMS)}
    </div>
  </div>
</section>

<section style="background:var(--offset);border-top:1px solid var(--divider);
  padding-block:var(--space-20);text-align:center">
  <div class="wrap-narrow">
    <div style="display:flex;justify-content:center;margin-bottom:var(--space-6)">{olive_branch(170)}</div>
    <h2 style="font-size:var(--text-xl);margin-bottom:var(--space-4)">See more on Facebook</h2>
    <p style="color:var(--muted);margin-bottom:var(--space-8)">We post the fresh bakes as they come out of the oven.</p>
    <a href="#" class="btn btn-fill">Oh! You Fancy Focaccia</a>
  </div>
</section>
""" + FOOTER

# ══ REVIEWS ═══════════════════════════════════════════════════════════
def quote_card(text, who, big=False):
    return f"""<div class="card" style="padding:var(--space-10)">
  <svg width="34" height="28" viewBox="0 0 46 38" aria-hidden="true" style="margin-bottom:var(--space-5)">
    <path d="M18 38C8 38 2 31 2 21 2 10 9 2 20 0l2 6c-7 2-11 6-11 11 0 1 0 2 1 3 6-1 11 3 11 9 0 5-3 9-7 9zm24 0c-10 0-16-7-16-17C26 10 33 2 44 0l2 6c-7 2-11 6-11 11 0 1 0 2 1 3 6-1 11 3 11 9 0 5-3 9-7 9z" fill="#8E1B1B" opacity=".3"/></svg>
  <p style="font-family:var(--font-display);font-size:{'1.45rem' if big else '1.2rem'};
    font-style:italic;line-height:1.55;color:var(--text);margin-bottom:var(--space-6)">{text}</p>
  <p style="font-family:var(--font-display);font-size:var(--text-xs);font-weight:700;
    letter-spacing:.2em;text-transform:uppercase;color:var(--burgundy)">{who}</p>
</div>"""

REVIEWS = header("reviews") + page_hero("Kind Words","What Our Customers Say",
  "100% recommend across 9 reviews on Facebook.") + f"""
<section class="sec" style="background:var(--bg)">
  <div class="wrap">
    <p class="eyebrow">From the Market</p>
    <div style="height:var(--space-10)"></div>
    <div class="grid g2" style="align-items:start">
      {quote_card("I stopped at The Dawg House for a sandwich at the Farmer&#8217;s Market today. I received one of the most delicious Italian garden sandwiches I&#8217;ve ever had in my entire existence and it was because she made it with FRESH Focaccia bread from Oh You Fancy Focaccia! It&#8217;s fluffy, it&#8217;s fresh, it&#8217;s flavorful. Must try.","Jessica Dora",True)}
      <div style="display:flex;flex-direction:column;gap:var(--space-6)">
        {quote_card("Best Focaccia I&#8217;ve ever had. She definitely knows what she&#8217;s doing. Absolutely scrumptious.","TonyandTasha Holden")}
        {quote_card("This bread is made with love, so delicious that it compliments every meal. Stop and taste her many yummy varieties.","Char Rigg")}
      </div>
    </div>
  </div>
</section>

<section class="sec" style="background:var(--offset);border-block:1px solid var(--divider)">
  <div class="wrap">
    <p class="eyebrow">Word Around Town</p>
    <h2 class="sec-title">Go see Amanda,<br>you will love it</h2>
    {rule_orn()}
    <div class="grid g2">
      {quote_card("Who has tried the Focaccia from the Brookings Farmers market?? They have sweet and savory flavors. The samples were amazing so I bought the &#8216;Oh you Fancy.&#8217; It was delicious the way it is but turning into a pizza was super fast and easy. Go see Amanda, you will love it.","A neighbour in Brookings")}
      {quote_card("OMG! I tried some the other day and it is absolutely the best focaccia I&#8217;ve ever had in my life. My husband agreed.","A market regular")}
      {quote_card("Super yummy food. Baked with love for sure. So many varieties. Get there early cause this girl sells out quick!","Linnea")}
      {quote_card("It is the best. My family loved it. All three were gone in a day.","A Brookings customer")}
    </div>
  </div>
</section>

<section style="background:var(--burgundy);color:var(--inverse);padding-block:var(--space-20);text-align:center">
  <div class="wrap-narrow">
    <h2 style="font-size:var(--text-xl);color:#FBEDE4;margin-bottom:var(--space-5)">Thank you</h2>
    <p style="color:#E9BFA8;margin-bottom:var(--space-6)">We read every one of these, and they mean the world to us. Thank you to our customers, our friends, our family, and our Father in Heaven for supporting our small business.</p>
    <p style="font-family:var(--font-script);font-size:2.2rem;color:#FBEDE4">Love always, Oh! You Fancy Focaccia</p>
  </div>
</section>
""" + FOOTER

# ══ CONTACT ═══════════════════════════════════════════════════════════
FAQ = [("Do you have a storefront?","Not yet. You will find us at the Brookings-Harbor Farmers Market on Wednesdays and Saturdays, and we deliver and ship as well."),
("Do you deliver?","Yes &#8212; around Brookings and Harbor. Write to us and we will sort out the details."),
("Do you ship?","We do. Send us a note and let us know where you are."),
("Are your ingredients organic?","We bake with organic ingredients, and we say so on every loaf we are proud of."),
("Can you make something custom?","Tell us the occasion. We have made hearts, flower gardens, and plenty of things that were never on a menu."),
("What time should I come to the market?","Early. We bake in small batches and we sell out most market days.")]

CONTACT = header("contact") + page_hero("Say Hello","We&#8217;d Love to Hear From You",
  "Questions, delivery, shipping, or something particular for an occasion &#8212; just say hello.") + f"""
<section class="sec" style="background:var(--bg)">
  <div class="wrap" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-16);align-items:start">
    <div>
      <p class="eyebrow eyebrow-l">Get in Touch</p>
      <div style="display:flex;flex-direction:column;gap:var(--space-6);margin-top:var(--space-6)">
        <div style="display:flex;gap:var(--space-5);align-items:flex-start">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8E1B1B" stroke-width="1.5" style="flex-shrink:0;margin-top:4px">
            <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 7l10 6 10-6"/></svg>
          <div><h3 style="font-size:var(--text-lg);margin-bottom:var(--space-1)">Email</h3>
            <p style="color:var(--muted);font-size:var(--text-sm)">The fastest way to reach us. We answer every message.</p>
            <p style="margin-top:var(--space-2)"><a href="#" style="font-weight:600">ohyoufancyfocaccia@gmail.com</a></p></div>
        </div>
        <div style="display:flex;gap:var(--space-5);align-items:flex-start">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8E1B1B" stroke-width="1.5" style="flex-shrink:0;margin-top:4px">
            <path d="M21 12a9 9 0 10-10.4 8.9v-6.3H8.2V12h2.4V9.9c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.5.7-1.5 1.5V12h2.6l-.4 2.6h-2.2v6.3A9 9 0 0021 12z"/></svg>
          <div><h3 style="font-size:var(--text-lg);margin-bottom:var(--space-1)">Facebook</h3>
            <p style="color:var(--muted);font-size:var(--text-sm)">That is where the fresh bakes get posted first.</p>
            <p style="margin-top:var(--space-2)"><a href="#" style="font-weight:600">Oh! You Fancy Focaccia</a></p></div>
        </div>
        <div style="display:flex;gap:var(--space-5);align-items:flex-start">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8E1B1B" stroke-width="1.5" style="flex-shrink:0;margin-top:4px">
            <path d="M12 21s7-5.7 7-11a7 7 0 10-14 0c0 5.3 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>
          <div><h3 style="font-size:var(--text-lg);margin-bottom:var(--space-1)">Where We Are</h3>
            <p style="color:var(--muted);font-size:var(--text-sm)">Brookings, Oregon &#8212; on the southern Oregon coast, in Curry County.</p></div>
        </div>
      </div>
      <div style="margin-top:var(--space-10);padding:var(--space-6);background:var(--surface);
        border:1px dashed var(--border);border-radius:var(--radius-lg)">
        <p style="font-family:var(--font-display);font-size:var(--text-xs);font-weight:700;
          letter-spacing:.2em;text-transform:uppercase;color:var(--burgundy);margin-bottom:var(--space-2)">Phone</p>
        <p style="color:var(--muted);font-size:var(--text-sm)">[PHONE NUMBER &#8212; if you want one public]</p>
      </div>
    </div>

    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xl);
      padding:var(--space-10);box-shadow:var(--shadow-md)">
      <div style="display:flex;justify-content:center;margin-bottom:var(--space-5)">{olive_branch(150)}</div>
      <h2 style="font-size:var(--text-xl);text-align:center;margin-bottom:var(--space-3)">Find us in person</h2>
      <p style="text-align:center;color:var(--muted);margin-bottom:var(--space-8)">Brookings-Harbor Farmers Market</p>
      <div style="border-block:1px solid var(--divider);padding-block:var(--space-6);text-align:center">
        <p style="font-family:var(--font-display);font-size:2.1rem;font-weight:700;color:var(--burgundy);
          line-height:1.25">Wednesdays<br>&amp; Saturdays</p>
        <p style="font-family:var(--font-display);font-size:var(--text-xs);font-weight:600;
          letter-spacing:.22em;text-transform:uppercase;color:var(--olive);margin-top:var(--space-3)">
          9am &#8216;til sold out</p>
      </div>
      <p style="text-align:center;color:var(--muted);font-size:var(--text-sm);margin-top:var(--space-6)">
        Port of Brookings Harbor. Come early and come hungry &#8212; there are always samples, and we do sell out.</p>
      <div class="photo" style="height:200px;margin-top:var(--space-8)">
        <span class="photo-cap">Map &#183; Port of Brookings Harbor</span></div>
    </div>
  </div>
</section>

<section class="sec" style="background:var(--offset);border-block:1px solid var(--divider)">
  <div class="wrap">
    <p class="eyebrow">Common Questions</p>
    <h2 class="sec-title">Everything people ask us<br>at the stall</h2>
    {rule_orn()}
    <div class="grid g2">
      {''.join(f'<div class="card"><h3>{q}</h3><p>{a}</p></div>' for q,a in FAQ)}
    </div>
  </div>
</section>

<section style="background:var(--bg);padding-block:var(--space-20);text-align:center">
  <div class="wrap-narrow">
    <p style="font-family:var(--font-script);font-size:2.6rem;color:var(--burgundy);margin-bottom:var(--space-3)">Pane &#183; Amore &#183; Sempre</p>
    <p style="color:var(--muted)">Bread, love, always.</p>
  </div>
</section>
""" + FOOTER

# ══ MOBILE (home, 390px) ══════════════════════════════════════════════
MOBILE = f"""
<div class="ribbon" style="font-size:.62rem;letter-spacing:.13em;padding:.5rem .6rem">
  Farmers Market &#183; Wed &amp; Sat &#183; 9am &#8216;til sold out</div>
<header class="hdr"><div style="padding:var(--space-3) var(--space-5);display:flex;
  align-items:center;justify-content:space-between">
  <div class="brand">
    <svg width="42" height="42" viewBox="0 0 58 58" aria-hidden="true">
      <circle cx="29" cy="29" r="27.5" fill="#F5EDD8" stroke="#8E1B1B" stroke-width="2"/>
      <circle cx="29" cy="29" r="23.5" fill="none" stroke="#8E1B1B" stroke-width=".8" opacity=".55"/>
      <path d="M29 17c-4.6 2.6-7 6.4-7 11 0 4.2 3 7.6 7 10.6 4-3 7-6.4 7-10.6 0-4.6-2.4-8.4-7-11z" fill="none" stroke="#4E6023" stroke-width="1.3"/>
      <path d="M29 20.5v17" stroke="#4E6023" stroke-width="1" opacity=".75"/></svg>
    <span class="brand-txt"><span class="brand-script" style="font-size:1.25rem">Oh! You Fancy</span>
      <span class="brand-name" style="font-size:.8rem">Focaccia</span></span>
  </div>
  <button aria-label="Menu" style="width:48px;height:48px;display:flex;flex-direction:column;
    justify-content:center;gap:6px;align-items:flex-end;background:none;border:none">
    <span style="display:block;width:26px;height:1.5px;background:#8E1B1B"></span>
    <span style="display:block;width:26px;height:1.5px;background:#8E1B1B"></span>
    <span style="display:block;width:18px;height:1.5px;background:#8E1B1B"></span>
  </button>
</div></header>

<section style="background:linear-gradient(170deg,var(--surface-2),var(--offset));
  padding:var(--space-12) var(--space-5) var(--space-10);text-align:center">
  <div style="display:flex;justify-content:center;margin-bottom:var(--space-4)">{olive_branch(140)}</div>
  <p style="font-family:var(--font-script);font-size:2.9rem;line-height:.85;color:var(--burgundy)">Oh! You Fancy</p>
  <h1 style="font-size:2.5rem;font-weight:800;letter-spacing:.02em;text-transform:uppercase;
    margin:var(--space-2) 0 var(--space-4)">Focaccia</h1>
  <p style="font-family:var(--font-display);font-size:.68rem;font-weight:600;letter-spacing:.26em;
    text-transform:uppercase;color:var(--olive);margin-bottom:var(--space-5)">Pane &#183; Amore &#183; Sempre</p>
  <p style="color:var(--muted);font-size:1rem;margin-bottom:var(--space-6)">Artisan focaccia, baked by hand on the southern Oregon coast.</p>
  <a href="#" class="btn btn-fill" style="width:100%">Find Us at the Market</a>
  <div class="photo" style="height:280px;margin-top:var(--space-8)">{focaccia(170)}
    <span class="photo-cap">Hero photograph</span></div>
</section>

<section style="padding:var(--space-12) var(--space-5);background:var(--bg)">
  <p class="eyebrow" style="font-size:.66rem">Where to Find Us</p>
  <h2 class="sec-title" style="font-size:1.7rem">We bake small,<br>and we sell out</h2>
  <div style="display:flex;flex-direction:column;gap:var(--space-4);margin-top:var(--space-8)">
    <div class="card" style="padding:var(--space-6)"><p class="num">I</p><h3 style="font-size:1.2rem">At the Market</h3>
      <p>Brookings-Harbor Farmers Market, Wednesdays and Saturdays from 9am until the last loaf is gone.</p></div>
    <div class="card" style="padding:var(--space-6)"><p class="num">II</p><h3 style="font-size:1.2rem">Come Early</h3>
      <p>&#8220;Get there early cause this girl sells out quick.&#8221;</p></div>
    <div class="card" style="padding:var(--space-6)"><p class="num">III</p><h3 style="font-size:1.2rem">We Deliver &amp; Ship</h3>
      <p>Around Brookings and Harbor &#8212; and our breads travel well further afield.</p></div>
  </div>
</section>

<section style="padding:var(--space-12) var(--space-5);background:var(--offset);
  border-block:1px solid var(--divider)">
  <p class="eyebrow" style="font-size:.66rem">From the Oven</p>
  <h2 class="sec-title" style="font-size:1.7rem">Savory &amp; sweet</h2>
  <div style="display:flex;flex-direction:column;gap:var(--space-5);margin-top:var(--space-8)">
    <div class="card" style="padding:0;overflow:hidden">{photo(180,'Savory')}
      <div style="padding:var(--space-5)"><span class="tag">Savory</span>
      <h3 style="font-size:1.2rem;margin-top:var(--space-2)">Olive, Garlic &amp; Jalape&#241;o</h3></div></div>
    <div class="card" style="padding:0;overflow:hidden">{photo(180,'Sweet')}
      <div style="padding:var(--space-5)"><span class="tag">Sweet</span>
      <h3 style="font-size:1.2rem;margin-top:var(--space-2)">Cinnamon Swirl</h3></div></div>
  </div>
</section>

<section style="background:var(--burgundy);padding:var(--space-12) var(--space-5);text-align:center">
  <p style="font-family:var(--font-display);font-size:1.35rem;font-style:italic;line-height:1.5;
    color:#FBEDE4;margin-bottom:var(--space-4)">Best Focaccia I&#8217;ve ever had. Absolutely scrumptious.</p>
  <p style="font-family:var(--font-display);font-size:.66rem;font-weight:600;letter-spacing:.22em;
    text-transform:uppercase;color:#E9BFA8">TonyandTasha Holden</p>
</section>

<section style="background:var(--offset-2);padding:var(--space-12) var(--space-5);text-align:center">
  <h2 style="font-size:1.6rem;margin-bottom:var(--space-4)">Come see us</h2>
  <p style="color:var(--muted);margin-bottom:var(--space-6);font-size:.95rem">Wednesdays &amp; Saturdays, 9am &#8216;til sold out.</p>
  <a href="#" class="btn btn-fill" style="width:100%;font-size:.66rem">Email Us</a>
  <p style="margin-top:var(--space-8);font-family:var(--font-script);font-size:1.6rem;color:var(--burgundy)">
    Love always, Oh! You Fancy Focaccia</p>
</section>
"""

# ── write files ───────────────────────────────────────────────────────
import json
PAGES = [("Main", HOME, 1440, 5900), ("Mobile", MOBILE, 390, 3250),
         ("About", ABOUT, 1440, 3850), ("Breads", BREADS, 1440, 4750),
         ("Gallery", GALLERY, 1440, 3300), ("Reviews", REVIEWS, 1440, 3250),
         ("Contact", CONTACT, 1440, 3650)]
for name, body, w, h in PAGES:
    with open(os.path.join(OUT, f"{name}.dc.html"), "w", encoding="utf-8") as f:
        f.write(page(body, w, h))
    print(f"wrote {name}.dc.html")

canvas = {"artboards":[
  {"file":"Main.dc.html","x":0,"y":0,"w":1440,"h":5900,"title":"Home","print":"flow"},
  {"file":"Mobile.dc.html","x":1560,"y":0,"w":390,"h":3250,"title":"Home - mobile","print":"flow"},
  {"file":"About.dc.html","x":0,"y":6060,"w":1440,"h":3850,"title":"About","print":"flow"},
  {"file":"Breads.dc.html","x":1560,"y":6060,"w":1440,"h":4750,"title":"Our Breads","print":"flow"},
  {"file":"Gallery.dc.html","x":0,"y":10970,"w":1440,"h":3300,"title":"Gallery","print":"flow"},
  {"file":"Reviews.dc.html","x":1560,"y":10970,"w":1440,"h":3250,"title":"Reviews","print":"flow"},
  {"file":"Contact.dc.html","x":0,"y":14430,"w":1440,"h":3650,"title":"Contact","print":"flow"}],
 "annotations":[
  {"id":"brief","x":-460,"y":0,"w":380,"text":"Oh! You Fancy Focaccia\n\nPalette lifted from the logo: burgundy #8E1B1B, olive #4E6023, gold #C08A2E, parchment #F5EDD8.\n\nStructure follows Sugar Haus (home / about / menu / gallery / reviews / contact) with the ordering flow removed.\n\nType: Playfair Display + Lora + Pinyon Script for the wordmark."},
  {"id":"photos","x":-460,"y":380,"w":380,"text":"Every tan panel is a photo slot with an engraved placeholder. Swap in Amanda's real photography before this goes anywhere near a client."},
  {"id":"gaps","x":-460,"y":620,"w":380,"text":"Bracketed placeholders mark the two facts we do not have: prices (Our Breads) and a phone number (Contact). Nothing was invented."}],
 "launch":{"view":"canvas"}}
with open(os.path.join(OUT,"canvas.json"),"w",encoding="utf-8") as f:
    json.dump(canvas,f,indent=2)
print("wrote canvas.json")
