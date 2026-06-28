import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getConnectionsApi, getAnalystDatabasesApi } from "@/api/connections.api";
import { executeQueryApi, executeAdminQueryApi } from "@/api/query.api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DataTable, type Column } from "@/components/common/DataTable";
import type { QueryResult, DatabaseConnection } from "@/types";
import { Play, Copy, Download } from "lucide-react";

export function QueryPage() {
  const { isAdmin } = useAuth();
  const [selectedDb, setSelectedDb] = useState("");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [executing, setExecuting] = useState(false);

  const { data: databases } = useQuery({
    queryKey: isAdmin ? ["connections"] : ["my-databases"],
    queryFn: isAdmin ? getConnectionsApi : getAnalystDatabasesApi,
  });

  const handleExecute = async () => {
    if (!selectedDb) {
      toast.error("Please select a database");
      return;
    }
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setExecuting(true);
    setResult(null);

    try {
      const executeFn = isAdmin ? executeAdminQueryApi : executeQueryApi;
      const res = await executeFn({
        database_connection_id: selectedDb,
        question,
      });
      setResult(res);
      if (res.status === "error") {
        toast.error(res.error || "Query execution failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Query failed");
    } finally {
      setExecuting(false);
    }
  };

  const resultColumns: Column<Record<string, string>>[] = result?.column_names
    ? result.column_names.map((name) => ({ key: name, header: name }))
    : [];

  const tableData: Record<string, string>[] = result?.rows.map((row) => {
    const obj: Record<string, string> = {};
    result.column_names.forEach((name, i) => {
      const val = row[i];
      obj[name] = val !== undefined && val !== null ? String(val) : "-";
    });
    return obj;
  }) || [];

  const handleCopySql = () => {
    if (result?.sql) {
      navigator.clipboard.writeText(result.sql);
      toast.success("SQL copied to clipboard");
    }
  };

  const handleDownloadCsv = () => {
    if (!result || result.status !== "success") return;
    const csv = [
      result.column_names.join(","),
      ...result.rows.map((r) => r.map((v) => `"${String(v ?? "")}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "query_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Query</h1>
        <p className="text-sm text-muted-foreground mt-1">Ask questions in natural language</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Natural Language Query</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                id="database"
                label="Database"
                value={selectedDb}
                onChange={(e) => setSelectedDb(e.target.value)}
                options={[
                  { value: "", label: "Select a database..." },
                  ...(databases || []).map((db: DatabaseConnection) => ({
                    value: db.id,
                    label: db.name,
                  })),
                ]}
              />
              <div className="space-y-2">
                <Label htmlFor="question">Your Question</Label>
                <textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Show me all users who signed up last month"
                  rows={5}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <Button onClick={handleExecute} disabled={!selectedDb || !question.trim() || executing} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                {executing ? "Executing..." : "Generate & Execute"}
              </Button>
            </CardContent>
          </Card>

          {result?.sql && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Generated SQL</CardTitle>
                <Button variant="outline" size="sm" onClick={handleCopySql}>
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="rounded-md bg-[#0a0a0b] text-[#e4e4e7] p-4 text-sm font-mono overflow-x-auto">
                  <code>{result.sql}</code>
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Results</CardTitle>
              {result?.status === "success" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{result.execution_time.toFixed(2)}s</span>
                  <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
                    <Download className="h-4 w-4 mr-2" /> CSV
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!result && (
                <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                  Run a query to see results
                </div>
              )}

              {result?.status === "error" && (
                <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                  {result.error}
                </div>
              )}

              {result?.status === "success" && (
                <>
                  <p className="text-xs text-muted-foreground mb-3">
                    {result.row_count} row{result.row_count !== 1 ? "s" : ""} returned
                  </p>
                  <DataTable
                    columns={resultColumns}
                    data={tableData}
                    keyExtractor={(_, idx) => String(idx)}
                    emptyMessage="No results"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
