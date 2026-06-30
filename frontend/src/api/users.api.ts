import apiClient from "./client";
import type { User, DatabaseConnection, CreateUserPayload, UpdateUserPayload, AssignDatabasesPayload } from "@/types";

export function getUsersApi() {
  return apiClient.get<User[]>("/admin/users").then((r) => r.data);
}

export function createUserApi(data: CreateUserPayload) {
  return apiClient.post<User>("/admin/users", data).then((r) => r.data);
}

export function updateUserApi(userId: string, data: UpdateUserPayload) {
  return apiClient.put<User>(`/admin/users/${userId}`, data).then((r) => r.data);
}

export function deleteUserApi(userId: string) {
  return apiClient.delete(`/admin/users/${userId}`);
}

export function updateUserStatusApi(userId: string, is_active: boolean) {
  return apiClient.patch<User>(`/admin/users/${userId}/status`, { is_active }).then((r) => r.data);
}

export function getUserDatabasesApi(userId: string) {
  return apiClient.get<DatabaseConnection[]>(`/admin/users/${userId}/databases`).then((r) => r.data);
}

export function assignUserDatabasesApi(userId: string, data: AssignDatabasesPayload) {
  return apiClient.put(`/admin/users/${userId}/databases`, data).then((r) => r.data);
}

export function getPermissionsApi() {
  return apiClient.get<{ id: string; user_id: string; database_connection_id: string }[]>("/admin/permissions").then((r) => r.data);
}

export function assignPermissionApi(data: { user_id: string; database_connection_id: string }) {
  return apiClient.post("/admin/permissions", data).then((r) => r.data);
}

export function removePermissionApi(id: string) {
  return apiClient.delete(`/admin/permissions/${id}`);
}
