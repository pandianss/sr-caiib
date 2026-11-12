import json
def q(did,facts,diff,stem,opts,correct,expl):
    return {"draft_id":did,"item_type":"question","variant":"single_choice","fact_ids":facts,"payload":{"difficulty":diff,"stem_md":stem,
      "options":[{"option_id":k,"text_md":t,"explanation_md":e} for k,(t,e) in zip("ABCD",opts)],"correct_option_id":correct,"correct_explanation_md":expl}}
def F(i,s,src,loc):
    return {"fact_id":i,"statement":s,"source_id":src,"locator":loc,"regulatory_sensitive":src.startswith('RBI'),"evidence_status":"explicit"}
facts=[
 F("F001","RTGS stands for Real Time Gross Settlement: instructions are processed as they are received and each transfer is settled individually, without netting. Settlement takes place in the books of the Reserve Bank of India, so payments are final and irrevocable.","RBI_FAQ_RTGS","FAQ 1 and 2 (definition; finality)"),
 F("F002","The RTGS system is primarily meant for large value transactions. The minimum amount to be remitted through RTGS is Rs 2,00,000 with no upper or maximum ceiling, and RBI sets no amount cap. RTGS is available on all days on a 24x7x365 basis (since 14 December 2020).","RBI_FAQ_RTGS","FAQ 6 and the benefits answer; availability date corroborated by S03 printed p. 68"),
 F("F003","NEFT is a nation-wide centralised payment system owned and operated by the Reserve Bank of India. It operates in batches at half-hourly intervals and is available round the clock on all days of the year (24x7x365).","RBI_FAQ_NEFT","FAQ 1 and FAQ 10"),
 F("F004","RBI imposes no limit on the amount that can be transferred through NEFT; a member bank may place amount limits based on its own risk perception with the approval of its Board.","RBI_FAQ_NEFT","FAQ 7"),
 F("F005","A person without a bank account may remit through NEFT by depositing cash at an NEFT-enabled branch with additional details such as complete address and telephone number; such cash remittances are restricted to a maximum of Rs 50,000 per transaction.","RBI_FAQ_NEFT","FAQ 8"),
 F("F006","A beneficiary's account should be credited within two hours of the NEFT batch settlement.","RBI_FAQ_NEFT","FAQ 18"),
 F("F007","CHAPS payments between direct participants are settled individually on a gross basis in the Bank of England's real-time gross settlement system and are irrevocable. The courseware (S03 printed p. 67) says CHAPS works on net settlement principles like CHIPS.","BOE_CHAPS","How does CHAPS work; compare S03 printed p. 67, section 3.4.4"),
]
drafts=[
 {"draft_id":"D001","item_type":"card","variant":"concept","fact_ids":["F001","F002"],"payload":{"title":"RTGS: large payments, settled one by one","prerequisite_objective_ids":[],
  "core_explanation_md":"**RTGS** (Real Time Gross Settlement) is the Reserve Bank's system for large-value rupee transfers between banks.\n\nRead the name word by word:\n- **Real time**: an instruction is processed the moment it arrives.\n- **Gross**: every payment is settled on its own, never netted against another.\n- **Settlement**: it happens in the books of the Reserve Bank, so banks move funds through their accounts with it, and a settled payment is **final and irrevocable**.\n\nThree facts to remember for the exam:\n1. **Floor**: ₹2,00,000 is the minimum for a single remittance.\n2. **Ceiling**: none set by RBI.\n3. **Hours**: every day, around the clock (24x7x365), since 14 December 2020.",
  "self_check":{"mode":"question","question_id":"D005"}}},
 {"draft_id":"D002","item_type":"card","variant":"concept","fact_ids":["F003","F004","F005","F006"],"payload":{"title":"NEFT: batches every half hour, round the clock","prerequisite_objective_ids":[],
  "core_explanation_md":"**NEFT** (National Electronic Funds Transfer) is a centralised system owned and run by the Reserve Bank. Unlike RTGS it does not settle each payment on arrival: payments are collected and settled in **batches at half-hourly intervals**, and it works every day of the year, around the clock.\n\n- **Size of payment**: RBI sets no limit. A member bank may set its own limits, based on its risk view and with its Board's approval.\n- **Credit to the beneficiary**: expected within two hours of the batch settlement.\n- **Without an account**: a person with no bank account can send money by depositing cash at an NEFT-enabled branch, giving address and telephone details, but only up to ₹50,000 per transaction.\n\nContrast with RTGS: NEFT has no floor at ₹2,00,000 and settles in batches, RTGS settles one by one.",
  "self_check":{"mode":"question","question_id":"D006"}}},
 {"draft_id":"D003","item_type":"card","variant":"worked_example","fact_ids":["F002","F003","F004"],"payload":{"title":"Three payments, which rail?","prerequisite_objective_ids":[],
  "core_explanation_md":"Illustrative case: a branch has three customer transfers to other banks today: (A) ₹1,50,000; (B) ₹2,00,000; (C) ₹12,40,000. Which can go by RTGS, and which by NEFT?",
  "worked_steps":[
   {"step_number":1,"description":"Recall the RTGS floor: a single remittance must be at least this amount.","formula_or_substitution":"Minimum for RTGS","intermediate_result":"₹2,00,000"},
   {"step_number":2,"description":"Compare A with the floor.","formula_or_substitution":"1,50,000 < 2,00,000","intermediate_result":"A is below the floor: not eligible for RTGS"},
   {"step_number":3,"description":"Compare B: equal to the floor is enough.","formula_or_substitution":"2,00,000 ≥ 2,00,000","intermediate_result":"B is eligible for RTGS"},
   {"step_number":4,"description":"Compare C.","formula_or_substitution":"12,40,000 ≥ 2,00,000","intermediate_result":"C is eligible for RTGS"},
   {"step_number":5,"description":"NEFT has no RBI floor or ceiling, so all three can go by NEFT, subject to the sending bank's own limits.","formula_or_substitution":"No RBI limit on NEFT","intermediate_result":"A, B and C can all use NEFT"}],
  "final_answer_with_unit":"A: NEFT only. B and C: RTGS or NEFT (RTGS if immediate, individual settlement is wanted, NEFT otherwise)",
  "self_check":{"mode":"self_assessed","prompt_text":"Why can a bank still refuse a very large NEFT payment even though RBI sets no limit?","expected_takeaway":"A member bank may set its own amount limits, based on its risk view and with Board approval."}}},
 {"draft_id":"D004","item_type":"card","variant":"concept","fact_ids":["F007"],"payload":{"title":"A caution on CHAPS: the textbook and the Bank of England differ","prerequisite_objective_ids":[],
  "core_explanation_md":"The courseware describes CHAPS, the sterling system in London, as working like CHIPS on a **net** settlement principle.\n\nThe Bank of England, which operates CHAPS, describes it differently: payments between direct participants are settled **individually, on a gross basis**, in its real-time gross settlement system, and are irrevocable.\n\nWhat to do with this:\n- Treat CHAPS as the British high-value sterling system, with TARGET2 and Fedwire as the euro and dollar real-time gross systems.\n- Do not rely on the net-versus-gross label for CHAPS alone. If an exam statement says CHAPS nets like CHIPS, it follows the courseware wording; the operator's own description is gross.\n- CHIPS is the one of the group that nets.",
  "self_check":{"mode":"self_assessed","prompt_text":"Which of CHIPS, Fedwire, TARGET2 and CHAPS does the operator itself describe as netting?","expected_takeaway":"Only CHIPS. The others are described by their operators as gross settlement."}}},
 q("D005",["F002"],"easy","What is the minimum amount that can be remitted in a single transaction through RTGS?",
   [("₹1,00,000","An earlier minimum, no longer the current one."),("₹2,00,000","This is the current minimum, with no upper ceiling."),("₹5,00,000","No such minimum applies."),("There is no minimum","RTGS is meant for large-value payments and has a minimum.")],"B",
   "The minimum for an RTGS remittance is ₹2,00,000, and RBI sets no upper ceiling."),
 q("D006",["F003"],"easy","How does NEFT settle fund transfers?",
   [("Each payment is settled individually the moment it is received","That describes RTGS."),("In batches at half-hourly intervals, on all days, round the clock","This is how NEFT works."),("Once a day, after banking hours","NEFT settles through the day in batches."),("Only on working days, during banking hours","NEFT is available on all days, round the clock.")],"B",
   "NEFT operates in batches at half-hourly intervals and is available 24x7x365. RTGS is the system that settles each payment individually."),
 q("D007",["F005"],"medium","A person who has no bank account walks into an NEFT-enabled branch and deposits cash to remit to a relative's account in another bank. What is the maximum amount allowed for such a cash remittance per transaction?",
   [("₹10,000","The limit is higher."),("₹50,000","Cash remittances by non-account holders are limited to ₹50,000 per transaction."),("₹2,00,000","That is the RTGS floor, not this limit."),("There is no limit","RBI restricts such cash remittances.")],"B",
   "Cash remittances through NEFT by persons without a bank account are restricted to a maximum of ₹50,000 per transaction."),
 q("D008",["F001"],"medium","Why is a payment settled through RTGS final and irrevocable?",
   [("Because the funds settlement takes place in the books of the Reserve Bank of India","This is the reason RBI gives."),("Because the payments are netted at the end of the day","RTGS does not net; it settles gross."),("Because the beneficiary bank holds the funds until the next day","RTGS settles in real time."),("Because the payment is limited to ₹2,00,000","The figure is a minimum, not the reason for finality.")],"A",
   "Settlement in the books of the Reserve Bank makes the payment final and irrevocable. RTGS settles each payment individually, without netting."),
 q("D009",["F004"],"medium","Who may place an upper limit on the amount of an NEFT transfer, and on what basis?",
   [("RBI, at a fixed ceiling for all banks","RBI imposes no limit on NEFT amounts."),("A member bank, based on its own risk perception and with its Board's approval","This is the position stated by RBI."),("The beneficiary bank, case by case","Neither RBI nor the courseware gives this power to the beneficiary bank."),("Nobody: NEFT cannot be limited","A member bank may set limits.")],"B",
   "RBI sets no NEFT limit, but a member bank may place amount limits based on its own risk perception with the approval of its Board."),
]
st={"schema_version":"notebook-staging-1","batch_id":"BFM-A-U03-B002","paper_id":"BFM","unit_label":"Module A: International Banking - Correspondent Banking and NRI Accounts","publication_state":"draft","verified_at":None,
 "source_ids":["S03","RBI_FAQ_RTGS","RBI_FAQ_NEFT","BOE_CHAPS"],"facts":facts,"drafts":drafts,
 "unresolved":["LO_04 (NRI banking) is not drafted in this batch.","RBI RTGS FAQ page is dated 14 Oct 2026, after the 30 June 2026 cut-off; the figures used agree with the 2026 courseware (S03 printed p. 68) and date from December 2020, so they are treated as applicable at the cut-off.","No scored question tests CHAPS settlement mode, because the courseware and the Bank of England disagree.","Reviewer for this batch is the authoring agent; no independent or human review."],
 "next_batch_hint":"BFM-A-U03-B003: NRI banking from printed p. 69, with RBI/FEMA primary sources."}
