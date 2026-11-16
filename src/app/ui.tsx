/** UI primitives built on the Material 3 token roles in styles.css. Content is rendered as React nodes, never raw HTML. */
import { useEffect, useId, useRef, type ReactNode } from 'react';

// ---- icons (inline, decorative unless labelled by the parent control) --------------------------------------------
const PATHS: Record<string, string> = {
  today: 'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V10h14v10ZM7 12h5v5H7z',
  learn: 'M12 3 1 9l11 6 9-4.9V17h2V9L12 3Zm-7 10.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.8-7-3.8Z',
  practice: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-9 14-4-4 1.4-1.4L10 14.2l6.6-6.6L18 9l-8 8Z',
  library: 'M4 6H2v14a2 2 0 0 0 2 2h14v-2H4V6Zm16-4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm-1 9H9V9h10v2Zm-4 4H9v-2h6v2Zm4-8H9V5h10v2Z',
  back: 'M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2Z',
  close: 'M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4Z',
  expand: 'M7 10l5 5 5-5H7Z',
  chevron: 'M9 6l6 6-6 6-1.4-1.4L12.2 12 7.6 7.4 9 6Z',
  settings: 'M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3.2h-4l-.4 2.7a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.4 2.7h4l.4-2.7c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5-2.3-1.6ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z',
  bookmark: 'M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2Z',
  bookmarkOff: 'M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2Zm0 15-5-2.2L7 18V5h10v13Z',
  flag: 'M14.4 6 14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6Z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z',
  cross: 'M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4Z',
  lock: 'M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2ZM9 6a3 3 0 0 1 6 0v2H9V6Zm3 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z',
  offline: 'M19.4 10A7.5 7.5 0 0 0 6.2 7.1L3.3 4.2 2 5.5l16.5 16.5 1.3-1.3-2.7-2.7H19a4 4 0 0 0 .4-8ZM6 18a4 4 0 0 1-.6-8l8 8H6Z',
  search: 'M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 14 15.5l.3.3v.8l5 5 1.5-1.5-5-5Zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z',
  account: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4Z',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z',
  warn: 'M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3Z',
  map: 'M20.5 3h-.2L15 5.1 9 3 3.4 4.9c-.2.1-.4.3-.4.5V20.500c0 .3.2.5.5.5h.2L9 18.900l6 2.100 5.600-1.900c.2-.1.400-.3.400-.5V3.500c0-.3-.2-.5-.5-.5ZM15 19l-6-2.100V5l6 2.100V19Z',
  download: 'M19 9h-4V3H9v6H5l7 7 7-7ZM5 18v2h14v-2H5Z',
  calc: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-5.970 4.060L14.090 6l1.410 1.410L16.910 6l1.060 1.060-1.410 1.410 1.410 1.410-1.060 1.060-1.410-1.400-1.410 1.410-1.060-1.060 1.410-1.410-1.410-1.420ZM6.250 7.720h5v1.500h-5v-1.500ZM11.500 16h-2v2H8v-2H6v-1.500h2v-2h1.500v2h2V16Zm6.500 1.250h-5v-1.500h5v1.500Zm0-2.500h-5v-1.500h5v1.500Z',
};
export function Icon({ name, size = 24 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ flex: 'none' }}><path fill="currentColor" d={PATHS[name] ?? PATHS.info} /></svg>;
}

// ---- buttons, chips, tabs -------------------------------------------------------------------------------------------
type BtnProps = { children: ReactNode; onClick?: () => void; variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'danger'; block?: boolean; disabled?: boolean; type?: 'button' | 'submit'; href?: string; label?: string; describedBy?: string; className?: string };
export function Button({ children, onClick, variant = 'text', block, disabled, type = 'button', href, label, describedBy, className }: BtnProps) {
  const cls = `btn ${variant === 'text' ? '' : variant}${block ? ' block' : ''}${className ? ` ${className}` : ''}`;
  if (href) return <a className={cls} href={href} aria-label={label} aria-describedby={describedBy}>{children}</a>;
  return <button className={cls} type={type} onClick={onClick} disabled={disabled} aria-label={label} aria-describedby={describedBy}>{children}</button>;
}
export function IconButton({ icon, label, onClick, pressed, href }: { icon: string; label: string; onClick?: () => void; pressed?: boolean; href?: string }) {
  if (href) return <a className="icon-btn" href={href} aria-label={label} title={label}><Icon name={icon} /></a>;
  return <button className="icon-btn" type="button" onClick={onClick} aria-label={label} title={label} aria-pressed={pressed}><Icon name={icon} /></button>;
}
export function Chip({ children, selected, onClick }: { children: ReactNode; selected: boolean; onClick: () => void }) {
  return <button type="button" className="chip" aria-pressed={selected} onClick={onClick}>{selected && <Icon name="check" size={18} />}{children}</button>;
}

