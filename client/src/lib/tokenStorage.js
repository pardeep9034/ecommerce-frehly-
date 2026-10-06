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
