/*
# RBAC System: Seed Roles, Permissions, Enhance Impersonation & Audit

## Overview
Seeds the existing normalized RBAC tables (roles, permissions, role_permissions)
with a 5-role hierarchy. Enhances the existing impersonation_sessions table.
Enhances audit_logs with change-tracking columns. Adds helper functions.

## Changes
1. Seeds roles: super_admin, admin, moderator, support, user
2. Seeds 38 permissions across all modules
3. Seeds role→permission mappings
4. Updates profiles.role CHECK constraint for 5 roles
5. Adds reason/started_at/ended_at/is_active to impersonation_sessions
6. Enhances audit_logs with old_value, new_value, target_user_id
7. Creates helper functions: is_admin(), is_super_admin(), can(), log_audit()
8. Updates RLS on profiles, wallets, transactions, nfts for staff access
*/

-- ============================================================
-- 1. ADD UNIQUE CONSTRAINT ON roles.name
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_name_key' AND conrelid = 'public.roles'::regclass) THEN
    ALTER TABLE public.roles ADD CONSTRAINT roles_name_key UNIQUE (name);
  END IF;
END $$;

-- ============================================================
-- 2. SEED ROLES
-- ============================================================

INSERT INTO public.roles (id, name, description, is_system) VALUES
  (gen_random_uuid(), 'super_admin', 'Full platform access including role management', true),
  (gen_random_uuid(), 'admin', 'Manage users, wallets, content, support', true),
  (gen_random_uuid(), 'moderator', 'Moderate users and support tickets', true),
  (gen_random_uuid(), 'support', 'View data and manage support tickets', true),
  (gen_random_uuid(), 'user', 'Standard user with own-data access only', true)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  is_system = EXCLUDED.is_system;

-- ============================================================
-- 3. SEED PERMISSIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = TG_TABLE_SCHEMA
      AND table_name = TG_TABLE_NAME
      AND column_name = 'updated_at'
  ) THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.permissions;
DROP TRIGGER IF EXISTS set_updated_at ON public.role_permissions;

ALTER TABLE public.permissions DISABLE TRIGGER USER;
ALTER TABLE public.role_permissions DISABLE TRIGGER USER;

INSERT INTO public.permissions (id, name, description) VALUES
  (gen_random_uuid(), 'users.create', 'Create new user accounts'),
  (gen_random_uuid(), 'users.read', 'View all users'),
  (gen_random_uuid(), 'users.update', 'Edit any user profile'),
  (gen_random_uuid(), 'users.delete', 'Delete user accounts'),
  (gen_random_uuid(), 'users.suspend', 'Suspend users'),
  (gen_random_uuid(), 'users.ban', 'Ban users'),
  (gen_random_uuid(), 'users.reactivate', 'Reactivate suspended/banned users'),
  (gen_random_uuid(), 'users.restore', 'Restore deleted users'),
  (gen_random_uuid(), 'users.reset_password', 'Reset user passwords'),
  (gen_random_uuid(), 'users.verify', 'Verify user emails'),
  (gen_random_uuid(), 'roles.assign', 'Assign roles to users'),
  (gen_random_uuid(), 'roles.remove', 'Remove roles from users'),
  (gen_random_uuid(), 'roles.manage_permissions', 'Manage role permissions'),
  (gen_random_uuid(), 'admin.create', 'Create admin accounts'),
  (gen_random_uuid(), 'admin.delete', 'Delete admin accounts'),
  (gen_random_uuid(), 'admin.promote_super', 'Promote to super_admin'),
  (gen_random_uuid(), 'admin.demote_super', 'Demote super_admin'),
  (gen_random_uuid(), 'impersonate.start', 'Impersonate any user'),
  (gen_random_uuid(), 'impersonate.end', 'End impersonation session'),
  (gen_random_uuid(), 'wallets.read', 'View all wallets'),
  (gen_random_uuid(), 'wallets.update', 'Update wallet labels and settings'),
  (gen_random_uuid(), 'wallets.disconnect', 'Disconnect wallets'),
  (gen_random_uuid(), 'wallets.sync', 'Trigger wallet synchronization'),
  (gen_random_uuid(), 'wallets.refresh_balances', 'Refresh wallet balances'),
  (gen_random_uuid(), 'wallets.refresh_nfts', 'Refresh NFT holdings'),
  (gen_random_uuid(), 'transactions.read', 'View all transactions'),
  (gen_random_uuid(), 'transactions.create', 'Record new transactions'),
  (gen_random_uuid(), 'settings.manage', 'Manage platform settings'),
  (gen_random_uuid(), 'blockchains.manage', 'Manage blockchain networks'),
  (gen_random_uuid(), 'audit.read', 'View audit logs'),
  (gen_random_uuid(), 'cms.manage', 'Manage CMS content'),
  (gen_random_uuid(), 'announcements.manage', 'Manage announcements'),
  (gen_random_uuid(), 'notifications.manage', 'Manage notifications'),
  (gen_random_uuid(), 'api_keys.manage', 'Manage API keys'),
  (gen_random_uuid(), 'support.manage', 'Manage support tickets'),
  (gen_random_uuid(), 'analytics.view', 'View platform analytics'),
  (gen_random_uuid(), 'self.read', 'View own profile'),
  (gen_random_uuid(), 'self.update', 'Update own profile')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

