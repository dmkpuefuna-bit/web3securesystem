/*
# Reset impersonation_sessions policies safely

## Overview
Some environments already have the RBAC impersonation policies created, which
causes this migration to fail with duplicate policy names.

## Fix
Drop any existing impersonation-related policies before recreating them.
*/

DROP POLICY IF EXISTS "impersonation_sessions_admin_only" ON public.impersonation_sessions;
DROP POLICY IF EXISTS "impersonation_sessions_insert_admin" ON public.impersonation_sessions;
DROP POLICY IF EXISTS "impersonation_sessions_delete_admin" ON public.impersonation_sessions;
DROP POLICY IF EXISTS "imp_select_super_admin" ON public.impersonation_sessions;
DROP POLICY IF EXISTS "imp_insert_super_admin" ON public.impersonation_sessions;
DROP POLICY IF EXISTS "imp_update_super_admin" ON public.impersonation_sessions;
DROP POLICY IF EXISTS "imp_delete_super_admin" ON public.impersonation_sessions;

CREATE POLICY "imp_select_super_admin"
  ON public.impersonation_sessions FOR SELECT TO authenticated USING (
    public.is_super_admin()
  );

CREATE POLICY "imp_insert_super_admin"
  ON public.impersonation_sessions FOR INSERT TO authenticated WITH CHECK (
    public.is_super_admin()
  );

CREATE POLICY "imp_update_super_admin"
  ON public.impersonation_sessions FOR UPDATE TO authenticated USING (
    public.is_super_admin()
  ) WITH CHECK (
    public.is_super_admin()
  );

CREATE POLICY "imp_delete_super_admin"
  ON public.impersonation_sessions FOR DELETE TO authenticated USING (
    public.is_super_admin()
  );
