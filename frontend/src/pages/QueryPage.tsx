import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getConnectionsApi, getAnalystDatabasesApi, batchCheckStatusApi } from "@/api/connections.api";
import { executeQueryApi, executeAdminQueryApi } from "@/api/query.api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DataTable, type Column } from "@/components/common/DataTable";
import type { QueryResult, DatabaseConnection, ConnectionStatus } from "@/types";
import { Play, Copy, Download, RefreshCw, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from "lucide-react";

const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "LIKE", "BETWEEN", "IS",
  "NULL", "TRUE", "FALSE", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "CROSS",
  "FULL", "ON", "AS", "ORDER", "BY", "GROUP", "HAVING", "LIMIT", "OFFSET",
  "DISTINCT", "UNION", "ALL", "EXISTS", "CASE", "WHEN", "THEN", "ELSE", "END",
  "COUNT", "SUM", "AVG", "MIN", "MAX", "CAST", "COALESCE", "NULLIF",
  "ASC", "DESC", "WITH", "RECURSIVE", "ARRAY", "ROW", "TYPE", "LATERAL",
  "FETCH", "NEXT", "ROWS", "ONLY", "OVER", "PARTITION", "RANK", "ROW_NUMBER",
  "DENSE_RANK", "LAG", "LEAD", "FIRST_VALUE", "LAST_VALUE",
]);

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightSQL(sql: string): string {
  const tokens: string[] = [];
  let i = 0;
  const len = sql.length;

  while (i < len) {
    if (sql[i] === "'") {
      let j = i + 1;
      while (j < len) {
        if (sql[j] === "'" && sql[j - 1] !== "\\") { j++; break; }
        j++;
      }
      tokens.push(`<span class="sql-string">${escapeHtml(sql.slice(i, j))}</span>`);
      i = j;
    } else if (sql[i] === '"') {
      let j = i + 1;
      while (j < len) {
        if (sql[j] === '"' && sql[j - 1] !== "\\") { j++; break; }
        j++;
      }
      tokens.push(`<span class="sql-string">${escapeHtml(sql.slice(i, j))}</span>`);
      i = j;
    } else if (sql[i] === "-" && sql[i + 1] === "-") {
      let j = i + 2;
      while (j < len && sql[j] !== "\n") j++;
      tokens.push(`<span class="sql-comment">${escapeHtml(sql.slice(i, j))}</span>`);
      i = j;
    } else if (sql[i] === "/" && sql[i + 1] === "*") {
      let j = i + 2;
      while (j < len && !(sql[j] === "*" && sql[j + 1] === "/")) j++;
      if (j < len) j += 2;
      tokens.push(`<span class="sql-comment">${escapeHtml(sql.slice(i, j))}</span>`);
      i = j;
    } else if (/\d/.test(sql[i]) && (i === 0 || /[\s,()=<>!+\-*/]/.test(sql[i - 1]))) {
      let j = i;
      while (j < len && /[\d.]/.test(sql[j])) j++;
      tokens.push(`<span class="sql-number">${escapeHtml(sql.slice(i, j))}</span>`);
      i = j;
    } else if (/[a-zA-Z_]/.test(sql[i])) {
      let j = i;
      while (j < len && /[a-zA-Z_0-9]/.test(sql[j])) j++;
      const word = sql.slice(i, j);
      const upper = word.toUpperCase();
      if (SQL_KEYWORDS.has(upper)) {
        tokens.push(`<span class="sql-keyword">${escapeHtml(word)}</span>`);
      } else {
        tokens.push(escapeHtml(word));
      }
      i = j;
    } else {
      tokens.push(escapeHtml(sql[i]));
      i++;
    }
  }

  return tokens.join("");
}

