'use client';

import type { ClusterState } from '@/hooks/use-current-node-cluster';

/** 根据集群状态渲染头部一行摘要，由父组件传入 state（父组件负责请求）。 */
export function ClusterStatusFetcher({ state }: { state: ClusterState }) {
  if (state.status === 'idle') return null;
  if (state.status === 'loading') {
    return (
      <span className="text-xs text-muted-foreground">集群状态: 请求中…</span>
    );
  }
  if (state.status === 'error') {
    return (
      <span className="text-xs text-muted-foreground" title={state.message}>
        集群状态: 请求失败
      </span>
    );
  }
  const d = state.data;
  if (!d.isClusterNode) {
    return (
      <span className="text-xs text-muted-foreground">集群状态: 非集群节点</span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">
      集群状态: 集群节点
      {d.memberCount >= 0 && ` (${d.memberCount} 成员)`}
      {d.inQuorum && ' · 在法定人数内'}
    </span>
  );
}
