// All values here are synthetic test data, including review/publication flags.
// These fixtures must never be imported as educational or commercial content.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as v from '../src/validation/contracts.ts';
const clone=x=>structuredClone(x);
const source={source_id:'TEST',authority:'TEST',title:'Synthetic arithmetic fixture',locator:'Test only',publication_date:null,effective_date:null};
const catalogue={syllabus_version:'TEST_V1',modules:[{id:'BFM::MOD_A',paper_id:'BFM'},{id:'ABFM::MOD_A',paper_id:'ABFM'},{id:'CB::MOD_F',paper_id:'CB'}],
  units:[{id:'BFM::MOD_A::U01',module_id:'BFM::MOD_A'},{id:'ABFM::MOD_A::U01',module_id:'ABFM::MOD_A'}],objectives:[{id:'BFM::MOD_A::U01::LO_01',unit_id:'BFM::MOD_A::U01'}]};
const base={id:'q1',schema_version:'2.0.0',revision:1,syllabus_version:'TEST_V1',paper_id:'BFM',module_id:'BFM::MOD_A',unit_id:'BFM::MOD_A::U01',objective_ids:['BFM::MOD_A::U01::LO_01'],
  context:{kind:'exam',exam_context_id:'TEST',regulatory_cutoff_date:'2026-06-30'},citations:[source],publication_state:'published',origin:'original_authoring',
  review:{verified_at:'2026-11-09T00:00:00Z',reviewer_id:'TEST_ONLY',method:'automated',source_verified:true,answer_checked:true,calculations:'verified'}};
const question={...base,item_type:'question',question_type:'single_choice',difficulty:'easy',stem_md:'Test: 1+1?',correct_explanation_md:'Test: addition.',
  options:['A','B','C','D'].map((option_id,i)=>({option_id,text_md:String(i+1),explanation_md:'Synthetic option explanation'})),correct_option_id:'B'};
const numeric={...base,item_type:'question',question_type:'numeric_input',difficulty:'easy',stem_md:'Test numeric',correct_explanation_md:'Test',
  numeric_rule:{expected_answer:'2.00',unit_label:'units',precision_decimals:2,rounding_mode:'HALF_UP',rounding_instruction:'Round to two decimals.',allow_negative:false}};
