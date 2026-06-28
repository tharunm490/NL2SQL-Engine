import apiClient from "./client";
import type { QueryRequest, QueryResult } from "@/types";

export function executeQueryApi(data: QueryRequest) {
  return apiClient.post<QueryResult>("/query/execute", data).then((r) => r.data);
}

export function executeAdminQueryApi(data: QueryRequest) {
  return apiClient.post<QueryResult>("/admin/query/execute", data).then((r) => r.data);
}
