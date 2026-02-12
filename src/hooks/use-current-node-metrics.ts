'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl, getCurrentNodeMetrics, isOk } from '@/lib/api';
import type { MetricsSnapshot } from '@/lib/api';

const POLL_INTERVAL_MS = 3000;

export type MetricsStateResult =
  | { status: 'idle' }
  | { status: 'disabled' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: MetricsSnapshot };

/**
 * 当 metricsEnabled 为 true 时轮询指标快照（与 EnableMetricsUpdatedNotify 配合展示）；为 false 时不请求。
 */
export function useCurrentNodeMetrics(metricsEnabled: boolean): MetricsStateResult {
  const [state, setState] = useState<MetricsStateResult>({ status: 'idle' });

  useEffect(() => {
    if (!metricsEnabled) {
      setState({ status: 'disabled' });
      return;
    }
    if (typeof window === 'undefined') return;
    const base = getApiBaseUrl();
    if (!base) {
      setState({ status: 'idle' });
      return;
    }

    let cancelled = false;
    const fetchOnce = () => {
      getCurrentNodeMetrics()
        .then((res) => {
          if (cancelled) return;
          if (isOk(res) && res.data) {
            setState({ status: 'success', data: res.data });
          } else {
            setState({ status: 'error', message: res.message || '请求失败' });
          }
        })
        .catch((err) => {
          if (cancelled) return;
          setState({ status: 'error', message: err?.message ?? '网络错误' });
        });
    };

    setState({ status: 'loading' });
    fetchOnce();
    const id = setInterval(fetchOnce, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [metricsEnabled]);

  return state;
}
