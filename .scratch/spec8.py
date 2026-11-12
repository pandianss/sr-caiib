import json
s=json.load(open('content/publish/BFM-2026DEC-v7.json',encoding='utf-8'))
s['pack_version']='8'
s['change_summary']='Adds RTGS and NEFT (checked against RBI FAQs), a worked example choosing between them, and a caution that the courseware and the Bank of England differ on CHAPS settlement.'
s['verified_at']='2026-11-13T00:30:00Z'
for i in range(1,10):
    s['items'].append({"batch":"BFM-A-U03-B002","draft_id":"D00%d"%i,"calculations":"not_applicable","review_ref":"content/batches/BFM-A-U03-B002/review.md"})
json.dump(s,open('content/publish/BFM-2026DEC-v8.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
