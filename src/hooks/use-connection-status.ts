'use client';

import { useCallback, useEffect, useState } from 'react';
import { getApiBaseUrl, getCurrentNodeCluster, isOk } from '@/lib/api';
import type { NodeClusterStatus } from '@/lib/api';

const HEARTBEAT_INTERVAL_MS = 10_000;

export type ConnectionStatus = 'idle' | 'loading' | 'ok' | 'error';

export type ConnectionState =
  | { status: 'idle'; address: null; cluster: null }
  | { status: 'loading'; address: string; cluster: null }
  | { status: 'ok'; address: string; cluster: NodeClusterStatus }
  | { status: 'error'; address: string; cluster: null; message?: string };

/** 当前用于请求的基地址：登录保存的地址优先，否则环境变量或默认 15800 */
function getEffectiveBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  return getApiBaseUrl();
}

/** 心跳 + 集群信息：只要有有效基地址（含默认）就轮询 GET /api/nodes/current/cluster，用于顶栏连接状态与集群展示 */
export function useConnectionStatus(): ConnectionState {
  const [address, setAddress] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : getEffectiveBaseUrl() || null
  );
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [cluster, setCluster] = useState<NodeClusterStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const runCheck = useCallback(async () => {
    const base = getEffectiveBaseUrl();
    if (!base) {
      setStatus('idle');
      setAddress(null);
      setCluster(null);
      return;
    }
    setAddress(base);
    setStatus((s) => (s === 'idle' ? 'loading' : s));
    getCurrentNodeCluster()
      .then((res) => {
        if (isOk(res)) {
          setStatus('ok');
          setCluster(res.data);
          setErrorMessage(undefined);
        } else {
          setStatus('error');
          setCluster(null);
          setErrorMessage(res.message || '请求失败');
        }
      })
      .catch((err) => {
        setStatus('error');
        setCluster(null);
        setErrorMessage(err?.message ?? '网络错误');
      });
  }, []);

  useEffect(() => {
    const base = getEffectiveBaseUrl();
    if (!base) {
      setAddress(null);
      setStatus('idle');
      setCluster(null);
      return;
    }
    setAddress(base);
    runCheck();
    const timer = setInterval(runCheck, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [runCheck]);

  useEffect(() => {
    const onStorage = () => {
      const base = getEffectiveBaseUrl();
      setAddress(base || null);
      if (!base) {
        setStatus('idle');
        setCluster(null);
      } else if (status === 'idle') {
        runCheck();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [status, runCheck]);

  if (status === 'idle') {
    return { status: 'idle', address: null, cluster: null };
  }
  if (status === 'loading') {
    return { status: 'loading', address: address!, cluster: null };
  }
  if (status === 'error') {
    return { status: 'error', address: address!, cluster: null, message: errorMessage };
  }
  return { status: 'ok', address: address!, cluster: cluster! };
}
