/**
 * Lightweight email format check for client-side form validation.
 * Not a full RFC 5322 parser — just catches common typos before hitting the server.
 */
const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 254) return false;
  return EMAIL_PATTERN.test(trimmed);
}

/** Returns an error message, or '' when the email is present and well-formed. */
export function validateEmail(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'Email is required.';
  if (!isValidEmail(trimmed)) return 'Enter a valid email address.';
  return '';
}
