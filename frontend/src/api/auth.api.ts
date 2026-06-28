import apiClient from "./client";
import type { LoginRequest, RegisterRequest, TokenResponse, User } from "@/types";

export function loginApi(data: LoginRequest) {
  return apiClient.post<TokenResponse>("/auth/login", data).then((r) => r.data);
}

export function registerApi(data: RegisterRequest) {
  return apiClient.post<TokenResponse>("/auth/register", data).then((r) => r.data);
}

export function getCurrentUserApi() {
  return apiClient.get<User>("/auth/me").then((r) => r.data);
}
