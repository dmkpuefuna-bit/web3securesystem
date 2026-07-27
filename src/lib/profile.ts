import { supabase } from "@/lib/supabase";
import type { Profile, UserRole, UserStatus } from "@/lib/types";

export async function getOrCreateProfile(
  userId: string,
  email: string | null,
  fallbackRole: UserRole = "user",
  fallbackStatus: UserStatus = "active",
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!error) {
    return data as Profile;
  }

  if (error.code !== "PGRST116") {
    throw error;
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    user_id: userId,
    email: email ?? "",
    role: fallbackRole,
    status: fallbackStatus,
  });

  if (insertError && insertError.code !== "23505") {
    throw insertError;
  }

  const { data: created, error: readError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (readError) {
    throw readError;
  }

  return created as Profile;
}
