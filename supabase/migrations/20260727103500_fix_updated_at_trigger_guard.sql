/*
# Fix updated_at trigger guard for tables without updated_at columns

## Overview
Some tables in this schema (such as permissions and role_permissions) do not have
an updated_at column. Older trigger definitions could still try to access
NEW.updated_at and fail during inserts.

## Fix
- Recreate the trigger function so it only writes NEW.updated_at when the target
  table actually has an updated_at column.
- Remove any stale set_updated_at triggers from tables that do not have updated_at.
*/

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
