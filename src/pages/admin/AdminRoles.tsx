import { useEffect, useState, useMemo } from "react";
import { Loader2, Search, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import type { Profile, UserRole, UserStatus } from "@/lib/types";

const ROLES: UserRole[] = ["super_admin", "admin", "moderator", "support", "user"];
const STATUSES: UserStatus[] = ["active", "suspended", "banned", "deleted"];

export function AdminRoles() {
  const { profile: adminProfile } = useAuthStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [pendingChanges, setPendingChanges] = useState<
    Record<
      string,
      {
        role: UserRole;
        status: UserStatus;
      }
    >
  >({});

  const isSuperAdmin = adminProfile?.role === "super_admin";

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setProfiles([]);
    } else {
      setProfiles((data as Profile[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      if (roleFilter !== "all" && profile.role !== roleFilter) return false;
      if (statusFilter !== "all" && profile.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        profile.email.toLowerCase().includes(term) ||
        profile.full_name?.toLowerCase().includes(term) ||
        profile.username?.toLowerCase().includes(term) ||
        profile.role.toLowerCase().includes(term)
      );
    });
  }, [profiles, roleFilter, statusFilter, search]);

  const canUpdateRole = (currentRole: UserRole, newRole: UserRole) => {
    if (newRole === "super_admin" && !isSuperAdmin) return false;
    if (currentRole === "super_admin" && !isSuperAdmin) return false;
    return true;
  };

  const handleChange = (
    userId: string,
    field: "role" | "status",
    value: UserRole | UserStatus,
  ) => {
    setPendingChanges((prev) => ({
      ...prev,
      [userId]: {
        role:
          field === "role"
            ? (value as UserRole)
            : prev[userId]?.role ??
              profiles.find((profile) => profile.user_id === userId)?.role ??
              "user",
        status:
          field === "status"
            ? (value as UserStatus)
            : prev[userId]?.status ??
              profiles.find((profile) => profile.user_id === userId)?.status ??
              "active",
      },
    }));
  };

  const saveRoleUpdate = async (userId: string) => {
    const profile = profiles.find((item) => item.user_id === userId);
    const pending = pendingChanges[userId];
    if (!profile || !pending) return;

    if (!canUpdateRole(profile.role, pending.role)) {
      setError("Only Super Admins can change Super Admin assignments.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase
      .from("profiles")
      .update({ role: pending.role, status: pending.status })
      .eq("user_id", userId);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(`Updated ${profile.email} to ${pending.role} / ${pending.status}`);
      setPendingChanges((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      await loadProfiles();
    }

    setLoading(false);
    window.setTimeout(() => setSuccess(null), 4000);
  };

  const getPending = (userId: string) => {
    return pendingChanges[userId] ?? {
      role: profiles.find((item) => item.user_id === userId)?.role ?? "user",
      status: profiles.find((item) => item.user_id === userId)?.status ?? "active",
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Role Assignment</h1>
        <p className="text-sm text-muted-foreground">
          Promote or demote users and manage role/status assignments from here.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search by email, name, username, role"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
          className="h-10 rounded-lg border border-input bg-secondary/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Roles</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as UserStatus | "all")}
          className="h-10 rounded-lg border border-input bg-secondary/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>{success}</span>
          </div>
        </div>
      )}

      <Card className="glass">
        <CardHeader>
          <CardTitle>Profiles ({filteredProfiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-80 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredProfiles.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No profiles match your filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((profile) => {
                    const pending = getPending(profile.user_id);
                    const disabled =
                      profile.role === "super_admin" && !isSuperAdmin;
                    return (
                      <tr key={profile.user_id} className="border-b border-border/50">
                        <td className="px-4 py-3 text-sm text-foreground">
                          {profile.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {profile.full_name ?? profile.username ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={pending.role}
                            onChange={(e) =>
                              handleChange(
                                profile.user_id,
                                "role",
                                e.target.value as UserRole,
                              )
                            }
                            disabled={
                              !isSuperAdmin &&
                              (pending.role === "super_admin" ||
                                profile.role === "super_admin")
                            }
                            className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {ROLES.filter(
                              (role) => isSuperAdmin || role !== "super_admin",
                            ).map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={pending.status}
                            onChange={(e) =>
                              handleChange(
                                profile.user_id,
                                "status",
                                e.target.value as UserStatus,
                              )
                            }
                            className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(profile.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            onClick={() => saveRoleUpdate(profile.user_id)}
                            disabled={
                              disabled ||
                              (pending.role === profile.role &&
                                pending.status === profile.status)
                            }
                          >
                            Save
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
