// Sandbox-only: replaces the real cookie-based session (set by POST /public/admin/login,
// read by GET /internal/auth/me) with a sessionStorage flag so a page reload keeps the
// user logged in but closing the tab logs them out, mirroring the "session" feel of a
// real login without any backend.
const SESSION_KEY = "xpoll_admin_sandbox_session";

export function startSession() {
  sessionStorage.setItem(SESSION_KEY, "1");
}

export function endSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function hasSession(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}
