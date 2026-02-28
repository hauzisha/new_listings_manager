// Centralized session token management
// Better Auth's HttpOnly cookies don't work through dev proxy,
// so we store the token and pass it via Authorization header.

const STORAGE_KEY = "session_token";

let token: string | null = null;

// Restore from localStorage on module load
try {
  token = localStorage.getItem(STORAGE_KEY);
} catch {
  // SSR or restricted context
}

export function getSessionToken(): string | null {
  return token;
}

export function setSessionToken(t: string | null) {
  token = t;
  try {
    if (t) {
      localStorage.setItem(STORAGE_KEY, t);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // SSR or restricted context
  }
}
