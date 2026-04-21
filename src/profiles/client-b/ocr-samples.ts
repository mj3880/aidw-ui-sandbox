// client-b: OCR後ダミーデータ ちょうど10件
// 種別内訳（customer lookup 基準）: unique 8 / multi 1 / none 1
//
// rawShape を client-a と別設計にする（抽象化層の動作検証目的）
// - ルート直下: orderNo / orderedAt
// - partner: { accountNo?, labelText }
// - ship_to: { warehouseCode }
// - item: { jan, title, units }
// - amount: { price_per_unit }

export interface ClientBRawOcr {
  orderNo: string;
  orderedAt: string;
  partner: { accountNo?: string; labelText: string };
  ship_to: { warehouseCode: string };
  item: { jan: string; title: string; units: number };
  amount: { price_per_unit: number | null };
}

export const clientBOcrSamples: ClientBRawOcr[] = [
  // 1. unique: account_no 完全一致
  {
    orderNo: 'B-ORD-0001',
    orderedAt: '2026-04-10T10:00:00+09:00',
    partner: { accountNo: '70001', labelText: 'BLUE WAVE LOGISTICS' },
    ship_to: { warehouseCode: 'WH-01' },
    item: { jan: '4901234567001', title: '清涼飲料A', units: 100 },
    amount: { price_per_unit: 98 },
  },
  // 2. unique
  {
    orderNo: 'B-ORD-0002',
    orderedAt: '2026-04-10T11:30:00+09:00',
    partner: { accountNo: '70002', labelText: 'RED SUN DISTRIBUTION' },
    ship_to: { warehouseCode: 'WH-02' },
    item: { jan: '4901234567002', title: '清涼飲料B', units: 80 },
    amount: { price_per_unit: 110 },
  },
  // 3. unique
  {
    orderNo: 'B-ORD-0003',
    orderedAt: '2026-04-11T09:00:00+09:00',
    partner: { accountNo: '70003', labelText: 'GREEN FIELD TRADING' },
    ship_to: { warehouseCode: 'WH-03' },
    item: { jan: '4901234567003', title: 'スナックA', units: 120 },
    amount: { price_per_unit: 148 },
  },
  // 4. unique
  {
    orderNo: 'B-ORD-0004',
    orderedAt: '2026-04-11T14:20:00+09:00',
    partner: { accountNo: '70004', labelText: 'WHITE CLOUD COMMERCE' },
    ship_to: { warehouseCode: 'WH-04' },
    item: { jan: '4901234567004', title: 'スナックB', units: 60 },
    amount: { price_per_unit: 168 },
  },
  // 5. unique
  {
    orderNo: 'B-ORD-0005',
    orderedAt: '2026-04-12T08:40:00+09:00',
    partner: { accountNo: '70005', labelText: 'BLACK STONE HOLDINGS' },
    ship_to: { warehouseCode: 'WH-05' },
    item: { jan: '4901234567005', title: 'インスタント麺', units: 40 },
    amount: { price_per_unit: 498 },
  },
  // 6. unique
  {
    orderNo: 'B-ORD-0006',
    orderedAt: '2026-04-12T15:10:00+09:00',
    partner: { accountNo: '70006', labelText: 'GOLDEN GATE SUPPLY' },
    ship_to: { warehouseCode: 'WH-01' },
    item: { jan: '4901234567006', title: '冷凍餃子', units: 50 },
    amount: { price_per_unit: 398 },
  },
  // 7. unique（account_no が無いが labelText ユニーク）
  {
    orderNo: 'B-ORD-0007',
    orderedAt: '2026-04-13T10:00:00+09:00',
    partner: { labelText: 'BLUE WAVE LOGISTICS' },
    ship_to: { warehouseCode: 'WH-01' },
    item: { jan: '4901234567001', title: '清涼飲料A', units: 200 },
    amount: { price_per_unit: 98 },
  },
  // 8. unique
  {
    orderNo: 'B-ORD-0008',
    orderedAt: '2026-04-13T13:55:00+09:00',
    partner: { accountNo: '70002', labelText: 'RED SUN DISTRIBUTION' },
    ship_to: { warehouseCode: 'WH-02' },
    item: { jan: '4901234567005', title: 'インスタント麺', units: 25 },
    amount: { price_per_unit: 498 },
  },
  // 9. multi: account_no なし / labelText "SILVER LINE EXPRESS" で 70007 / 70008 の2件
  {
    orderNo: 'B-ORD-0009',
    orderedAt: '2026-04-14T09:20:00+09:00',
    partner: { labelText: 'SILVER LINE EXPRESS' },
    ship_to: { warehouseCode: 'WH-03' },
    item: { jan: '4901234567003', title: 'スナックA', units: 90 },
    amount: { price_per_unit: 148 },
  },
  // 10. none: マスタに存在しない account_no + labelText 一致なし
  {
    orderNo: 'B-ORD-0010',
    orderedAt: '2026-04-14T16:45:00+09:00',
    partner: { accountNo: '79999', labelText: 'UNKNOWN PARTNER CO' },
    ship_to: { warehouseCode: 'WH-04' },
    item: { jan: '4901234567006', title: '冷凍餃子', units: 30 },
    amount: { price_per_unit: 398 },
  },
];