const pack={schema_version:'2.0.0',pack_id:'TEST_PACK',pack_version:'1',syllabus_version:'TEST_V1',exam_context_id:'TEST',paper_id:'BFM',items:[question]};
function rejects(name,value,fn){test(name,()=>assert.equal(fn(value).ok,false));}
test('accepts catalogue modules beyond D',()=>assert.equal(v.validateCatalogue(catalogue).ok,true));
test('accepts a complete synthetic choice record',()=>assert.equal(v.validateContentItem(question,catalogue).ok,true));
test('accepts a complete synthetic numeric record',()=>assert.equal(v.validateContentItem(numeric,catalogue).ok,true));
test('accepts an unverified structured draft without invented citations',()=>assert.equal(v.validateContentItem({...question,publication_state:'draft',review:null,citations:[]},catalogue).ok,true));
const check=x=>v.validateContentItem(x,catalogue);
rejects('rejects missing numeric rule', {...numeric,numeric_rule:undefined},check);
rejects('rejects numeric question carrying choices', {...numeric,options:question.options},check);
rejects('rejects missing MCQ answer', {...question,correct_option_id:undefined},check);
rejects('rejects duplicate option IDs', {...question,options:question.options.map(x=>({...x,option_id:'A'}))},check);
rejects('rejects BFM record with ABFM module', {...question,module_id:'ABFM::MOD_A'},check);
rejects('rejects mismatched unit ancestry', {...question,unit_id:'ABFM::MOD_A::U01'},check);
rejects('rejects unknown objective', {...question,objective_ids:['BFM::MOD_A::U01::LO_99']},check);
rejects('rejects published content without citations', {...question,citations:[]},check);
rejects('rejects unverified published content', {...question,review:null},check);
rejects('rejects synthetic-origin publication', {...question,origin:'synthetic_fixture'},check);
rejects('rejects impossible cutoff date', {...question,context:{...base.context,regulatory_cutoff_date:'2026-02-30'}},check);
rejects('rejects unverified calculations', {...numeric,review:{...base.review,calculations:'not_applicable'}},check);
rejects('rejects unsupported decimal string', {...numeric,numeric_rule:{...numeric.numeric_rule,expected_answer:'2e0'}},check);
rejects('rejects precision mismatch', {...numeric,numeric_rule:{...numeric.numeric_rule,expected_answer:'2.0'}},check);
const card={...base,id:'c1',item_type:'card',card_type:'concept',title:'Test',core_explanation_md:'Test only',prerequisite_objective_ids:[],self_check:{mode:'self_assessed',prompt_text:'Test?',expected_takeaway:'Test'}};
test('accepts a complete concept card',()=>assert.equal(check(card).ok,true));
rejects('requires formula fields for formula cards', {...card,card_type:'formula'},check);
rejects('requires worked steps for worked examples', {...card,card_type:'worked_example'},check);
test('validates a self-contained delivery pack',()=>assert.equal(v.validatePack(pack,catalogue).ok,true));
rejects('rejects draft in delivery pack',{...pack,items:[{...question,publication_state:'draft',review:null}]},x=>v.validatePack(x,catalogue));
rejects('rejects duplicate item IDs',{...pack,items:[question,clone(question)]},x=>v.validatePack(x,catalogue));
rejects('rejects mixed-paper pack',{...pack,paper_id:'ABFM'},x=>v.validatePack(x,catalogue));
rejects('rejects dangling case reference',{...pack,items:[{...question,case_study_id:'missing'}]},x=>v.validatePack(x,catalogue));
rejects('rejects missing self-check question',{...pack,items:[{...card,self_check:{mode:'question',question_id:'missing'}}]},x=>v.validatePack(x,catalogue));
const event={event_id:'e1',learner_id:'u1',device_id:'d1',device_sequence:1,exam_context_id:'TEST',pack_id:'p1',pack_version:'1',item_id:'q1',item_revision:1,paper_id:'BFM',objective_ids:base.objective_ids,occurred_at:'2026-11-09T00:00:00Z'};
test('self-rated recall does not invent objective correctness',()=>assert.equal(v.validateEvent({...event,event_type:'self_check',assessment:'self_assessed',recall:'partial'}).ok,true));
rejects('rejects correctness on self-assessed recall',{...event,event_type:'self_check',assessment:'self_assessed',recall:'partial',is_correct:true},v.validateEvent);
test('accepts SM2 event without a graded response',()=>assert.equal(v.validateEvent({...event,event_type:'sm2_review',sm2_rating:'Hard',based_on_answer_event_id:null,algorithm_version:'SM2_V1'}).ok,true));
const answer={...event,event_type:'answer_submitted',attempt_id:'a1',mode:'practice',submitted_response:'B',is_correct:true,elapsed_ms:1000,answer_was_revealed_prior:false,assessment:'objective'};
rejects('rejects negative answer time',{...answer,elapsed_ms:-1},v.validateEvent);
rejects('rejects client claim of first exposure',{...answer,is_first_exposure:true},v.validateEvent);
const readiness={paper_id:'BFM',exam_context_id:'TEST',calculated_at:'2026-11-09T00:00:00Z',window_start:'2026-10-10T00:00:00Z',window_end:'2026-11-09T00:00:00Z',formula_version:'CRI_V1',evidence_status:'sufficient_evidence',study_coverage_pct:50,assessed_accuracy_pct:0,speed_score_pct:0,cri_score:20,mapped_objectives_total:10,completed_objectives:5,eligible_accuracy_questions:20,eligible_timed_questions:20};
test('enough evidence with poor scores does not label learner ready',()=>assert.equal(v.validateReadiness(readiness).ok,true));
rejects('rejects Ready label',{...readiness,evidence_status:'Ready'},v.validateReadiness);
rejects('rejects unsupported numeric CRI',{...readiness,eligible_accuracy_questions:19},v.validateReadiness);
rejects('rejects unknown coverage denominator with numeric score',{...readiness,mapped_objectives_total:null},v.validateReadiness);
rejects('rejects wrong CRI formula',{...readiness,cri_score:80},v.validateReadiness);
test('unknown denominator is representable honestly',()=>assert.equal(v.validateReadiness({...readiness,mapped_objectives_total:null,study_coverage_pct:null,cri_score:null,evidence_status:'insufficient_evidence'}).ok,true));
const attempt={attempt_id:'a1',learner_id:'u1',paper_id:'BFM',exam_context_id:'TEST',exam_config_version:'1',pack_id:'p1',pack_version:'1',mode:'mock',status:'active',started_at:'2026-11-09T00:00:00Z',expires_at_iso:'2026-11-09T02:00:00Z',question_order:[{item_id:'q1',item_revision:1}],saved_responses:{q1:'B'},flagged_item_ids:[]};
test('accepts a mock with persisted deadline and pinned questions',()=>assert.equal(v.validateAttempt(attempt).ok,true));
rejects('rejects mock without deadline',{...attempt,expires_at_iso:null},v.validateAttempt);
rejects('rejects response outside attempt',{...attempt,saved_responses:{other:'B'}},v.validateAttempt);
const claims={entitlement_id:'en1',learner_id:'u1',product_id:'pass',purchase_id:'p1',issued_at:'2026-11-01T00:00:00Z',offline_until:'2026-11-30T00:00:00Z',access_expires_at:'2027-05-01T00:00:00Z',allowed_papers:['BFM'],entitlement_version:1};
test('accepts bounded offline access claims, without asserting authenticity',()=>assert.equal(v.validateEntitlementClaims(claims).ok,true));
rejects('rejects offline validity beyond purchased term',{...claims,offline_until:'2028-01-01T00:00:00Z'},v.validateEntitlementClaims);
rejects('rejects verified purchase without verification and term',{purchase_id:'p1',learner_id:'u1',product_id:'pass',provider:'razorpay',provider_transaction_id:'test',amount_minor:39900,currency:'INR',status:'verified',verified_at:null,access_starts_at:null,access_expires_at:null},v.validatePurchase);
const extraction={schema_version:'notebook-staging-1',batch_id:'b1',paper_id:'BFM',unit_label:'Test',publication_state:'draft',verified_at:null,source_ids:['S1'],facts:[{fact_id:'F1',statement:'Test',source_id:'S1',locator:'Test heading',regulatory_sensitive:false,evidence_status:'explicit'}],drafts:[{draft_id:'D1',item_type:'card',variant:'concept',fact_ids:['F1'],payload:{title:'Test'}}],unresolved:[],next_batch_hint:null};
test('accepts evidence-linked Notebook staging',()=>assert.equal(v.validateExtraction(extraction).ok,true));
rejects('rejects Notebook self-publication',{...extraction,publication_state:'published'},v.validateExtraction);
rejects('rejects unknown evidence linkage',{...extraction,drafts:[{...extraction.drafts[0],fact_ids:['F99']}]},v.validateExtraction);
rejects('rejects malformed nested unit identifiers',{...catalogue,units:[{id:'BFM::MOD_A::U01::U02',module_id:'BFM::MOD_A'}],objectives:[]},v.validateCatalogue);
rejects('rejects timed sample larger than assessed sample',{...readiness,eligible_timed_questions:21},v.validateReadiness);

