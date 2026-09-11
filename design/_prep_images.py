# -*- coding: utf-8 -*-
"""Resize and re-encode Amanda's photography for the design canvas.

Every entry must land under ~68 KB: the whole canvas document republishes on
each save and the editor drops anything over 2 MB. WebP quality is searched
per image; where a heavily-textured crust cannot reach the budget even at low
quality, pixel dimensions come down instead.
"""
from PIL import Image, ImageDraw
import os, io

SRC = "/root/.claude/uploads/01dc96a3-a6dd-5803-8a08-d1aa320808c5"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "img")
TARGET = 68 * 1024

def fit(im, path, lo=38, hi=90):
    best = None
    while lo <= hi:
        q = (lo + hi) // 2
        b = io.BytesIO(); im.save(b, "WEBP", quality=q, method=6)
        if b.tell() <= TARGET:
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

def prepare_logo(stem, size=480):
    """Crop the label to its circle and mask the white ground away."""
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
    fit(im, f"{OUT}/logo.webp", lo=60)

JOBS = [
    ("d3b4b8ed", "hero-garden", 760), ("37832b3a", "savory-round", 600),
    ("38faf7e6", "sweet-cinnamon", 580), ("7a4f2f1e", "muffins-jalapeno", 600),
    ("84d3e0b7", "art-garden", 580), ("5139d28f", "swirl-jalapeno", 600),
    ("a8aedbec", "honey-bites", 600), ("6f3f3a2b", "heart-loaf", 580),
    ("b20d8a47", "olive-slab", 520), ("b0ba1e33", "sea-salt-round", 560),
    ("79665253", "lemon-pepper", 540), ("ca9a03d3", "cheesy-jalapeno", 560),
    ("8f3eed65", "rosemary-slab", 520), ("b59dcf39", "herb-rolls", 560),
    ("3ff24cb1", "olive-tomato", 540), ("ca877ee9", "skillet", 560),
    ("d820daaa", "wide-slab", 900), ("093008b5", "parm-muffins", 560),
    ("10815106", "caramel-swirl", 600),
]

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    prepare_logo("c2a2c49b")
    for stem, name, w in JOBS:
        src = f"{SRC}/{stem}-image.png"
        if not os.path.exists(src):
            src = f"{SRC}/{stem}-image.jpg"
        size, q, n = fit_dim(src, name, w)
        print(f"{name+'.webp':<24}{size[0]}x{size[1]:<5} q{q}  {n//1024}KB")
    tot = sum(os.path.getsize(f"{OUT}/{f}") for f in os.listdir(OUT))
    print(f"\nTOTAL {tot//1024}KB / {len(os.listdir(OUT))} files")
