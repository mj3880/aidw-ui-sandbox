/**
 * Normalize text for partial-match search:
 * - Full-width ASCII -> half-width
 * - Hiragana -> Katakana (so kana variants match)
 * - Lowercase
 * - Strip whitespace
 */
export function normalizeForSearch(input: string): string {
  if (!input) return '';

  // Full-width ASCII -> half-width
  let s = input.replace(/[\uff01-\uff5e]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
  );
  // Full-width space
  s = s.replace(/\u3000/g, ' ');

  // Hiragana -> Katakana
  s = s.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60),
  );

  return s.toLowerCase().trim();
}

export function matchesSearch(haystack: string, needle: string): boolean {
  if (!needle) return true;
  return normalizeForSearch(haystack).includes(normalizeForSearch(needle));
}