// --- Regression & new test coverage ---
test('accepts single_choice question with numeric_rule undefined', () => {
  assert.equal(check({...question, numeric_rule: undefined}).ok, true);
});

test('accepts question with explicit marks', () => {
  const numericWithTol = {
    ...numeric,
    marks: 2,
    numeric_rule: { ...numeric.numeric_rule }
  };
  assert.equal(check(numericWithTol).ok, true);
});

test('accepts catalogue with module/unit titles and objective descriptions', () => {
  const titledCatalogue = {
    syllabus_version: 'TEST_V1',
    modules: [{ id: 'BFM::MOD_A', paper_id: 'BFM', title: 'International Banking' }],
    units: [{ id: 'BFM::MOD_A::U01', module_id: 'BFM::MOD_A', title: 'Exchange Rates & Forex' }],
    objectives: [{ id: 'BFM::MOD_A::U01::LO_01', unit_id: 'BFM::MOD_A::U01', title: 'Understand Direct/Indirect quotes', description: 'Cross currency rate calculations' }]
  };
  assert.equal(v.validateCatalogue(titledCatalogue).ok, true);
});

test('accepts pending purchase with omitted nullable fields', () => {
  const pendingPurchase = {
    purchase_id: 'p1', learner_id: 'u1', product_id: 'pass', provider: 'razorpay',
    provider_transaction_id: 'tx_001', amount_minor: 39900, currency: 'INR', status: 'pending'
  };
  assert.equal(v.validatePurchase(pendingPurchase).ok, true);
});

test('accepts Notebook staging with case_study draft item', () => {
  const caseStaging = {
    ...extraction,
    drafts: [{ draft_id: 'CS1', item_type: 'case_study', variant: 'consortium_lending', fact_ids: ['F1'], payload: { title: 'Consortium Appraisal Case' } }]
  };
  assert.equal(v.validateExtraction(caseStaging).ok, true);
});

const examConfigFixture = {
  exam_context_id: 'CAIIB_2026', config_version: '1.0', syllabus_version: 'TEST_V1',
  regulatory_cutoff_date: '2026-06-30', duration_seconds: 7200, question_count: 100, total_marks: 100,
  wrong_answer_penalty: '0.00', official_source: source, verified_at: '2026-11-09T00:00:00Z',
  passing_rule_description: '50% aggregate subject to single-attempt rules', calculator_policy: 'Simple non-programmable'
};
test('accepts valid exam config', () => assert.equal(v.validateExamConfig(examConfigFixture).ok, true));
rejects('rejects negative penalty in exam config', { ...examConfigFixture, wrong_answer_penalty: '-0.25' }, v.validateExamConfig);
rejects('rejects invalid cutoff date in exam config', { ...examConfigFixture, regulatory_cutoff_date: '2026-02-30' }, v.validateExamConfig);