json.dump(st,open('content/batches/BFM-A-U03-B002/staging.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
c=json.load(open('content/batches/BFM-A-U03-B001/import-config.json',encoding='utf-8'))
c['batch_id']='BFM-A-U03-B002'
c['sources']=c['sources']+[
 {"source_id":"RBI_FAQ_RTGS","authority":"Reserve Bank of India","title":"Real Time Gross Settlement System (RTGS) FAQs","url":"https://www.rbi.org.in/commonman/english/scripts/FAQs.aspx?Id=275","publication_date":"2026-10-14","effective_date":None},
 {"source_id":"RBI_FAQ_NEFT","authority":"Reserve Bank of India","title":"National Electronic Funds Transfer (NEFT) System FAQs","url":"https://www.rbi.org.in/commonman/english/scripts/FAQs.aspx?Id=274","publication_date":"2024-09-02","effective_date":None},
 {"source_id":"BOE_CHAPS","authority":"Bank of England","title":"CHAPS (payments page)","url":"https://www.bankofengland.co.uk/payments/chaps","publication_date":None,"effective_date":None}]
c['mappings']=[{"draft_id":"D00%d"%i,"unit_id":"BFM::MOD_A::U03","objective_ids":["BFM::MOD_A::U03::LO_03"]} for i in range(1,10)]
json.dump(c,open('content/batches/BFM-A-U03-B002/import-config.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
