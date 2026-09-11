# -*- coding: utf-8 -*-
"""Resize and re-encode Amanda's photography for the design canvas.

Every entry must land under ~68 KB: the whole canvas document republishes on
each save and the editor drops anything over 2 MB. WebP quality is searched
per image; where a heavily-textured crust cannot reach the budget even at low
quality, pixel dimensions come down instead.
"""
from PIL import Image, ImageDraw
import os, io, sys

SRC = "/root/.claude/uploads/01dc96a3-a6dd-5803-8a08-d1aa320808c5"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "img")
ROOT_SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src")
TARGET = 68 * 1024

def fit(im, path, lo=38, hi=90, target=TARGET):
    """Write `im` as WebP at the highest quality that stays inside `target`.

    Binary search rather than a fixed quality: a flat-lit round and a
    heavily-blistered crust land decades apart on the quality scale for the
    same file size. Returns (quality, bytes), or None if even `lo` overshoots
    — which is the caller's signal to reduce the dimensions instead."""
    best = None
    while lo <= hi:
        q = (lo + hi) // 2
        b = io.BytesIO(); im.save(b, "WEBP", quality=q, method=6)
        if b.tell() <= target:
            best = (q, b.getvalue()); lo = q + 1
        else:
            hi = q - 1
    if best:
        open(path, "wb").write(best[1])
    return best

def fit_dim(src, name, w):
    """Shrink until a reasonable quality fits the budget."""
    while w >= 380:
        im = Image.open(src).convert("RGB")
        r = w / im.size[0]
        im = im.resize((w, int(im.size[1] * r)), Image.LANCZOS)
        got = fit(im, f"{OUT}/{name}.webp", lo=55)
        if got:
            return im.size, got[0], len(got[1])
        w = int(w * 0.88)
    raise SystemExit(f"{name}: cannot reach budget")

def prepare_logo(stem, size=480, out="logo", budget=TARGET):
    """Crop the label to its circle and mask the white ground away.

    Two sizes come out of this: the 480px one every masthead and the favicon
    use, and a 840px one for the loading screen, where the label is the whole
    picture and its lettering has to survive being read. The big one is over
    the gallery budget on purpose — it is the only image on that screen."""
    im = Image.open(f"{SRC}/{stem}-image.png").convert("RGB")
    W, H = im.size; px = im.load()
    minx, miny, maxx, maxy = W, H, 0, 0
    for y in range(0, H, 3):
        for x in range(0, W, 3):
            r, g, b = px[x, y]
            if r < 244 or g < 244 or b < 244:
                minx = min(minx, x); maxx = max(maxx, x)
                miny = min(miny, y); maxy = max(maxy, y)
    side = min(max(maxx - minx, maxy - miny), W, H)
    cx, cy = (minx + maxx) // 2, (miny + maxy) // 2
    x0 = max(0, min(cx - side // 2, W - side))
    y0 = max(0, min(cy - side // 2, H - side))
    im = im.crop((x0, y0, x0 + side, y0 + side)).resize((size, size), Image.LANCZOS).convert("RGBA")
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).ellipse((1, 1, size - 2, size - 2), fill=255)
    im.putalpha(m)
    fit(im, f"{OUT}/{out}.webp", lo=60, hi=92, target=budget)

def prepare_splash_scene(src=os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                          "src", "splash-scene.jpg")):
    """The courtyard photograph behind the loading screen.

    It is the only image on that screen and sits under a burgundy wash, so it
    gets a larger budget than a gallery bake. The source is already cropped
    clear of the dark frame the original screenshot carried."""
    im = Image.open(src).convert("RGB")
    got = fit(im, f"{OUT}/splash-scene.webp", lo=40, hi=92, target=220 * 1024)
    if not got:
        raise SystemExit("splash-scene: cannot reach budget")
    print(f"splash-scene.webp       {im.size[0]}x{im.size[1]:<5} q{got[0]}  {len(got[1])//1024}KB")

JOBS = [
    ("d3b4b8ed", "hero-garden", 760), ("37832b3a", "savory-round", 600),
    ("38faf7e6", "sweet-cinnamon", 580), ("7a4f2f1e", "muffins-jalapeno", 600),
    ("84d3e0b7", "art-garden", 580), ("5139d28f", "swirl-jalapeno", 600),
    ("a8aedbec", "hot-honey-bites", 600), ("6f3f3a2b", "heart-loaf", 580),
    ("b20d8a47", "olive-slab", 520), ("b0ba1e33", "sea-salt-round", 560),
    ("79665253", "lemon-pepper", 540), ("ca9a03d3", "scallion-chili", 560),
    ("8f3eed65", "rosemary-slab", 520), ("b59dcf39", "herb-rolls", 560),
    ("3ff24cb1", "olive-tomato", 540), ("ca877ee9", "pesto-skillet", 560),
    ("d820daaa", "wide-slab", 900), ("093008b5", "parm-muffins", 560),
    ("10815106", "caramel-swirl", 600),
    ("02d0f819", "jalapeno-swirl-xl", 600),
    ("791fd729", "jalapeno-garlic-round", 560),
    ("33e81866", "jalapeno-dimpled", 560),
    ("7453f7b8", "tomato-olive-round", 560),
    ("596ef3d4", "garlic-herb-round", 560),
    ("474db0bc", "potato-onion", 520),
    ("9dbee8ae", "plain-swirl", 560),
    ("a64338e8", "square-focaccia", 560),
    ("b031a6e9", "cinnamon-dark", 520),
    ("ee579750", "cinnamon-drizzle-2", 520),
]

# Bakes whose only copy came through a screenshot, cropped into design/src
# rather than sitting in the upload set. Same budget, same encoder.
SRC_JOBS = [
    ("classic-sourdough", 560),
    ("garlic-rosemary-sourdough", 560),
]

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    if sys.argv[1:] == ["splash"]:          # the photo alone; the bakes need the upload set
        prepare_splash_scene()
        sys.exit()
    prepare_logo("c2a2c49b")
    prepare_logo("c2a2c49b", size=840, out="logo-splash", budget=140 * 1024)
    for stem, name, w in JOBS:
        src = f"{SRC}/{stem}-image.png"
        if not os.path.exists(src):
            src = f"{SRC}/{stem}-image.jpg"
        size, q, n = fit_dim(src, name, w)
        print(f"{name+'.webp':<24}{size[0]}x{size[1]:<5} q{q}  {n//1024}KB")
    for name, w in SRC_JOBS:
        size, q, n = fit_dim(f"{ROOT_SRC}/{name}.png", name, w)
        print(f"{name+'.webp':<24}{size[0]}x{size[1]:<5} q{q}  {n//1024}KB")
    tot = sum(os.path.getsize(f"{OUT}/{f}") for f in os.listdir(OUT))
    print(f"\nTOTAL {tot//1024}KB / {len(os.listdir(OUT))} files")
