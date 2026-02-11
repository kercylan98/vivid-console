import {
  Activity,
  Cpu,
  Layers,
  Zap,
  Inbox,
  Clock,
  AlertCircle,
  HardDrive,
} from 'lucide-react';

const METRICS = [
  { key: 'actors', label: 'Actor 数量', value: '—', icon: Layers },
  { key: 'throughput', label: '消息吞吐', value: '—', unit: '条/秒', icon: Zap },
  { key: 'nodes', label: '节点数', value: '—', icon: Cpu },
  { key: 'status', label: '运行状态', value: '就绪', icon: Activity },
  { key: 'mailbox', label: '邮箱待处理', value: '—', icon: Inbox },
  { key: 'uptime', label: '运行时长', value: '—', icon: Clock },
  { key: 'deathLetter', label: 'Death Letter', value: '—', icon: AlertCircle },
  { key: 'memory', label: '内存占用', value: '—', icon: HardDrive },
] as const;

const SYSTEM_FIELDS = [
  { label: '系统名称', value: '—' },
  { label: 'Vivid 版本', value: '—' },
  { label: '节点 ID', value: '—', mono: true },
  { label: 'Remoting 地址', value: '—', mono: true },
  { label: '启动时间', value: '—' },
];

const SCHEDULER_FIELDS = [
  { label: '调度器类型', value: '—' },
  { label: '工作协程数', value: '—' },
  { label: '活跃任务数', value: '—' },
  { label: '队列深度', value: '—' },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
      <span className="w-0.5 h-4 rounded-full bg-[var(--vivid-gold)]" />
      {children}
    </h2>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">仪表盘</h1>
        <p className="mt-1 text-sm text-muted-foreground">ActorSystem 运行状态与关键指标</p>
      </header>

      {/* 指标带：单条横栏，无独立卡片 */}
      <section
        className="rounded-lg border border-[var(--vivid-gold-muted)]/30 bg-muted/20 py-4 px-4"
        aria-label="关键指标"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-0">
          {METRICS.map((m, i) => {
            const Icon = m.icon;
            const isLast = i === METRICS.length - 1;
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
                  className="mt-1 text-lg font-semibold tabular-nums"
                  style={{ color: 'var(--vivid-gold-soft)' }}
                >
                  {m.value}
                  {m.unit && m.value !== '—' && (
                    <span className="text-xs font-normal text-muted-foreground ml-0.5">{m.unit}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 系统信息 + 调度器：两列键值，无卡片 */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionTitle>系统信息</SectionTitle>
          <div className="rounded-lg border border-border/60 bg-background overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {SYSTEM_FIELDS.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-border/50 ${i < SYSTEM_FIELDS.length - 1 ? 'border-b' : ''}`}
                  >
                    <td className="py-2.5 px-4 text-muted-foreground w-[140px]">{row.label}</td>
                    <td className={`py-2.5 px-4 ${row.mono ? 'font-mono text-xs' : ''}`}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <SectionTitle>调度器概览</SectionTitle>
          <div className="rounded-lg border border-border/60 bg-background overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {SCHEDULER_FIELDS.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-border/50 ${i < SCHEDULER_FIELDS.length - 1 ? 'border-b' : ''}`}
                  >
                    <td className="py-2.5 px-4 text-muted-foreground w-[140px]">{row.label}</td>
                    <td className="py-2.5 px-4">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 集群节点：标题 + 表格为主 */}
      <section>
        <SectionTitle>集群节点</SectionTitle>
        <p className="text-xs text-muted-foreground mb-3">集群成员及状态，待对接后展示真实数据</p>
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
                <td className="py-2.5 px-4 font-mono text-xs">—</td>
                <td className="py-2.5 px-4 font-mono text-xs text-muted-foreground">—</td>
                <td className="py-2.5 px-4">
                  <span
                    className="inline-flex items-center rounded border border-[var(--vivid-gold-muted)]/50 bg-[var(--vivid-gold-subtle)] px-2 py-0.5 text-xs"
                    style={{ color: 'var(--vivid-gold-soft)' }}
                  >
                    占位
                  </span>
                </td>
                <td className="py-2.5 px-4 text-muted-foreground">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 底部提示：单行，无卡片 */}
      <p className="text-xs text-muted-foreground flex items-center gap-2 pt-2 border-t border-border/50">
        <span className="w-0.5 h-3 rounded-full bg-[var(--vivid-gold-muted)]" />
        登录页填写的连接地址已保存在顶栏；点击「退出」返回登录页。当前为占位数据，对接 API 后将展示真实指标。
      </p>
    </div>
  );
}
