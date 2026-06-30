import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getConnectionsApi, getAnalystDatabasesApi,
  createConnectionApi, updateConnectionApi, deleteConnectionApi,
  testStoredConnectionApi, batchCheckStatusApi,
} from "@/api/connections.api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { SchemaViewer } from "@/components/schema/SchemaViewer";
import { removeSchema } from "@/utils/schemaCache";
import type { DatabaseConnection, CreateConnectionPayload, ConnectionStatus } from "@/types";
import { Plus, Pencil, Trash2, Wifi, RefreshCw } from "lucide-react";

const defaultForm: CreateConnectionPayload = {
  name: "", host: "localhost", port: 5432, database: "", username: "postgres", password: "",
};

export function DatabasesPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DatabaseConnection | null>(null);
  const [form, setForm] = useState<CreateConnectionPayload>(defaultForm);
  const [statusMap, setStatusMap] = useState<Record<string, ConnectionStatus>>({});
  const [lastChecked, setLastChecked] = useState<Record<string, string>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  const { data: connections, isLoading } = useQuery({
    queryKey: isAdmin ? ["connections"] : ["my-databases"],
    queryFn: isAdmin ? getConnectionsApi : getAnalystDatabasesApi,
  });

  const checkStatuses = useCallback(async () => {
    if (!connections || connections.length === 0) return;
    const ids = connections.map((c) => c.id);
    try {
      const statuses = await batchCheckStatusApi(ids);
      const map: Record<string, ConnectionStatus> = {};
      const times: Record<string, string> = {};
      const now = new Date().toISOString();
      statuses.forEach((s) => {
        map[s.id] = s;
        times[s.id] = now;
      });
      setStatusMap(map);
      setLastChecked(times);
    } catch {
      // silent
    }
  }, [connections]);

  useEffect(() => {
    checkStatuses();
    const interval = setInterval(checkStatuses, 30000);
    return () => clearInterval(interval);
  }, [checkStatuses]);

  const createMutation = useMutation({
    mutationFn: () => createConnectionApi(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      toast.success("Connection created");
      closeDialog();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create connection"),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateConnectionApi(editing!.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      toast.success("Connection updated");
      closeDialog();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update connection"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteConnectionApi(id),
    onSuccess: (_data, id) => {
      removeSchema(id);
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      toast.success("Connection deleted");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete connection"),
  });

  const handleTestStored = async (id: string) => {
    setTestingId(id);
    try {
      const res = await testStoredConnectionApi(id);
      if (res.success) {
        toast.success("Connection successful");
      } else {
        toast.error(res.message || "Connection failed");
      }
      await checkStatuses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test failed");
    } finally {
      setTestingId(null);
    }
  };

  function openCreate() {
    if (!isAdmin) return;
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(conn: DatabaseConnection) {
    if (!isAdmin) return;
    setEditing(conn);
    setForm({
      name: conn.name, host: conn.host, port: conn.port,
      database: conn.database, username: conn.username, password: "",
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    setForm(defaultForm);
  }

  function getRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 5) return "just now";
    if (secs < 60) return `${secs} sec ago`;
    const mins = Math.floor(secs / 60);
    return `${mins} min ago`;
  }

  const columns: Column<DatabaseConnection>[] = [
    { key: "name", header: "Name" },
    { key: "host", header: "Host" },
    { key: "database", header: "Database" },
    { key: "port", header: "Port", render: (item) => String(item.port) },
    {
      key: "is_active",
      header: "Status",
      render: (item) => {
        const st = statusMap[item.id];
        const isActive = st?.status === "Active";
        const checked = lastChecked[item.id];
        return (
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? "success" : "secondary"}>
              <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
              {isActive ? "Active" : "Inactive"}
            </Badge>
            {checked && (
              <span className="text-[10px] text-muted-foreground">
                Last checked {getRelativeTime(checked)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-1">
          <SchemaViewer connectionId={item.id} connectionName={item.name} />
          <Button
            variant="ghost" size="icon"
            onClick={() => handleTestStored(item.id)}
            disabled={testingId === item.id}
            title="Test Connection"
          >
            {testingId === item.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
          </Button>
          {isAdmin && (
            <>
              <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon"
                onClick={() => {
                  if (confirm("Delete this connection?")) deleteMutation.mutate(item.id);
                }}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Database Connections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? "Manage your database connections" : "View your assigned databases"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={checkStatuses} title="Refresh Status">
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          {isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Add Database
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={connections || []}
            isLoading={isLoading}
            keyExtractor={(item) => item.id}
            emptyMessage={
              isAdmin
                ? "No database connections yet. Add one to get started."
                : "No databases assigned to you."
            }
          />
        </CardContent>
      </Card>

      {isAdmin && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogClose onClick={closeDialog} />
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Connection" : "New Connection"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Connection Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Database" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="host">Host</Label>
                <Input id="host" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input id="port" type="number" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="database">Database</Label>
                <Input id="database" value={form.database} onChange={(e) => setForm({ ...form, database: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? "Leave blank to keep current" : ""} />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={() => (editing ? updateMutation.mutate() : createMutation.mutate())} disabled={!form.name || !form.database}>
                {editing ? "Update" : "Create"}
              </Button>
              <Button variant="ghost" onClick={closeDialog}>Cancel</Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
