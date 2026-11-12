p='PROJECT_STATE.md'
t=open(p,encoding='utf-8').read()
old="- Next content cursor: `BFM-A-U03-B002` (NRI banking, printed p. 69 onward, LO_04: regulation-heavy, draft and hold unless verified against RBI/FEMA). Done:"
new="- Next content cursor: `BFM-A-U03-B003` (NRI banking, printed p. 69 onward, LO_04: regulation-heavy; verify against RBI/FEMA primary pages, saved under content/sources/primary/ and registered). Done: `BFM-A-U03-B002` (RTGS, NEFT checked against RBI FAQ pages; CHAPS caution from Bank of England page; 9 items, pack v8 = 60 items; LO_03 complete). Earlier:"
assert old in t
open(p,'w',encoding='utf-8').write(t.replace(old,new,1))
