import apiClient from "./client";
import type { QueryHistoryItem } from "@/types";

export function getMyHistoryApi() {
  return apiClient.get<QueryHistoryItem[]>("/me/query-history").then((r) => r.data);
}

export function getRecentHistoryApi() {
  return apiClient.get<QueryHistoryItem[]>("/me/query-history/recent").then((r) => r.data);
}

export function getHistoryDetailApi(id: string) {
  return apiClient.get<QueryHistoryItem>(`/me/query-history/${id}`).then((r) => r.data);
}

export function getAllHistoryApi() {
  return apiClient.get<QueryHistoryItem[]>("/admin/query-history").then((r) => r.data);
}
