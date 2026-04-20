'use client';

import { cn } from '@/lib/utils';
import { STATUS_LABEL, type RequestStatus } from '@/types/request';

export type FilterValue = 'all' | RequestStatus;

const ITEMS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'すべて' },
  ...(Object.entries(STATUS_LABEL) as [RequestStatus, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
];

export function StatusFilter({
  value,
  onChange,
}: {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
}) {
  return (
    <div className="pills">
      {ITEMS.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={cn('pill', value === it.value && 'active')}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
