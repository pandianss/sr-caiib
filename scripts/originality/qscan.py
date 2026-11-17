"""Copied-question check: published question stems/options vs source pages (esp. Check Your Progress)."""
import sys, os, re, json, glob, collections
ocr_dir, packs_dir, out = sys.argv[1:4]
TOK = re.compile(r"[a-z]+|\d+(?:\.\d+)?")
def toks(s, mask=True):
    t = TOK.findall(s.lower().replace("’", "").replace("'", ""))
    return ["#" if mask and x[0].isdigit() else x for x in t]
pages = []
for book in sorted(os.listdir(ocr_dir)):
    for f in sorted(glob.glob(os.path.join(ocr_dir, book, "p*.txt"))):
        txt = re.sub(r"-\n(?=[a-z])", "", open(f, encoding="utf-8").read())
        nopt = len(re.findall(r"(?m)^\s*\(?[a-dA-D]\)\s", txt))
        pages.append((f"{book} pdf p.{int(os.path.basename(f)[1:5])}", txt, nopt))
ptok = [toks(p[1]) for p in pages]
pstr = [" " + " ".join(t) + " " for t in ptok]
pset = [{hash(tuple(t[i:i+3])) for i in range(len(t)-2)} for t in ptok]
idx = collections.defaultdict(set)
for pi, s in enumerate(pset):
    for h in s: idx[h].add(pi)
COMMON = {h for h, s in idx.items() if len(s) > 300}
res = []
nq = 0
for pf in sorted(glob.glob(os.path.join(packs_dir, "*.json"))):
    pack = json.load(open(pf, encoding="utf-8"))["pack"]
    for it in pack["items"]:
        if it.get("item_type") != "question": continue
        nq += 1
        m = toks(it["stem_md"])
        g = [hash(tuple(m[i:i+3])) for i in range(len(m)-2)]
        if len(g) < 3: continue
        cnt = collections.Counter()
        for h in g:
            if h in COMMON: continue
            for p in idx.get(h, ()): cnt[p] += 1
        best = None
        for p, _ in cnt.most_common(5):
            r = sum(1 for h in g if h in pset[p]) / len(g)
            opts = it.get("options") or []
            hit = []
            for o in opts:
                ot = toks(o["text_md"])
                if len(ot) >= 1 and (" " + " ".join(ot) + " ") in (pstr[p] + (pstr[p+1] if p+1 < len(pstr) else "")):
                    hit.append((o["option_id"], len(ot)))
            score = r + 0.15 * len(hit)
            if best is None or score > best[0]: best = (score, r, p, hit)
        if not best: continue
        score, r, p, hit = best
        longhit = [h for h in hit if h[1] >= 2]
        if (r >= 0.6 and len(m) >= 8) or (r >= 0.4 and len(hit) >= 3) or (r >= 0.5 and len(longhit) >= 2):
            res.append({"pack": os.path.basename(pf), "id": it["id"], "unit": it["unit_id"], "qtype": it["question_type"], "stem_sim": round(r, 2), "stem_words": len(m),
                        "opts_on_page": len(hit), "opts_multiword_on_page": len(longhit), "n_opts": len(it.get("options") or []),
                        "src": pages[p][0], "src_option_lines": pages[p][2], "stem": it["stem_md"], "options": [o["text_md"] for o in it.get("options") or []]})
json.dump({"questions": nq, "flags": res}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("questions", nq, "flagged", len(res))
c = collections.Counter((r["pack"][:5], "CYP-page" if r["src_option_lines"] >= 4 else "prose-page", ">=3opts" if r["opts_on_page"] >= 3 else "<3opts") for r in res)
for k in sorted(c): print(k, c[k])
