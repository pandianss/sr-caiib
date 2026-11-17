"""Convert mini patch format to jsonl.
Blocks: '@<8hex>' then lines 'S: ' stem, 'W: ' correct_explanation_md, '<n>T: ' option n text, '<n>E: ' option n explanation.
Span patches: '#<sid>: new text'. A literal backslash-n in the text becomes a newline."""
import sys, json, re
out = []
cur = None
NL = chr(92) + "n"
for ln in open(sys.argv[1], encoding="utf-8"):
    ln = ln.rstrip("\r\n")
    if not ln.strip():
        continue
    m = re.match(r"#(\d+): (.*)$", ln)
    if m:
        out.append({"sid": int(m.group(1)), "new": m.group(2).replace(NL, "\n")})
        continue
    if ln.startswith("@"):
        cur = ln[1:].strip()
        continue
    m = re.match(r"(S|W|\dT|\dE): (.*)$", ln)
    if not m:
        sys.exit("bad line: " + ln)
    k, v = m.groups()
    v = v.replace(NL, "\n")
    path = "stem_md" if k == "S" else "correct_explanation_md" if k == "W" else f"options[{k[0]}].{'text_md' if k[1] == 'T' else 'explanation_md'}"
    out.append({"q": cur, "path": path, "new": v})
open(sys.argv[2], "w", encoding="utf-8").write("\n".join(json.dumps(o, ensure_ascii=False) for o in out) + "\n")
print(len(out), "patches")
