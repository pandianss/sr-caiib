import json
p='content/batches/BFM-A-U03-B002/staging.json'
s=json.load(open(p,encoding='utf-8'))
target={'D006':'C','D007':'D','D008':'C','D009':'A'}
for d in s['drafts']:
    if d['draft_id'] in target:
        pl=d['payload']; opts=pl['options']
        ci=[o['option_id'] for o in opts].index(pl['correct_option_id'])
        ti='ABCD'.index(target[d['draft_id']])
        o=opts.pop(ci); opts.insert(ti,o)
        for k,x in zip('ABCD',opts): x['option_id']=k
        pl['correct_option_id']=target[d['draft_id']]
json.dump(s,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
