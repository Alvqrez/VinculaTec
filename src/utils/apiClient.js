import { getAuthToken } from "../context/AuthContext";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://flock-gratuity-dancing.ngrok-free.dev";

const defaultHeaders = {
  "Content-Type": "application/json",
};

const buildHeaders = (headers = {}) => {
  const token = getAuthToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  return { ...defaultHeaders, ...authHeader, ...headers };
};

const parseResponse = async (response) => {
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, ok: response.ok, body };
};

const createErrorPayload = ({ response, body }) => {
  const message =
    body?.mensaje || body?.message || response?.statusText || "Error de red";
  const error = new Error(message);
  error.status = response?.status ?? 0;
  error.response = body;
  return { ok: false, status: response?.status ?? 0, error, body };
};

const request = async (endpoint, config = {}) => {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  const headers = buildHeaders(config.headers);
  const init = {
    credentials: "include",
    ...config,
    headers,
  };

  if (
    init.body !== undefined &&
    init.body !== null &&
    !(init.body instanceof FormData) &&
    typeof init.body !== "string"
  ) {
    init.body = JSON.stringify(init.body);
  }

  if (init.body instanceof FormData) {
    delete init.headers["Content-Type"];
  }

  try {
    const response = await fetch(url, init);
    const { ok, status, body } = await parseResponse(response);
    if (!ok) {
      if (status === 401) {
        console.warn("apiClient: autenticación inválida o expirada.");
      }
      return createErrorPayload({ response, body });
    }
    return { ok: true, status, body };
  } catch (error) {
    console.error("apiClient request failed:", error);
    return {
      ok: false,
      status: 0,
      error,
      body: null,
    };
  }
};

const apiClient = {
  get: (endpoint, options) => request(endpoint, { method: "GET", ...options }),
  post: (endpoint, data, options) =>
    request(endpoint, { method: "POST", body: data, ...options }),
  put: (endpoint, data, options) =>
    request(endpoint, { method: "PUT", body: data, ...options }),
  patch: (endpoint, data, options) =>
    request(endpoint, { method: "PATCH", body: data, ...options }),
  delete: (endpoint, options) =>
    request(endpoint, { method: "DELETE", ...options }),
};

export default apiClient;
