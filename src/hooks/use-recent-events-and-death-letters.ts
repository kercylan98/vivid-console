'use client';

import { useEffect, useState } from 'react';
import {
  getApiBaseUrl,
  getRecentDeathLetters,
  getRecentEvents,
  isOk,
} from '@/lib/api';
import type { DeathLetterItem, EventItem } from '@/lib/api';

const POLL_INTERVAL_MS = 4000;

export type RecentEventsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: EventItem[] };

export type RecentDeathLettersState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: DeathLetterItem[] };

export function useRecentEventsAndDeathLetters(): {
  events: RecentEventsState;
  deathLetters: RecentDeathLettersState;
} {
  const [events, setEvents] = useState<RecentEventsState>({ status: 'idle' });
  const [deathLetters, setDeathLetters] = useState<RecentDeathLettersState>({
    status: 'idle',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const base = getApiBaseUrl();
    if (!base) return;

    const fetchAll = () => {
      setEvents((e) => (e.status === 'idle' ? { status: 'loading' } : e));
      setDeathLetters((d) =>
        d.status === 'idle' ? { status: 'loading' } : d
      );
      Promise.all([getRecentEvents(), getRecentDeathLetters()]).then(
        ([eventsRes, dlRes]) => {
          if (isOk(eventsRes) && eventsRes.data != null) {
            setEvents({ status: 'success', data: eventsRes.data });
          } else {
            setEvents({
              status: 'error',
              message: eventsRes.message || '请求失败',
            });
          }
          if (isOk(dlRes) && dlRes.data != null) {
            setDeathLetters({ status: 'success', data: dlRes.data });
          } else {
            setDeathLetters({
              status: 'error',
              message: dlRes.message || '请求失败',
            });
          }
        }
      ).catch((err) => {
        setEvents({ status: 'error', message: err?.message ?? '网络错误' });
        setDeathLetters({ status: 'error', message: err?.message ?? '网络错误' });
      });
    };

    fetchAll();
    const id = setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return { events, deathLetters };
}
