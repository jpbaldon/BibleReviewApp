import { isValidEmail, validateEmail } from './validateEmail';

describe('isValidEmail', () => {
  it('accepts common valid addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('first.last+tag@mail.co.uk')).toBe(true);
    expect(isValidEmail('  user@example.com  ')).toBe(true);
  });

  it('rejects empty and malformed values', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('   ')).toBe(false);
    expect(isValidEmail('user')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('user@example')).toBe(false);
    expect(isValidEmail('user example@example.com')).toBe(false);
  });
});

describe('validateEmail', () => {
  it('returns required message when empty', () => {
    expect(validateEmail('')).toBe('Email is required.');
    expect(validateEmail('  ')).toBe('Email is required.');
  });

  it('returns format message for invalid emails', () => {
    expect(validateEmail('not-an-email')).toBe('Enter a valid email address.');
  });

  it('returns empty string for valid emails', () => {
    expect(validateEmail('user@example.com')).toBe('');
  });
});
