'use client';

import type { DraftDiff } from './types';
import { X } from 'lucide-react';

interface Props {
  diffs: DraftDiff[];
  onCancel: () => void;
  onApprove: () => void;
}

export function Step4ConfirmModal({ diffs, onCancel, onApprove }: Props) {
  return (
    <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-base font-semibold">変更内容の確認</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
            aria-label="閉じる"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="px-4 py-4 max-h-80 overflow-y-auto">
          {diffs.length === 0 ? (
            <p className="text-sm text-slate-500">変更はありません。そのまま承認できます。</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-2 py-1.5">項目</th>
                  <th className="text-left px-2 py-1.5">変更前</th>
                  <th className="text-left px-2 py-1.5">変更後</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {diffs.map((d, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1.5 text-slate-700">{d.field}</td>
                    <td className="px-2 py-1.5 text-slate-500">{d.before}</td>
                    <td className="px-2 py-1.5 font-semibold text-slate-900">{d.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700"
          >
            承認
          </button>
        </div>
      </div>
    </div>
  );
}
