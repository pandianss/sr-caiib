// Writes the scanned image of one or more PDF pages to PNG files so a reviewer can read the actual page.
// For scanned books (one image per page, no text layer). Uses pdfjs to decode the embedded image and a
// minimal built-in PNG encoder; no external tools. Output files are review aids: keep them out of the repo.
// Usage: node scripts/render-page.mjs <pdf> <outDir> <page>[-<page>] [maxWidth=1300]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';

const [pdfPath, outDir, range, maxWidthArg] = process.argv.slice(2);
if (!pdfPath || !outDir || !range) { console.error('Usage: node scripts/render-page.mjs <pdf> <outDir> <page>[-<page>] [maxWidth]'); process.exit(2); }
const maxWidth = Number(maxWidthArg ?? 1300);
const [from, to = from] = range.split('-').map(Number);
mkdirSync(outDir, { recursive: true });

const crcTable = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const body = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body)); return Buffer.concat([len, body, crc]); };
/** Greyscale 8-bit PNG. */
function pngGrey(width, height, grey) {
  const raw = Buffer.alloc((width + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (width + 1)] = 0; grey.copy(raw, y * (width + 1) + 1, y * width, (y + 1) * width); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))]);
}
/** Converts a pdfjs image (kind 1 = 1bpp grey, 2 = RGB, 3 = RGBA) to 8-bit grey, box-averaged down to maxWidth. */
function toGrey(img) {
  const { width, height, data, kind } = img;
  const factor = Math.max(1, Math.ceil(width / maxWidth));
  const w = Math.floor(width / factor), h = Math.floor(height / factor);
  const out = Buffer.alloc(w * h);
  const at = (x, y) => {
    if (kind === 1) { const rowBytes = (width + 7) >> 3; return (data[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1 ? 255 : 0; }
    const step = kind === 2 ? 3 : 4; const i = (y * width + x) * step;
    return (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let dy = 0; dy < factor; dy++) for (let dx = 0; dx < factor; dx++) sum += at(x * factor + dx, y * factor + dy);
    out[y * w + x] = Math.round(sum / (factor * factor));
  }
  return { w, h, out };
}

const doc = await getDocument({ data: new Uint8Array(readFileSync(pdfPath)), verbosity: 0, isOffscreenCanvasSupported: false }).promise;
for (let pn = from; pn <= Math.min(to, doc.numPages); pn++) {
  const page = await doc.getPage(pn);
  const ops = await page.getOperatorList();
  const names = [];
  ops.fnArray.forEach((fn, i) => { if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject) names.push(ops.argsArray[i][0]); });
  if (!names.length) { console.error(`page ${pn}: no page image found`); continue; }
  // The page scan is the largest image on the page.
  const images = await Promise.all(names.map(name => new Promise(resolve => { const store = name.startsWith('g_') ? page.commonObjs : page.objs; store.get(name, resolve); })));
  const img = images.filter(Boolean).sort((a, b) => b.width * b.height - a.width * a.height)[0];
  if (!img?.data) { console.error(`page ${pn}: image could not be decoded`); continue; }
  const { w, h, out } = toGrey(img);
  const file = join(outDir, `p${String(pn).padStart(4, '0')}.png`);
  writeFileSync(file, pngGrey(w, h, out));
  console.log(`${file} ${w}x${h} (source ${img.width}x${img.height}, kind ${img.kind})`);
}
