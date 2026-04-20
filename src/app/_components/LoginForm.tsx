'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { toast } from 'sonner';
import { ArrowRight, Info } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const login = useStore((s) => s.login);
  const loadAll = useStore((s) => s.loadAll);
  const loaded = useStore((s) => s.loaded);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.info('LoginForm.handleSubmit: start');
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'メールアドレスを入力してください';
    if (!password.trim()) next.password = 'パスワードを入力してください';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      login(email.trim());
      if (!loaded) {
        await loadAll();
      }
      toast.success('ログインしました');
      router.push('/dashboard');
    } catch (e) {
      console.error('LoginForm.handleSubmit: failed', e);
      toast.error('ログインに失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360 }}>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          margin: '0 0 6px',
        }}
      >
        ログイン
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '0 0 28px' }}>
        メールアドレスとパスワードを入力してください
      </p>

      <div className="mb-4">
        <label className="form-label">メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="you@example.com"
          autoFocus
        />
        {errors.email && <div className="form-error">{errors.email}</div>}
      </div>
      <div className="mb-6">
        <label className="form-label">パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="••••••••"
        />
        {errors.password && <div className="form-error">{errors.password}</div>}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary btn-lg"
        style={{ width: '100%' }}
      >
        {submitting ? 'ログイン中...' : 'ログイン'} <ArrowRight className="size-4" />
      </button>
      <p
        className="flex items-center justify-center gap-1"
        style={{
          marginTop: 20,
          fontSize: 12,
          color: 'var(--text-subtle)',
        }}
      >
        <Info className="size-3" /> Mock認証：任意のメール/パスワードでログインできます
      </p>
    </form>
  );
}
