import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Image,
  Activity,
  Bell,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  Star,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";
import { useAuthStore } from "@/store/auth-store";
import { cn, formatAddress } from "@/lib/utils";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Wallets", icon: Wallet, path: "/dashboard/wallets" },
  { label: "Send Crypto", icon: ArrowUpRight, path: "/dashboard/send" },
  { label: "Receive", icon: ArrowDownLeft, path: "/dashboard/receive" },
  { label: "Transactions", icon: Activity, path: "/dashboard/transactions" },
  { label: "Watchlist", icon: Star, path: "/dashboard/watchlist" },
  { label: "NFTs", icon: Image, path: "/dashboard/nfts" },
  { label: "Staking", icon: TrendingUp, path: "/dashboard/staking" },
  { label: "Settings", icon: Settings, path: "/dashboard/settings" },
];

export function DashboardLayout() {
  const { profile, user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 border-r border-border bg-card/80 backdrop-blur-xl transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          <Link
            to="/"
            className="flex items-center gap-2.5 border-b border-border px-6 py-5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-700 shadow-lg shadow-primary-500/30">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">
              Web3<span className="gradient-text">SecureSystem</span>
            </span>
          </Link>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
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

          {profile?.role === "admin" && (
            <div className="border-t border-border p-4">
              <Link
                to="/admin"
                className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-primary-500/10 to-primary-700/10 px-3 py-2.5 text-sm font-medium text-primary transition-all hover:from-primary-500/20 hover:to-primary-700/20"
              >
                <LayoutDashboard className="h-4 w-4" />
                Admin Panel
              </Link>
            </div>
          )}

          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                {(profile?.full_name || user?.email || "U")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {profile?.full_name || "User"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email && formatAddress(user.email, 12)}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
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

      {/* Main content */}
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
          <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
