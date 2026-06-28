import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getConnectionsApi,
  createConnectionApi,
  updateConnectionApi,
  deleteConnectionApi,
  testConnectionApi,
} from "@/api/connections.api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { SchemaViewer } from "@/components/schema/SchemaViewer";
import type { DatabaseConnection, CreateConnectionPayload } from "@/types";
import { Plus, Pencil, Trash2, Wifi } from "lucide-react";

const defaultForm: CreateConnectionPayload = {
  name: "",
  host: "localhost",
  port: 5432,
  database: "",
  username: "postgres",
  password: "",
};

export function DatabasesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DatabaseConnection | null>(null);
  const [form, setForm] = useState<CreateConnectionPayload>(defaultForm);

  const { data: connections, isLoading } = useQuery({
    queryKey: ["connections"],
    queryFn: getConnectionsApi,
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      toast.success("Connection deleted");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete connection"),
  });

  const testMutation = useMutation({
    mutationFn: (data: CreateConnectionPayload) =>
      testConnectionApi({
        host: data.host,
        port: data.port,
        database: data.database,
        username: data.username,
        password: data.password,
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Connection test succeeded");
      } else {
        toast.error(res.message || "Connection test failed");
      }
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Connection test failed"),
  });

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(conn: DatabaseConnection) {
    setEditing(conn);
    setForm({
      name: conn.name,
      host: conn.host,
      port: conn.port,
      database: conn.database,
      username: conn.username,
      password: "",
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    setForm(defaultForm);
  }

  const columns: Column<DatabaseConnection>[] = [
    { key: "name", header: "Name" },
    { key: "host", header: "Host" },
    { key: "database", header: "Database" },
    { key: "port", header: "Port", render: (item) => String(item.port) },
    {
      key: "is_active",
      header: "Status",
      render: (item) => (
        <Badge variant={item.is_active ? "success" : "secondary"}>
          {item.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-1">
          <SchemaViewer connectionId={item.id} connectionName={item.name} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              testMutation.mutate({
                host: item.host,
                port: item.port,
                database: item.database,
                username: item.username,
                password: "",
              })
            }
            title="Test Connection"
          >
            <Wifi className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (confirm("Delete this connection?")) deleteMutation.mutate(item.id);
            }}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Database Connections</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your database connections</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add Database
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={connections || []}
            isLoading={isLoading}
            keyExtractor={(item) => item.id}
            emptyMessage="No database connections yet. Add one to get started."
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogClose onClick={closeDialog} />
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Connection" : "New Connection"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Connection Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="My Database"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="database">Database</Label>
              <Input
                id="database"
                value={form.database}
                onChange={(e) => setForm({ ...form, database: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editing ? "Leave blank to keep current" : ""}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => testMutation.mutate(form)}
              disabled={!form.host || !form.database}
            >
              <Wifi className="h-4 w-4 mr-2" /> Test
            </Button>
            <Button
              onClick={() => (editing ? updateMutation.mutate() : createMutation.mutate())}
              disabled={!form.name || !form.database}
            >
              {editing ? "Update" : "Create"}
            </Button>
            <Button variant="ghost" onClick={closeDialog}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
