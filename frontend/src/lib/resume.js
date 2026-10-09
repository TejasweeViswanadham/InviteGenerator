// Remembers the invitation a user last edited on this device, so the dashboard
// can offer "Continue editing" after they come back (even after logging out).
const KEY = "ic_last_edit";

export function rememberLastEdit(userId, inv) {
  if (!userId || !inv?.id) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ userId, id: inv.id, title: inv.title || "", at: Date.now() }));
  } catch {}
}

export function readLastEdit(userId) {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    // Keyed by user so someone else signing in on this device doesn't see it.
    return v && v.userId === userId ? v : null;
  } catch {
    return null;
  }
}
