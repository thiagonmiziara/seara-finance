import type { CardBrand } from '@/types';

/**
 * Detects the card brand from the card number digits.
 * Returns undefined if no brand can be determined.
 * Detection happens from the first digits — no need for the full number.
 */
export function detectCardBrand(digits: string): CardBrand | undefined {
  if (!digits) return undefined;

  // Amex: starts with 34 or 37
  if (/^3[47]/.test(digits)) return 'amex';

  // Diners: starts with 300-305, 36, or 38
  if (/^3(?:0[0-5]|[68])/.test(digits)) return 'diners';

  // Discover: starts with 6011, 622126-622925, 644-649, or 65
  if (/^6(?:011|5\d{0,2})|^64[4-9]/.test(digits)) return 'discover';

  // Elo: specific BIN ranges used in Brazil
  if (
    /^(636368|636297|504175|438935|40117[8-9]|45763[1-2]|457393|431274|50990[0-2]|5099[3-4]|5098[7-9]|5090[4-7]|5090[0-3]|509[1-9]|65003[1-3]|6500[3-4]|6504[0-8]|6505[0-3]|6505[8-9]|6507[0-3]|6507[5-9]|6516[5-7]|6550[0-1]|6550[2-5]|655[4-5])/.test(
      digits,
    )
  )
    return 'elo';

  // Hipercard: starts with 606282 or 637095
  if (/^(606282|637095)/.test(digits)) return 'hipercard';

  // Mastercard: starts with 51-55 or 2221-2720
  if (/^5[1-5]/.test(digits)) return 'mastercard';
  if (/^2(?:2[2-9][1-9]|[3-6]\d{2}|7[01]\d|720)/.test(digits))
    return 'mastercard';

  // Visa: starts with 4
  if (/^4/.test(digits)) return 'visa';

  return undefined;
}

/**
 * Formats raw digits into a display string grouped by 4.
 * Amex uses 4-6-5 grouping; all others use 4-4-4-4.
 */
export function formatCardNumber(digits: string): string {
  const isAmex = /^3[47]/.test(digits);
  if (isAmex) {
    return digits
      .slice(0, 15)
      .replace(/^(\d{0,4})(\d{0,6})(\d{0,5})$/, (_, a, b, c) =>
        [a, b, c].filter(Boolean).join(' '),
      );
  }
  return digits.slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** Maximum digit count for the given brand (or default 16). */
export function maxCardDigits(brand: CardBrand | undefined): number {
  return brand === 'amex' ? 15 : brand === 'diners' ? 14 : 16;
}
