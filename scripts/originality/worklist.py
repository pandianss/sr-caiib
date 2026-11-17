"""Build rewrite worklist: sentence-level spans of must-fix strings. Usage: worklist.py <packs_dir> <out_prefix>"""
import sys, os, re, json, glob, collections
packs_dir, outp = sys.argv[1], sys.argv[2]
W = os.path.dirname(os.path.abspath(__file__))
N = 5
SUF = os.environ.get("SUF", "")
TOKP = re.compile(r"[A-Za-z]+|\d+(?:\.\d+)?")
def toks(s): return [m.group(0).lower() for m in TOKP.finditer(s.replace("’", "").replace("'", ""))]
def clean(s): return re.sub(r"-\n(?=[a-z])", "", s)
book5, prim5 = set(), set()
for f in glob.glob(os.path.join(W, "ocr", "*", "p*.txt")):
    t = toks(clean(open(f, encoding="utf-8").read()))
    for i in range(len(t) - N + 1): book5.add(hash(tuple(t[i:i+N])))
P = os.environ.get("PRIM")
if P:
    for f in glob.glob(os.path.join(P, "*.txt")):
        t = toks(open(f, encoding="utf-8", errors="ignore").read())
        for i in range(len(t) - N + 1): prim5.add(hash(tuple(t[i:i+N])))
def analyse(s):
    """returns list of runs (len, text, lawshare, nameshare) and coverage"""
    raw = [m.group(0) for m in TOKP.finditer(s.replace("’", "").replace("'", ""))]
    t = [x.lower() for x in raw]
    cov = [False] * len(t); law = [False] * len(t)
    for i in range(len(t) - N + 1):
        h = hash(tuple(t[i:i+N]))
        if h in book5:
            for j in range(i, i+N): cov[j] = True
        if h in prim5:
            for j in range(i, i+N): law[j] = True
    runs = []; i = 0
    while i < len(t):
        if cov[i]:
            j = i
            while j < len(t) and cov[j]: j += 1
            name = sum(1 for x in raw[i:j] if x[0].isupper() or x[0].isdigit()) / (j - i)
            runs.append((j - i, " ".join(t[i:j]), sum(law[i:j]) / (j - i), name))
            i = j
        else: i += 1
    return runs, (sum(cov) / len(t) if t else 0), len(t)
SPLIT = re.compile(r"(?<=[.!?])\s+|\n+")
def sentences(s):
    out = []; pos = 0
    for m in SPLIT.finditer(s):
        if m.start() > pos: out.append(s[pos:m.start()])
        pos = m.end()
    if pos < len(s): out.append(s[pos:])
    return [x for x in out if x.strip()]
tiers = json.load(open(os.path.join(W, "tiers"+SUF+".json")))
must = {}
for k, v in tiers.items():
    if k[0] in "12345":
        for i, p in v: must.setdefault((i, p), k[:2].strip())
fz = {(f["id"], f["path"]): f for f in json.load(open(os.path.join(W, "flags"+SUF+".json"), encoding="utf-8"))["flags"]}
qf = {q["id"]: q for q in json.load(open(os.path.join(W, "qflags"+SUF+".json"), encoding="utf-8"))["flags"]}
def get(o, path):
    for part in re.findall(r"[^.\[\]]+", path):
        o = o[int(part)] if isinstance(o, list) else o[part]
    return o
spans = []; sid = 0
for pf in sorted(glob.glob(os.path.join(packs_dir, "*.json"))):
    pk = os.path.basename(pf).split("-")[0]
    for it in json.load(open(pf, encoding="utf-8"))["pack"]["items"]:
        keys = [(i, p) for (i, p) in must if i == it["id"]] if any(i == it["id"] for i, _ in ()) else None
    items = json.load(open(pf, encoding="utf-8"))["pack"]["items"]
    byid = collections.defaultdict(list)
    for (i, p), t in must.items(): byid[i].append((p, t))
    for it in items:
        for path, tier in sorted(byid.get(it["id"], [])):
            try: s = get(it, path)
            except Exception: continue
            ctx = ""
            if it["item_type"] == "question":
                ctx = "Q: " + it["stem_md"][:140].replace("\n", " ") + " || " + " / ".join(("*" if o["option_id"] == it.get("correct_option_id") else "") + o["text_md"][:60] for o in it.get("options") or [])
            else: ctx = "CARD: " + it.get("title", "")
            whole = tier in ("1a", "1b", "5") or path.endswith("text_md") or path == "stem_md" or len(toks(s)) < 26
            cands = [s] if whole else sentences(s)
            f = fz.get((it["id"], path))
            for c in cands:
                runs, cov, n = analyse(c)
                hot = [r for r in runs if r[0] >= 8 and r[2] < 0.6 and not (r[3] >= 0.75 and r[0] < 20)]
                isfz = bool(f and f["fuzzy"] >= 0.7 and f["fuzzy_sent"] and f["fuzzy_sent"][:40] in c)
                if whole and tier in ("1a", "1b"): pass
                elif not hot and not isfz and not (n >= 12 and cov >= 0.6 and not all(r[2] >= 0.6 for r in runs)): continue
                sid += 1
                spans.append({"sid": sid, "pack": pk, "id": it["id"], "path": path, "tier": tier, "span": c, "hits": [r[1] for r in runs if r[0] >= 6], "ctx": ctx,
                              "src": (qf[it["id"]]["src"] if tier[0] == "1" and it["id"] in qf else (f["run_src"] or f["fuzzy_src"]) if f else None)})
json.dump(spans, open(outp + ".json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
with open(outp + ".txt", "w", encoding="utf-8") as o:
    last = None
    for sp in spans:
        if (sp["id"]) != last:
            o.write(f"\n@ {sp['pack']} {sp['ctx']}\n"); last = sp["id"]
        o.write(f"#{sp['sid']} [{sp['tier']}] {sp['path']} ({sp['src']})\n  TEXT: {sp['span']}\n" + ("  HIT: " + " | ".join(sp["hits"]) + "\n" if sp["hits"] else ""))
print("spans", len(spans), collections.Counter((s["pack"], s["tier"]) for s in spans))
