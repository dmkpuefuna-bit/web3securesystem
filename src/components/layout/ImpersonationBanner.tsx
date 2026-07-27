import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';

export function ImpersonationBanner() {
  const { impersonating, profile, stopImpersonation } = useAuthStore();
  const navigate = useNavigate();
  const [exiting, setExiting] = useState(false);

  if (!impersonating) return null;

  const handleExit = async () => {
    setExiting(true);
    await stopImpersonation();
    setExiting(false);
    navigate('/admin/users');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-destructive/30 bg-destructive/10 px-4 py-3 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/20 text-destructive">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-destructive">
              You are currently impersonating this user.
            </p>
            <p className="text-xs text-muted-foreground">
              Viewing as {profile?.full_name ?? profile?.email ?? 'user'}. All actions are logged.
            </p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleExit} disabled={exiting}>
          {exiting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          Exit Impersonation
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
