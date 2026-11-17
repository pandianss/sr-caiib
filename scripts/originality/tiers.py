"""Bucket scan flags into severity tiers. Usage: tiers.py <flags.json> <qflags.json> <out_tiers.json>"""
import json, sys, collections
F = json.load(open(sys.argv[1], encoding="utf-8"))
Q = json.load(open(sys.argv[2], encoding="utf-8"))
stats, F, Q = F["stats"], F["flags"], Q["flags"]
law = lambda f: f["run_in_prim"] >= .6
T = collections.defaultdict(set)
for q in Q:
    cyp = q["src_option_lines"] >= 4
    if cyp and (q["opts_on_page"] >= 3 or q["stem_sim"] >= .6): T["1a copied source MCQ"].add((q["id"], "stem_md"))
    elif q["stem_sim"] >= .6 or (q["stem_sim"] >= .5 and q["opts_multiword_on_page"] >= 2) or q["opts_on_page"] >= 3: T["1b stem lifted from prose / options on page"].add((q["id"], "stem_md"))
for f in F:
    k = (f["id"], f["path"])
    if f["run"] >= 12 and not law(f): T["2 book-only run>=12"].add(k)
    elif f["run"] >= 12: T["L statutory run>=12"].add(k)
    elif f["fuzzy"] >= .7: T["3 fuzzy>=.7"].add(k)
    elif f["words"] >= 20 and f["cov"] >= .5: T["4 long string majority verbatim"].add(k)
    elif f["words"] < 20 and f["cov"] >= .8 and f["run"] >= 8 and not law(f): T["5 short string wholly verbatim (8-19w)"].add(k)
    elif f["run"] >= 8 and not law(f): T["6 run 8-11 inside original text"].add(k)
    elif f["run"] >= 8: T["L2 statutory run 8-11"].add(k)
    else: T["7 fuzzy .5-.7 / other"].add(k)
pk = {f["id"]: f["pack"].split("-")[0] for f in F}; pk.update({q["id"]: q["pack"].split("-")[0] for q in Q})
print("strings", stats["strings"], "words", stats["words"], "| words inside verbatim runs>=8 (longest run per string):", sum(f["run"] for f in F if f["run"] >= 8))
for k in sorted(T):
    c = collections.Counter(pk[i] for i, _ in T[k])
    print(f"{k:<48} {len(T[k]):>5} strings {len({i for i, _ in T[k]}):>5} items  {dict(sorted(c.items()))}")
must = set().union(*(T[k] for k in T if k[0] in "12345"))
print("must-fix strings", len(must), "items", len({i for i, _ in must}))
json.dump({k: sorted(v) for k, v in T.items()}, open(sys.argv[3], "w"))
