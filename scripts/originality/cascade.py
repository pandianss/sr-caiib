"""For option-text span patches, propagate the new text into sibling explanation fields that quote the old option text
(Central Banking items embed 'the answer is: <correct option text>' in distractor explanations, sometimes truncated with '....').
Usage: cascade.py <patches.jsonl> <work.json> <cur_dir> <out.jsonl>"""
import sys, json, glob, os, re
patches = [json.loads(l) for l in open(sys.argv[1], encoding="utf-8") if l.strip()]
work = {s["sid"]: s for s in json.load(open(sys.argv[2], encoding="utf-8"))}
items = {}
for f in glob.glob(os.path.join(sys.argv[3], "*.json")):
    for it in json.load(open(f, encoding="utf-8"))["pack"]["items"]:
        items[it["id"]] = it
out = list(patches)
direct = set()
for p in patches:
    if "sid" in p:
        direct.add((work[p["sid"]]["id"], work[p["sid"]]["path"]))
extra = {}
n = 0
for p in patches:
    if "sid" not in p:
        continue
    sp = work[p["sid"]]
    if not re.fullmatch(r"options\[\d\]\.text_md", sp["path"]):
        continue
    it = items[sp["id"]]
    old, new = sp["span"], p["new"]
    fields = [(f"options[{i}].explanation_md", o.get("explanation_md")) for i, o in enumerate(it.get("options") or [])]
    fields.append(("correct_explanation_md", it.get("correct_explanation_md")))
    for path, val in fields:
        if not isinstance(val, str) or (sp["id"], path) in direct:
            continue
        cur = extra.get((sp["id"], path), val)
        nv = cur
        if old in cur:
            nv = cur.replace(old, new)
        else:
            m = re.search(r"([^:]{20,}?)\.{3,}\.?$", cur)  # truncated quote "<prefix>...."
            if m:
                frag = m.group(1).strip()
                if old.startswith(frag):
                    nv = cur[: m.start(1)] + (" " if cur[m.start(1) - 1] != " " else "") + new + "."
                    nv = re.sub(r"  +", " ", nv)
        if nv != cur:
            extra[(sp["id"], path)] = nv
for (i, path), nv in extra.items():
    out.append({"id": i, "path": path, "new": nv}); n += 1
open(sys.argv[4], "w", encoding="utf-8").write("\n".join(json.dumps(o, ensure_ascii=False) for o in out) + "\n")
print(len(patches), "patches +", n, "cascaded explanation fields")
