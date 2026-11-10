# Monetization and purchase access

Prepared 9 November 2026. Prices below are product proposals for testing, not published offers or revenue forecasts. Provider policies and commercial terms must be checked again at release.

Payment implementation and verification are required work under [autonomous-delivery.md](autonomous-delivery.md). Missing credentials must not halt independent engineering. Keep local simulations, real provider sandbox checks and live activation distinct; a missing required provider test remains blocked. Prepare a complete reviewable release before seeking any genuinely required owner-only action.

## Proposed first offer

| Item | Proposal |
| --- | --- |
| Free sample | One useful unit and a short practice set per available paper; no account needed for local trial |
| Paid tier | One CAIIB preparation pass; four compulsory papers plus available electives, with one active elective selected |
| Trial price | ₹399 for six months, non-renewing; validate willingness to pay before fixing the price |
| Included | Published learning content, practice, supported mocks/calculators, reviews and offline packs within the access term |
| Elective changes | Allowed without buying another pass; preserve history |
| Account | Required when purchasing/restoring access; use a recoverable identity and merge local trial history |
| Exclusions | No automatic renewal, unlimited lifetime updates, or runtime AI tutoring promises |

Before checkout, show actual paper/unit availability. Do not sell a complete curriculum while only sample packs exist. Never publish a made-up launch discount, scarcity claim, success rate or guarantee.

Use explicit dates in the offer/receipt. A six-month term is a calendar period, not automatically 180 days. For a web purchase, add six calendar months under the documented business timezone, clamp to the last valid day of the destination month, and store the resulting UTC instant. For Google Play, use the verified provider expiry. Display the exact expiry to the buyer.

## Payment route by distribution

| Distribution | Initial route | Implication |
| --- | --- | --- |
| Direct website / PWA | Razorpay Standard Checkout for supported UPI/cards/net banking | Needs server-created orders and server purchase verification |
| Android through Google Play | Play Billing, with a six-month prepaid subscription base plan | A prepaid plan requires manual renewal; use provider expiry and purchase state |
| Google Play alternative billing in India | Consider after the initial release | Requires program enrolment, prescribed integration/reporting and applicable Play service fees; a plain UPI button is not a substitute |

Google's Payments policy generally requires Play Billing for paid digital functionality in Play-distributed apps unless an applicable exception/program applies. Its India alternative-billing program permits an additional billing choice and reduces the applicable Play fee by four percentage points; processor fees still apply. Google currently requires alternative-billing transactions to be reported within 24 hours of authorization. A 15% applicable fee therefore becomes 11%, not zero. Eligibility and actual fees must be checked for the developer account. [Policy](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en) · [India program](https://support.google.com/googleplay/android-developer/answer/13306652?hl=en) · [Service fees](https://support.google.com/googleplay/android-developer/answer/112622?hl=en-IN).

Play supports a six-month prepaid base-plan duration. Validate availability and pricing in the intended market before release. [Prepaid setup](https://support.google.com/googleplay/android-developer/answer/140504?hl=en).

Razorpay's standard advertised platform pricing is 2% plus applicable GST; special payment methods, promotions and negotiated plans can differ. Use the merchant's actual terms for financial planning. Gateway charges are separate from any tax due on the app sale. [Pricing](https://razorpay.com/pricing/).

## Minimal backend justified by monetization

Keep free learning local. Introduce a small backend and durable purchase ledger for checkout, payment verification, purchase recovery, account binding, refunds and entitlement signing. This is a required commercial capability, not a reason to move every lesson interaction online.

Required records: account, product/price version, checkout order, provider transaction/token, purchase status, access period, entitlement version and processed provider-event IDs. Store amounts in integer minor units (₹399 = 39,900 paise). The server determines the trusted amount/currency/product; never accept a client-selected price as authoritative.

Provider-specific secrets and purchase tokens belong on the backend with appropriate access controls. Do not store card numbers or UPI credentials. Keep test/live credentials and records separate.

### Web checkout

1. Resolve the signed-in learner and server-side offer. Create an idempotent checkout order in the backend and with Razorpay.
2. Open the provider checkout with the returned order. The client may show pending status, but its success callback cannot grant access.
3. Verify the checkout signature using the server's own order ID and secret. Confirm the provider payment/order, captured status, amount, currency and expected account/product.
4. Validate webhook signatures against the raw request body, record provider event IDs, and process idempotently. Events can repeat or arrive out of order; reconcile against current provider status. A refund must not be undone by a delayed capture notification.
5. Persist the verified purchase and entitlement in one consistent transaction. Acknowledge processing only after durable storage; retry safely.
6. The client reads verified entitlement status. Pending payments show a recoverable pending screen and support reconciliation rather than encouraging a second payment.

[Razorpay integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/) · [Webhook verification and ordering](https://razorpay.com/docs/webhooks/validate-test/).

### Google Play purchase

Use the Billing Library and send purchase tokens to the backend. Verify the product, package, purchase/account association, state and expiry through the appropriate Google Play Developer API. Grant access only for an eligible confirmed purchase; pending is not paid. Acknowledge purchases within the applicable platform window, process notifications and voided/refunded purchases, and reconcile restore requests. Do not treat a notification alone as complete purchase evidence. [Google purchase-verification guidance](https://developer.android.com/google/play/billing/security).

## Offline paid access and restore

- The backend issues a signed entitlement with learner/product/purchase identity, allowed papers, issued time, access expiry, offline-until time and version. The client verifies its signature with a public key and checks identity and time bounds. Shape validation alone proves none of these trust properties.
- Initial product proposal: allow up to 30 days between online entitlement refreshes, capped by the purchased access expiry. Show "Available offline until [date]" before download and before the refresh deadline. Refresh automatically when online.
- Server revocation takes effect on reconnection, or at the latest when the offline lease expires. Offline revocation cannot be instantaneous. Client-held content is not copy-proof DRM.
- Do not interrupt a previously authorized timed mock mid-session solely because a refresh becomes due. Let that session finish by its existing deadline, then require refresh for new paid sessions. Keep the exception bounded to the persisted session.
- Refund/expiry blocks new paid work under the published policy but preserves learning history, bookmarks, receipts and free content. Explain what is locked and how to restore or renew.
- Restore re-verifies purchases for the authenticated account. Anonymous trial data is merged with stable IDs, not discarded. Do not transfer another account's purchase through an unverified receipt screenshot.
- Guard against obvious device-clock rollback using a persisted last-trusted server time and monotonic time where available; require reconnection when confidence in validity is lost. Document offline limitations honestly.

## Payment UX and release checks

Provide clear paywall, provider checkout handoff, pending, success, failure, cancelled, expired, restore and refund states. Show price, currency, exact term, non-renewal, included content and support/refund information before purchase. Preserve the originating study screen so the learner can continue after unlocking.

Test spoofed success callbacks, amount/product mismatch, duplicate/out-of-order webhooks, app closure during payment, pending-to-confirmed transitions, refund/revocation, purchase restoration, wrong-account restore, offline lease expiry, clock rollback, and paid/free progress preservation. Test signed-token verification independently of the data-shape validator.

Before enabling real purchases, complete provider onboarding and verify the app's tax/invoice and refund obligations with the appropriate adviser/provider. Set public commercial terms deliberately; do not infer them from the test price. Apply the same mandatory original-authorship and syllabus-coverage reviews to paid and free content; reproduced textbook passages, tables, examples and questions are excluded. The kit defines contracts and requirements; it does not contain a live billing integration or establish the merchant's legal/tax position.
