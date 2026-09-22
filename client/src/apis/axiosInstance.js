import axios from "axios";

/* ================= AXIOS INSTANCE ================= */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // MUST be here (not inside headers)
  headers: {
    "Content-Type": "application/json",
    "x-warehouse-id":"1"
  },
});

/* ================= REQUEST INTERCEPTOR ================= */

api.interceptors.request.use((config) => {

  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

    if (error.response?.status === 401 && !originalRequest._retry) {

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

        localStorage.setItem("token", newAccessToken);

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
        // logout(); route guards like /dashboard re-check on next render).
        localStorage.removeItem("token");

        return Promise.reject(refreshError);

      } finally {

        isRefreshing = false;

      }

    }

    return Promise.reject(error);

  }
);

export default api;