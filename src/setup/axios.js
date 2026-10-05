import axios from "axios";
import { API } from "@api";

export const AUTH_EXPIRED_EVENT = "auth:expired";

let refreshing = null;

/**
 * Giống owlla_frontend: cookie access_token đi kèm mọi request (withCredentials, qua Vite proxy).
 * Gặp 401 thì gọi /api/refresh một lần (dùng chung cho các request song song) rồi gửi lại;
 * refresh lỗi thì báo cho AuthContext để đưa về trang đăng nhập.
 */
export function setupAxios() {
  axios.defaults.withCredentials = true;
  axios.defaults.headers.Accept = "application/json";

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { config, response } = error;
      const isAuthCall = [API.LOGIN, API.REFRESH, API.VERIFY_2FA].includes(config?.url);
      if (response?.status !== 401 || !config || config._retried || isAuthCall) {
        return Promise.reject(error);
      }
      try {
        refreshing = refreshing || axios.post(API.REFRESH).finally(() => { refreshing = null; });
        const refreshed = await refreshing;
        if (!refreshed?.data?.success) throw new Error("refresh failed");
      } catch (refreshError) {
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
        return Promise.reject(error);
      }
      return axios({ ...config, _retried: true });
    },
  );
}

/** Chuẩn hóa lỗi API: {status, code, message, data}. Lỗi 409/422 của skill có detail.code. */
export function apiError(error) {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail;
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    return { status, code: detail.code, message: detail.message, data: detail };
  }
  if (Array.isArray(detail)) {
    return { status, code: null, message: detail.map((d) => d.msg).join("; "), data: detail };
  }
  const fallback = status ? `Lỗi ${status}` : "Không kết nối được máy chủ";
  return { status, code: null, message: typeof detail === "string" ? detail : fallback, data: detail };
}
