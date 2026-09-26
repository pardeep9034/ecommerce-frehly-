// Decodes the role out of a JWT without verifying it — the server is the
// source of truth on every request; this is only used client-side to decide
// which layout/redirect to show.
export const getTokenRole = (token) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role || null;
  } catch {
    return null;
  }
};
