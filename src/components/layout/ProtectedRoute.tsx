import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/lib/types';
import { hasRoleAccess } from '@/lib/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireRole?: UserRole;
}

export function ProtectedRoute({ children, requireAdmin = false, requireRole }: ProtectedRouteProps) {
  const { user, profile, loading, initialized } = useAuthStore();
  const location = useLocation();

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireRole && !hasRoleAccess(profile?.role, requireRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireAdmin && !hasRoleAccess(profile?.role, 'admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
