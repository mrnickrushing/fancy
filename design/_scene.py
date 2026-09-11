# -*- coding: utf-8 -*-
"""The hill scene that sits behind the loading screen.

Amanda's label is an illustration, not a photograph — cypress, campanile and
olive terrace, drawn. The splash borrows the same hand rather than dropping a
stock photo behind it, which keeps the two reading as one brand. Drawn as
vector it also stays sharp from a 390px phone to a 5K display and adds about
six kilobytes rather than a couple of hundred.

Everything sits under a burgundy wash on the page, so the palette here runs a
stop or two brighter than it looks in the finished splash.
"""

W, H = 1600, 900

SKY_HI   = "#B9C9D2"
SKY_LO   = "#F0DDB0"
FAR      = ["#9DB0BB", "#8CA3B0", "#7B94A2"]
MID      = ["#8E9F7E", "#7C9068"]
NEAR     = ["#63784A", "#4E6023"]
DEEP     = "#3B4A1E"
CYPRESS  = "#37492B"
STONE    = "#E6D6B4"
STONE_SH = "#CDB894"
ROOF     = "#B25A2E"
ROOF_SH  = "#93482599"


def _smooth(pts, base_close=True):
    """A rolling ridge through the given summits, closed to the bottom edge."""
    d = f"M0 {pts[0][1]:.0f}"
    for i in range(1, len(pts)):
        x0, y0 = pts[i - 1]
        x1, y1 = pts[i]
        mx = x0 + (x1 - x0) / 2
        d += f" C{mx:.0f} {y0:.0f} {mx:.0f} {y1:.0f} {x1:.0f} {y1:.0f}"
    if base_close:
        d += f" L{W} {H} L0 {H} Z"
    return d


def _ridge(pts, fill, op=1.0):
    """One filled range of hills, drawn through `pts` and closed to the bottom.

    Each ridge is opaque below its own skyline, so they are painted back to
    front and the nearer one simply covers what is behind it."""
    o = "" if op == 1 else f' opacity="{op}"'
    return f'<path d="{_smooth(pts)}" fill="{fill}"{o}/>'


def _cypress(x, y, h, fill=CYPRESS, op=1.0):
    """The flame silhouette that says Tuscany before anything else does."""
    w = h * 0.27
    d = (f"M{x:.0f} {y:.0f} C{x - w / 2:.1f} {y - h * .30:.0f} {x - w * .48:.1f} {y - h * .74:.0f} "
         f"{x:.0f} {y - h:.0f} C{x + w * .48:.1f} {y - h * .74:.0f} {x + w / 2:.1f} {y - h * .30:.0f} "
         f"{x:.0f} {y:.0f}Z")
    o = "" if op == 1 else f' opacity="{op}"'
    return f'<path d="{d}" fill="{fill}"{o}/>'


