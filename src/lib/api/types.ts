/**
 * 与后端 pkg/console 约定的标准响应格式。
 * code 0 表示成功，非 0 为业务错误码；data 成功时为业务数据，失败时为 null。
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

/** 节点集群状态，与后端 NodeClusterStatus 一致 */
export interface NodeClusterStatus {
  isClusterNode: boolean;
  leaderAddr?: string;
  inQuorum: boolean;
  memberCount: number;
}

/** 系统基本状态，与后端 SystemBasicState 一致（startTime 为 RFC3339 字符串） */
export interface SystemBasicState {
  startTime: string;
  version: string;
  remotingEnabled: boolean;
  remotingAddress: string;
  metricsEnabled: boolean;
}

/** 指标快照，与后端 pkg/metrics.MetricsSnapshot 一致（Go 序列化为大写键） */
export interface MetricsSnapshot {
  Counters: Record<string, number>;
  Gauges: Record<string, number>;
  Histograms: Record<string, { Count: number; Sum: number; Min: number; Max: number; Values?: number[] }>;
}

/** 单条事件摘要，与后端 store.EventItem 一致 */
export interface EventItem {
  time: string;
  type: string;
  summary: string;
}

/** 单条死信摘要，与后端 store.DeathLetterItem 一致 */
export interface DeathLetterItem {
  time: string;
  sender: string;
  receiver: string;
  messageType: string;
}
