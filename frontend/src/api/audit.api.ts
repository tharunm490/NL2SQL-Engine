import apiClient from "./client";
import type { AuditLogItem } from "@/types";

export function getAuditLogsApi() {
  return apiClient.get<AuditLogItem[]>("/admin/audit-logs").then((r) => r.data);
}

export function getAuditLogsByActionApi(action: string) {
  return apiClient.get<AuditLogItem[]>(`/admin/audit-logs/action/${action}`).then((r) => r.data);
}

export function getAuditLogsByUserApi(userId: string) {
  return apiClient.get<AuditLogItem[]>(`/admin/audit-logs/user/${userId}`).then((r) => r.data);
}
