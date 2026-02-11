import { DashboardShell } from '@/components/dashboard-shell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '仪表盘 — Vivid Console',
  description: 'Vivid ActorSystem 控制台仪表盘',
};

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DashboardShell>{children}</DashboardShell>;
}
