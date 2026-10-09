import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ic_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("ic_token");
      localStorage.removeItem("ic_user");
      window.dispatchEvent(new Event("ic:unauthorized"));
    }
    return Promise.reject(err);
  }
);

// Turn an axios error into a message a user can act on.
export function errorMessage(err, fallback = "Something went wrong") {
  if (!err?.response) {
    return "Can't reach the server. It may be waking up — please try again in a few seconds.";
  }
  const detail = err.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) {
    // FastAPI validation errors: [{loc, msg, ...}]
    const first = detail[0];
    const field = Array.isArray(first?.loc) ? first.loc[first.loc.length - 1] : "";
    if (field === "email") return "Please enter a valid email address.";
    if (field === "password") return "Password must be at least 6 characters.";
    return first?.msg || fallback;
  }
  return fallback;
}

export async function uploadFile(kind, file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post(`/upload/${kind}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data; // {id, path, content_type, size}
}

export default api;
