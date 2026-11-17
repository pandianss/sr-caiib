"""Originality scan: published pack text vs OCR'd source books (+ primary sources).
Usage: scan.py <ocr_dir> <packs_dir> <out_json> [primary_dir]"""
import sys, os, re, json, glob, collections
ocr_dir, packs_dir, out = sys.argv[1], sys.argv[2], sys.argv[3]
prim = sys.argv[4] if len(sys.argv) > 4 else None
N = 5            # shingle size for verbatim runs
TOK = re.compile(r"[a-z]+|\d+(?:\.\d+)?")
def toks(s, mask=False):
    s = s.lower().replace("’", "'").replace("'", "")
    t = TOK.findall(s)
    return ["#" if mask and x[0].isdigit() else x for x in t]
def clean_src(s):
    s = re.sub(r"-\n(?=[a-z])", "", s)       # de-hyphenate line breaks
    return s
# ---------- sources ----------
pages = []   # (label, tokens)
for book in sorted(os.listdir(ocr_dir)):
    for f in sorted(glob.glob(os.path.join(ocr_dir, book, "p*.txt"))):
        pg = int(os.path.basename(f)[1:5])
        pages.append((f"{book} pdf p.{pg}", open(f, encoding="utf-8").read()))
nbook = len(pages)
if prim:
    for f in sorted(glob.glob(os.path.join(prim, "*.txt"))):
        txt = open(f, encoding="utf-8", errors="ignore").read()
        w = txt.split("\n"); 
        for i in range(0, len(w), 60):
            pages.append((f"PRIMARY {os.path.basename(f)} L{i+1}", "\n".join(w[i:i+65])))
src5 = {}      # 5-gram -> first page idx (books) ; primary kept apart
src5p = {}
tri_idx = collections.defaultdict(set)   # masked 3-gram -> page idxs (books only)
ptoks = []
for pi, (lab, txt) in enumerate(pages):
    t = toks(clean_src(txt)); ptoks.append(t)
    d = src5 if pi < nbook else src5p
    for i in range(len(t) - N + 1):
        d.setdefault(hash(tuple(t[i:i+N])), pi)
    if pi < nbook:
        m = toks(clean_src(txt), True)
        for i in range(len(m) - 2):
            tri_idx[hash(tuple(m[i:i+3]))].add(pi)
print("source pages", nbook, "primary chunks", len(pages) - nbook, "5grams", len(src5), file=sys.stderr)
COMMON = {h for h, s in tri_idx.items() if len(s) > 400}
# ---------- content ----------
SKIP = {"id","citations","review","origin","context","publication_state","schema_version","syllabus_version","paper_id",
        "module_id","unit_id","objective_ids","prerequisite_objective_ids","question_ids","case_study_id","question_id",
        "correct_option_id","option_id","difficulty","item_type","card_type","question_type","mode","revision","latex_expression"}
def strings(o, path=""):
    if isinstance(o, str):
        yield path, o
    elif isinstance(o, list):
        for i, v in enumerate(o): yield from strings(v, f"{path}[{i}]")
    elif isinstance(o, dict):
        for k, v in o.items():
            if k in SKIP: continue
            yield from strings(v, f"{path}.{k}" if path else k)
SENT = re.compile(r"(?<=[.!?:;])\s+|\n+")
def runs(t, d):
    """longest contiguous token run covered by matching N-grams; coverage; page of longest run"""
    cov = [False] * len(t); pg = [None] * len(t)
    for i in range(len(t) - N + 1):
        p = d.get(hash(tuple(t[i:i+N])))
        if p is not None:
            for j in range(i, i + N): cov[j] = True; pg[j] = p
    best = (0, 0, None); i = 0
    while i < len(t):
        if cov[i]:
            j = i
            while j < len(t) and cov[j]: j += 1
            if j - i > best[0]: best = (j - i, i, pg[i])
            i = j
        else: i += 1
    return best, sum(cov)
res = []; stats = collections.Counter()
for pf in sorted(glob.glob(os.path.join(packs_dir, "*.json"))):
    pack = json.load(open(pf, encoding="utf-8")); pack = pack.get("pack", pack)
    for it in pack["items"]:
        for path, s in strings(it):
            t = toks(s)
            stats["strings"] += 1; stats["words"] += len(t)
            if len(t) < N: continue
            (rl, rs, rp), c = runs(t, src5)
            (prl, prs, prp), pc = runs(t, src5p) if src5p else ((0, 0, None), 0)
            # sentence-level fuzzy containment (numbers masked) against a single source page
            fz = None
            for sent in SENT.split(s):
                m = toks(sent, True)
                if sum(1 for x in m if x != "#" and len(x) > 1) < 10: continue
                g = [hash(tuple(m[i:i+3])) for i in range(len(m) - 2) if sum(1 for x in m[i:i+3] if x != "#" and len(x) > 1) >= 2]
                if len(g) < 6: continue
                cnt = collections.Counter()
                for h in g:
                    if h in COMMON: continue
                    for p in tri_idx.get(h, ()): cnt[p] += 1
                if cnt:
                    p, k = cnt.most_common(1)[0]
                    # recount incl. common trigrams on best page
                    pm = toks(clean_src(pages[p][1]), True)
                    ps = {hash(tuple(pm[i:i+3])) for i in range(len(pm) - 2)}
                    k = sum(1 for h in g if h in ps)
                    r = k / len(g)
                    if fz is None or r > fz[0]: fz = (r, sent.strip(), p, len(m))
            flag = rl >= 8 or (len(t) >= 20 and c / len(t) >= 0.35) or (fz and fz[0] >= 0.5) or prl >= 12
            if flag:
                res.append({"pack": os.path.basename(pf), "id": it["id"], "type": it.get("item_type") + "/" + (it.get("card_type") or it.get("question_type") or ""),
                    "unit": it.get("unit_id"), "path": path, "words": len(t),
                    "run": rl, "run_text": " ".join(t[rs:rs+rl]), "run_src": pages[rp][0] if rp is not None else None,
                    "cov": round(c / len(t), 3),
                    "run_in_prim": round(runs(t[rs:rs+rl], src5p)[1] / rl, 2) if rl >= N and src5p else 0,
                    "fuzzy": round(fz[0], 3) if fz else 0, "fuzzy_sent": fz[1] if fz else None, "fuzzy_src": pages[fz[2]][0] if fz else None,
                    "prim_run": prl, "prim_text": " ".join(t[prs:prs+prl]), "prim_src": pages[prp][0] if prp is not None else None,
                    "text": s})
json.dump({"stats": stats, "flags": res}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(dict(stats), "flagged", len(res), file=sys.stderr)
