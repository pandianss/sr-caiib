// In-page UI audit used during rendered inspection (paste/evaluate in the browser against the running app).
// It measures the REAL rendered DOM: horizontal overflow, touch-target sizes, text contrast and unnamed controls.
// Usage in page: await window.__audit(['today','learn', ...], { theme: 'dark', textScale: 2 })
window.__audit = async function (routes, opts = {}) {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const root = document.documentElement;
  if (opts.theme) root.dataset.theme = opts.theme;
  root.style.fontSize = opts.textScale ? `${opts.textScale * 100}%` : '';
  await wait(350); // let colour transitions settle before measuring contrast
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const parse = c => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { rgb: p.slice(0, 3), a: p[3] === undefined ? 1 : p[3] }; };
  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0.99) return c.rgb; } return parse(getComputedStyle(document.body).backgroundColor)?.rgb ?? [255, 255, 255]; };
  const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest('.sr-only, .skip'); };
  const inScroller = el => Boolean(el.closest('.table-wrap, .formula, .tabs, .calc, .qnav'));
  const report = {};
  for (const route of routes) {
    if (route !== null) { location.hash = `#/${route}`; await wait(opts.wait ?? 700); }
    const vw = root.clientWidth; const issues /* clientWidth: innerWidth grows with overflowing content under mobile emulation */ = { overflow: [], smallTargets: [], contrast: [], unnamed: [] };
    if (root.scrollWidth > vw + 1) issues.overflow.push(`page scrollWidth ${root.scrollWidth} > ${vw}`);
    for (const el of document.querySelectorAll('body *')) {
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      if ((r.right > vw + 1 || r.left < -1) && !inScroller(el)) issues.overflow.push(`${el.tagName.toLowerCase()}.${el.className} "${(el.textContent || '').trim().slice(0, 30)}" right=${Math.round(r.right)}`);
    }
    const min = 48 * (opts.textScale ? 1 : 1); // 48 CSS px minimum regardless of text scale
    for (const el of document.querySelectorAll('button, a[href], input, select, summary, label.option')) {
      if (!visible(el) || el.closest('.md') || (el.tagName === 'INPUT' && (el.type === 'radio' || el.type === 'checkbox'))) continue;
      const r = el.getBoundingClientRect();
      if (r.width < min - 0.5 || r.height < min - 0.5) issues.smallTargets.push(`${el.tagName.toLowerCase()}.${el.className} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 28)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
      const name = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim() || (el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent) || el.getAttribute('aria-labelledby');
      if (!name) issues.unnamed.push(`${el.tagName.toLowerCase()}.${el.className}#${el.id}`);
    }
    const seen = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement; if (!n.textContent.trim() || !el || !visible(el) || seen.has(el)) continue; seen.add(el);
      const s = getComputedStyle(el); const fg = parse(s.color); if (!fg) continue;
      if (el.closest(':disabled, [aria-disabled="true"]')) continue; // inactive controls are exempt from WCAG contrast
      const bg = bgOf(el); const opacity = Number(s.opacity) || 1;
      const mix = fg.rgb.map((v, i) => v * fg.a * opacity + bg[i] * (1 - fg.a * opacity));
      const l1 = lum(mix), l2 = lum(bg); const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const px = parseFloat(s.fontSize); const large = px >= 24 || (px >= 18.66 && Number(s.fontWeight) >= 700);
      if (ratio < (large ? 3 : 4.5) - 0.01) issues.contrast.push(`${ratio.toFixed(2)} ${el.tagName.toLowerCase()}.${el.className} "${n.textContent.trim().slice(0, 24)}"`);
    }
    for (const k of Object.keys(issues)) issues[k] = [...new Set(issues[k])].slice(0, 8);
    report[route ?? location.hash] = Object.fromEntries(Object.entries(issues).filter(([, v]) => v.length));
  }
  return { viewport: `${root.clientWidth}x${window.innerHeight}`, theme: root.dataset.theme, textScale: opts.textScale ?? 1, report };
};
