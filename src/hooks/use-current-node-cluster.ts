'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl, getCurrentNodeCluster, isOk } from '@/lib/api';
import type { NodeClusterStatus } from '@/lib/api';

export type ClusterState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: NodeClusterStatus };

export function useCurrentNodeCluster(): ClusterState {
  const [state, setState] = useState<ClusterState>({ status: 'idle' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const base = getApiBaseUrl();
    if (!base) {
      setState({ status: 'idle' });
      return;
    }
    setState({ status: 'loading' });
    getCurrentNodeCluster()
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
