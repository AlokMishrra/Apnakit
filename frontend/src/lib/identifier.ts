/**
 * Detect whether an input string is an email or phone number,
 * and normalize it accordingly.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone: starts with optional +, contains 7-15 digits, allows spaces/dashes
const PHONE_REGEX = /^\+?[\d\s\-()]{7,20}$/;

export type IdentifierType = "email" | "phone" | "unknown";

export interface ParsedIdentifier {
  type: IdentifierType;
  email?: string;
  phone?: string;
  raw: string;
}

export function detectIdentifierType(input: string): IdentifierType {
  const trimmed = (input || "").trim();
  if (!trimmed) return "unknown";
  if (EMAIL_REGEX.test(trimmed)) return "email";
  // Strip common separators and check if remaining is 7-15 digits
  const digitsOnly = trimmed.replace(/[\s\-()]/g, "");
  if (/^\+?\d{7,15}$/.test(digitsOnly) && PHONE_REGEX.test(trimmed)) {
    return "phone";
  }
  // Pure digit string of 7-15 digits = phone
  if (/^\d{7,15}$/.test(trimmed)) return "phone";
  return "unknown";
}

export function parseIdentifier(input: string): ParsedIdentifier {
  const raw = (input || "").trim();
  const type = detectIdentifierType(raw);
  if (type === "email") {
    return { type, email: raw.toLowerCase(), raw };
  }
  if (type === "phone") {
    // Normalize: keep + if present, strip spaces/dashes/parens
    let phone = raw.replace(/[\s\-()]/g, "");
    if (!phone.startsWith("+")) {
      // Indian default — if 10 digits, prepend +91
      if (/^\d{10}$/.test(phone)) {
        phone = `+91${phone}`;
      }
    }
    return { type, phone, raw };
  }
  return { type: "unknown", raw };
}

/**
 * Quick check: is the input a valid email?
 */
export function isEmail(input: string): boolean {
  return detectIdentifierType(input) === "email";
}

/**
 * Quick check: is the input a valid phone?
 */
export function isPhone(input: string): boolean {
  return detectIdentifierType(input) === "phone";
}

/**
 * Mask an identifier for display (e.g. for OTP sent confirmation)
 * j***@example.com  or  +91******7890
 */
export function maskIdentifier(input: string): string {
  const parsed = parseIdentifier(input);
  if (parsed.type === "email" && parsed.email) {
    const [user, domain] = parsed.email.split("@");
    if (user.length <= 2) return `${user[0] || ""}***@${domain}`;
    return `${user[0]}${"*".repeat(Math.max(2, user.length - 2))}${user[user.length - 1]}@${domain}`;
  }
  if (parsed.type === "phone" && parsed.phone) {
    const digits = parsed.phone.replace(/\D/g, "");
    if (digits.length <= 4) return parsed.phone;
    return `${parsed.phone.slice(0, 3)}${"*".repeat(Math.max(2, digits.length - 6))}${parsed.phone.slice(-2)}`;
  }
  return input;
}
