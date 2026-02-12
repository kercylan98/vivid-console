/**
 * 解析 pprof 文本输出，用于可视化展示。
 * 格式以 Go runtime/pprof 实际输出为准：heap?debug=1 为 "N: bytes [N: N] @ 0x..." + # 栈行；
 * goroutine?debug=2 为 "goroutine N [state]:" 逐条栈。
 */

/** Heap 单行：inuse 字节/对象、占比、从栈解析出的名称 */
export interface HeapRow {
  flat: string;
  flatPct: number;
  sumPct: number;
  cum: string;
  cumPct: number;
  name: string;
}

/** Goroutine 块：id, state, 栈顶帧, 完整栈行（debug=2 格式） */
export interface GoroutineEntry {
  id: string;
  state: string;
  topFrame: string;
  stack: string[];
}

/**
 * 解析 heap?debug=1 输出（Go 实际格式）。
 * 格式：首行 "heap profile: inuseObj: inuseBytes [allocObj: allocBytes] @ heap/rate"，
 * 随后多块，每块：一行 "inuseObj: inuseBytes [allocObj: allocBytes] @ 0x... 0x..."，
 * 接着若干 "#\t0x...\tfunc+0x...\tfile:line" 栈行；名称取自栈首条有效帧。
 */
export function parseHeapText(text: string): HeapRow[] {
  const lines = text.split(/\n/);
  let totalInuseBytes = 0;
  const rows: HeapRow[] = [];
  let i = 0;

  // 解析首行：heap profile: inuseObj: inuseBytes [allocObj: allocBytes] @ heap/rate
  for (; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/heap profile:\s*\d+:\s*(\d+)\s*\[/);
    if (m) {
      totalInuseBytes = parseInt(m[1], 10) || 1;
      i++;
      break;
    }
    if (line.trim().startsWith('#')) continue;
    if (line.trim()) break;
  }

  let sumPct = 0;
  while (i < lines.length) {
    const dataLine = lines[i];
    const dataMatch = dataLine.match(/^\s*(\d+):\s*(\d+)\s*\[\d+:\s*\d+\]\s*@/);
    if (!dataMatch) {
      i++;
      continue;
    }
    const inuseBytes = parseInt(dataMatch[2], 10) || 0;
    i++;
    let name = '';
    while (i < lines.length && lines[i].startsWith('#')) {
      const frame = lines[i];
      // #	0x123	package.Func+0x456	file.go:123
      const frameMatch = frame.match(/#\s+0x[0-9a-fA-F]+\s+(\S+)/);
      if (frameMatch && !name) {
        name = frameMatch[1];
        if (name === 'runtime.goexit' || name.startsWith('runtime.') || name.startsWith('internal/runtime/')) {
          name = '';
        }
      }
      i++;
    }
    if (!name) name = '(unknown)';
    const flatPct = totalInuseBytes > 0 ? (inuseBytes / totalInuseBytes) * 100 : 0;
    sumPct += flatPct;
    const flat = formatBytes(inuseBytes);
    rows.push({
      flat,
      flatPct,
      sumPct,
      cum: flat,
      cumPct: flatPct,
      name,
    });
  }

  return rows.sort((a, b) => b.flatPct - a.flatPct);
}

function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)}MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(2)}kB`;
  return `${n}B`;
}

/**
 * 解析 goroutine?debug=2 输出（runtime.Stack 格式）。
 * 按 "goroutine " 切分块，每块首行 "goroutine N [state]:" 或 "goroutine N [state]"，
 * 后续为栈帧（可能带前导空白或 tab）。
 */
export function parseGoroutineText(text: string): GoroutineEntry[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  const blocks = normalized.split(/\n(?=goroutine \d+)/).filter(Boolean);
  const entries: GoroutineEntry[] = [];
  for (const block of blocks) {
    const firstLine = block.split('\n')[0] ?? '';
    const match = firstLine.match(/^goroutine\s+(\d+)\s+\[([^\]]*)\]:?\s*$/);
    if (!match) continue;
    const id = match[1];
    const state = match[2].trim() || 'unknown';
    const rest = block.slice(firstLine.length).trim();
    const stack = rest ? rest.split('\n').map((s) => s.trim()).filter(Boolean) : [];
    const topFrame = stack[0] ?? '—';
    entries.push({ id, state, topFrame, stack });
  }
  return entries;
}

/** 按 state 聚合 goroutine 数量 */
export function groupGoroutinesByState(entries: GoroutineEntry[]): { state: string; count: number }[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    map.set(e.state, (map.get(e.state) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count);
}
