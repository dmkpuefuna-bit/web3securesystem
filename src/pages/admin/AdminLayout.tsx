import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Wallet,
  Activity,
  Image,
  TrendingUp,
  Settings as SettingsIcon,
  FileText,
  HelpCircle,
  MessageSquare,
  Megaphone,
  Mail,
  Shield,
  BarChart3,
  Link2,
  Bell,
  LogOut,
  Menu,
  ChevronRight,
  Home,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { cn, formatAddress } from "@/lib/utils";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";

const adminNav = [
  { label: "Overview", icon: BarChart3, path: "/admin" },
  { label: "Users", icon: Users, path: "/admin/users" },
  { label: "Roles", icon: Shield, path: "/admin/roles" },
  { label: "Wallets", icon: Wallet, path: "/admin/wallets" },
  { label: "Transactions", icon: Activity, path: "/admin/transactions" },
  { label: "NFTs", icon: Image, path: "/admin/nfts" },
  { label: "Staking", icon: TrendingUp, path: "/admin/staking" },
  { label: "Blog", icon: FileText, path: "/admin/blog" },
  { label: "FAQ", icon: HelpCircle, path: "/admin/faq" },
  { label: "Testimonials", icon: MessageSquare, path: "/admin/testimonials" },
  { label: "Announcements", icon: Megaphone, path: "/admin/announcements" },
  { label: "Newsletter", icon: Mail, path: "/admin/newsletter" },
  { label: "Notifications", icon: Bell, path: "/admin/notifications" },
  { label: "Support", icon: HelpCircle, path: "/admin/support" },
  { label: "Settings", icon: SettingsIcon, path: "/admin/settings" },
  { label: "Audit Logs", icon: Shield, path: "/admin/audit-logs" },
  { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { label: "Blockchains", icon: Link2, path: "/admin/blockchains" },
];

export function AdminLayout() {
  const { profile, user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) =>
    path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 border-r border-border bg-card/80 backdrop-blur-xl transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          <Link
            to="/admin"
            className="flex items-center gap-2.5 border-b border-border px-6 py-5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-700 shadow-lg shadow-primary-500/30">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold">Admin Panel</span>
              <p className="text-xs text-muted-foreground">Web3SecureSystem</p>
            </div>
          </Link>

          <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
            {adminNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  isActive(item.path)
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {isActive(item.path) && (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
              </Link>
            ))}
          </nav>

          <div className="border-t border-border p-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Home className="h-4 w-4" /> Back to Dashboard
            </Link>
            <button
              onClick={handleSignOut}
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-destructive"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {(profile?.full_name || user?.email || "A")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">
                  {profile?.full_name ?? "Admin"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email && formatAddress(user.email, 12)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <ImpersonationBanner />
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground">Admin Mode</span>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
