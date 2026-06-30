import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getUsersApi, createUserApi, updateUserApi, deleteUserApi,
  updateUserStatusApi, getUserDatabasesApi, assignUserDatabasesApi,
} from "@/api/users.api";
import { getConnectionsApi, testStoredConnectionApi, getAnalystSchemaVisualizationApi } from "@/api/connections.api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { SchemaViewer } from "@/components/schema/SchemaViewer";
import type { User, DatabaseConnection, CreateUserPayload, UpdateUserPayload } from "@/types";
import {
  Plus, Pencil, Trash2, Database, ToggleLeft, Check, Wifi,
  RefreshCw, Eye, X,
} from "lucide-react";

export function UsersPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDatabases, setUserDatabases] = useState<DatabaseConnection[]>([]);
  const [selectedDbIds, setSelectedDbIds] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [testing, setTesting] = useState(false);

  const createDefault = { username: "", email: "", password: "", role: "analyst" as const };
  const [createForm, setCreateForm] = useState<CreateUserPayload>(createDefault);
  const [editForm, setEditForm] = useState<UpdateUserPayload>({
    username: "", email: "", role: "analyst", is_active: true,
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getUsersApi,
  });

  const { data: connections } = useQuery({
    queryKey: ["connections"],
    queryFn: getConnectionsApi,
  });

  const createMutation = useMutation({
    mutationFn: () => createUserApi(createForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created");
      setCreateOpen(false);
      setCreateForm(createDefault);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create user"),
  });

  const editMutation = useMutation({
    mutationFn: () => updateUserApi(selectedUser!.id, editForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated");
      setEditOpen(false);
      setSelectedUser(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update user"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUserApi(selectedUser!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted");
      setDeleteOpen(false);
      setSelectedUser(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete user"),
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
    mutationFn: () => assignUserDatabasesApi(selectedUser!.id, { database_ids: Array.from(selectedDbIds) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Databases assigned");
      setAssignOpen(false);
      setSelectedUser(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to assign databases"),
  });

  function openEdit(user: User) {
    setSelectedUser(user);
    setEditForm({ username: user.username, email: user.email, role: user.role, is_active: user.is_active });
    setEditOpen(true);
  }

  function openDelete(user: User) {
    setSelectedUser(user);
    setDeleteOpen(true);
  }

  async function openAssign(user: User) {
    setSelectedUser(user);
    setSelectedDbIds(new Set());
    try {
      const dbs = await getUserDatabasesApi(user.id);
      setUserDatabases(dbs);
      setSelectedDbIds(new Set(dbs.map((d) => d.id)));
    } catch {
      setUserDatabases([]);
    }
    setAssignOpen(true);
  }

  async function openTest(user: User) {
    setSelectedUser(user);
    setTestResults({});
    try {
      const dbs = await getUserDatabasesApi(user.id);
      setUserDatabases(dbs);
    } catch {
      setUserDatabases([]);
    }
    setTestOpen(true);
  }

  async function runAllTests() {
    setTesting(true);
    setTestResults({});
    const results: Record<string, { success: boolean; message: string }> = {};
    for (const db of userDatabases) {
      try {
        const res = await testStoredConnectionApi(db.id);
        results[db.id] = { success: res.success, message: res.message };
      } catch {
        results[db.id] = { success: false, message: "Connection failed" };
      }
    }
    setTestResults(results);
    setTesting(false);
  }

  function toggleDb(dbId: string) {
    setSelectedDbIds((prev) => {
      const next = new Set(prev);
      if (next.has(dbId)) next.delete(dbId);
      else next.add(dbId);
      return next;
    });
  }

  function getAssignedDbNames(userId: string): DatabaseConnection[] {
    return [];
  }

  const dbNamesForUser: Record<string, DatabaseConnection[]> = {};

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
      header: "Assigned Databases",
      render: (item) => {
        if (item.role === "admin") return <span className="text-sm text-muted-foreground">All Databases</span>;
        const dbs = dbNamesForUser[item.id] || [];
        if (dbs.length === 0) return <span className="text-sm text-muted-foreground">No databases assigned</span>;
        const displayed = dbs.slice(0, 2);
        const remaining = dbs.length - 2;
        return (
          <div className="group relative">
            <div className="flex flex-wrap gap-1">
              {displayed.map((d) => (
                <Badge key={d.id} variant="secondary" className="text-xs">{d.name}</Badge>
              ))}
              {remaining > 0 && (
                <Badge variant="outline" className="text-xs cursor-default">
                  +{remaining} More
                </Badge>
              )}
            </div>
            {dbs.length > 2 && (
              <div className="absolute left-0 top-full z-10 mt-1 hidden rounded-md border bg-card p-2 shadow-lg group-hover:block">
                {dbs.map((d) => (
                  <div key={d.id} className="whitespace-nowrap px-2 py-1 text-xs">{d.name}</div>
                ))}
              </div>
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
          <Button variant="ghost" size="icon" onClick={() => openAssign(item)} title="Assign Database">
            <Database className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => openTest(item)} title="Test Connections">
            <Wifi className="h-4 w-4" />
          </Button>
          <SchemaViewerTrigger userId={item.id} />
          <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Edit User">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon"
            onClick={() => toggleMutation.mutate({ id: item.id, active: !item.is_active })}
            title={item.is_active ? "Deactivate" : "Activate"}
          >
            <ToggleLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => openDelete(item)} title="Delete User">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  function SchemaViewerTrigger({ userId }: { userId: string }) {
    const [dbs, setDbs] = useState<DatabaseConnection[]>([]);
    const [open, setOpen] = useState(false);
    const [selectedSchema, setSelectedSchema] = useState<{ id: string; name: string } | null>(null);

    async function handleOpen() {
      try {
        const data = await getUserDatabasesApi(userId);
        setDbs(data);
        setOpen(true);
      } catch {
        toast.error("Failed to load databases");
      }
    }

    return (
      <>
        <Button variant="ghost" size="icon" onClick={handleOpen} title="View Schemas">
          <Eye className="h-4 w-4" />
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogClose onClick={() => { setOpen(false); setSelectedSchema(null); }} />
          <DialogHeader>
            <DialogTitle>Database Schemas</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {dbs.length === 0 && <p className="text-sm text-muted-foreground">No databases assigned</p>}
            {dbs.map((db) => (
              <div key={db.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-sm font-medium">{db.name}</span>
                <Button
                  variant="outline" size="sm"
                  onClick={() => setSelectedSchema({ id: db.id, name: db.name })}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        </Dialog>
        {selectedSchema && (
          <div className="fixed inset-0 z-50 flex flex-col bg-background">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-lg font-semibold">{selectedSchema.name}</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedSchema(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <SchemaViewer connectionId={selectedSchema.id} connectionName={selectedSchema.name} />
            </div>
          </div>
        )}
      </>
    );
  }

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
            <Input id="c-username" value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-email">Email</Label>
            <Input id="c-email" type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-password">Password</Label>
            <Input id="c-password" type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-role">Role</Label>
            <select
              id="c-role"
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as "admin" | "analyst" })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => createMutation.mutate()} disabled={!createForm.username || !createForm.email || !createForm.password}>
              Create User
            </Button>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogClose onClick={() => { setEditOpen(false); setSelectedUser(null); }} />
        <DialogHeader>
          <DialogTitle>Edit User - {selectedUser?.username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="e-username">Username</Label>
            <Input id="e-username" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-email">Email</Label>
            <Input id="e-email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-role">Role</Label>
            <select
              id="e-role"
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value as "admin" | "analyst" })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="e-active">Active</Label>
            <input id="e-active" type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} className="h-4 w-4 rounded border-input" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => editMutation.mutate()} disabled={!editForm.username || !editForm.email}>
              Save Changes
            </Button>
            <Button variant="ghost" onClick={() => { setEditOpen(false); setSelectedUser(null); }}>Cancel</Button>
          </div>
        </div>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogClose onClick={() => { setDeleteOpen(false); setSelectedUser(null); }} />
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{selectedUser?.username}</strong>?
          </p>
          <p className="text-sm text-destructive">This action cannot be undone.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="destructive" onClick={() => deleteMutation.mutate()}>Delete</Button>
            <Button variant="ghost" onClick={() => { setDeleteOpen(false); setSelectedUser(null); }}>Cancel</Button>
          </div>
        </div>
      </Dialog>

      {/* Assign Databases Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogClose onClick={() => { setAssignOpen(false); setSelectedUser(null); }} />
        <DialogHeader>
          <DialogTitle>Assign Databases - {selectedUser?.username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select the databases this user should have access to:</p>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {(connections || []).length === 0 && (
              <p className="text-sm text-muted-foreground italic">No database connections configured</p>
            )}
            {(connections || []).map((conn) => (
              <label
                key={conn.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent ${
                  selectedDbIds.has(conn.id) ? "border-primary bg-primary/5" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedDbIds.has(conn.id)}
                  onChange={() => toggleDb(conn.id)}
                  className="h-4 w-4 rounded border-input text-primary"
                />
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{conn.name}</span>
                </div>
                {selectedDbIds.has(conn.id) && <Check className="ml-auto h-4 w-4 text-primary" />}
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {selectedDbIds.size} database{selectedDbIds.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => { setAssignOpen(false); setSelectedUser(null); }}>Cancel</Button>
              <Button onClick={() => assignMutation.mutate()}>Save</Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Test Connections Dialog */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogClose onClick={() => { setTestOpen(false); setSelectedUser(null); setTestResults({}); }} />
        <DialogHeader>
          <DialogTitle>Test Connections - {selectedUser?.username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {userDatabases.length === 0 && (
            <p className="text-sm text-muted-foreground">No databases assigned to this user</p>
          )}
          {userDatabases.map((db) => (
            <div key={db.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-sm font-medium">{db.name}</span>
              <div className="flex items-center gap-2">
                {testResults[db.id] && (
                  <Badge variant={testResults[db.id].success ? "success" : "destructive"}>
                    {testResults[db.id].success ? "Connected" : "Failed"}
                  </Badge>
                )}
              </div>
            </div>
          ))}
          {userDatabases.length > 0 && (
            <Button onClick={runAllTests} disabled={testing} className="w-full">
              {testing ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Testing...</> : <><Wifi className="mr-2 h-4 w-4" /> Test All Connections</>}
            </Button>
          )}
        </div>
      </Dialog>
    </div>
  );
}
