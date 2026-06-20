/**
 * Dominican Republic phone number utilities
 * Valid prefixes: +1-809, +1-829, +1-849
 */

export function normalizePhoneRD(phone: string): string {
  // Remove everything except digits
  const digits = phone.replace(/\D/g, '');

  // If starts with 1 and is 11 digits (1-809-xxx-xxxx)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // If 10 digits (809-xxx-xxxx), add country code
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If already has +1 prefix
  if (digits.length === 11) {
    return `+${digits}`;
  }

  return `+1${digits}`;
}

export function isValidPhoneRD(phone: string): boolean {
  const normalized = normalizePhoneRD(phone);
  return /^\+1(809|829|849)\d{7}$/.test(normalized);
}
