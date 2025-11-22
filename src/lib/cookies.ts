/**
 * Cookie management utilities for Firebase authentication
 * Handles production vs development environment differences
 */

export interface CookieOptions {
  path?: string;
  maxAge?: number;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  domain?: string;
}

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

const isLocalhost = () => {
  if (!isBrowser) return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
};

const getDefaultCookieOptions = (): CookieOptions => {
  if (!isBrowser) return {};

  const secureContext = window.location.protocol === 'https:';
  const sameSite: CookieOptions['sameSite'] = isLocalhost() ? 'lax' : 'strict';

  return {
    path: '/',
    maxAge: 3600, // 1 hour
    secure: secureContext,
    sameSite,
  };
};

const normalizeSameSite = (value?: CookieOptions['sameSite']): string | undefined => {
  if (!value) return undefined;
  if (value === 'none') return 'None';
  if (value === 'lax') return 'Lax';
  return 'Strict';
};

/**
 * Set a cookie with appropriate settings for the environment
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (!isBrowser) {
    console.warn('setCookie called on server side - skipping');
    return;
  }

  const defaultOptions = getDefaultCookieOptions();
  const finalOptions = { ...defaultOptions, ...options };

  if (finalOptions.sameSite === 'none') {
    finalOptions.secure = true;
  }

  if (isLocalhost() && finalOptions.domain) {
    delete finalOptions.domain;
  }

  const cookieParts: string[] = [`${name}=${value}`];

  if (finalOptions.path) {
    cookieParts.push(`Path=${finalOptions.path}`);
  }

  if (typeof finalOptions.maxAge === 'number') {
    cookieParts.push(`Max-Age=${finalOptions.maxAge}`);
  }

  if (finalOptions.secure) {
    cookieParts.push('Secure');
  }

  const sameSiteValue = normalizeSameSite(finalOptions.sameSite);
  if (sameSiteValue) {
    cookieParts.push(`SameSite=${sameSiteValue}`);
  }

  if (finalOptions.domain) {
    cookieParts.push(`Domain=${finalOptions.domain}`);
  }

  try {
    document.cookie = cookieParts.join('; ');
    console.log('✅ Cookie set successfully:', {
      name,
      preview: value.substring(0, 12) + '…',
      options: finalOptions,
    });
  } catch (error) {
    console.error('❌ Error setting cookie:', error);
  }
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (!isBrowser) {
    return null;
  }

  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') cookie = cookie.substring(1, cookie.length);
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }

  return null;
}

/**
 * Delete a cookie by setting it to expire
 */
export function deleteCookie(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  if (!isBrowser) {
    return;
  }

  const parts = [`${name}=`, 'Expires=Thu, 01 Jan 1970 00:00:00 GMT', 'Max-Age=0'];
  const path = options.path ?? '/';
  parts.push(`Path=${path}`);

  if (options.domain && !isLocalhost()) {
    parts.push(`Domain=${options.domain}`);
  }

  document.cookie = parts.join('; ');
}

/**
 * Set authentication cookies used across the app and middleware
 */
export function setAuthCookies(token: string, options: CookieOptions = {}): void {
  if (!isBrowser) {
    return;
  }

  setCookie('firebase-token', token, options);
  setCookie('__session', token, options);
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(): void {
  if (!isBrowser) {
    return;
  }

  deleteCookie('firebase-token');
  deleteCookie('__session');
}

/**
 * Helper to read whichever auth cookie is present
 */
export function getAuthCookie(): string | null {
  return getCookie('firebase-token') ?? getCookie('__session');
}