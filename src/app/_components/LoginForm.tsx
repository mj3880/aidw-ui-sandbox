'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { toast } from 'sonner';

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: user@example.com"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="任意の値で構いません"
        />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'ログイン中...' : 'ログイン'}
      </button>
      <p className="text-xs text-slate-400 text-center">Mock認証のため任意の値で成立します</p>
    </form>
  );
}
