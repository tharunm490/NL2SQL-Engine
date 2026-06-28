import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogsApi } from "@/api/audit.api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/common/DataTable";
import type { AuditLogItem } from "@/types";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const actionLabels: Record<string, string> = {
  login: "Login",
  login_failed: "Login Failed",
  user_created: "User Created",
  user_status_changed: "Status Changed",
  connection_created: "Connection Created",
  connection_updated: "Connection Updated",
  connection_deleted: "Connection Deleted",
  connection_tested: "Connection Tested",
  permission_assigned: "Permission Assigned",
  permission_removed: "Permission Removed",
  query_executed: "Query Executed",
};

export function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: getAuditLogsApi,
  });

  const filtered = (logs || []).filter((log) => {
    const matchesSearch = search
      ? (log.username || "").toLowerCase().includes(search.toLowerCase()) ||
        (log.details || "").toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const uniqueActions = [...new Set((logs || []).map((l) => l.action))];

  const columns: Column<AuditLogItem>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      render: (item) => (
        <span className="text-xs">{new Date(item.timestamp).toLocaleString()}</span>
      ),
    },
    { key: "username", header: "User" },
    {
      key: "action",
      header: "Action",
      render: (item) => (
        <Badge variant="secondary">{actionLabels[item.action] || item.action}</Badge>
      ),
    },
    { key: "ip_address", header: "IP Address", render: (item) => item.ip_address || "-" },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge variant={item.status === "success" ? "success" : "destructive"}>
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">Track all system activities</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by user or details..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {actionLabels[action] || action}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={paged}
            isLoading={isLoading}
            keyExtractor={(item) => item.id}
            emptyMessage="No audit logs found"
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
