"""Numeric-example check: do a question's/worked example's figures all appear together on one source page?
Usage: numscan.py <ocr_dir> <packs_dir> <out.json>"""
import sys, os, re, json, glob, collections
ocr_dir, packs_dir, out = sys.argv[1:4]
NUM = re.compile(r"\d[\d,]*(?:\.\d+)?")
def nums(s):
    r = set()
    for m in NUM.findall(s):
        v = m.replace(",", "").rstrip(".")
        if v in ("1", "2", "3", "4", "5", "10", "100", "12", "365", "360") or len(v) == 4 and v[:2] in ("19", "20"):
            continue
        r.add(v.rstrip("0").rstrip(".") if "." in v else v)
    return r
TOK = re.compile(r"[a-z]+")
pages = []
for book in sorted(os.listdir(ocr_dir)):
    for f in sorted(glob.glob(os.path.join(ocr_dir, book, "p*.txt"))):
        t = open(f, encoding="utf-8").read()
        pages.append((f"{book} pdf p.{int(os.path.basename(f)[1:5])}", nums(t), set(TOK.findall(t.lower()))))
idx = collections.defaultdict(set)
for i, (_, ns, _) in enumerate(pages):
    for n in ns: idx[n].add(i)
res = []; total = 0
for pf in sorted(glob.glob(os.path.join(packs_dir, "*.json"))):
    for it in json.load(open(pf, encoding="utf-8"))["pack"]["items"]:
        text = it.get("stem_md") or it.get("scenario_narrative_md") or ""
        if it.get("card_type") == "worked_example": text = (it.get("core_explanation_md") or "") + " " + " ".join(s.get("description", "") for s in it.get("worked_steps") or [])
        ns = nums(text)
        if len(ns) < 3: continue
        total += 1
        cnt = collections.Counter()
        for n in ns:
            if len(idx.get(n, ())) > 150: continue
            for p in idx.get(n, ()): cnt[p] += 1
        if not cnt: continue
        p, _ = cnt.most_common(1)[0]
        share = len(ns & pages[p][1]) / len(ns)
        words = set(TOK.findall(text.lower()))
        wshare = len(words & pages[p][2]) / max(1, len(words))
        if share >= 0.8 and len(ns & pages[p][1]) >= 3 and wshare >= 0.6:
            res.append({"pack": os.path.basename(pf).split("-")[0], "id": it["id"], "type": it.get("question_type") or it.get("card_type"), "src": pages[p][0],
                        "nums": sorted(ns), "num_share": round(share, 2), "word_share": round(wshare, 2), "text": text[:400]})
json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("items with >=3 figures:", total, "| figures co-located on one source page:", len(res), collections.Counter(r["pack"] for r in res))
for r in sorted(res, key=lambda r: -len(r["nums"]))[:40]:
    print(f"{r['pack']} {r['id'][5:13]} {r['type']} {r['src']} nums={len(r['nums'])} | {r['text'][:230]}")
