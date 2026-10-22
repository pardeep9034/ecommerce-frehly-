import axios from "axios";
import { getToken, setToken, clearToken } from "@/lib/tokenStorage";
import { store } from "@/redux/store";

/* ================= AXIOS INSTANCE ================= */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // MUST be here (not inside headers)
  headers: {
    "Content-Type": "application/json",
  },
});

/* ================= REQUEST INTERCEPTOR ================= */

api.interceptors.request.use((config) => {

  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // The store serving the customer's chosen location (LocationPicker). A header the caller set itself wins.
  const warehouseId = store.getState().location.current?.warehouse_id;
  if (warehouseId && !config.headers["x-warehouse-id"]) {
    config.headers["x-warehouse-id"] = String(warehouseId);
  }

  return config;

});

/* ================= RESPONSE INTERCEPTOR ================= */

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {

  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(

  (response) => response,

  async (error) => {

    const originalRequest = error.config;

    /* ================= IF ACCESS TOKEN EXPIRED ================= */

    // A login's own 401 (wrong password, "finish sign-up first", locked) has no session to refresh;
    // refreshing here would swallow the server's message behind the refresh call's 400.
    const isLogin = originalRequest?.url?.includes("/auth/login");

    if (error.response?.status === 401 && !originalRequest._retry && !isLogin) {

      if (isRefreshing) {

        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));

      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {

        /* ================= CALL REFRESH API ================= */

        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data.data.accessToken;

        /* ================= STORE NEW TOKEN ================= */

        // Keep whichever storage the old token was already in, so a
        // non-remembered admin session doesn't get silently upgraded
        // to a persistent one on refresh.
        setToken(newAccessToken, !!localStorage.getItem("token"));

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        return api(originalRequest);

      } catch (refreshError) {

        processQueue(refreshError, null);

        // Only clear the dead token here — never navigate. This runs for
        // background checks (e.g. AuthLoader's silent profile fetch) on
        // every page, public ones included; forcing a redirect here would
        // yank the user off whatever page they're on. Callers decide what
        // to do with a failed/expired session (AuthLoader dispatches
        // logout(); route guards like /admin re-check on next render).
        clearToken();

        return Promise.reject(refreshError);

      } finally {

        isRefreshing = false;

      }

    }

    return Promise.reject(error);

  }
);

export default api;