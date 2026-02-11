import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Cpu, Layers, Zap } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">仪表盘</h1>
        <p className="mt-1 text-muted-foreground">概览 ActorSystem 运行状态与关键指标</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[var(--vivid-gold-muted)]/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actor 数量</CardTitle>
            <Layers className="size-4 text-muted-foreground" style={{ color: 'var(--vivid-gold-muted)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--vivid-gold-soft)' }}>
              —
            </div>
            <p className="text-xs text-muted-foreground">当前未接入，仅展示占位</p>
          </CardContent>
        </Card>
        <Card className="border-[var(--vivid-gold-muted)]/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">消息吞吐</CardTitle>
            <Zap className="size-4 text-muted-foreground" style={{ color: 'var(--vivid-gold-muted)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--vivid-gold-soft)' }}>
              —
            </div>
            <p className="text-xs text-muted-foreground">待对接后展示</p>
          </CardContent>
        </Card>
        <Card className="border-[var(--vivid-gold-muted)]/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">节点数</CardTitle>
            <Cpu className="size-4 text-muted-foreground" style={{ color: 'var(--vivid-gold-muted)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--vivid-gold-soft)' }}>
              —
            </div>
            <p className="text-xs text-muted-foreground">集群节点数</p>
          </CardContent>
        </Card>
        <Card className="border-[var(--vivid-gold-muted)]/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">运行状态</CardTitle>
            <Activity className="size-4 text-muted-foreground" style={{ color: 'var(--vivid-gold-muted)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--vivid-gold-soft)' }}>
              就绪
            </div>
            <p className="text-xs text-muted-foreground">控制台已连接</p>
          </CardContent>
        </Card>
      </div>

      {/* 欢迎区块 */}
      <Card className="border-[var(--vivid-gold-muted)]/40">
        <CardHeader>
          <CardTitle>欢迎使用 Vivid Console</CardTitle>
          <CardDescription>
            仪表盘用于查看 ActorSystem 或集群的概览信息。当前为占位界面，后续将对接真实指标与节点数据。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>在登录页填写的 ActorSystem / 集群地址已保存，顶栏会显示当前连接地址；点击「退出」可返回登录页。</p>
        </CardContent>
      </Card>
    </div>
  );
}
