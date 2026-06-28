import { useQuery } from "@tanstack/react-query";
import { getConnectionsApi } from "@/api/connections.api";
import { getRecentHistoryApi } from "@/api/history.api";
import { getUsersApi } from "@/api/users.api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatCard } from "@/components/common/StatCard";
import type { QueryHistoryItem, DatabaseConnection } from "@/types";
import { Database, Users, PlayCircle, Clock, Activity } from "lucide-react";

const historyColumns: Column<QueryHistoryItem>[] = [
  {
    key: "question",
    header: "Question",
    render: (item) => (
      <span className="truncate max-w-[200px] block">{item.question || item.generated_sql?.slice(0, 50)}</span>
    ),
  },
  { key: "database_name", header: "Database" },
  {
    key: "status",
    header: "Status",
    render: (item) => (
      <Badge variant={item.status === "success" ? "success" : "destructive"}>{item.status}</Badge>
    ),
  },
  {
    key: "execution_time",
    header: "Time",
    render: (item) => `${item.execution_time?.toFixed(2)}s`,
  },
  {
    key: "timestamp",
    header: "Timestamp",
    render: (item) => new Date(item.timestamp).toLocaleString(),
  },
];

export function DashboardPage() {
  const { data: connections, isLoading: connsLoading } = useQuery({
    queryKey: ["connections"],
    queryFn: getConnectionsApi,
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: getUsersApi,
  });

  const { data: recentHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["recent-history"],
    queryFn: getRecentHistoryApi,
  });

  const analysts = users?.filter((u) => u.role === "analyst" && u.is_active) || [];
  const totalQueries = recentHistory?.length || 0;
  const avgTime = recentHistory && recentHistory.length > 0
    ? recentHistory.reduce((s, q) => s + q.execution_time, 0) / recentHistory.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your AI SQL Assistant</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Database}
          label="Connected Databases"
          value={connections?.length}
          isLoading={connsLoading}
        />
        <StatCard
          icon={Users}
          label="Active Analysts"
          value={analysts.length}
        />
        <StatCard
          icon={PlayCircle}
          label="Executed Queries"
          value={totalQueries}
          subtitle="Recent queries"
        />
        <StatCard
          icon={Clock}
          label="Avg Response Time"
          value={avgTime > 0 ? `${avgTime.toFixed(2)}s` : "-"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={historyColumns}
                data={recentHistory || []}
                isLoading={historyLoading}
                keyExtractor={(item) => item.id}
                emptyMessage="No recent queries"
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Database Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connected</span>
                <span className="text-lg font-bold">{connections?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={connections && connections.length > 0 ? "success" : "secondary"}>
                  {connections && connections.length > 0 ? "All Connected" : "No Connections"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Health</span>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">Healthy</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
