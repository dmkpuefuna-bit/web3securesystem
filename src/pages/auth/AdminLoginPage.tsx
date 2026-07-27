import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import { getOrCreateProfile } from "@/lib/profile";
import type { Profile } from "@/lib/types";
import { hasRoleAccess } from "@/lib/types";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { initialize } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    "/admin";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.user) {
      let effectiveProfile: Profile | null = null;

      try {
        effectiveProfile = await getOrCreateProfile(data.user.id, data.user.email ?? null);
      } catch (profileError) {
        await supabase.auth.signOut();
        setError(
          (profileError as Error).message ||
            "Unable to verify your profile. Please try again.",
        );
        return;
      }

      if (!effectiveProfile) {
        await supabase.auth.signOut();
        setError("Unable to locate your admin profile. Contact a Super Admin.");
        return;
      }

      if (effectiveProfile.status?.toLowerCase() !== "active") {
        await supabase.auth.signOut();
        setError("Your account is not active. Contact a Super Admin.");
        return;
      }

      if (
        !hasRoleAccess(
          effectiveProfile.role as
            | "super_admin"
            | "admin"
            | "moderator"
            | "support"
            | "user",
          "admin",
        )
      ) {
        await supabase.auth.signOut();
        setError(
          "You do not have admin privileges. This portal is restricted to staff accounts.",
        );
        return;
      }
    }

    await initialize();
    navigate(from);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary-500/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass rounded-2xl border border-white/10 p-8 shadow-2xl">
          <Link
            to="/"
            className="mb-2 flex items-center justify-center gap-2.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-700 shadow-lg shadow-primary-500/30">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold">
              Web3<span className="gradient-text">SecureSystem</span>
            </span>
          </Link>

          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Admin Portal</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Restricted access — staff and administrators only
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign In to Admin Portal <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link
              to="/login"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to user login
            </Link>
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
