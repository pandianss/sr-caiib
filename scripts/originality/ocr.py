import sys, os, io, time, asyncio
import pymupdf, winocr
from PIL import Image
pdf, out, a, b = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
os.makedirs(out, exist_ok=True)
d = pymupdf.open(pdf)
b = min(b, len(d))
async def run():
    for i in range(a, b):
        fn = os.path.join(out, f"p{i+1:04d}.txt")
        if os.path.exists(fn): continue
        pix = d[i].get_pixmap(dpi=170, colorspace=pymupdf.csGRAY)
        img = Image.frombytes("L", (pix.width, pix.height), pix.samples).convert("RGBA")
        r = await winocr.recognize_pil(img, "en")
        with open(fn + ".tmp", "w", encoding="utf-8") as f:
            f.write("\n".join(l.text for l in r.lines))
        os.replace(fn + ".tmp", fn)
asyncio.run(run())
