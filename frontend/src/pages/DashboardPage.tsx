import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getConnectionsApi, getAnalystDatabasesApi, batchCheckStatusApi } from "@/api/connections.api";
import { getRecentHistoryApi } from "@/api/history.api";
import { getUsersApi } from "@/api/users.api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatCard } from "@/components/common/StatCard";
import type { QueryHistoryItem, DatabaseConnection, ConnectionStatus } from "@/types";
import { Database, Users, PlayCircle, Clock, Activity, Wifi } from "lucide-react";

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
  const { isAdmin } = useAuth();

  const { data: connections, isLoading: connsLoading } = useQuery({
    queryKey: isAdmin ? ["connections"] : ["my-databases"],
    queryFn: isAdmin ? getConnectionsApi : getAnalystDatabasesApi,
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: getUsersApi,
  });

  const { data: recentHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["recent-history"],
    queryFn: getRecentHistoryApi,
  });

  const [statusMap, setStatusMap] = useState<Record<string, ConnectionStatus>>({});

  const checkStatuses = useCallback(async () => {
    if (!connections || connections.length === 0) return;
    try {
      const statuses = await batchCheckStatusApi(connections.map((c) => c.id));
      const map: Record<string, ConnectionStatus> = {};
      statuses.forEach((s) => { map[s.id] = s; });
      setStatusMap(map);
    } catch {
      // silent
    }
  }, [connections]);

  useEffect(() => {
    checkStatuses();
    const interval = setInterval(checkStatuses, 30000);
    return () => clearInterval(interval);
  }, [checkStatuses]);

  const analysts = users?.filter((u) => u.role === "analyst" && u.is_active) || [];
  const totalQueries = recentHistory?.length || 0;
  const avgTime = recentHistory && recentHistory.length > 0
    ? recentHistory.reduce((s, q) => s + q.execution_time, 0) / recentHistory.length
    : 0;

  const totalDbs = connections?.length || 0;
  const healthyDbs = Object.values(statusMap).filter((s) => s.status === "Active").length;
  const offlineDbs = totalDbs - healthyDbs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your AI SQL Assistant</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Database}
          label={isAdmin ? "Connected Databases" : "Assigned Databases"}
          value={totalDbs}
          isLoading={connsLoading}
        />
        <StatCard
          icon={Activity}
          label="Healthy"
          value={healthyDbs}
          subtitle={`${offlineDbs} offline`}
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
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-bold">{totalDbs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Healthy</span>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">{healthyDbs}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Offline</span>
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{offlineDbs}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