def _house(x, y, w, h, windows=True):
    """A block of warm stone with a terracotta cap."""
    o = w * 0.09                                   # the eaves overhang the wall
    s = [f'<rect x="{x:.0f}" y="{y - h:.0f}" width="{w:.0f}" height="{h:.0f}" fill="{STONE}"/>',
         f'<rect x="{x + w * .66:.0f}" y="{y - h:.0f}" width="{w * .34:.0f}" height="{h:.0f}" '
         f'fill="{STONE_SH}" opacity=".55"/>',
         f'<rect x="{x - o:.1f}" y="{y - h - w * .11:.1f}" width="{w + o * 2:.1f}" '
         f'height="{w * .13:.1f}" fill="{ROOF}"/>']
    if windows and h > 26:
        for i in range(max(1, int(w // 20))):
            wx = x + 6 + i * 18
            if wx + 6 < x + w:
                s.append(f'<rect x="{wx:.0f}" y="{y - h + 10:.0f}" width="5" height="9" '
                         f'fill="{ROOF_SH}"/>')
    return "".join(s)


def _campanile(x, y, w, h):
    """The bell tower — the one vertical that reads as a village from a distance."""
    return (f'<rect x="{x:.0f}" y="{y - h:.0f}" width="{w:.0f}" height="{h:.0f}" fill="{STONE}"/>'
            f'<rect x="{x + w * .62:.0f}" y="{y - h:.0f}" width="{w * .38:.0f}" height="{h:.0f}" '
            f'fill="{STONE_SH}" opacity=".5"/>'
            f'<path d="M{x - w * .34:.0f} {y - h:.0f} L{x + w / 2:.0f} {y - h - w * .78:.0f} '
            f'L{x + w * 1.34:.0f} {y - h:.0f}Z" fill="{ROOF}"/>'
            f'<path d="M{x + w * .28:.0f} {y - h + 20:.0f} a{w * .22:.0f} {w * .22:.0f} 0 0 1 '
            f'{w * .44:.0f} 0 l0 {w * .5:.0f} l-{w * .44:.0f} 0Z" fill="{ROOF_SH}"/>')


# The hill town, hand-placed so the roofline steps down the knoll instead of
# marching along at one height. x, base, width, height.
_TOWN = [
    (868, 648, 56, 42), (898, 668, 48, 30), (922, 636, 42, 50), (958, 624, 50, 42),
    (1060, 628, 58, 38), (1096, 646, 46, 44), (1142, 660, 42, 38), (1176, 672, 54, 34),
    (1228, 684, 38, 30), (1044, 666, 40, 28),
]


def scene_svg(cls="scene"):
    """The whole scene as one inline <svg>, sized to cover whatever box holds it."""
    p = []

    # sky, then the low sun that warms the horizon
    p.append(f'<rect width="{W}" height="{H}" fill="url(#skG)"/>')
    p.append(f'<ellipse cx="1108" cy="392" rx="430" ry="300" fill="url(#snG)"/>')

    # two drawn-out cloud banks, low and horizontal, so the sky is not a flat wash
    p.append('<g filter="url(#sft)">')
    for cx, cy, rx, ry, op in [(430, 250, 300, 26, .42), (330, 214, 190, 17, .30),
                               (1180, 286, 340, 22, .36), (980, 196, 200, 15, .24)]:
        p.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#FFFFFF" '
                 f'opacity="{op}"/>')
    p.append('</g>')

    # three ranges stacked back to front, each a shade cooler than the last
    p.append(_ridge([(0, 470), (210, 404), (430, 452), (650, 388), (880, 440),
                     (1120, 396), (1350, 448), (1600, 414)], FAR[0], .8))
    p.append(_ridge([(0, 510), (240, 462), (500, 498), (760, 448), (1010, 486),
                     (1290, 452), (1600, 492)], FAR[1], .88))
    p.append(_ridge([(0, 548), (300, 512), (560, 546), (850, 500), (1140, 538),
                     (1420, 508), (1600, 540)], FAR[2]))

    # haze in the valley — the trick that makes the ranges sit behind the hills
    p.append(f'<rect y="470" width="{W}" height="160" fill="url(#hzG)"/>')

    # the green country the town stands on
    p.append(_ridge([(0, 618), (260, 592), (520, 624), (820, 574), (1100, 606),
                     (1380, 588), (1600, 616)], MID[0]))
    for x, h in [(96, 52), (150, 40), (318, 58), (366, 44), (612, 50), (1462, 46), (1512, 58)]:
        p.append(_cypress(x, 612 + (x % 17), h, CYPRESS, .55))

    # a lone farmhouse across the valley, to balance the town
    p.append(_house(238, 618, 44, 30))
    p.append(_house(272, 624, 30, 22, windows=False))

    # the hill town, with its cypress guard
    p.append('<g>')
    for x, y, w, h in _TOWN:
        p.append(_house(x, y, w, h))
    p.append(_campanile(1006, 622, 30, 88))
    p.append('</g>')
    for x, y, h in [(846, 656, 78), (956, 632, 66), (1044, 636, 58),
                    (1260, 692, 70), (1298, 700, 54), (826, 662, 52)]:
        p.append(_cypress(x, y, h))

    # foreground terrace
    p.append(_ridge([(0, 700), (300, 676), (640, 712), (960, 668), (1280, 704),
                     (1600, 678)], MID[1]))
    # ploughed contour lines — they give the terrace a direction to run along
    for i, y in enumerate((722, 742, 762)):
        p.append(f'<path d="M0 {y} C300 {y - 22} 640 {y + 14} 960 {y - 28} '
                 f'C1240 {y - 48} 1440 {y - 6} 1600 {y - 20}" fill="none" '
                 f'stroke="{DEEP}" stroke-width="2" opacity="{.20 - i * .04:.2f}"/>')
    p.append(_ridge([(0, 772), (340, 742), (700, 786), (1080, 736), (1440, 778),
                     (1600, 752)], NEAR[0]))

    # olive canopies along the last ridge, rows of overlapping crowns
    for i in range(26):
        x = 24 + i * 62 + (i % 3) * 11
        y = 796 + (i % 4) * 9
        r = 21 + (i % 3) * 5
        p.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{NEAR[1]}"/>'
                 f'<circle cx="{x - r * .5:.0f}" cy="{y + r * .3:.0f}" r="{r * .72:.0f}" '
                 f'fill="{NEAR[1]}"/>'
                 f'<circle cx="{x + r * .55:.0f}" cy="{y + r * .25:.0f}" r="{r * .66:.0f}" '
                 f'fill="{DEEP}" opacity=".55"/>')

    p.append(_ridge([(0, 842), (420, 826), (900, 856), (1320, 828), (1600, 848)], DEEP))

    defs = (f'<defs>'
            f'<linearGradient id="skG" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="{SKY_HI}"/>'
            f'<stop offset=".62" stop-color="#DCD5BE"/>'
            f'<stop offset="1" stop-color="{SKY_LO}"/></linearGradient>'
            f'<radialGradient id="snG">'
            f'<stop offset="0" stop-color="#FFF4D2" stop-opacity=".85"/>'
            f'<stop offset="1" stop-color="#FFF4D2" stop-opacity="0"/></radialGradient>'
            f'<linearGradient id="hzG" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="#F2E6C6" stop-opacity="0"/>'
            f'<stop offset="1" stop-color="#F2E6C6" stop-opacity=".5"/></linearGradient>'
            f'<filter id="sft" x="-20%" y="-200%" width="140%" height="500%">'
            f'<feGaussianBlur stdDeviation="22"/></filter>'
            f'</defs>')

    return (f'<svg class="{cls}" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" '
            f'aria-hidden="true" focusable="false">{defs}{"".join(p)}</svg>')
