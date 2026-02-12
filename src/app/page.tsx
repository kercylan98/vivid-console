'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Server, User, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      sessionStorage.setItem('vivid-console-address', address.trim());
    }
    if (username.trim()) {
      sessionStorage.setItem('vivid-console-username', username.trim());
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* 背景渐变光晕 */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, var(--vivid-gold-subtle), transparent 60%)',
        }}
      />

      <div className="w-full max-w-md opacity-100 transition-opacity duration-500">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--vivid-gold-soft)' }}>
            Vivid Console
          </h1>
          <p className="text-muted-foreground text-sm mt-1">ActorSystem 控制台</p>
        </div>

        <Card className="border-[var(--vivid-gold-muted)]/50 shadow-[0_0_32px_rgba(212,175,55,0.08)]">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">登录</CardTitle>
            <CardDescription>
              指定 ActorSystem 或集群地址后进入控制台（用户名与密码当前仅作展示）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2 text-muted-foreground">
                  <Server className="size-4" style={{ color: 'var(--vivid-gold-muted)' }} />
                  ActorSystem / 集群地址
                </Label>
                <Input
                  id="address"
                  type="url"
                  placeholder="例如：http://localhost:15800"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="border-[var(--vivid-gold-muted)]/50 focus-visible:ring-[var(--vivid-gold-muted)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2 text-muted-foreground">
                  <User className="size-4" style={{ color: 'var(--vivid-gold-muted)' }} />
                  用户名
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-[var(--vivid-gold-muted)]/50 focus-visible:ring-[var(--vivid-gold-muted)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="size-4" style={{ color: 'var(--vivid-gold-muted)' }} />
                  密码
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-[var(--vivid-gold-muted)]/50 focus-visible:ring-[var(--vivid-gold-muted)]"
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-6 bg-[var(--vivid-gold)] text-primary-foreground hover:bg-[var(--vivid-gold-soft)] hover:opacity-90 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              >
                登录
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
