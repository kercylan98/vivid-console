'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Server, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [connectionAddress, setConnectionAddress] = useState<string | null>(null);

  useEffect(() => {
    const addr = typeof window !== 'undefined' ? sessionStorage.getItem('vivid-console-address') : null;
    setConnectionAddress(addr);
  }, []);

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
        {/* 顶栏 */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-[var(--vivid-gold-muted)]/30 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Server className="size-4" style={{ color: 'var(--vivid-gold-muted)' }} />
            {connectionAddress ? (
              <span className="truncate max-w-[280px]" title={connectionAddress}>
                {connectionAddress}
              </span>
            ) : (
              <span>未连接</span>
            )}
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