const manifestFixture = {
  pack_id: 'BFM_P1', pack_version: '1.0.0', paper_id: 'BFM', exam_context_id: 'CAIIB_2026',
  schema_version: '2.0.0', file_size_bytes: 1048576, sha256: 'a'.repeat(64),
  download_url: 'https://cdn.example.com/packs/bfm_p1.json', minimum_client_version: '1.0.0', change_summary: 'Initial release'
};
test('accepts valid pack manifest', () => assert.equal(v.validateManifest(manifestFixture).ok, true));
rejects('rejects non-https download url in manifest', { ...manifestFixture, download_url: 'http://cdn.example.com/pack.json' }, v.validateManifest);
rejects('rejects malformed sha256 in manifest', { ...manifestFixture, sha256: 'bad_hash' }, v.validateManifest);

const offerFixture = {
  product_id: 'caiib_pass_6m', title: 'CAIIB 6-Month Preparation Pass', provider: 'razorpay',
  provider_product_id: 'plan_123', currency: 'INR', amount_minor: 39900,
  term_description: '6 calendar months access', auto_renews: false,
  included_papers: ['ABM', 'BFM', 'ABFM', 'BRBL'], content_availability_description: 'Four compulsory papers'
};
test('accepts valid product offer', () => assert.equal(v.validateOffer(offerFixture).ok, true));
rejects('rejects non-INR currency in product offer', { ...offerFixture, currency: 'USD' }, v.validateOffer);
rejects('rejects auto-renewing offer in initial release', { ...offerFixture, auto_renews: true }, v.validateOffer);

const reviewStateFixture = {
  learner_id: 'u1', item_id: 'q1', item_revision: 1, paper_id: 'BFM', exam_context_id: 'CAIIB_2026',
  algorithm_version: 'SM2_V1', repetition_count: 2, ease_factor: 2.36, interval_days: 6,
  due_date_iso: '2026-11-15', learner_time_zone: 'Asia/Kolkata', last_reviewed_at: '2026-11-09T00:00:00Z'
};
test('accepts valid SM2 review state', () => assert.equal(v.validateReviewState(reviewStateFixture).ok, true));
rejects('rejects ease factor below 1.3', { ...reviewStateFixture, ease_factor: 1.2 }, v.validateReviewState);
rejects('rejects invalid timezone in review state', { ...reviewStateFixture, learner_time_zone: 'Invalid/Zone' }, v.validateReviewState);

test('accepts valid progress upload and changes', () => {
  const upload = { events: [answer], after_cursor: null };
  assert.equal(v.validateProgressUpload(upload).ok, true);
  const changes = { events: [answer], next_cursor: 'c_002', has_more: false };
  assert.equal(v.validateProgressChanges(changes).ok, true);
});

test('accepts valid progress ack', () => {
  const ack = { accepted_event_ids: ['e1'], duplicate_event_ids: [], rejected: [], next_cursor: 'c_001' };
  assert.equal(v.validateProgressAck(ack).ok, true);
});

test('accepts signed offline entitlement shape', () => {
  const token = { key_id: 'k1', signed_token: 'header.payload.signature' };
  assert.equal(v.validateSignedEntitlement(token).ok, true);
});


rejects('rejects numeric tolerance until an explicit grading contract exists', {...numeric,numeric_rule:{...numeric.numeric_rule,tolerance:'0.01'}},check);
rejects('rejects omitted required source dates', {...question,citations:[{source_id:'test',authority:'test',title:'test',locator:'test'}]},check);
rejects('rejects omitted draft review marker', {...question,publication_state:'draft',review:undefined},check);
rejects('rejects a score above total marks', {...attempt,score_summary:{marks_obtained:101,total_marks:100,passed:true}},v.validateAttempt);
rejects('rejects submission before attempt start', {...attempt,submitted_at:'2026-11-08T00:00:00Z'},v.validateAttempt);
rejects('rejects malformed event in progress upload', {events:[{...answer,is_correct:'yes'}],after_cursor:null},v.validateProgressUpload);
rejects('rejects omitted required progress cursor', {events:[]},v.validateProgressUpload);
rejects('rejects invalid progress acknowledgement', {accepted_event_ids:['e1'],duplicate_event_ids:['e1'],rejected:[],next_cursor:'c1'},v.validateProgressAck);
rejects('rejects malformed progress changes', {events:[],next_cursor:'c1',has_more:'no'},v.validateProgressChanges);
rejects('rejects missing signed-token data', {key_id:'k1'},v.validateSignedEntitlement);
