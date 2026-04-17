/**
 * Normalize a product code string to 7-digit zero-padded form.
 * Strips non-digits then pads.
 */
export function normalizeProductCode(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const digits = String(input).replace(/\D/g, '');
  if (digits.length === 0) return '';
  return digits.padStart(7, '0').slice(-7);
}
