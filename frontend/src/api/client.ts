import axios from "axios";
import { clearAllSchemas } from "@/utils/schemaCache";

const apiClient = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AUTH_ENDPOINTS = ["/auth/login", "/auth/register"];

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) =>
        error.config?.url?.includes(ep)
      );

      if (status === 401 && !isAuthEndpoint) {
        clearAllSchemas();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }

      const message =
        typeof data?.detail === "string"
          ? data.detail
          : data?.detail?.[0]?.msg || `Request failed with status ${status}`;

      return Promise.reject(new Error(message));
    }

    if (error.request) {
      return Promise.reject(new Error("Unable to connect to the server. Please try again later."));
    }

    return Promise.reject(error);
  }
);

export default apiClient;
