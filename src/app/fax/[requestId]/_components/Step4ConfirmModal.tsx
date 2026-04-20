'use client';

import { Check, X } from 'lucide-react';
import type { DraftDiff } from './types';

interface Props {
  diffs: DraftDiff[];
  onCancel: () => void;
  onApprove: () => void;
}

export function Step4ConfirmModal({ diffs, onCancel, onApprove }: Props) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-start justify-between">
            <div>
              <h2>変更内容の確認</h2>
              <div className="sub">承認前に変更内容を確認してください</div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost btn-sm"
              aria-label="閉じる"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <div className="modal-body">
          {diffs.length === 0 ? (
            <div
              style={{
                padding: 20,
                textAlign: 'center',
                background: 'var(--bg-muted)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--text-muted)',
              }}
            >
              変更項目はありません（OCR結果のまま承認）
            </div>
          ) : (
            <table className="t">
              <thead>
                <tr>
                  <th>項目</th>
                  <th>変更前</th>
                  <th>変更後</th>
                </tr>
              </thead>
              <tbody>
                {diffs.map((d, i) => (
                  <tr key={i}>
                    <td className="font-medium">{d.field}</td>
                    <td style={{ color: 'var(--text-subtle)', textDecoration: 'line-through' }}>
                      {d.before}
                    </td>
                    <td style={{ color: 'var(--accent-text)', fontWeight: 500 }}>{d.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            キャンセル
          </button>
          <button type="button" onClick={onApprove} className="btn btn-primary">
            <Check className="size-3.5" /> 承認
          </button>
        </div>
      </div>
    </div>
  );
}
