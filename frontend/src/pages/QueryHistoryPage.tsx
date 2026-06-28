import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllHistoryApi } from "@/api/history.api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/common/DataTable";
import type { QueryHistoryItem } from "@/types";
import { Search, ChevronLeft, ChevronRight, Eye, X } from "lucide-react";

export function QueryHistoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<QueryHistoryItem | null>(null);
  const pageSize = 10;

  const { data: history, isLoading } = useQuery({
    queryKey: ["query-history"],
    queryFn: getAllHistoryApi,
  });

  const filtered = (history || []).filter((item) => {
    const matchesSearch = search
      ? (item.question || item.generated_sql || "").toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<QueryHistoryItem>[] = [
    {
      key: "question",
      header: "Question",
      render: (item) => (
        <span className="truncate max-w-[200px] block">
          {item.question || item.generated_sql?.slice(0, 60)}
        </span>
      ),
    },
    {
      key: "generated_sql",
      header: "SQL",
      render: (item) => (
        <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[200px] block">
          {item.generated_sql?.slice(0, 60)}...
        </code>
      ),
    },
    { key: "database_name", header: "Database" },
    {
      key: "execution_time",
      header: "Time",
      render: (item) => `${item.execution_time?.toFixed(2)}s`,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge variant={item.status === "success" ? "success" : "destructive"}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: "timestamp",
      header: "Timestamp",
      render: (item) => new Date(item.timestamp).toLocaleString(),
    },
    {
      key: "actions",
      header: "",
      render: (item) => (
        <Button variant="ghost" size="icon" onClick={() => setSelected(item)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Query History</h1>
        <p className="text-sm text-muted-foreground mt-1">View all executed queries</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search queries..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={paged}
            isLoading={isLoading}
            keyExtractor={(item) => item.id}
            emptyMessage="No query history found"
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

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl rounded-xl border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Query Details</h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Question</p>
                <p className="text-sm mt-1">{selected.question || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Generated SQL</p>
                <pre className="mt-1 rounded-md bg-[#0a0a0b] text-[#e4e4e7] p-3 text-xs font-mono overflow-x-auto">
                  <code>{selected.generated_sql}</code>
                </pre>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Database</p>
                  <p className="text-sm mt-1">{selected.database_name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Status</p>
                  <Badge variant={selected.status === "success" ? "success" : "destructive"} className="mt-1">
                    {selected.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Execution Time</p>
                  <p className="text-sm mt-1">{selected.execution_time?.toFixed(3)}s</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Rows Returned</p>
                  <p className="text-sm mt-1">{selected.row_count ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">User</p>
                  <p className="text-sm mt-1">{selected.username}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Timestamp</p>
                  <p className="text-sm mt-1">{new Date(selected.timestamp).toLocaleString()}</p>
                </div>
              </div>
              {selected.error_message && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Error</p>
                  <p className="text-sm text-destructive mt-1">{selected.error_message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
