import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { PaperId } from '../types/contracts.ts';
import { model, type AppState } from './model.ts';

export const useApp = (): AppState => useSyncExternalStore(model.subscribe, model.getState);

export function useRoute(): string[] {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => { const on = () => setHash(window.location.hash); window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on); }, []);
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
}
export const go = (path: string): void => { window.location.hash = `#/${path}`; };
export const href = (path: string): string => `#/${path}`;

/** What the learner can actually open for a paper right now. */
export function paperAvailability(s: AppState, paper: PaperId): { label: string; kind?: 'ok' | 'warn' | 'info' } {
  const record = s.index.packFor(paper);
  if (record) return record.kind === 'fixture' ? { label: 'Engineering sample', kind: 'warn' } : record.access === 'free' ? { label: 'Free sample on this device', kind: 'ok' } : { label: 'Downloaded', kind: 'ok' };
  if (model.entryFor(paper).length) return { label: 'Available to download', kind: 'info' };
  return { label: 'Not yet published' };
}

/** Re-renders every second while mounted; used for deadlines derived from a persisted absolute time. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), intervalMs); return () => clearInterval(t); }, [intervalMs]);
  return now;
}

/**
 * Time spent on the current item while the page is visible. Hidden time is not counted, and the caller
 * collects the elapsed value when the learner submits or moves on.
 */
export function useStopwatch(key: string): () => number {
  const acc = useRef(0); const started = useRef<number | null>(null);
  useEffect(() => {
    acc.current = 0; started.current = document.visibilityState === 'visible' ? performance.now() : null;
    const on = () => {
      if (document.visibilityState === 'visible') started.current = performance.now();
      else if (started.current !== null) { acc.current += performance.now() - started.current; started.current = null; }
    };
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, [key]);
  return () => { const total = acc.current + (started.current !== null ? performance.now() - started.current : 0); acc.current = 0; started.current = document.visibilityState === 'visible' ? performance.now() : null; return total; };
}
