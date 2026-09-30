"""Write docs/images/logo.svg and docs/images/icon.svg from the lynx in the banner.

Run from the repo root with Python 3 (no packages). The banner is the only
source of the mark, so after a banner edit, run this again.
"""
import pathlib, re

banner = pathlib.Path("docs/images/banner.svg").read_text()
defs = banner[banner.index("<defs>") + 6 : banner.index("</defs>")]
lxb = re.search(r'<path id="lxb" d="[^"]+"/>', defs).group(0)
lynx = re.search(r'<g id="lynx">.*?</g></g>', defs, re.S).group(0)

def mark(stroke):
    # The outline first, then the mark, exactly as the banner body draws them.
    return (
        f'<g transform="translate(0,1416) scale(1,-1)">'
        f'<use href="#lxb" fill="#ffffff" stroke="#ffffff" stroke-width="{stroke}" stroke-linejoin="round"/>'
        f'</g><use href="#lynx"/>'
    )

logo = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -40 1356 1496" '
    'role="img" aria-label="LynxPrompt">'
    f'<defs>{lxb}{lynx}</defs>{mark(60)}</svg>'
)
icon = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 1536" '
    'role="img" aria-label="LynxPrompt">'
    '<clipPath id="plate"><rect width="1536" height="1536" rx="300"/></clipPath>'
    '<g clip-path="url(#plate)">'
    '<rect width="768" height="1536" fill="#f6f6f4"/>'
    '<rect x="768" width="768" height="1536" fill="#0b0b0c"/>'
    '</g>'
    f'<defs>{lxb}{lynx}</defs>'
    f'<g transform="translate(130,60)">{mark(80)}</g></svg>'
)
pathlib.Path("docs/images/logo.svg").write_text(logo + "\n")
pathlib.Path("docs/images/icon.svg").write_text(icon + "\n")
print(len(logo), len(icon))
