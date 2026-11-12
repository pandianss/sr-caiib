import json
p='content/publish/BFM-2026DEC-v8.json'
s=json.load(open(p,encoding='utf-8'))
for e in s['items']:
    if e['batch']=='BFM-A-U03-B002' and e['draft_id']=='D003':
        e['calculations']='verified'; e['calculation_ref']='tests/content/batch-u03-b002.test.ts'
json.dump(s,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
# ledger
b=json.load(open('content/batches/BFM-A-U03-B002/draft-bundle.json',encoding='utf-8'))
it={i['id']:i for i in b['items']}; m={x['draft_id']:x['item_id'] for x in b['draft_item_map']}
led=json.load(open('content/ledger/BFM.json',encoding='utf-8'))
r=[x for x in led if x['objective_id']=='BFM::MOD_A::U03::LO_03'][0]
typ=lambda d:(it[m[d]].get('card_type') or it[m[d]].get('question_type'))
for d in m:
    t=typ(d)
    key='lesson_item_ids' if t=='concept' else 'worked_example_item_ids' if t=='worked_example' else 'assessment_item_ids'
    r[key].append(m[d]); r['published_item_ids'].append(m[d])
r['teaching_adequate']=True; r['assessment_adequate']=True
r['gaps']=["CHAPS settlement mode: courseware (net) and Bank of England (gross) disagree; taught as a flagged caution, not scored."]
r['review']['source']='passed'; r['review']['calculations']='passed'
r['review']['record_refs']+=["content/batches/BFM-A-U03-B002/review.md","content/publish/BFM-2026DEC-v8.json","tests/content/batch-u03-b002.test.ts"]
r['review']['record_refs']=sorted(set(r['review']['record_refs']))
json.dump(led,open('content/ledger/BFM.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
