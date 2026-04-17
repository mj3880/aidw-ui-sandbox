'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FileText, GitBranch, ShoppingCart, Database, Settings } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
}

const ITEMS: NavItem[] = [
  { label: 'ダッシュボード', href: '/dashboard', icon: LayoutDashboard, enabled: true },
  { label: '振分確認', href: '#', icon: GitBranch, enabled: false },
  { label: 'FAX確認', href: '/fax', icon: FileText, enabled: true },
  { label: '発注確認', href: '#', icon: ShoppingCart, enabled: false },
  { label: 'マスタ管理', href: '#', icon: Database, enabled: false },
  { label: '設定', href: '#', icon: Settings, enabled: false },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white">
      <div className="px-4 py-6">
        <div className="text-lg font-bold text-slate-900">AIDW</div>
        <div className="text-xs text-slate-500">UI Mock</div>
      </div>
      <nav className="px-2 space-y-1">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.enabled && pathname?.startsWith(item.href);
          if (!item.enabled) {
            return (
              <button
                type="button"
                key={item.label}
                className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-400 cursor-not-allowed select-none"
                disabled
                aria-disabled="true"
              >
                <Icon className="size-4" />
                {item.label}
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
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-100',
                active ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700',
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
