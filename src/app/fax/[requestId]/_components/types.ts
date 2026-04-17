import type { FaxRequest, LineItem } from '@/types/request';

export type StepKey = 'step1' | 'step2' | 'step3' | 'step4' | 'step5';

export type Mode = 'edit' | 'view';

/** Draft state held in memory while user is editing the request. */
export interface RequestDraft {
  customerId: string;
  deliveryLocation: string;
  lineItems: LineItem[];
}

export function toDraft(req: FaxRequest): RequestDraft {
  return {
    customerId: req.customerId,
    deliveryLocation: req.deliveryLocation,
    lineItems: req.lineItems.map((li) => ({ ...li })),
  };
}

export function applyDraft(req: FaxRequest, draft: RequestDraft): FaxRequest {
  return {
    ...req,
    customerId: draft.customerId,
    deliveryLocation: draft.deliveryLocation,
    lineItems: draft.lineItems,
  };
}

export interface DraftDiff {
  field: string;
  before: string;
  after: string;
}

export function diffRequest(original: FaxRequest, draft: RequestDraft): DraftDiff[] {
  const out: DraftDiff[] = [];
  if (original.customerId !== draft.customerId) {
    out.push({ field: '取引先', before: original.customerId, after: draft.customerId });
  }
  if (original.deliveryLocation !== draft.deliveryLocation) {
    out.push({
      field: '納品先',
      before: original.deliveryLocation,
      after: draft.deliveryLocation,
    });
  }
  for (let i = 0; i < draft.lineItems.length; i++) {
    const a = original.lineItems[i];
    const b = draft.lineItems[i];
    if (!a) continue;
    if (a.productCode !== b.productCode) {
      out.push({
        field: `明細${i + 1} 商品コード`,
        before: a.productCode,
        after: b.productCode,
      });
    }
    if (a.quantity !== b.quantity) {
      out.push({
        field: `明細${i + 1} 個数`,
        before: String(a.quantity),
        after: String(b.quantity),
      });
    }
    if (a.unitPrice !== b.unitPrice) {
      out.push({
        field: `明細${i + 1} 単価`,
        before: String(a.unitPrice),
        after: String(b.unitPrice),
      });
    }
  }
  return out;
}
