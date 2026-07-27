import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import { getOrCreateProfile } from "@/lib/profile";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  impersonating: boolean;
  impersonatedUserId: string | null;
  impersonatedProfile: Profile | null;
  effectiveUserId: string | null;
  originalUser: User | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  startImpersonation: (
    targetUserId: string,
    reason?: string,
  ) => Promise<boolean>;
  stopImpersonation: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  impersonating: false,
  impersonatedUserId: null,
  impersonatedProfile: null,
  effectiveUserId: null,
  originalUser: null,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      effectiveUserId: session?.user?.id ?? null,
      impersonating: false,
      impersonatedUserId: null,
      impersonatedProfile: null,
      originalUser: null,
    }),

  setProfile: (profile) => set({ profile }),

  setLoading: (loading) => set({ loading }),

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null });

      supabase.auth.onAuthStateChange((event, session) => {
        set({
          session,
          user: session?.user ?? null,
          effectiveUserId: session?.user?.id ?? null,
          impersonating: false,
          impersonatedUserId: null,
          impersonatedProfile: null,
          originalUser: null,
        });
        if (event === "SIGNED_OUT") {
          set({ profile: null });
        }
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          (async () => {
            try {
              await get().refreshProfile();
            } catch {
              // ignore profile refresh errors
            }
          })();
        }
      });

      if (session?.user) {
        try {
          await get().refreshProfile();
        } catch {
          // ignore profile fetch errors
        }
      }
    } catch {
      // Supabase not configured or network error — allow app to render anyway
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const profile = await getOrCreateProfile(user.id, user.email ?? null);
      set({ profile });
    } catch {
      // ignore — profile fetch is non-critical
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      profile: null,
      impersonating: false,
      originalUser: null,
    });
  },

  startImpersonation: async (targetUserId: string, reason?: string) => {
    const { user } = get();
    if (!user) {
      console.error("startImpersonation: No logged-in user");
      return false;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", targetUserId)
      .single();

    if (profileError) {
      console.error("startImpersonation: Failed to fetch target profile", profileError);
      return false;
    }

    if (!profileData) {
      console.error("startImpersonation: Target profile not found");
      return false;
    }

    const targetProfile = profileData as Profile;
    if (targetProfile.status !== "active") {
      console.error(`startImpersonation: Target profile status is "${targetProfile.status}", not "active"`);
      return false;
    }

    const { error: insertError } = await supabase.from("impersonation_sessions").insert({
      admin_id: user.id,
      target_user_id: targetUserId,
      reason: reason ?? null,
      started_at: new Date().toISOString(),
      is_active: true,
    });

    if (insertError) {
      console.error("startImpersonation: Failed to insert impersonation session", {
        message: insertError.message,
        code: insertError.code,
        hint: insertError.hint,
        details: insertError.details,
        fullError: insertError,
      });
      return false;
    }

    try {
      await supabase.rpc("log_audit", {
        p_action: "impersonation.started",
        p_target_user_id: targetUserId,
        p_details: { reason: reason ?? null } as unknown as never,
      });
    } catch (auditError) {
      console.warn("startImpersonation: Failed to log audit (non-critical)", auditError);
    }

    set({
      impersonating: true,
      originalUser: user,
      impersonatedUserId: targetUserId,
      impersonatedProfile: targetProfile,
      profile: targetProfile,
      effectiveUserId: targetUserId,
    });

    return true;
  },

  stopImpersonation: async () => {
    const { originalUser } = get();
    if (!originalUser) return;

    const { data: activeSessions } = await supabase
      .from("impersonation_sessions")
      .select("id, target_user_id")
      .eq("admin_id", originalUser.id)
      .eq("is_active", true);

    if (activeSessions && activeSessions.length > 0) {
      for (const session of activeSessions) {
        await supabase
          .from("impersonation_sessions")
          .update({ ended_at: new Date().toISOString(), is_active: false })
          .eq("id", session.id);

        await supabase.rpc("log_audit", {
          p_action: "impersonation.ended",
          p_target_user_id: session.target_user_id,
        });
      }
    }

    set({
      impersonating: false,
      impersonatedUserId: null,
      impersonatedProfile: null,
      originalUser: null,
      effectiveUserId: originalUser.id,
    });

    try {
      await get().refreshProfile();
    } catch {
      // ignore refresh failures
    }
  },
}));
