// Simple logged-in flag — NOT the actual token.
// Cookies handle real auth. This just gates UI checks
// so we don't make unnecessary API calls for anonymous visitors.

const KEY = "logged_in";

export function isLoggedIn(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setLoggedIn(v: boolean) {
  try {
    if (v) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    // SSR or restricted context
  }
}
