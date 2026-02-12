'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl, getCurrentNodeState, isOk } from '@/lib/api';
import type { SystemBasicState } from '@/lib/api';

export type SystemStateResult =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: SystemBasicState };

export function useCurrentNodeState(): SystemStateResult {
  const [state, setState] = useState<SystemStateResult>({ status: 'idle' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const base = getApiBaseUrl();
    if (!base) {
      setState({ status: 'idle' });
      return;
    }
    setState({ status: 'loading' });
    getCurrentNodeState()
      .then((res) => {
        if (isOk(res)) {
          setState({ status: 'success', data: res.data });
        } else {
          setState({ status: 'error', message: res.message || '请求失败' });
        }
      })
      .catch((err) => {
        setState({ status: 'error', message: err?.message ?? '网络错误' });
      });
  }, []);

  return state;
}
