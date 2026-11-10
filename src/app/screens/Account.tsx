import { useEffect, useState } from 'react';
import { PAPER_NAMES } from '../../core/catalogue.ts';
import { formatIndian, dec } from '../../core/decimal.ts';
import { formatDate, formatDateTime } from '../../core/time.ts';
import { go, useApp } from '../hooks.ts';
import { model } from '../model.ts';
import { Banner, Button, Empty, More, Sheet, Tag } from '../ui.tsx';

declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open(): void } } }
const rupees = (minor: number): string => `₹${formatIndian(dec(BigInt(minor), 2), minor % 100 === 0 ? 0 : 2)}`;

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise(resolve => { const sc = document.createElement('script'); sc.src = 'https://checkout.razorpay.com/v1/checkout.js'; sc.onload = () => resolve(Boolean(window.Razorpay)); sc.onerror = () => resolve(false); document.head.appendChild(sc); });
}

function SignIn() {
  const [email, setEmail] = useState(''); const [code, setCode] = useState(''); const [sent, setSent] = useState(false); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [devCode, setDevCode] = useState<string | null>(null);
  const request = async () => { setBusy(true); const e = await model.requestCode(email); setBusy(false); setError(e); if (!e) { setSent(true); setDevCode(await model.devLastCode(email.trim().toLowerCase())); } };
  const verify = async () => { setBusy(true); const e = await model.verifyCode(email, code); setBusy(false); setError(e); };
  return (
    <section className="card" aria-labelledby="si"><h2 id="si">Sign in or create an account</h2>
      <p className="support">An account is needed only to buy or restore the pass and to keep a recoverable copy of your progress. We email you a one-time code; there is no password. Your study history on this device is kept and attached to the account.</p>
      <form className="section" onSubmit={e => { e.preventDefault(); void (sent ? verify() : request()); }} noValidate>
        <div className="field"><label htmlFor="em">Email address</label><div className="input-row"><input id="em" className="input" type="email" autoComplete="email" value={email} disabled={sent} onChange={e => setEmail(e.target.value)} /></div></div>
        {sent && <div className="field"><label htmlFor="cd">6-digit code from the email</label><div className="input-row"><input id="cd" className="input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => setCode(e.target.value)} /></div><span className="support">The code expires in 10 minutes.</span></div>}
        {devCode && <Banner kind="warn">Development server: no email is sent. The code logged by the local server is <strong>{devCode}</strong>.</Banner>}
        {error && <p className="field"><span className="error" role="alert">{error}</span></p>}
        <div className="actions"><Button variant="filled" type="submit" disabled={busy || !email || (sent && code.length !== 6)}>{sent ? 'Verify and sign in' : 'Email me a code'}</Button>{sent && <Button onClick={() => { setSent(false); setCode(''); setError(null); setDevCode(null); }}>Use a different email</Button>}</div>
      </form>
    </section>
  );
}

function PassStatus() {
  const s = useApp(); const e = s.entitlement;
  if (e.state === 'valid') return <Banner kind="ok"><strong>Pass active.</strong> Access until {formatDateTime(e.claims.access_expires_at)}. Available offline until {formatDateTime(e.claims.offline_until)}; it renews automatically whenever you open the app online.{e.refreshDue && s.online ? ' Refreshing soon.' : ''}</Banner>;
  if (e.state === 'refresh_required') return <Banner kind="warn" action={<Button variant="outlined" disabled={!s.online} onClick={() => void model.refreshEntitlement()}>Check now</Button>}><strong>Go online to confirm your pass.</strong> {e.reason === 'clock_rollback' ? 'This device\'s date or time looks earlier than when the pass was last confirmed.' : `The offline period ended on ${formatDate(e.claims.offline_until)}.`} Paid lessons are paused until then; a timed mock you already started can finish. Free content and your history stay available.</Banner>;
  if (e.state === 'expired') return <Banner kind="warn"><strong>Your pass ended on {formatDate(e.claims.access_expires_at)}.</strong> It did not renew, because it never renews automatically. Your history, bookmarks and the free units are still here.</Banner>;
  if (e.state === 'invalid') return <Banner kind="warn" action={<Button variant="outlined" disabled={!s.online} onClick={() => void model.restorePurchases().then(m => model.toast(m))}>Restore</Button>}>{e.reason === 'wrong_account' ? 'The pass saved on this device belongs to a different account.' : 'The pass saved on this device could not be verified.'} Sign in with the purchasing account and restore while online.</Banner>;
  const last = [...s.purchases].reverse().find(p => p.status === 'refunded' || p.status === 'revoked');
  if (last && s.token) return <Banner><strong>{last.status === 'refunded' ? 'Your payment was refunded, so the pass has ended.' : 'This pass was withdrawn.'}</strong> Units in the pass are locked again. Your history, bookmarks and the free units are unchanged.</Banner>;
  return null;
}

export function Account() {
  const s = useApp(); const [refundId, setRefundId] = useState<string | null>(null); const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { void model.loadOffers(); if (s.token) { void model.refreshEntitlement(); void model.hasPendingOrder().then(p => { if (p && model.state.checkout.step === 'idle') void model.recheckPendingOrder(); }); } }, [s.token]);
  const offer = s.offers?.offers[0]; const c = s.checkout; const active = s.entitlement.state === 'valid';
  const openProvider = async () => {
    if (c.step !== 'awaiting_payment' || c.simulated) return;
    if (!(await loadRazorpay()) || !window.Razorpay) { model.toast('The payment window could not be loaded. Check your connection and try again. You have not been charged.'); return; }
    // Options per Razorpay Standard Checkout: key, amount (paise), currency, name and order_id are mandatory.
    new window.Razorpay({ key: c.key_id, amount: c.amount_minor, currency: 'INR', order_id: c.provider_order_id, name: 'CAIIB study pass', description: offer?.title, prefill: { email: s.prefs.account?.email },
      handler: (r: { razorpay_payment_id: string; razorpay_signature: string }) => { void model.completeCheckout(c.order_id, r.razorpay_payment_id, r.razorpay_signature); },
      modal: { ondismiss: () => { void model.cancelCheckout(); } } }).open();
  };
  const finish = () => { const back = s.returnTo; model.resetCheckout(); model.setReturnTo(null); if (back) window.location.hash = back; };

  return (
    <>
      <div className="section"><h1>Account and pass</h1></div>
      {s.apiReachable === false && <Banner kind="warn">{s.online ? 'The account service cannot be reached right now.' : 'You are offline.'} Sign-in, purchase and restore need a connection. Study on this device is not affected.</Banner>}
      <PassStatus />
      {s.prefs.account && s.token ? (
        <section className="section" aria-labelledby="ac"><h2 id="ac">Signed in</h2><p>{s.prefs.account.email}</p>
          <p className="support">{s.sync === 'idle' ? 'Progress is synced to this account.' : s.sync === 'pending' ? `${s.pendingSync} action${s.pendingSync === 1 ? '' : 's'} waiting to sync.` : s.sync === 'syncing' ? 'Syncing…' : s.sync === 'error' ? 'Sync could not finish; it will be retried. Nothing is lost on this device.' : ''}</p>
          <div className="row"><Button variant="outlined" onClick={() => void model.syncNow()} disabled={!s.online}>Sync now</Button><Button variant="outlined" disabled={!s.online} onClick={() => void model.restorePurchases().then(setMsg)}>Restore purchases</Button><Button onClick={() => void model.signOut()}>Sign out</Button></div>
          {msg && <Banner>{msg}</Banner>}
        </section>
      ) : s.prefs.account ? <><Banner kind="warn">Your sign-in for {s.prefs.account.email} has ended on this device. Sign in again to sync or restore. Your history is still here.</Banner><SignIn /></> : <SignIn />}

      <section className="section" aria-labelledby="of"><h2 id="of">CAIIB preparation pass</h2>
        {!offer ? <Empty title="Pass details are unavailable">{s.online ? 'The account service could not be reached, so the current offer cannot be shown.' : 'Go online to see the current offer.'}</Empty> : (<>
          <div className="card">
            <div className="row between"><h2>{offer.title}</h2><strong style={{ fontSize: '1.375rem' }}>{rupees(offer.amount_minor)}</strong></div>
            <dl className="kv"><dt>Price</dt><dd>{rupees(offer.amount_minor)} ({offer.currency}), paid once</dd><dt>Access period</dt><dd>{offer.term_description}</dd><dt>Renewal</dt><dd>Does not renew automatically. Nothing is charged later.</dd>
              <dt>What you get today</dt><dd>{offer.content_availability_description}</dd><dt>Electives</dt><dd>You can change your elective at any time without buying again.</dd>
              <dt>Offline use</dt><dd>Downloaded paid content works offline for up to {s.offers?.offline_lease_days} days between online checks, never beyond the access period.</dd>
              <dt>Refunds and support</dt><dd>{s.offers?.support} After a refund, access ends at the next online check or when the offline period ends, whichever is first.</dd></dl>
            {s.offers?.simulated_payments && <Banner kind="warn">Development build: payments are simulated on this computer. No real provider is contacted and no money moves.</Banner>}
            {active ? <Banner kind="ok">This account already has an active pass. There is nothing more to buy.</Banner>
              : !s.offers?.purchasing_enabled ? <Banner><strong>Not on sale yet.</strong> {s.offers?.purchasable_reason ?? 'Purchasing is not enabled.'}</Banner>
              : !s.token ? <p className="support">Sign in above to buy, so the pass can always be restored.</p>
              : c.step === 'idle' || c.step === 'cancelled' || c.step === 'failed' ? <Button variant="filled" block onClick={() => void model.startCheckout(offer.product_id)}>{c.step === 'idle' ? `Continue to payment · ${rupees(offer.amount_minor)}` : 'Try payment again'}</Button> : null}
          </div>
          {c.step === 'creating' && <Banner>Preparing your order…</Banner>}
          {c.step === 'cancelled' && <Banner>Payment cancelled. You have not been charged and nothing has changed.</Banner>}
          {c.step === 'failed' && <Banner kind="error">{c.message}</Banner>}
          {c.step === 'verifying' && <Banner>Confirming your payment with the payment provider… This can take a few seconds. Keep this screen open.</Banner>}
          {c.step === 'pending' && <Banner kind="warn" action={<Button variant="outlined" disabled={!s.online} onClick={() => void model.recheckPendingOrder()}>Check again</Button>}><strong>Payment not confirmed yet.</strong> {c.message}</Banner>}
          {c.step === 'confirmed' && <Banner kind="ok" action={<Button variant="outlined" onClick={finish}>{s.returnTo ? 'Back to where you were' : 'Done'}</Button>}><strong>Payment verified. Your pass is active until {formatDateTime(c.expires_at)}.</strong> Paid papers are downloading now; see Library › Downloads.</Banner>}
          {c.step === 'awaiting_payment' && !c.simulated && <div className="actions"><Button variant="filled" onClick={() => void openProvider()}>Open secure payment window</Button><Button onClick={() => void model.cancelCheckout()}>Cancel</Button></div>}
        </>)}
      </section>

      {s.purchases.length > 0 && <section className="section" aria-labelledby="pu"><h2 id="pu">Purchases on this account</h2><ul className="list">{s.purchases.map(p => (
        <li key={p.purchase_id} style={{ padding: '0.5rem 0' }}><div className="row between"><div className="grow"><strong>{rupees(p.amount_minor)}</strong> · {p.verified_at ? formatDate(p.verified_at) : 'not completed'}<div className="support">{p.access_expires_at ? `Access to ${formatDateTime(p.access_expires_at)}` : ''}{p.refunded_at ? ` · refunded ${formatDate(p.refunded_at)}` : ''} · reference {p.provider_transaction_id}</div></div>
          <Tag kind={p.status === 'verified' ? 'ok' : p.status === 'pending' ? 'warn' : 'bad'}>{p.status === 'verified' ? '✓ Verified' : p.status === 'pending' ? 'Pending' : p.status === 'refunded' ? 'Refunded' : p.status === 'revoked' ? 'Revoked' : 'Failed'}</Tag></div>
          {s.offers?.simulated_payments && p.status === 'verified' && <Button onClick={() => setRefundId(p.purchase_id)}>Simulate a refund (development)</Button>}</li>))}</ul></section>}

      <More summary="What stays free"><p>One sample unit and a short practice set for each published paper, the syllabus coverage map, calculators, and all of your own history and bookmarks. Papers in the pass: {offer?.included_papers.map(p => PAPER_NAMES[p]).join(', ') ?? '—'}; only the parts listed under “What you get today” exist so far.</p></More>

      {c.step === 'awaiting_payment' && c.simulated && (
        <Sheet title="Simulated payment (development only)" onClose={() => void model.cancelCheckout()}>
          <Banner kind="warn">This stands in for the payment provider's window. No real payment is made. Choose what the pretend provider should report for {rupees(c.amount_minor)}.</Banner>
          <div className="stack"><Button variant="filled" block onClick={() => void model.simulatePayment('captured')}>Payment succeeds</Button><Button variant="tonal" block onClick={() => void model.simulatePayment('authorized')}>Payment stays pending</Button><Button variant="tonal" block onClick={() => void model.simulatePayment('failed')}>Payment fails</Button><Button block onClick={() => void model.cancelCheckout()}>Close the window without paying</Button></div>
        </Sheet>)}
      {refundId && <Sheet title="Simulate a refund?" onClose={() => setRefundId(null)}><p>The pretend provider will report this payment as refunded. The pass is then withdrawn at the next online check.</p><div className="actions"><Button variant="outlined" onClick={() => setRefundId(null)}>Cancel</Button><Button variant="filled" onClick={() => { const id = refundId; setRefundId(null); void model.simulateRefund(id); }}>Simulate refund</Button></div></Sheet>}
      <div className="row"><Button onClick={() => go('today')}>Back to Today</Button></div>
    </>
  );
}
