export type RequestStatus = 'pending' | 'in_progress' | 'done';

export interface LineItem {
  lineItemId: string;
  productCode: string; // 7-digit zero-padded
  productName: string;
  quantity: number;
  unitPrice: number;
  isLowConfidence: boolean;
}

export interface FaxRequest {
  requestId: string; // cg_XXXX
  pdfFile: string; // cg_XXXX.pdf
  customerId: string;
  deliveryLocation: string;
  receivedAt: string; // ISO8601
  orderDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  arrivalDate: string; // YYYY-MM-DD 拠点着日（deliveryDateの1〜2日前）
  status: RequestStatus;
  assigneeUserId: string | null;
  assigneeTeamId: string | null;
  lineItems: LineItem[];
}

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: '未対応',
  in_progress: '対応中',
  done: '対応済み',
};

export const STATUS_BADGE_CLASS: Record<RequestStatus, string> = {
  pending: 'bg-slate-200 text-slate-700',
  in_progress: 'bg-amber-100 text-amber-800',
  done: 'bg-emerald-100 text-emerald-800',
};
