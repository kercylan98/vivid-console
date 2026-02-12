'use client';

import { useState, useEffect } from 'react';
import {
  Layers,
  MessageSquare,
  ListOrdered,
  AlertCircle,
  Server,
  Network,
} from 'lucide-react';
import { useCurrentNodeCluster } from '@/hooks/use-current-node-cluster';
import { useCurrentNodeMetrics } from '@/hooks/use-current-node-metrics';
import { useCurrentNodeState } from '@/hooks/use-current-node-state';
import { useRecentEventsAndDeathLetters } from '@/hooks/use-recent-events-and-death-letters';
import { ClusterStatusFetcher } from '@/components/cluster-status-fetcher';
import { cn } from '@/lib/utils';

// 关键指标：Actor 数量、消息数量、事件数量、死信数
const METRIC_KEYS = [
  { key: 'actors', label: 'Actor 数量', unit: '', icon: Layers },
  { key: 'messageCount', label: '消息数量', unit: '', icon: MessageSquare },
  { key: 'eventCount', label: '事件数量', unit: '', icon: ListOrdered },
  { key: 'deathLetter', label: '死信数', unit: '', icon: AlertCircle },
] as const;

function formatTimeShort(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatStartTime(iso: string): string {
  if (!iso || iso.startsWith('0001-01-01')) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('zh-CN', {
    dateStyle: 'short',
    timeStyle: 'medium',
    hour12: false,
  });
}

/** 根据启动时间与当前时间计算运行时长，精确到秒，如 "2天 3小时 15分 30秒" */
function formatUptime(iso: string, nowMs: number = Date.now()): string {
  if (!iso || iso.startsWith('0001-01-01')) return '—';
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return '—';
  const totalSeconds = Math.floor((nowMs - start) / 1000);
  if (totalSeconds < 0) return '—';
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分`);
  parts.push(`${seconds}秒`);
  return parts.join(' ');
}

function deriveSystemFields(
  state: ReturnType<typeof useCurrentNodeState>,
  nowMs: number = Date.now()
): { label: string; value: string; mono?: boolean }[] {
  const empty = '—';
  if (state.status !== 'success') {
    return [
      { label: 'Vivid 版本', value: empty },
      { label: '远程通讯', value: empty },
      { label: '指标', value: empty },
      { label: '启动时间', value: empty },
      { label: '运行时长', value: empty },
    ];
  }
  const d = state.data;
  const remotingValue = d.remotingEnabled && d.remotingAddress ? d.remotingAddress : '未开启';
  const metricsValue = d.metricsEnabled ? '已启用' : '未启用';
  return [
    { label: 'Vivid 版本', value: d.version || empty },
    {
      label: '远程通讯',
      value: remotingValue,
      mono: d.remotingEnabled && !!d.remotingAddress,
    },
    { label: '指标', value: metricsValue },
    { label: '启动时间', value: formatStartTime(d.startTime) },
    { label: '运行时长', value: formatUptime(d.startTime, nowMs) },
  ];
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
      <span className="w-0.5 h-4 rounded-full bg-[var(--vivid-gold)]" />
      {children}
    </h2>
  );
}

const NOT_ENABLED = '暂未启用';

function deriveMetrics(
  clusterState: ReturnType<typeof useCurrentNodeCluster>,
  systemState: ReturnType<typeof useCurrentNodeState>,
  metricsState: ReturnType<typeof useCurrentNodeMetrics>,
  nowMs: number
): Record<(typeof METRIC_KEYS)[number]['key'], { value: string; unit?: string }> {
  const empty = (v: string, u?: string) => ({ value: v, unit: u });
  const metricsEnabled =
    systemState.status === 'success' && systemState.data.metricsEnabled;

  if (!metricsEnabled) {
    return {
      actors: empty(NOT_ENABLED),
      messageCount: empty(NOT_ENABLED),
      eventCount: empty(NOT_ENABLED),
      deathLetter: empty(NOT_ENABLED),
    };
  }

  const snapshot = metricsState.status === 'success' ? metricsState.data : null;
  const gauges = snapshot?.Gauges ?? {};
  const counters = snapshot?.Counters ?? {};

  return {
    actors: empty(snapshot ? String(gauges['vivid_actor_count'] ?? '—') : '…'),
    messageCount: empty(
      snapshot ? String(counters['vivid_messages_processed_total'] ?? '0') : '…'
    ),
    eventCount: empty(
      snapshot ? String(counters['vivid_stream_events_total'] ?? '0') : '…'
    ),
    deathLetter: empty(
      snapshot ? String(counters['vivid_death_letter_total'] ?? '0') : '…'
    ),
  };
}

type TabId = 'node' | 'cluster';

export default function DashboardPage() {
  const clusterState = useCurrentNodeCluster();
  const systemState = useCurrentNodeState();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const metricsEnabled =
    systemState.status === 'success' && systemState.data.metricsEnabled;
  const metricsState = useCurrentNodeMetrics(!!metricsEnabled);
  const { events: eventsState, deathLetters: deathLettersState } =
    useRecentEventsAndDeathLetters();
  const systemFields = deriveSystemFields(systemState, now);
  const metrics = deriveMetrics(clusterState, systemState, metricsState, now);
  const isClusterAvailable =
    clusterState.status === 'success' && clusterState.data.isClusterNode;
  const [activeTab, setActiveTab] = useState<TabId>('node');

  useEffect(() => {
    if (!isClusterAvailable && activeTab === 'cluster') {
      setActiveTab('node');
    }
  }, [isClusterAvailable, activeTab]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">仪表盘</h1>
        <p className="mt-1 text-sm text-muted-foreground">ActorSystem 运行状态与关键指标</p>
        <div className="mt-2">
          <ClusterStatusFetcher state={clusterState} />
        </div>
      </header>

      {/* Tab 栏 */}
      <div
        className="flex gap-0 rounded-lg border border-[var(--vivid-gold-muted)]/30 bg-muted/20 p-1"
        role="tablist"
        aria-label="节点与集群视图"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'node'}
          aria-controls="panel-node"
          id="tab-node"
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'node'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          )}
          onClick={() => setActiveTab('node')}
        >
          <Server className="size-4" style={{ color: 'var(--vivid-gold-muted)' }} />
          节点状态
        </button>
        <span
          className={cn(
            'relative inline-flex',
            !isClusterAvailable && 'group/cluster-tab'
          )}
        >
          {!isClusterAvailable && (
            <span
              id="cluster-tab-tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-md border border-[var(--vivid-gold-muted)]/50 bg-popover text-popover-foreground text-xs shadow-lg opacity-0 transition-opacity duration-200 group-hover/cluster-tab:opacity-100 z-50 whitespace-nowrap flex items-center gap-2 max-w-[220px] sm:max-w-none before:content-[''] before:absolute before:left-1/2 before:top-full before:-translate-x-1/2 before:border-[6px] before:border-transparent before:border-t-[var(--popover)]"
              role="tooltip"
            >
              <span className="shrink-0 w-0.5 h-4 rounded-full bg-[var(--vivid-gold-muted)]" aria-hidden />
              <span className="text-muted-foreground">
                当前为非集群节点，无法查看集群视图
              </span>
            </span>
          )}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cluster'}
            aria-controls="panel-cluster"
            id="tab-cluster"
            disabled={!isClusterAvailable}
            aria-describedby={!isClusterAvailable ? 'cluster-tab-tooltip' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === 'cluster'
                ? 'bg-background text-foreground shadow-sm'
                : isClusterAvailable
                  ? 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  : 'cursor-not-allowed opacity-50 text-muted-foreground'
            )}
            onClick={() => isClusterAvailable && setActiveTab('cluster')}
          >
            <Network className="size-4" style={{ color: 'var(--vivid-gold-muted)' }} />
            集群
          </button>
        </span>
      </div>

      {/* 节点状态 Tab */}
      <div
        id="panel-node"
        role="tabpanel"
        aria-labelledby="tab-node"
        hidden={activeTab !== 'node'}
        className="space-y-8"
      >
        <section
          className="rounded-lg border border-[var(--vivid-gold-muted)]/30 bg-muted/20 py-4 px-4"
          aria-label="关键指标"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
            {METRIC_KEYS.map((m, i) => {
              const Icon = m.icon;
              const isLast = i === METRIC_KEYS.length - 1;
              const { value, unit } = metrics[m.key];
              const isDisabled = value === NOT_ENABLED;
              return (
                <div
                  key={m.key}
                  className={`flex flex-col items-center justify-center py-2 px-3 text-center ${
                    !isLast ? 'border-r border-border/60' : ''
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 justify-center">
                    <Icon className="size-3" style={{ color: 'var(--vivid-gold-muted)' }} />
                    {m.label}
                  </span>
                  <span
                    className={cn(
                      'mt-1 tabular-nums',
                      isDisabled
                        ? 'text-xs text-muted-foreground'
                        : 'text-base font-semibold'
                    )}
                    style={isDisabled ? undefined : { color: 'var(--vivid-gold-soft)' }}
                  >
                    {value}
                    {unit && value !== '—' && value !== '…' && !isDisabled && (
                      <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 左侧系统信息，右侧上下两行：事件、死信队列 */}
        <div className="grid gap-8 lg:grid-cols-2 lg:grid-rows-2 lg:auto-rows-fr">
          <section className="lg:row-span-2 rounded-lg border border-border/60 bg-background overflow-hidden">
            <SectionTitle>系统信息</SectionTitle>
            <div className="rounded-lg border-t border-border/50 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {systemFields.map((row, i) => (
                    <tr
                      key={row.label}
                      className={`border-border/50 ${i < systemFields.length - 1 ? 'border-b' : ''}`}
                    >
                      <td className="py-2.5 px-4 text-muted-foreground w-[140px]">{row.label}</td>
                      <td className={`py-2.5 px-4 ${row.mono ? 'font-mono text-xs' : ''}`}>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="rounded-lg border border-border/60 bg-muted/10 overflow-hidden min-h-[180px] flex flex-col">
            <SectionTitle>事件</SectionTitle>
            <div className="flex-1 border-t border-border/50 overflow-auto">
              {eventsState.status === 'loading' && (
                <p className="text-xs text-muted-foreground text-center py-8">加载中…</p>
              )}
              {eventsState.status === 'error' && (
                <p className="text-xs text-muted-foreground text-center py-8">{eventsState.message}</p>
              )}
              {eventsState.status === 'success' && eventsState.data.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">暂无事件</p>
              )}
              {eventsState.status === 'success' && eventsState.data.length > 0 && (
                <ul className="divide-y divide-border/50">
                  {eventsState.data.map((item, i) => (
                    <li key={`${item.time}-${i}`} className="py-2 px-4 text-sm">
                      <span className="text-muted-foreground tabular-nums">
                        {formatTimeShort(item.time)}
                      </span>
                      <span className="ml-2 font-medium" style={{ color: 'var(--vivid-gold-soft)' }}>
                        {item.type}
                      </span>
                      {item.summary && (
                        <span className="ml-2 text-muted-foreground truncate block sm:inline">
                          {item.summary}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
          <section className="rounded-lg border border-border/60 bg-muted/10 overflow-hidden min-h-[180px] flex flex-col">
            <SectionTitle>死信队列</SectionTitle>
            <div className="flex-1 border-t border-border/50 overflow-auto">
              {deathLettersState.status === 'loading' && (
                <p className="text-xs text-muted-foreground text-center py-8">加载中…</p>
              )}
              {deathLettersState.status === 'error' && (
                <p className="text-xs text-muted-foreground text-center py-8">{deathLettersState.message}</p>
              )}
              {deathLettersState.status === 'success' && deathLettersState.data.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">暂无死信</p>
              )}
              {deathLettersState.status === 'success' && deathLettersState.data.length > 0 && (
                <ul className="divide-y divide-border/50">
                  {deathLettersState.data.map((item, i) => (
                    <li key={`${item.time}-${i}`} className="py-2 px-4 text-sm">
                      <span className="text-muted-foreground tabular-nums">
                        {formatTimeShort(item.time)}
                      </span>
                      <span className="ml-2 text-foreground">
                        {item.sender || '—'} → {item.receiver || '—'}
                      </span>
                      {item.messageType && (
                        <span className="ml-2 text-muted-foreground font-mono text-xs block sm:inline">
                          {item.messageType}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* 集群 Tab：仅集群可用时显示内容 */}
      <div
        id="panel-cluster"
        role="tabpanel"
        aria-labelledby="tab-cluster"
        hidden={activeTab !== 'cluster'}
        className="space-y-8"
      >
        {clusterState.status === 'success' && clusterState.data.isClusterNode && (
          <>
            <section>
              <SectionTitle>集群概览</SectionTitle>
              <p className="text-xs text-muted-foreground mb-3">
                当前视图 {clusterState.data.memberCount} 个成员
                {clusterState.data.inQuorum && ' · 本节点在法定人数内'}
              </p>
              <div className="rounded-lg border border-border/60 bg-background overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left font-medium text-muted-foreground py-2.5 px-4">节点 ID</th>
                      <th className="text-left font-medium text-muted-foreground py-2.5 px-4">地址</th>
                      <th className="text-left font-medium text-muted-foreground py-2.5 px-4">状态</th>
                      <th className="text-left font-medium text-muted-foreground py-2.5 px-4">角色</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="py-2.5 px-4 font-mono text-xs">当前节点</td>
                      <td className="py-2.5 px-4 font-mono text-xs text-muted-foreground">
                        {clusterState.data.leaderAddr || '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className="inline-flex items-center rounded border px-2 py-0.5 text-xs"
                          style={{
                            borderColor: 'var(--vivid-gold-muted)',
                            backgroundColor: 'var(--vivid-gold-subtle)',
                            color: 'var(--vivid-gold-soft)',
                          }}
                        >
                          {clusterState.data.inQuorum ? '在法定人数内' : '集群节点'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">
                        {clusterState.data.memberCount} 成员
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-2 pt-2 border-t border-border/50">
        <span className="w-0.5 h-3 rounded-full bg-[var(--vivid-gold-muted)]" />
        「节点状态」展示当前连接节点的指标与系统信息；「集群」展示集群视图，仅当当前节点为集群成员时可切换。
      </p>
    </div>
  );
}
