// client-a: OCR後ダミーデータ ちょうど10件
// 種別内訳（customer lookup 基準）: unique 8 / multi 1 / none 1

/**
 * client-a rawShape:
 *  - customer_block: { text, telHint }
 *  - delivery: { locationName }
 *  - product_line: { sku, name, qty }
 *  - price_block: { unitPrice }
 */
export interface ClientARawOcr {
  request_id: string;
  received_at: string;
  customer_block: { text: string; telHint?: string };
  delivery: { locationName: string };
  product_line: { sku: string; name: string; qty: number };
  price_block: { unitPrice: number | null };
}

export const clientAOcrSamples: ClientARawOcr[] = [
  // 1. unique: IDが customer 名に含まれる（customer hit, location hit, product hit）
  {
    request_id: 'CA-REQ-0001',
    received_at: '2026-04-10T09:12:00+09:00',
    customer_block: { text: '株式会社ミネルヴァ商店 御中', telHint: '03-1111-1111' },
    delivery: { locationName: '東京物流センター' },
    product_line: { sku: 'A-TOM-01', name: 'トマト L', qty: 20 },
    price_block: { unitPrice: 180 },
  },
  // 2. unique
  {
    request_id: 'CA-REQ-0002',
    received_at: '2026-04-10T09:30:00+09:00',
    customer_block: { text: '有限会社アルテミス食品 御中' },
    delivery: { locationName: '大阪物流センター' },
    product_line: { sku: 'A-CUC-01', name: 'きゅうり', qty: 50 },
    price_block: { unitPrice: 120 },
  },
  // 3. unique
  {
    request_id: 'CA-REQ-0003',
    received_at: '2026-04-11T10:00:00+09:00',
    customer_block: { text: 'ヘルメス物産株式会社 購買部' },
    delivery: { locationName: '本社倉庫' },
    product_line: { sku: 'A-APL-01', name: 'りんご 赤', qty: 30 },
    price_block: { unitPrice: 220 },
  },
  // 4. unique
  {
    request_id: 'CA-REQ-0004',
    received_at: '2026-04-11T11:00:00+09:00',
    customer_block: { text: 'アポロン青果' },
    delivery: { locationName: '名古屋DC' },
    product_line: { sku: 'A-LET-01', name: 'レタス', qty: 15 },
    price_block: { unitPrice: 160 },
  },
  // 5. unique
  {
    request_id: 'CA-REQ-0005',
    received_at: '2026-04-12T08:45:00+09:00',
    customer_block: { text: 'ゼウス食品流通' },
    delivery: { locationName: '福岡DC' },
    product_line: { sku: 'A-BAN-01', name: 'バナナ', qty: 100 },
    price_block: { unitPrice: 98 },
  },
  // 6. unique
  {
    request_id: 'CA-REQ-0006',
    received_at: '2026-04-12T13:20:00+09:00',
    customer_block: { text: 'ポセイドン水産' },
    delivery: { locationName: '東京物流センター' },
    product_line: { sku: 'A-ORG-01', name: 'オレンジ', qty: 40 },
    price_block: { unitPrice: 140 },
  },
  // 7. unique
  {
    request_id: 'CA-REQ-0007',
    received_at: '2026-04-13T09:05:00+09:00',
    customer_block: { text: '株式会社ミネルヴァ商店' },
    delivery: { locationName: '大阪物流センター' },
    product_line: { sku: 'A-TOM-01', name: 'トマト L', qty: 25 },
    price_block: { unitPrice: 180 },
  },
  // 8. unique
  {
    request_id: 'CA-REQ-0008',
    received_at: '2026-04-13T14:50:00+09:00',
    customer_block: { text: 'アポロン青果 様' },
    delivery: { locationName: '名古屋DC' },
    product_line: { sku: 'A-CUC-01', name: 'きゅうり', qty: 60 },
    price_block: { unitPrice: 120 },
  },
  // 9. multi: 「デメテル青果」だけでは CA-C-007 / CA-C-008 の2件ヒット
  {
    request_id: 'CA-REQ-0009',
    received_at: '2026-04-14T10:15:00+09:00',
    customer_block: { text: 'デメテル青果' },
    delivery: { locationName: '本社倉庫' },
    product_line: { sku: 'A-APL-01', name: 'りんご 赤', qty: 20 },
    price_block: { unitPrice: 220 },
  },
  // 10. none: customer 文字列がマスタに一切ヒットしない
  {
    request_id: 'CA-REQ-0010',
    received_at: '2026-04-14T15:40:00+09:00',
    customer_block: { text: '謎株式会社 エクス' },
    delivery: { locationName: '福岡DC' },
    product_line: { sku: 'A-LET-01', name: 'レタス', qty: 10 },
    price_block: { unitPrice: 160 },
  },
];
