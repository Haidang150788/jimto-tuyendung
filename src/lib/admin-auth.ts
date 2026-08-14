// The admin password now lives server-side only (ADMIN_PASSWORD env var) and
// is checked by /api/admin/login and /api/content. What we keep client-side
// is just the password the HR person typed, held in sessionStorage so it can
// be resent as a bearer token on write requests — it is cleared on logout or
// when the tab is closed. Still not high-security (visible via devtools to
// whoever is using that browser session), but the password itself is no
// longer shipped in the JS bundle.
const SESSION_KEY = "jimto_admin_token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(SESSION_KEY);
}

export function isAdminAuthed(): boolean {
  return getAdminToken() !== null;
}

export function setAdminToken(token: string) {
  window.sessionStorage.setItem(SESSION_KEY, token);
}

export function clearAdminToken() {
  window.sessionStorage.removeItem(SESSION_KEY);
}
