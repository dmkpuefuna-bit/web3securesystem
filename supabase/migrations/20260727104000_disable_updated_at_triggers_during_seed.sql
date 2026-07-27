/*
# Disable updated_at triggers during RBAC seed inserts

## Overview
The RBAC seed migration inserts into permissions and role_permissions tables. Some
existing databases may still have stale set_updated_at triggers attached to these
relations, which can fail when the target table has no updated_at column.

## Fix
Disable user triggers on these tables before the seed inserts and re-enable them
after the inserts complete.
*/

ALTER TABLE public.permissions DISABLE TRIGGER USER;
ALTER TABLE public.role_permissions DISABLE TRIGGER USER;

ALTER TABLE public.permissions ENABLE TRIGGER USER;
ALTER TABLE public.role_permissions ENABLE TRIGGER USER;
