export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_REQUIREMENTS_HINT =
  '8+ characters, with upper, lower, and a number';

/**
 * Returns an error message for a new password, or '' when it meets requirements.
 * Used for signup and password reset — not for existing-account sign-in.
 */
export function validatePassword(value: string): string {
  if (!value) return 'Password is required.';
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password should be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (!/[a-z]/.test(value)) {
    return 'Password must include a lowercase letter.';
  }
  if (!/[A-Z]/.test(value)) {
    return 'Password must include an uppercase letter.';
  }
  if (!/[0-9]/.test(value)) {
    return 'Password must include a number.';
  }
  return '';
}

export function isValidPassword(value: string): boolean {
  return validatePassword(value) === '';
}