/** Presentation only: the caller supplies feedback after explicit submission. */
export function McqOption({ name, value, selected, state, onSelect, children, explanation }: {
  name: string; value: string; selected: boolean;
  state: 'resting' | 'active_selected' | 'verified_correct' | 'examiner_trap';
  onSelect: () => void; children: ReactNode; explanation?: ReactNode;
}) {
  return <label className="option" data-state={state}>
    <input type="radio" name={name} value={value} checked={selected} onChange={onSelect} />
    <span className="body"><span className="option-heading"><strong className="option-key">{value}</strong><span>{children}</span></span>
      {explanation && <span className="why">{explanation}</span>}</span>
  </label>;
}

/** Counts published cards studied, never an inferred mastery score. */
export function ProgressRing({ done, total, label }: { done: number; total: number; label: string }) {
  const percent = total > 0 ? Math.min(100, Math.max(0, 100 * done / total)) : 0;
  return <span className="progress-ring" role="img" aria-label={`${label}: ${done} of ${total} published cards studied`}>
    <svg viewBox="0 0 40 40" aria-hidden="true"><circle className="ring-track" cx="20" cy="20" r="16" />{percent > 0 && <circle className="ring-value" cx="20" cy="20" r="16" pathLength="100" strokeDasharray={`${percent} 100`} />}</svg>
    <strong aria-hidden="true">{total ? `${Math.round(percent)}%` : '—'}</strong>
  </span>;
}
export function Tabs<T extends string>({ tabs, value, onChange, label, idPrefix, panelId }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string; idPrefix: string; panelId: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => { refs.current[tabs.findIndex(t => t.id === value)]?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [tabs, value]);
  const move = (i: number, d: number) => { const n = (i + d + tabs.length) % tabs.length; onChange(tabs[n]!.id); refs.current[n]?.focus(); };
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t, i) => (
        <button key={t.id} id={`${idPrefix}-${t.id}`} aria-controls={panelId} ref={el => { refs.current[i] = el; }} role="tab" type="button" className="tab" aria-selected={value === t.id} tabIndex={value === t.id ? 0 : -1}
          onClick={() => onChange(t.id)} onKeyDown={e => {
            if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
            e.preventDefault();
            move(i, e.key === 'Home' ? -i : e.key === 'End' ? tabs.length - 1 - i : e.key === 'ArrowRight' ? 1 : -1);
          }}>{t.label}</button>
      ))}
    </div>
  );
}

// ---- overlays --------------------------------------------------------------------------------------------------------
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null); const id = useId();
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector<HTMLElement>('button, a, input, [tabindex]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close.current(); }
      if (e.key === 'Tab' && ref.current) {
        const f = [...ref.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])')].filter(el => el.tabIndex >= 0 && el.getClientRects().length > 0);
        if (!f.length) return;
        const first = f[0]!, last = f[f.length - 1]!;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = previousOverflow; if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  return (
    <div className="scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={id} ref={ref}>
        <div className="row between"><h2 id={id}>{title}</h2><IconButton icon="close" label="Close" onClick={onClose} /></div>
        {children}
      </div>
    </div>
  );
}
export function Banner({ kind = 'info', children, action }: { kind?: 'info' | 'warn' | 'error' | 'ok'; children: ReactNode; action?: ReactNode }) {
  return <div className={`banner ${kind === 'info' ? '' : kind}`} role={kind === 'error' ? 'alert' : 'status'}><Icon name={kind === 'ok' ? 'check' : kind === 'info' ? 'info' : 'warn'} /><div className="grow">{children}</div>{action}</div>;
}
export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="empty"><h2>{title}</h2>{children && <p className="support">{children}</p>}{action}</div>;
}
export function Tag({ kind, children }: { kind?: 'ok' | 'warn' | 'bad' | 'info'; children: ReactNode }) { return <span className={`tag ${kind ?? ''}`}>{children}</span>; }
export function More({ summary, children, open }: { summary: string; children: ReactNode; open?: boolean }) { return <details className="more" open={open}><summary>{summary}</summary><div>{children}</div></details>; }
/** Polite live region for submitted answers and state changes. */
export function Announce({ message }: { message: string }) { return <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{message}</div>; }

