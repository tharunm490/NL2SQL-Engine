import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getUsersApi, createUserApi, updateUserStatusApi, getPermissionsApi, assignPermissionApi, removePermissionApi } from "@/api/users.api";
import { getConnectionsApi } from "@/api/connections.api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import type { User, DatabaseConnection, CreateUserPayload } from "@/types";
import { Plus, ToggleLeft, Database, X } from "lucide-react";

export function UsersPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState<CreateUserPayload>({
    username: "", email: "", password: "", role: "analyst",
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getUsersApi,
  });

  const { data: connections } = useQuery({
    queryKey: ["connections"],
    queryFn: getConnectionsApi,
  });

  const { data: permissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: getPermissionsApi,
  });

  const createMutation = useMutation({
    mutationFn: () => createUserApi(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created");
      setCreateOpen(false);
      setForm({ username: "", email: "", password: "", role: "analyst" });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create user"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateUserStatusApi(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User status updated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update user"),
  });

  const assignMutation = useMutation({
    mutationFn: ({ userId, connId }: { userId: string; connId: string }) =>
      assignPermissionApi({ analyst_id: userId, database_connection_id: connId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("Database assigned");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to assign database"),
  });

  const removePermMutation = useMutation({
    mutationFn: (permId: string) => removePermissionApi(permId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("Database removed");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to remove permission"),
  });

  function getAssignedDBs(userId: string): DatabaseConnection[] {
    return (permissions || [])
      .filter((p) => p.analyst_id === userId)
      .map((p) => (connections || []).find((c) => c.id === p.database_connection_id))
      .filter((d): d is DatabaseConnection => !!d);
  }

  function getAssignedPermId(userId: string, connId: string): string | undefined {
    return (permissions || []).find(
      (p) => p.analyst_id === userId && p.database_connection_id === connId
    )?.id;
  }

  const columns: Column<User>[] = [
    { key: "username", header: "Username" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (item) => (
        <Badge variant={item.role === "admin" ? "default" : "secondary"}>{item.role}</Badge>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (item) => (
        <Badge variant={item.is_active ? "success" : "destructive"}>
          {item.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "databases",
      header: "Databases",
      render: (item) => <span>{getAssignedDBs(item.id).length} databases</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-1">
          {item.role === "analyst" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedUser(item);
                setAssignOpen(true);
              }}
              title="Assign Database"
            >
              <Database className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleMutation.mutate({ id: item.id, active: !item.is_active })}
            title={item.is_active ? "Deactivate" : "Activate"}
          >
            <ToggleLeft className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage users and database permissions</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={users || []}
            isLoading={isLoading}
            keyExtractor={(item) => item.id}
            emptyMessage="No users found"
          />
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogClose onClick={() => setCreateOpen(false)} />
        <DialogHeader>
          <DialogTitle>New User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="c-username">Username</Label>
            <Input
              id="c-username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-email">Email</Label>
            <Input
              id="c-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-password">Password</Label>
            <Input
              id="c-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-role">Role</Label>
            <select
              id="c-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "analyst" })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => createMutation.mutate()} disabled={!form.username || !form.email || !form.password}>
              Create User
            </Button>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Dialog>

      {/* Assign Database Dialog */}
      {selectedUser && (
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogClose onClick={() => setAssignOpen(false)} />
          <DialogHeader>
            <DialogTitle>Assign Database - {selectedUser.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Currently assigned databases:</p>
              {getAssignedDBs(selectedUser.id).length === 0 && (
                <p className="text-sm text-muted-foreground italic">No databases assigned</p>
              )}
              {getAssignedDBs(selectedUser.id).map((db) => (
                <div key={db.id} className="flex items-center justify-between rounded-md border px-3 py-2 mb-2">
                  <span className="text-sm">{db.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const permId = getAssignedPermId(selectedUser.id, db.id);
                      if (permId) removePermMutation.mutate(permId);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Add database</p>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    assignMutation.mutate({ userId: selectedUser.id, connId: e.target.value });
                    e.target.value = "";
                  }
                }}
                value=""
              >
                <option value="">Select a database...</option>
                {(connections || [])
                  .filter((c) => !getAssignedDBs(selectedUser.id).find((d) => d.id === c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
