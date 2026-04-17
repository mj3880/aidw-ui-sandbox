import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatYen(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return `¥${n.toLocaleString('ja-JP')}`;
}
