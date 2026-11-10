# Operations: deployment, payments, backup and recovery

Nothing in this document has been carried out. It describes how to operate the build once the owner decides to.

## What gets deployed

One Node process (`node server/main.ts`, Node 22.18+) serves the API and, in production mode, the built web
app from `dist/`. State lives in one SQLite file (`DATA_DIR/app.sqlite`) plus the entitlement signing key.

```sh
npm ci --ignore-scripts
npm run check
npm run build
APP_MODE=production PORT=8787 APP_ORIGIN=https://your-domain.example \
  MAIL_MODE=http MAIL_HTTP_URL=... MAIL_HTTP_TOKEN=... MAIL_FROM=... \
  ENTITLEMENT_PRIVATE_KEY_FILE=/secure/entitlement-key.pem \
  PAYMENT_PROVIDER=disabled node server/main.ts
```

Serve it behind HTTPS (the service worker and installability require it). The server refuses to start in
production with the payment simulation, with logged sign-in codes, or without a managed signing key.

Create the signing key once and keep it out of the repository:

```sh
openssl ecparam -name prime256v1 -genkey -noout | openssl pkcs8 -topk8 -nocrypt -out entitlement-key.pem
```

Losing this key invalidates every offline entitlement; devices recover at their next online refresh once a
new key is installed. Rotating it works the same way.

## Sign-in email

`MAIL_MODE=http` posts `{from,to,subject,text}` as JSON with a bearer token to `MAIL_HTTP_URL`. Point it at a
transactional mail service or a small relay you control. Sign-in is a six-digit code valid for ten minutes,
five attempts per code, five codes per address per hour.

## Payments

| Stage | Configuration | What it proves |
| --- | --- | --- |
| Local simulation | `PAYMENT_PROVIDER=local_test` (development only) | Our ledger logic. **Not** provider verification. |
| Razorpay test mode | `PAYMENT_PROVIDER=razorpay`, `rzp_test_` key, secret, webhook secret, `SUPPORT_TEXT` | Real provider sandbox behaviour. **Not yet done**: needs the owner's test keys. |
| Live | `rzp_live_` keys **and** `LIVE_PURCHASES_ENABLED=true` | Real money. Owner decision; needs completed KYC, tax/invoice and refund terms. |

Webhook URL to register with Razorpay: `https://your-domain.example/api/v1/webhooks/razorpay`, events
`payment.captured`, `payment.failed`, `order.paid`, `refund.processed`. The handler verifies the signature on
the raw body, processes each event ID once, and always re-reads the payment from Razorpay before changing the
ledger, so duplicates and out-of-order deliveries are safe. A refund is terminal.

Sandbox checklist to run when test keys exist (record results in `PROJECT_STATE.md`): successful payment;
failed payment; closing the window; closing the app after paying, then reopening; duplicate webhook replay;
refund from the dashboard; restore on a second device; restore from a different account.

Purchasing is refused while no published paid pack exists, so the pass cannot be sold before content is ready.
Simulation, test and live records are kept apart by an `environment` column; entitlements are issued only from
purchases made in the server's current environment.

## Backup and recovery

- Back up `DATA_DIR/app.sqlite` (plus `-wal`/`-shm` if present) with `sqlite3 app.sqlite ".backup backup.sqlite"`
  while the server runs, or copy the files while it is stopped. Back up the signing key separately.
- Restore by stopping the server, replacing the file and starting again. Schema migrations are applied
  automatically at start and recorded in `schema_migrations`.
- After restoring an older backup, run "Restore purchases" for affected accounts or wait for Razorpay webhook
  retries: purchase state is rebuilt from the provider, which is the source of truth for payments.
- Learner progress is stored on each device first. A lost server database loses only the synced copy; devices
  re-upload unsent events, and already-synced history remains on the devices that have it.

## Publishing content

1. Author and review a batch under `docs/specs/content-pipeline.md`; record objectives in `content/objectives/`
   and evidence in `content/ledger/`.
2. Place the reviewed pack wrapper in `content/packs/` (`{ access, free_unit_ids, change_summary, pack }`).
3. `npm run content:build` validates everything and fails on any invalid item or ledger mismatch.
4. `npm run build` and deploy. Devices see "Update available" and keep unfinished sessions on their old version.

## Known limits

- The Razorpay adapter is implemented from the documented protocol but has not been run against Razorpay.
- Google Play billing is not implemented (the product is distributed as a web app).
- Client-held content is not copy-protected; a refund takes effect at the next online check or lease end.
- At 200% text the bottom navigation labels are capped at about 130% so four destinations stay visible.
