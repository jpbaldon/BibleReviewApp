import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

/**
 * Redirect target for password-reset (and other auth) emails.
 * Expo Go → exp://<lan-ip>:8081/--/reset-password  (custom schemes do NOT open Expo Go)
 * Dev/prod build → biblereviewapp://reset-password
 */
export function getPasswordResetRedirectUrl(): string {
  // Expo Go cannot open biblereviewapp:// — force the exp:// deep link.
  if (Constants.appOwnership === 'expo') {
    const hostUri =
      Constants.expoConfig?.hostUri ??
      Constants.linkingUri?.replace(/^exp:\/\//, '').replace(/\/--\/.*$/, '');
    if (hostUri) {
      return `exp://${hostUri}/--/reset-password`;
    }
  }

  return Linking.createURL('reset-password');
}

/** Parse query + hash params from a Supabase auth redirect / deep link. */
export function parseAuthUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};

  const parsed = Linking.parse(url);
  if (parsed.queryParams) {
    for (const [key, value] of Object.entries(parsed.queryParams)) {
      if (typeof value === 'string') {
        params[key] = value.trim();
      } else if (Array.isArray(value) && typeof value[0] === 'string') {
        params[key] = value[0].trim();
      }
    }
  }

  const hashIndex = url.indexOf('#');
  if (hashIndex >= 0) {
    const hash = url.slice(hashIndex + 1);
    // Some clients append another ?query after the hash; strip it.
    const hashOnly = hash.split('?')[0];
    for (const part of hashOnly.split('&')) {
      const [rawKey, rawValue] = part.split('=');
      if (rawKey && rawValue != null) {
        params[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue).trim();
      }
    }
  }

  return params;
}

export function isPasswordRecoveryUrl(url: string, params: Record<string, string>): boolean {
  return (
    params.type === 'recovery' ||
    url.includes('reset-password') ||
    url.includes('type=recovery')
  );
}
