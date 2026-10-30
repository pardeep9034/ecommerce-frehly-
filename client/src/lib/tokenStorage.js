const KEY = "token";

// "Remember me": localStorage survives closing the browser, sessionStorage
// clears with it. Always check localStorage first so existing storefront
// logins (which never pass remember=false) keep working unchanged.
export const getToken = () => localStorage.getItem(KEY) || sessionStorage.getItem(KEY);

export const setToken = (token, remember = true) => {
  if (remember) {
    localStorage.setItem(KEY, token);
    sessionStorage.removeItem(KEY);
  } else {
    sessionStorage.setItem(KEY, token);
    localStorage.removeItem(KEY);
  }
};

export const clearToken = () => {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
};

// The claims of a JWT ({ user_id, role, warehouse_id, ... }), or null. Reads the payload only; the services are
// what verify the signature.
export const getTokenClaims = (token) => {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
};

// The role claim of a JWT, or null.
export const getTokenRole = (token) => getTokenClaims(token)?.role || null;
