import { CouponType } from '@prisma/client';

export const PARTNER_CODE_MIN = 4;
export const PARTNER_CODE_MAX = 20;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Normalises a referral code: trims, uppercases, allows A-Z 0-9 and '-'. */
export function normalizePartnerCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidPartnerCode(code: string): boolean {
  return (
    code.length >= PARTNER_CODE_MIN &&
    code.length <= PARTNER_CODE_MAX &&
    /^[A-Z0-9-]+$/.test(code)
  );
}

/** Discount the customer receives on `subtotal` for this partner's code. */
export function customerDiscountFor(
  partner: { customerDiscountType: CouponType; customerDiscountValue: unknown },
  subtotal: number,
): number {
  const value = Number(partner.customerDiscountValue);
  if (value <= 0 || subtotal <= 0) return 0;
  if (partner.customerDiscountType === 'PERCENTAGE') {
    return round2(Math.min((subtotal * value) / 100, subtotal));
  }
  return round2(Math.min(value, subtotal));
}

/**
 * Partner commission = commissionRate% of the net merchandise value the partner
 * generated (subtotal after the partner's customer discount).
 */
export function commissionFor(
  partner: { commissionRate: unknown },
  subtotal: number,
  partnerDiscount: number,
): { rate: number; amount: number } {
  const rate = Number(partner.commissionRate);
  const base = Math.max(subtotal - partnerDiscount, 0);
  return { rate, amount: round2((base * rate) / 100) };
}
