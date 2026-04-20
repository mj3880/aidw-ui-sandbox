'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/store';
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  ShoppingCart,
  Database,
  Settings,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
}

const BUSINESS_ITEMS: NavItem[] = [
  { label: 'ダッシュボード', href: '/dashboard', icon: LayoutDashboard, enabled: true },
  { label: '振分確認', href: '#', icon: GitBranch, enabled: false },
  { label: 'FAX確認', href: '/fax', icon: FileText, enabled: true },
  { label: '発注確認', href: '#', icon: ShoppingCart, enabled: false },
  { label: 'マスタ管理', href: '#', icon: Database, enabled: false },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useStore((s) => s.auth);

  const displayName = auth?.email?.split('@')[0] ?? 'guest';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">AI</div>
        <div>
          <div className="name">AIDW Console</div>
          <div className="sub">HITL Confirmation</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-section">業務</div>
        {BUSINESS_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.enabled && pathname?.startsWith(item.href);
          if (!item.enabled) {
            return (
              <button
                key={item.label}
                type="button"
                className="sidebar-item disabled"
                disabled
                aria-disabled="true"
              >
                <span className="icon">
                  <Icon />
                </span>
                <span>{item.label}</span>
              </button>
            );
          }
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={(e) => {
                if (item.label === 'ダッシュボード' && pathname === '/dashboard') {
                  e.preventDefault();
                  router.refresh();
                }
              }}
              className={cn('sidebar-item', active && 'active')}
            >
              <span className="icon">
                <Icon />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="sidebar-section">その他</div>
        <button type="button" className="sidebar-item disabled" disabled aria-disabled="true">
          <span className="icon">
            <Settings />
          </span>
          <span>設定</span>
        </button>
      </nav>
      <div className="sidebar-footer">
        <div className="avatar">{initial}</div>
        <div className="who">
          <div className="n">{displayName}</div>
          <div className="t">{auth?.user.teamId ?? '-'}</div>
        </div>
      </div>
    </aside>
  );
}
