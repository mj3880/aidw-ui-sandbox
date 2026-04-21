// client-a: 汎用飲食卸業態想定のダミーマスタ

export interface ClientACustomer {
  id: string; // ID一致用
  name: string;
  tel: string;
}

export interface ClientADeliveryLocation {
  code: string;
  name: string;
}

export interface ClientAProduct {
  sku: string; // 商品コード（英数字）
  name: string;
  category: string;
}

export interface ClientAPriceRule {
  sku: string;
  basePrice: number; // 円
  note?: string;
}

export const clientACustomers: ClientACustomer[] = [
  { id: 'CA-C-001', name: '株式会社ミネルヴァ商店', tel: '03-1111-1111' },
  { id: 'CA-C-002', name: '有限会社アルテミス食品', tel: '03-2222-2222' },
  { id: 'CA-C-003', name: 'ヘルメス物産株式会社', tel: '03-3333-3333' },
  { id: 'CA-C-004', name: 'アポロン青果', tel: '06-4444-4444' },
  { id: 'CA-C-005', name: 'ゼウス食品流通', tel: '06-5555-5555' },
  { id: 'CA-C-006', name: 'ポセイドン水産', tel: '045-666-6666' },
  // multi 用に同名近接エントリを意図的に用意
  { id: 'CA-C-007', name: 'デメテル青果', tel: '011-777-7777' },
  { id: 'CA-C-008', name: 'デメテル青果 東日本', tel: '022-777-7777' },
];

export const clientADeliveryLocations: ClientADeliveryLocation[] = [
  { code: 'LOC-HQ', name: '本社倉庫' },
  { code: 'LOC-TKY', name: '東京物流センター' },
  { code: 'LOC-OSK', name: '大阪物流センター' },
  { code: 'LOC-NGY', name: '名古屋DC' },
  { code: 'LOC-FKK', name: '福岡DC' },
];

export const clientAProducts: ClientAProduct[] = [
  { sku: 'A-TOM-01', name: 'トマト L', category: 'vegetable' },
  { sku: 'A-CUC-01', name: 'きゅうり', category: 'vegetable' },
  { sku: 'A-LET-01', name: 'レタス', category: 'vegetable' },
  { sku: 'A-APL-01', name: 'りんご 赤', category: 'fruit' },
  { sku: 'A-BAN-01', name: 'バナナ', category: 'fruit' },
  { sku: 'A-ORG-01', name: 'オレンジ', category: 'fruit' },
];

export const clientAPriceRules: ClientAPriceRule[] = [
  { sku: 'A-TOM-01', basePrice: 180 },
  { sku: 'A-CUC-01', basePrice: 120 },
  { sku: 'A-LET-01', basePrice: 160 },
  { sku: 'A-APL-01', basePrice: 220 },
  { sku: 'A-BAN-01', basePrice: 98 },
  { sku: 'A-ORG-01', basePrice: 140 },
];
