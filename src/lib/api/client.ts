import type {
  ApiResponse,
  DeathLetterItem,
  EventItem,
  MetricsSnapshot,
  NodeClusterStatus,
  SystemBasicState,
} from './types';

const CODE_SUCCESS = 0;

const DEFAULT_API_BASE = 'http://localhost:15800';

/** 获取 API 基地址：优先使用登录时保存的连接地址，否则环境变量，最后默认 15800 端口 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_API_BASE;
  const fromStorage = sessionStorage.getItem('vivid-console-address');
  if (fromStorage?.trim()) return fromStorage.trim().replace(/\/$/, '');
  return process.env.NEXT_PUBLIC_CONSOLE_API_BASE ?? DEFAULT_API_BASE;
}

/**
 * 基于标准响应格式的请求封装。
 * 返回解析后的 ApiResponse<T>；HTTP 非 2xx 或 body 解析失败时抛出或返回错误体。
 */
export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const base = getApiBaseUrl();
  const url = base ? `${base}${path.startsWith('/') ? path : `/${path}`}` : path;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    body = {
      code: -1,
      message: res.statusText || '请求失败',
      data: null,
    } as ApiResponse<T>;
  }
  if (!res.ok) {
    return body;
  }
  return body;
}

/** 判断标准响应是否业务成功（code === 0） */
export function isOk<T>(res: ApiResponse<T>): res is ApiResponse<T> & { data: T } {
  return res.code === CODE_SUCCESS && res.data != null;
}

/**
 * 获取当前节点的 cluster 资源，GET /api/nodes/current/cluster。
 */
export async function getCurrentNodeCluster(): Promise<ApiResponse<NodeClusterStatus>> {
  return request<NodeClusterStatus>('/api/nodes/current/cluster', { method: 'GET' });
}

/**
 * 获取 health 资源，GET /api/health。
 */
export async function getHealth(): Promise<ApiResponse<{ status: string }>> {
  return request<{ status: string }>('/api/health', { method: 'GET' });
}

/**
 * 获取当前节点的系统基本状态，GET /api/nodes/current/state。
 */
export async function getCurrentNodeState(): Promise<ApiResponse<SystemBasicState>> {
  return request<SystemBasicState>('/api/nodes/current/state', { method: 'GET' });
}

/**
 * 获取当前节点的指标快照，GET /api/nodes/current/metrics。需后端启用指标时才有数据。
 */
export async function getCurrentNodeMetrics(): Promise<ApiResponse<MetricsSnapshot>> {
  return request<MetricsSnapshot>('/api/nodes/current/metrics', { method: 'GET' });
}

/**
 * 获取最近事件列表（最多 5 条，新在前），GET /api/nodes/current/events。
 */
export async function getRecentEvents(): Promise<ApiResponse<EventItem[]>> {
  return request<EventItem[]>('/api/nodes/current/events', { method: 'GET' });
}

/**
 * 获取最近死信列表（最多 5 条，新在前），GET /api/nodes/current/death-letters。
 */
export async function getRecentDeathLetters(): Promise<ApiResponse<DeathLetterItem[]>> {
  return request<DeathLetterItem[]>('/api/nodes/current/death-letters', { method: 'GET' });
}
