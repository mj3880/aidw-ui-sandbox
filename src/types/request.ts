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
  pending: 'badge badge-pending',
  in_progress: 'badge badge-inprogress',
  done: 'badge badge-completed',
};
