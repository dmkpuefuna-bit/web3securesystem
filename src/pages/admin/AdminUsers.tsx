import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Ban,
  CheckCircle,
  Search,
  Edit2,
  X,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  UserRound,
  Crown,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/utils";
import type { Profile, UserRole, UserStatus } from "@/lib/types";

const ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "moderator",
  "support",
  "user",
];
const STATUSES: UserStatus[] = ["active", "suspended", "banned", "deleted"];
const PAGE_SIZE = 10;

export function AdminUsers() {
  const { profile: adminProfile, startImpersonation } = useAuthStore();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isSuperAdmin = adminProfile?.role === "super_admin";

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase.from("profiles").select("*", { count: "exact" });

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,full_name.ilike.%${search}%,username.ilike.%${search}%`,
      );
    }
    if (roleFilter !== "all") query = query.eq("role", roleFilter);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);

    query = query
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, count, error } = await query;
    if (error) {
      setError(error.message);
      setUsers([]);
      setTotal(0);
    } else {
      setUsers((data as unknown as Profile[]) ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const logAction = async (
    action: string,
    targetUserId: string,
    details?: Record<string, unknown>,
  ) => {
    await supabase.rpc("log_audit", {
      p_action: action,
      p_target_user_id: targetUserId,
      p_details: (details ?? {}) as unknown as never,
    });
  };

  const updateStatus = async (userId: string, status: UserStatus) => {
    setError(null);
    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("user_id", userId);
    if (error) {
      setError(error.message);
      return;
    }
    await logAction(`user.${status}`, userId);
    setSuccess(`User status updated to ${status}`);
    setTimeout(() => setSuccess(null), 3000);
    await loadUsers();
  };

  const handleImpersonate = async (userId: string, userName: string) => {
    if (!isSuperAdmin) {
      setError("Only Super Admins can impersonate users.");
      return;
    }
    const confirmed = window.confirm(
      `You are about to impersonate ${userName}. Continue?`,
    );
    if (!confirmed) return;
    setError(null);
    const success = await startImpersonation(
      userId,
      "Manual impersonation from admin panel",
    );
    if (success) {
      window.location.href = "/dashboard";
    } else {
      setError(
        "Failed to start impersonation. Check browser console for details.",
      );
    }
  };

  const exportCSV = () => {
    const headers = [
      "Email",
      "Full Name",
      "Username",
      "Role",
      "Status",
      "Created At",
      "Last Login",
    ];
    const rows = users.map((u) => [
      u.email,
      u.full_name ?? "",
      u.username ?? "",
      u.role,
      u.status,
      u.created_at,
      u.last_login_at ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage all platform users ({total} total)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportCSV}
          disabled={users.length === 0}
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, username..."
            className="pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as UserRole | "all");
            setPage(0);
          }}
          className="h-10 rounded-lg border border-input bg-secondary/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as UserStatus | "all");
            setPage(0);
          }}
          className="h-10 rounded-lg border border-input bg-secondary/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No users found.
            </p>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Last Login
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border/50 transition-colors hover:bg-white/5"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                            {(user.full_name ||
                              user.email ||
                              "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.full_name ?? "Unnamed"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            user.role === "super_admin"
                              ? "default"
                              : user.role === "admin"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {user.role === "super_admin" && (
                            <Crown className="mr-1 h-3 w-3" />
                          )}
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            user.status === "active"
                              ? "success"
                              : user.status === "suspended"
                                ? "warning"
                                : user.status === "banned"
                                  ? "destructive"
                                  : "secondary"
                          }
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {timeAgo(user.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {user.last_login_at ? timeAgo(user.last_login_at) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                            title="Edit user"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {user.status === "active" ? (
                            <button
                              onClick={() =>
                                updateStatus(user.user_id, "suspended")
                              }
                              className="rounded-lg p-2 text-warning hover:bg-warning/10"
                              title="Suspend"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                updateStatus(user.user_id, "active")
                              }
                              className="rounded-lg p-2 text-success hover:bg-success/10"
                              title="Reactivate"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {isSuperAdmin && user.role !== "super_admin" && (
                            <button
                              onClick={() =>
                                handleImpersonate(
                                  user.user_id,
                                  user.full_name ?? user.email,
                                )
                              }
                              className="rounded-lg p-2 text-primary hover:bg-primary/10"
                              title="Impersonate"
                            >
                              <UserRound className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages} ({total} users)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <EditUserModal
            user={editingUser}
            isSuperAdmin={isSuperAdmin}
            onClose={() => setEditingUser(null)}
            onSave={async (updates) => {
              const oldValues = {
                full_name: editingUser.full_name,
                username: editingUser.username,
                role: editingUser.role,
                status: editingUser.status,
                phone: editingUser.phone,
                bio: editingUser.bio,
              };
              const { error } = await supabase
                .from("profiles")
                .update(updates)
                .eq("user_id", editingUser.user_id);
              if (error) {
                setError(error.message);
                return;
              }
              await logAction("user.updated", editingUser.user_id, {
                old: oldValues,
                new: updates,
              });
              setSuccess("User updated successfully");
              setTimeout(() => setSuccess(null), 3000);
              setEditingUser(null);
              await loadUsers();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EditUserModal({
  user,
  isSuperAdmin,
  onClose,
  onSave,
}: {
  user: Profile;
  isSuperAdmin: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Profile>) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [username, setUsername] = useState(user.username ?? "");
  const email = user.email ?? "";
  const [phone, setPhone] = useState(user.phone ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [role, setRole] = useState<UserRole>(user.role);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      full_name: fullName || null,
      username: username || null,
      phone: phone || null,
      bio: bio || null,
      role,
      status,
    });
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <UserCog className="h-5 w-5 text-primary" /> Edit User
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-fullname">Full Name</Label>
              <Input
                id="edit-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email (read-only)</Label>
            <Input
              id="edit-email"
              value={email}
              disabled
              className="opacity-60"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <Input
                id="edit-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <select
                id="edit-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={!isSuperAdmin && role === "super_admin"}
                className="h-10 w-full rounded-lg border border-input bg-secondary/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {ROLES.map((r) => (
                  <option
                    key={r}
                    value={r}
                    disabled={r === "super_admin" && !isSuperAdmin}
                  >
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="h-10 w-full rounded-lg border border-input bg-secondary/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
