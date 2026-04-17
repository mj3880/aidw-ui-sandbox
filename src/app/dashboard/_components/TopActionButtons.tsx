'use client';

import Link from 'next/link';
import { GitBranch, FileText, ShoppingCart, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionDef {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
}

const ACTIONS: ActionDef[] = [
  { label: '振分確認', href: '#', icon: GitBranch, enabled: false },
  { label: 'FAX確認', href: '/fax', icon: FileText, enabled: true },
  { label: '発注確認', href: '#', icon: ShoppingCart, enabled: false },
  { label: 'マスタ管理', href: '#', icon: Database, enabled: false },
];

export function TopActionButtons() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        const inner = (
          <div
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-lg border bg-white p-6 text-center shadow-sm transition',
              a.enabled
                ? 'border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
                : 'border-slate-100 text-slate-400 cursor-not-allowed',
            )}
          >
            <Icon className={cn('size-8', a.enabled ? 'text-blue-600' : 'text-slate-300')} />
            <div className="text-sm font-semibold">{a.label}</div>
          </div>
        );
        if (a.enabled) {
          return (
            <Link key={a.label} href={a.href}>
              {inner}
            </Link>
          );
        }
        return (
          <button
            key={a.label}
            type="button"
            disabled
            className="block text-left"
            aria-disabled="true"
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}
