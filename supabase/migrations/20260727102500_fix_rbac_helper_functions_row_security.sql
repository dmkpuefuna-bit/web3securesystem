/*
# Fix RBAC Helper Functions for Row Level Security

## Overview
This migration recreates the RBAC helper functions used by policies so they bypass
row-level security safely when they query the profiles table.

## Why
Some profile policies call these helper functions, and they must query the profiles
table without re-triggering profiles row-level security.

## Fix
- Recreate `public.is_admin()`
- Recreate `public.is_super_admin()`
- Recreate `public.is_staff()`
- Recreate `public.can()`
- Recreate `public.log_audit()`

All functions are created as SECURITY DEFINER and use `row_security = off`.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND status = 'active'
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
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND status = 'active'
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
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'moderator', 'support')
      AND status = 'active'
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
    WHERE pr.user_id = auth.uid()
      AND p.name = action
      AND pr.status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.log_audit(
  p_action text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL,
  p_old_value jsonb DEFAULT NULL,
  p_new_value jsonb DEFAULT NULL,
  p_target_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  SET LOCAL row_security = off;
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    details,
    old_value,
    new_value,
    target_user_id
  ) VALUES (
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_details,
    p_old_value,
    p_new_value,
    p_target_user_id
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
