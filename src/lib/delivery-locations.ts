export const DELIVERY_LOCATIONS = [
  '本店',
  '東京支店',
  '大阪支店',
  '名古屋支店',
  '横浜支店',
  '神戸支店',
  '福岡支店',
  '札幌支店',
  '仙台支店',
  '広島支店',
  '京都営業所',
  '千葉営業所',
  '埼玉営業所',
  '川崎営業所',
  '新宿営業所',
  '渋谷営業所',
  '品川営業所',
  '池袋営業所',
  '豊洲市場店',
  '築地店',
  '大田市場店',
  '秋葉原店',
  '梅田店',
  '難波店',
  '天神店',
] as const;

const LOCATIONS_BY_LENGTH_DESC = [...DELIVERY_LOCATIONS].sort((a, b) => b.length - a.length);

/**
 * OCR抽出の納品先文字列からマスタに存在する支店/営業所名を抽出する。
 * 例: "株式会社テストサンプルガンマ 本店" → "本店"
 * マスタに一致する末尾が無ければ原文のまま返す。
 */
export function normalizeDeliveryLocation(raw: string): string {
  if (!raw) return raw;
  for (const loc of LOCATIONS_BY_LENGTH_DESC) {
    if (raw.endsWith(loc)) return loc;
  }
  return raw;
}