// ---- markdown subset (paragraphs, lists, tables, bold, italic, code) ----------------------------------------------------
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = []; const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g; let last = 0; let m: RegExpExecArray | null; let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2] !== undefined) out.push(<strong key={`${key}-${i++}`}>{m[2]}</strong>);
    else if (m[3] !== undefined) out.push(<em key={`${key}-${i++}`}>{m[3]}</em>);
    else if (m[4] !== undefined) out.push(<code key={`${key}-${i++}`}>{m[4]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
const cells = (line: string): string[] => line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
export function Md({ text, className }: { text: string; className?: string }) {
  const blocks: ReactNode[] = []; const lines = text.replace(/\r/g, '').split('\n'); let i = 0; let k = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trim()) { i++; continue; }
    if (line.trim().startsWith('|') && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1] ?? '')) {
      const head = cells(line); const rows: string[][] = []; i += 2;
      while (i < lines.length && lines[i]!.trim().startsWith('|')) rows.push(cells(lines[i++]!));
      blocks.push(<div className="table-wrap" key={k++} tabIndex={0} role="region" aria-label={`Table: ${head.join(', ')}`}><table><thead><tr>{head.map((h, j) => <th key={j} scope="col">{inline(h, `h${j}`)}</th>)}</tr></thead><tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci}>{inline(c, `c${ri}-${ci}`)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) { const items: string[] = []; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i]!)) items.push(lines[i++]!.replace(/^\s*[-*]\s+/, '')); blocks.push(<ul key={k++}>{items.map((t, j) => <li key={j}>{inline(t, `l${j}`)}</li>)}</ul>); continue; }
    if (/^\s*\d+[.)]\s+/.test(line)) { const items: string[] = []; while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i]!)) items.push(lines[i++]!.replace(/^\s*\d+[.)]\s+/, '')); blocks.push(<ol key={k++}>{items.map((t, j) => <li key={j}>{inline(t, `o${j}`)}</li>)}</ol>); continue; }
    const para: string[] = [];
    while (i < lines.length && lines[i]!.trim() && !/^\s*[-*]\s+/.test(lines[i]!) && !lines[i]!.trim().startsWith('|')) para.push(lines[i++]!);
    blocks.push(<p key={k++}>{inline(para.join(' '), `p${k}`)}</p>);
  }
  return <div className={`md ${className ?? ''}`}>{blocks}</div>;
}

// ---- LaTeX subset for formula cards ------------------------------------------------------------------------------------
const SYMBOLS: Record<string, string> = { times: '×', div: '÷', cdot: '·', le: '≤', leq: '≤', ge: '≥', geq: '≥', approx: '≈', neq: '≠', pm: '±', sum: '∑', alpha: 'α', beta: 'β', sigma: 'σ', mu: 'μ', rho: 'ρ', Delta: 'Δ', delta: 'δ', lambda: 'λ', pi: 'π', infty: '∞', rightarrow: '→', quad: ' ', '%': '%', ',': ' ', ' ': ' ' };
function parseLatex(src: string): { nodes: ReactNode[]; spoken: string } {
  let pos = 0; let key = 0;
  const group = (): { nodes: ReactNode[]; spoken: string } => { // after an opening brace
    const inner = seq(true); if (src[pos] === '}') pos++; return inner;
  };
  const atom = (): { nodes: ReactNode[]; spoken: string } => {
    if (src[pos] === '{') { pos++; return group(); }
    if (src[pos] === '\\') return command();
    const ch = src[pos++] ?? ''; return { nodes: [ch], spoken: ch };
  };
  const command = (): { nodes: ReactNode[]; spoken: string } => {
    pos++; const m = /^([A-Za-z]+|.)/.exec(src.slice(pos)); const name = m?.[1] ?? ''; pos += name.length;
    if (name === 'frac') { const a = atom(), b = atom(); return { nodes: [<span className="frac" key={key++}><span>{a.nodes}</span><span>{b.nodes}</span></span>], spoken: ` (${a.spoken}) divided by (${b.spoken}) ` }; }
    if (name === 'sqrt') { const a = atom(); return { nodes: ['√(', ...a.nodes, ')'], spoken: ` square root of (${a.spoken}) ` }; }
    if (name === 'text' || name === 'mathrm' || name === 'mathit') { const a = atom(); return { nodes: a.nodes, spoken: a.spoken }; }
    if (name === 'left' || name === 'right') return { nodes: [], spoken: '' };
    const sym = SYMBOLS[name]; if (sym !== undefined) return { nodes: [sym], spoken: name === 'times' ? ' times ' : name === 'div' ? ' divided by ' : sym };
    return { nodes: [`\\${name}`], spoken: name };
  };
  const seq = (untilBrace: boolean): { nodes: ReactNode[]; spoken: string } => {
    const nodes: ReactNode[] = []; let spoken = '';
    while (pos < src.length && !(untilBrace && src[pos] === '}')) {
      const ch = src[pos]!;
      if (ch === '^' || ch === '_') { pos++; const a = atom(); nodes.push(ch === '^' ? <sup key={key++}>{a.nodes}</sup> : <sub key={key++}>{a.nodes}</sub>); spoken += ch === '^' ? ` to the power ${a.spoken} ` : ` sub ${a.spoken} `; continue; }
      const a = atom(); nodes.push(...a.nodes); spoken += a.spoken;
    }
    return { nodes, spoken };
  };
  return seq(false);
}
export function Formula({ latex }: { latex: string }) {
  let parsed: { nodes: ReactNode[]; spoken: string };
  try { parsed = parseLatex(latex); } catch { parsed = { nodes: [latex], spoken: latex }; }
  const spoken = parsed.spoken.replace(/=/g, ' equals ').replace(/\s+/g, ' ').trim();
  return <div className="formula" role="math" aria-label={spoken} tabIndex={0}>{parsed.nodes.map((n, i) => typeof n === 'string' ? <span key={`t${i}`}>{n}</span> : n)}</div>;
}

export const minutesLabel = (m: number | null): string => (m === null ? '' : `About ${m} min`);
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000)); const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  return `${h > 0 ? `${h}:` : ''}${String(m).padStart(h > 0 ? 2 : 1, '0')}:${String(s).padStart(2, '0')}`;
}
