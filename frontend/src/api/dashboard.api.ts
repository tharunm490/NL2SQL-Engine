import apiClient from "./client";

export interface DashboardStats {
  connected_databases: number;
  active_analysts: number;
  executed_queries: number;
  avg_response_time: number;
}

export function getDashboardStatsApi() {
  return apiClient.get<DashboardStats>("/dashboard/stats").then((r) => r.data);
}
