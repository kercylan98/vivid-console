'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BarChart3, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  groupGoroutinesByState,
  parseGoroutineText,
  parseHeapText,
} from './parsers';

const PPROF_PREFIX = '/debug/pprof';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
      <span className="w-0.5 h-4 rounded-full bg-[var(--vivid-gold)]" />
      {children}
    </h2>
  );
}

function usePprofText(path: string, params?: string) {
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'success'; text: string }
  >({ status: 'idle' });
  const fetchIt = useCallback(() => {
    if (typeof window === 'undefined') return;
    const base = getApiBaseUrl();
    const url = params ? `${base}${path}?${params}` : `${base}${path}`;
    setState({ status: 'loading' });
    fetch(url, { method: 'GET' })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText || '请求失败');
        return res.text();
      })
      .then((text) => setState({ status: 'success', text }))
      .catch((err) =>
        setState({ status: 'error', message: err?.message ?? '网络错误' })
      );
  }, [path, params]);

  useEffect(() => {
    fetchIt();
  }, [fetchIt]);

  return { ...state, refetch: fetchIt };
}

const MAX_HEAP_ROWS = 20;
const MAX_GOROUTINE_BARS = 12;

export default function PerformancePage() {
  const goroutine = usePprofText(`${PPROF_PREFIX}/goroutine`, 'debug=2');
  const heap = usePprofText(`${PPROF_PREFIX}/heap`, 'debug=1');

  const lastGoroutineTextRef = useRef('');
  const lastHeapTextRef = useRef('');
  if (goroutine.status === 'success') lastGoroutineTextRef.current = goroutine.text;
  if (heap.status === 'success') lastHeapTextRef.current = heap.text;

  const goroutineTextForRender =
    goroutine.status === 'success'
      ? goroutine.text
      : goroutine.status === 'loading' && lastGoroutineTextRef.current
        ? lastGoroutineTextRef.current
        : '';
  const heapTextForRender =
    heap.status === 'success'
      ? heap.text
      : heap.status === 'loading' && lastHeapTextRef.current
        ? lastHeapTextRef.current
        : '';

  const heapRows = heapTextForRender
    ? parseHeapText(heapTextForRender).slice(0, MAX_HEAP_ROWS)
    : [];
  const goroutineEntries = goroutineTextForRender
    ? parseGoroutineText(goroutineTextForRender)
    : [];
  const goroutineByState = groupGoroutinesByState(goroutineEntries).slice(0, MAX_GOROUTINE_BARS);
  const maxStateCount = Math.max(1, ...goroutineByState.map((g) => g.count));
  const maxFlatPct = Math.max(1, ...heapRows.map((r) => r.flatPct));

  const [expandedGoroutineId, setExpandedGoroutineId] = useState<string | null>(null);
  const scrollRestoreRef = useRef<number | null>(null);

  useEffect(() => {
    if (scrollRestoreRef.current === null) return;
    const y = scrollRestoreRef.current;
    scrollRestoreRef.current = null;
    const restore = () => window.scrollTo(0, y);
    requestAnimationFrame(() => {
      requestAnimationFrame(restore);
    });
    const t = setTimeout(restore, 50);
    return () => clearTimeout(t);
  }, [goroutine.status, heap.status]);

  const handleRefetch = useCallback((refetch: () => void) => {
    scrollRestoreRef.current = window.scrollY;
    refetch();
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3
            className="size-7"
            style={{ color: 'var(--vivid-gold-soft)' }}
          />
          性能分析
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          基于 Go pprof，可查看 Goroutine、堆内存等；表格与条形图便于排查与对比刻度，新开标签可查看完整 pprof 页面。
        </p>
      </header>

      {/* Goroutine */}
      <section className="rounded-lg border border-border/60 bg-background overflow-hidden">
        <div className="flex items-center justify-between py-2 px-4 border-b border-border/50">
          <SectionTitle>Goroutine</SectionTitle>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRefetch(goroutine.refetch);
            }}
            disabled={goroutine.status === 'loading'}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            title="刷新"
          >
            <RefreshCw
              className={cn('size-4', goroutine.status === 'loading' && 'animate-spin')}
            />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {goroutine.status === 'loading' && !goroutineTextForRender && (
            <p className="text-sm text-muted-foreground">加载中…</p>
          )}
          {goroutine.status === 'error' && (
            <p className="text-sm text-destructive">{goroutine.message}</p>
          )}
          {goroutineByState.length === 0 && goroutineTextForRender && (
            <p className="text-sm text-muted-foreground">无 goroutine 数据或格式无法解析。</p>
          )}
          {goroutineByState.length > 0 && (
            <>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">按状态数量（刻度条为占比）</p>
                <div className="space-y-1.5">
                  {goroutineByState.map((g) => (
                    <div key={g.state} className="flex items-center gap-3">
                      <span className="min-w-[7rem] flex-1 text-xs font-medium shrink-0 max-w-[12rem]">{g.state}</span>
                      <span className="w-9 text-xs tabular-nums text-muted-foreground shrink-0 text-right">
                        {g.count}
                      </span>
                      <div className="w-28 shrink-0">
                        <div
                          className="h-4 rounded-md min-w-[2px] transition-all"
                          style={{
                            width: `${(g.count / maxStateCount) * 100}%`,
                            maxWidth: '100%',
                            backgroundColor: 'var(--vivid-gold-subtle)',
                            border: '1px solid var(--vivid-gold-muted)',
                          }}
                          title={`${g.state}: ${g.count}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-border/50 pt-3">
                <p className="text-xs text-muted-foreground mb-2">Goroutine 列表（可展开栈）</p>
                <div className="max-h-[280px] overflow-auto space-y-0.5">
                  {goroutineEntries.slice(0, 50).map((e) => {
                    const isExpanded = expandedGoroutineId === e.id;
                    return (
                      <div
                        key={e.id}
                        className="rounded border border-border/50 bg-muted/20 overflow-hidden"
                      >
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 py-1.5 px-3 text-left text-sm hover:bg-muted/50"
                          onClick={() =>
                            setExpandedGoroutineId(isExpanded ? null : e.id)
                          }
                        >
                          {isExpanded ? (
                            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className="font-mono text-xs text-muted-foreground shrink-0">
                            #{e.id}
                          </span>
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium shrink-0"
                            style={{
                              backgroundColor: 'var(--vivid-gold-subtle)',
                              color: 'var(--vivid-gold-soft)',
                            }}
                          >
                            {e.state}
                          </span>
                          <span className="font-mono text-xs truncate min-w-0">
                            {e.topFrame}
                          </span>
                        </button>
                        {isExpanded && e.stack.length > 0 && (
                          <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap break-all px-3 pb-2 pt-0 border-t border-border/50 bg-background/80">
                            {e.stack.join('\n')}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
                {goroutineEntries.length > 50 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    仅展示前 50 条，共 {goroutineEntries.length} 个 goroutine
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Heap 内存 */}
      <section className="rounded-lg border border-border/60 bg-background overflow-hidden">
        <div className="flex items-center justify-between py-2 px-4 border-b border-border/50">
          <SectionTitle>Heap 内存</SectionTitle>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRefetch(heap.refetch);
            }}
            disabled={heap.status === 'loading'}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            title="刷新"
          >
            <RefreshCw
              className={cn('size-4', heap.status === 'loading' && 'animate-spin')}
            />
          </button>
        </div>
        <div className="overflow-auto max-h-[420px]">
          {heap.status === 'loading' && !heapTextForRender && (
            <p className="text-sm text-muted-foreground p-4">加载中…</p>
          )}
          {heap.status === 'error' && (
            <p className="text-sm text-destructive p-4">{heap.message}</p>
          )}
          {heapRows.length === 0 && heapTextForRender && (
            <p className="text-sm text-muted-foreground p-4">无数据或格式无法解析，可新开标签查看原始输出。</p>
          )}
          {heapRows.length > 0 && (
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-muted/90">
                <tr className="border-b border-border/60">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground w-[80px]">flat</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground w-[56px]">flat%</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground w-[48px]">sum%</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground w-[80px]">cum</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground w-[56px]">cum%</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[200px]">名称</th>
                </tr>
              </thead>
              <tbody>
                {heapRows.map((row, i) => (
                  <tr
                    key={`${row.name}-${i}`}
                    className="border-b border-border/50 hover:bg-muted/30"
                  >
                    <td className="py-1.5 px-3 font-mono text-xs">{row.flat}</td>
                    <td className="py-1.5 px-3 tabular-nums">{row.flatPct.toFixed(1)}%</td>
                    <td className="py-1.5 px-3 tabular-nums">{row.sumPct.toFixed(1)}%</td>
                    <td className="py-1.5 px-3 font-mono text-xs">{row.cum}</td>
                    <td className="py-1.5 px-3 tabular-nums">{row.cumPct.toFixed(1)}%</td>
                    <td className="py-1.5 px-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="inline-block h-1.5 rounded-sm shrink-0 min-w-[4px] max-w-[80px]"
                          style={{
                            width: `${(row.flatPct / maxFlatPct) * 80}px`,
                            backgroundColor: 'var(--vivid-gold-muted)',
                          }}
                          title={`flat% ${row.flatPct}%`}
                        />
                        <span className="font-mono text-xs truncate" title={row.name}>
                          {row.name}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
