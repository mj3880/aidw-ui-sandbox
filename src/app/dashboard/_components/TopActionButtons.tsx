'use client';

import Link from 'next/link';
import { GitBranch, FileText, ShoppingCart, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionDef {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  /** アクセント強調 (FAX確認のみ) */
  accent?: boolean;
  /** 表示用メタ情報 */
  caption?: string;
}

const ACTIONS: ActionDef[] = [
  { id: 'sort', label: '振分確認', href: '#', icon: GitBranch, enabled: false, caption: '準備中' },
  { id: 'fax', label: 'FAX確認', href: '/fax', icon: FileText, enabled: true, accent: true },
  { id: 'order', label: '発注確認', href: '#', icon: ShoppingCart, enabled: false, caption: '準備中' },
  { id: 'master', label: 'マスタ管理', href: '#', icon: Database, enabled: false, caption: '準備中' },
];

export function TopActionButtons() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
      }}
    >
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        const inner = (
          <div
            className={cn('card')}
            style={{
              padding: '22px 20px',
              background: a.accent ? 'var(--accent)' : 'var(--bg-elev)',
              color: a.accent ? '#fff' : 'var(--text)',
              borderColor: a.accent ? 'var(--accent)' : 'var(--border)',
              cursor: a.enabled ? 'pointer' : 'not-allowed',
              opacity: a.enabled ? 1 : 0.6,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: a.accent ? 'rgba(255,255,255,0.18)' : 'var(--bg-muted)',
                color: a.accent ? '#fff' : 'var(--text-muted)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Icon className="size-[18px]" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
                {a.label}
              </div>
              <div
                style={{
                  fontSize: 12,
                  marginTop: 4,
                  opacity: a.accent ? 0.9 : 0.65,
                  minHeight: 18,
                }}
              >
                {a.caption ?? '\u00A0'}
              </div>
            </div>
          </div>
        );
        if (a.enabled) {
          return (
            <Link key={a.id} href={a.href} style={{ textDecoration: 'none' }}>
              {inner}
            </Link>
          );
        }
        return (
          <button
            key={a.id}
            type="button"
            disabled
            aria-disabled="true"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              textAlign: 'left',
              cursor: 'not-allowed',
            }}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}
