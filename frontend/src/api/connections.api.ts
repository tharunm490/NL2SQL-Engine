import apiClient from "./client";
import type { DatabaseConnection, CreateConnectionPayload, TestConnectionPayload, TestResult, SchemaInfo, SchemaVisualization, ConnectionStatus } from "@/types";

export function getConnectionsApi() {
  return apiClient.get<DatabaseConnection[]>("/admin/connections").then((r) => r.data);
}

export function getConnectionApi(id: string) {
  return apiClient.get<DatabaseConnection>(`/admin/connections/${id}`).then((r) => r.data);
}

export function createConnectionApi(data: CreateConnectionPayload) {
  return apiClient.post<DatabaseConnection>("/admin/connections", data).then((r) => r.data);
}

export function updateConnectionApi(id: string, data: Partial<CreateConnectionPayload>) {
  return apiClient.put<DatabaseConnection>(`/admin/connections/${id}`, data).then((r) => r.data);
}

export function deleteConnectionApi(id: string) {
  return apiClient.delete(`/admin/connections/${id}`).then((r) => r.data);
}

export function testConnectionApi(data: TestConnectionPayload) {
  return apiClient.post<TestResult>("/admin/connections/test", data).then((r) => r.data);
}

export function testStoredConnectionApi(id: string) {
  return apiClient.post<TestResult>(`/databases/${id}/test`).then((r) => r.data);
}

export function batchCheckStatusApi(ids: string[]) {
  return apiClient.post<ConnectionStatus[]>("/databases/batch-status", { ids }).then((r) => r.data);
}

export function getSchemaApi(id: string) {
  return apiClient.get<SchemaInfo>(`/admin/databases/${id}/schema`).then((r) => r.data);
}

export function getAnalystDatabasesApi() {
  return apiClient.get<DatabaseConnection[]>("/me/databases").then((r) => r.data);
}

export function getAnalystSchemaApi(id: string) {
  return apiClient.get<SchemaInfo>(`/me/databases/${id}/schema`).then((r) => r.data);
}

export function getAnalystSchemaVisualizationApi(id: string) {
  return apiClient.get<SchemaVisualization>(`/me/databases/${id}/schema-visualization`).then((r) => r.data);
}

export function getSchemaVisualizationApi(id: string) {
  return apiClient.get<SchemaVisualization>(`/admin/connections/${id}/schema-visualization`).then((r) => r.data);
}

export function refreshSchemaApi(id: string) {
  return apiClient.post<SchemaVisualization>(`/admin/connections/${id}/refresh-schema`).then((r) => r.data);
}
