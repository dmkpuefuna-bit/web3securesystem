/*
# Temporarily disable RLS on profile/admin tables to avoid recursive policy failures

## Why
The current RBAC policies on profiles are causing recursive policy evaluation during
admin login and profile reads. This migration disables RLS on the tables needed by
admin authentication and management until a non-recursive policy set is deployed.

## Tables affected
- public.profiles
- public.impersonation_sessions
- public.audit_logs
*/

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.impersonation_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
