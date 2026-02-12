'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useConnectionStatus } from '@/hooks/use-connection-status';

const navItems = [
  { href: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { href: '/dashboard/performance', label: '性能分析', icon: BarChart3 },
];

function StatusDot({ status }: { status: 'idle' | 'loading' | 'ok' | 'error' }) {
  const dotClass =
    status === 'ok'
      ? 'status-dot status-dot--connected'
      : status === 'loading'
        ? 'status-dot status-dot--loading'
        : status === 'error'
          ? 'status-dot status-dot--error'
          : 'status-dot status-dot--disconnected';
  return <span className={dotClass} aria-hidden />;
}

function HeaderConnectionLabel() {
  const conn = useConnectionStatus();

  if (conn.status === 'idle') {
    return (
      <div className="flex items-center gap-2.5">
        <StatusDot status="idle" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          —
        </span>
        <span className="text-muted-foreground">未配置</span>
      </div>
    );
  }
  if (conn.status === 'loading') {
    return (
      <div className="flex items-center gap-2.5">
        <StatusDot status="loading" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          —
        </span>
        <span className="truncate max-w-[220px] text-muted-foreground" title={conn.address}>
          {conn.address}
        </span>
        <span className="text-muted-foreground/80 text-xs">连接中…</span>
      </div>
    );
  }
  if (conn.status === 'error') {
    return (
      <div className="flex items-center gap-2.5">
        <StatusDot status="error" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          —
        </span>
        <span className="truncate max-w-[220px]" title={conn.message ?? conn.address}>
          {conn.address}
        </span>
        <span className="text-destructive/90 text-xs">连接异常</span>
      </div>
    );
  }
  const isCluster = conn.cluster.isClusterNode;
  return (
    <div className="flex items-center gap-2.5">
      <StatusDot status="ok" />
      <span
        className={cn(
          'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
          isCluster
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            : 'bg-zinc-500/15 text-zinc-500 dark:text-zinc-400'
        )}
      >
        {isCluster ? 'Cluster' : 'Standalone'}
      </span>
      <span
        className="truncate max-w-[240px] text-muted-foreground"
        title={conn.address}
      >
        {conn.address}
      </span>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem('vivid-console-address');
    sessionStorage.removeItem('vivid-console-username');
    router.push('/');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* 侧栏 */}
      <aside
        className="fixed left-0 top-0 z-40 flex h-full w-56 flex-col border-r border-[var(--vivid-gold-muted)]/30 bg-card"
        style={{ boxShadow: '2px 0 24px rgba(0,0,0,0.15)' }}
      >
        <div className="flex h-14 items-center gap-2 border-b border-[var(--vivid-gold-muted)]/30 px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="text-lg" style={{ color: 'var(--vivid-gold-soft)' }}>
              Vivid Console
            </span>
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--vivid-gold-subtle)] text-[var(--vivid-gold-soft)]'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 主内容区 */}
      <div className="flex flex-1 flex-col pl-56">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-[var(--vivid-gold-muted)]/30 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center gap-2 text-sm">
            <HeaderConnectionLabel />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
            退出
          </Button>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
