import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * Format an ISO timestamp as "N分前" / "N時間前" relative to now.
 */
export function formatElapsed(iso: string, now: Date = new Date()): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return formatDistanceToNow(d, { locale: ja, addSuffix: false }) + '前';
  } catch {
    return '-';
  }
}

/**
 * Format an ISO timestamp as YYYY/MM/DD HH:mm.
 */
export function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
  } catch {
    return '-';
  }
}
