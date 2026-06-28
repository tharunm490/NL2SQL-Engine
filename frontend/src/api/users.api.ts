import apiClient from "./client";
import type { User, CreateUserPayload, Permission, AssignPermissionPayload } from "@/types";

export function getUsersApi() {
  return apiClient.get<User[]>("/admin/users").then((r) => r.data);
}

export function createUserApi(data: CreateUserPayload) {
  return apiClient.post<User>("/admin/users", data).then((r) => r.data);
}

export function updateUserStatusApi(userId: string, is_active: boolean) {
  return apiClient.put<User>(`/admin/users/${userId}/status`, { is_active }).then((r) => r.data);
}

export function getPermissionsApi() {
  return apiClient.get<Permission[]>("/admin/permissions").then((r) => r.data);
}

export function assignPermissionApi(data: AssignPermissionPayload) {
  return apiClient.post<Permission>("/admin/permissions", data).then((r) => r.data);
}

export function removePermissionApi(id: string) {
  return apiClient.delete(`/admin/permissions/${id}`);
}