export function QueryPage() {
  const { isAdmin } = useAuth();
  const [selectedDb, setSelectedDb] = useState("");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [executing, setExecuting] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<string, ConnectionStatus>>({});
  const [sqlExpanded, setSqlExpanded] = useState(false);

  const { data: databases } = useQuery({
    queryKey: isAdmin ? ["connections"] : ["my-databases"],
    queryFn: isAdmin ? getConnectionsApi : getAnalystDatabasesApi,
  });

  const checkStatuses = useCallback(async () => {
    if (!databases || databases.length === 0) return;
    try {
      const statuses = await batchCheckStatusApi(databases.map((d) => d.id));
      const map: Record<string, ConnectionStatus> = {};
      statuses.forEach((s) => { map[s.id] = s; });
      setStatusMap(map);
    } catch {
      // silent
    }
  }, [databases]);

  useEffect(() => {
    checkStatuses();
    const interval = setInterval(checkStatuses, 30000);
    return () => clearInterval(interval);
  }, [checkStatuses]);

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
    setSqlExpanded(false);

    try {
      const executeFn = isAdmin ? executeAdminQueryApi : executeQueryApi;
      const res = await executeFn({
        database_connection_id: selectedDb,
        question,
      });
      setResult(res);
      if (res.status === "error") {
        const msg = res.friendly_error || res.error || "Query execution failed";
        toast.error(msg);
      } else if (res.correction_attempts && res.correction_attempts > 0) {
        toast.success(`Auto-corrected after ${res.correction_attempts} attempt(s)`);
      } else {
        toast.success("Query executed successfully");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Query failed");
    } finally {
      setExecuting(false);
    }
  };

  const selectedConn = (databases || []).find((d) => d.id === selectedDb);
  const isSelectedInactive = selectedConn && statusMap[selectedConn.id]?.status === "Inactive";

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

  const handleCopySql = useCallback((sql: string) => {
    navigator.clipboard.writeText(sql);
    toast.success("SQL copied to clipboard");
  }, []);

  const handleDownloadSql = useCallback((sql: string) => {
    const blob = new Blob([sql], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "query.sql";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadCsv = useCallback(() => {
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
  }, [result]);

  const displaySql = useMemo(() => {
    if (!result?.sql) return null;
    const isCorrected = result.correction_attempts && result.correction_attempts > 0;
    return {
      sql: isCorrected && result.corrected_sql ? result.corrected_sql : result.sql,
      originalSql: result.corrected_sql ? result.sql : null,
      attempts: result.correction_attempts || 0,
    };
  }, [result]);

  const needsExpandButton = useMemo(() => {
    if (!displaySql) return false;
    return displaySql.sql.length > 500;
  }, [displaySql]);

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
              <div className="space-y-2">
                <Label htmlFor="database">Database</Label>
                <div className="relative">
                  <select
                    id="database"
                    value={selectedDb}
                    onChange={(e) => setSelectedDb(e.target.value)}
                    className="flex h-10 w-full appearance-none rounded-lg border border-input bg-card px-3 py-2 pr-8 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                    style={{ WebkitAppearance: "none" }}
                  >
                    <option value="" className="dark:bg-gray-900 dark:text-white">Select a database...</option>
                    {(databases || []).map((db: DatabaseConnection) => {
                      const st = statusMap[db.id];
                      const isActive = st?.status === "Active";
                      return (
                        <option
                          key={db.id}
                          value={db.id}
                          disabled={!isActive}
                          className="dark:bg-gray-900 dark:text-white"
                        >
                          {db.name} {isActive ? "Active" : "Inactive"}
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg className="h-4 w-4 fill-current text-muted-foreground" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
                {isSelectedInactive && (
                  <p className="text-xs text-destructive">This database is currently inactive. Select an active database.</p>
                )}
              </div>
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
              <Button onClick={handleExecute} disabled={!selectedDb || !question.trim() || executing || !!isSelectedInactive} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                {executing ? "Executing..." : "Generate & Execute"}
              </Button>
            </CardContent>
          </Card>

          {result?.error && result.status === "error" && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Error</CardTitle>
              </CardHeader>
              <CardContent>
                {result.friendly_error ? (
                  <p className="text-sm text-destructive">{result.friendly_error}</p>
                ) : (
                  <p className="text-sm text-destructive">{result.error}</p>
                )}
                {result.original_error && result.friendly_error && (
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Technical details</summary>
                    <pre className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto">{result.original_error}</pre>
                  </details>
                )}
              </CardContent>
            </Card>
          )}

          {displaySql && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Generated SQL</CardTitle>
                  {displaySql.attempts > 0 && (
                    <span className="text-xs text-amber-500 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Auto-corrected ({displaySql.attempts})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => handleCopySql(displaySql.sql)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadSql(displaySql.sql)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {displaySql.originalSql && (
                  <details className="mb-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      Original SQL (with errors)
                    </summary>
                    <pre className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">{displaySql.originalSql}</pre>
                  </details>
                )}
                <div className="relative">
                  <div
                    className={`rounded-md bg-[#0a0a0b] text-[#e4e4e7] text-sm font-mono overflow-x-auto ${
                      needsExpandButton && !sqlExpanded ? "max-h-[400px] overflow-hidden" : ""
                    }`}
                  >
                    <table className="w-full border-collapse">
                      <tbody>
                        {(() => {
                          const lines = displaySql.sql.split("\n");
                          const lineDigits = String(lines.length).length;
                          return lines.map((line, idx) => (
                            <tr key={idx} className="align-top">
                              <td className="select-none text-right text-[#6b7280] px-3 py-0 text-xs border-r border-[#1f2937] whitespace-nowrap" style={{ minWidth: `${lineDigits + 3}ch` }}>
                                {idx + 1}
                              </td>
                              <td className="px-4 py-0 whitespace-pre" dangerouslySetInnerHTML={{ __html: highlightSQL(line || " ") }} />
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                  {needsExpandButton && (
                    <div className={`flex justify-center ${!sqlExpanded ? "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0b] pt-8" : ""}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSqlExpanded(!sqlExpanded)}
                        className="text-xs text-muted-foreground"
                      >
                        {sqlExpanded ? (
                          <><ChevronUp className="h-3 w-3 mr-1" /> Show less</>
                        ) : (
                          <><ChevronDown className="h-3 w-3 mr-1" /> Show more</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Results</CardTitle>
                {result?.status === "success" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </div>
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