ALTER TABLE public.permissions ENABLE TRIGGER USER;
ALTER TABLE public.role_permissions ENABLE TRIGGER USER;

-- ============================================================
-- 4. SEED ROLE_PERMISSIONS
-- ============================================================

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r CROSS JOIN public.permissions p
WHERE
  (r.name = 'super_admin') OR
  (r.name = 'admin' AND p.name IN (
    'users.read', 'users.update', 'users.suspend', 'users.ban', 'users.reactivate',
    'wallets.read', 'wallets.update', 'wallets.sync', 'wallets.refresh_balances', 'wallets.refresh_nfts',
    'transactions.read', 'support.manage', 'cms.manage', 'analytics.view', 'audit.read'
  )) OR
  (r.name = 'moderator' AND p.name IN (
    'users.read', 'users.suspend', 'users.reactivate',
    'wallets.read', 'transactions.read', 'support.manage'
  )) OR
  (r.name = 'support' AND p.name IN (
    'users.read', 'wallets.read', 'transactions.read', 'support.manage'
  )) OR
  (r.name = 'user' AND p.name IN ('self.read', 'self.update', 'transactions.create'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================
-- 5. UPDATE PROFILES CONSTRAINTS
-- ============================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'moderator', 'support', 'user'));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('active', 'suspended', 'banned', 'deleted'));

-- ============================================================
-- 6. ENHANCE IMPERSONATION_SESSIONS (existing table)
-- ============================================================

ALTER TABLE public.impersonation_sessions
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_impersonation_active ON public.impersonation_sessions (is_active);

-- Update RLS: restrict to super_admin only
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

-- ============================================================
-- 7. ENHANCE AUDIT_LOGS
-- ============================================================

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS old_value jsonb,
  ADD COLUMN IF NOT EXISTS new_value jsonb,
  ADD COLUMN IF NOT EXISTS target_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs (target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at DESC);

-- ============================================================
-- 8. HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin') AND status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid()
    AND role = 'super_admin' AND status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'moderator', 'support') AND status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.can(action text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.roles r ON r.id = rp.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    JOIN public.profiles pr ON pr.role = r.name
    WHERE pr.user_id = auth.uid() AND p.name = action AND pr.status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.log_audit(
  p_action text, p_entity_type text DEFAULT NULL, p_entity_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL, p_old_value jsonb DEFAULT NULL,
  p_new_value jsonb DEFAULT NULL, p_target_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  SET LOCAL row_security = off;
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details, old_value, new_value, target_user_id)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details, p_old_value, p_new_value, p_target_user_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ============================================================
-- 9. RLS POLICY UPDATES FOR STAFF ACCESS
-- ============================================================

-- Profiles: staff can read all, admins can update all
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;
CREATE POLICY "admin_read_all_profiles"
  ON public.profiles FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "admin_update_all_profiles" ON public.profiles;
CREATE POLICY "admin_update_all_profiles"
  ON public.profiles FOR UPDATE TO authenticated USING (
    auth.uid() = user_id
    OR public.is_admin()
  ) WITH CHECK (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- Wallets: staff can read all, admins can update
DROP POLICY IF EXISTS "staff_read_all_wallets" ON public.wallets;
CREATE POLICY "staff_read_all_wallets"
  ON public.wallets FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "admin_update_all_wallets" ON public.wallets;
CREATE POLICY "admin_update_all_wallets"
  ON public.wallets FOR UPDATE TO authenticated USING (
    auth.uid() = user_id
    OR public.is_admin()
  ) WITH CHECK (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- Transactions: staff can read all, users can insert own
DROP POLICY IF EXISTS "staff_read_all_transactions" ON public.transactions;
CREATE POLICY "staff_read_all_transactions"
  ON public.transactions FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "user_insert_own_transactions" ON public.transactions;
CREATE POLICY "user_insert_own_transactions"
  ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- NFTs: staff can read all
DROP POLICY IF EXISTS "staff_read_all_nfts" ON public.nfts;
CREATE POLICY "staff_read_all_nfts"
  ON public.nfts FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR public.is_staff()
  );
