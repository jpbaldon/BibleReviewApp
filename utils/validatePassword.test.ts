import {
  isValidPassword,
  validatePassword,
  MIN_PASSWORD_LENGTH,
} from './validatePassword';

describe('validatePassword', () => {
  it('requires a password', () => {
    expect(validatePassword('')).toBe('Password is required.');
  });

  it('requires minimum length', () => {
    expect(validatePassword('Ab1')).toBe(
      `Password should be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
    expect(validatePassword('Abcde12')).toBe(
      `Password should be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  });

  it('requires lowercase, uppercase, and a number', () => {
    expect(validatePassword('ABCDEFG1')).toBe(
      'Password must include a lowercase letter.',
    );
    expect(validatePassword('abcdefg1')).toBe(
      'Password must include an uppercase letter.',
    );
    expect(validatePassword('Abcdefgh')).toBe(
      'Password must include a number.',
    );
  });

  it('accepts a strong enough password', () => {
    expect(validatePassword('Abcdefg1')).toBe('');
    expect(isValidPassword('Passw0rd')).toBe(true);
  });
});
