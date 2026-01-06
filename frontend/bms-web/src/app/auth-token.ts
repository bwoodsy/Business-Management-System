export const authTokenKey = 'bms_auth_token';

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(authTokenKey);
}

export function setStoredAuthToken(token: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    window.localStorage.setItem(authTokenKey, token);
  } else {
    window.localStorage.removeItem(authTokenKey);
  }
}

export function isDesktopRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Primary check: preload script exposes bmsApp
  if (window.bmsApp) {
    return true;
  }

  // Fallback: detect Electron via user agent (works even if preload fails)
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    return navigator.userAgent.toLowerCase().includes('electron');
  }

  return false;
}
