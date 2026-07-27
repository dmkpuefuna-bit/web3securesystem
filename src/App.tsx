import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { SignupPage } from "@/pages/auth/SignupPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { AdminLoginPage } from "@/pages/auth/AdminLoginPage";
import { SignInPage } from "@/pages/auth/SignInPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { DashboardLayout } from "@/pages/dashboard/DashboardLayout";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { formatAddress, formatCurrency, timeAgo } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const OverviewPage = lazy(() =>
  import("@/pages/dashboard/OverviewPage").then((m) => ({
    default: m.OverviewPage,
  })),
);
const WalletsPage = lazy(() =>
  import("@/pages/dashboard/WalletsPage").then((m) => ({
    default: m.WalletsPage,
  })),
);
const TransactionsPage = lazy(() =>
  import("@/pages/dashboard/TransactionsPage").then((m) => ({
    default: m.TransactionsPage,
  })),
);
const WatchlistPage = lazy(() =>
  import("@/pages/dashboard/WatchlistPage").then((m) => ({
    default: m.WatchlistPage,
  })),
);
const NftsPage = lazy(() =>
  import("@/pages/dashboard/NftsPage").then((m) => ({ default: m.NftsPage })),
);
const StakingPage = lazy(() =>
  import("@/pages/dashboard/StakingPage").then((m) => ({
    default: m.StakingPage,
  })),
);
const SettingsPage = lazy(() =>
  import("@/pages/dashboard/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);
const SendCryptoPage = lazy(() =>
  import("@/pages/dashboard/SendCryptoPage").then((m) => ({
    default: m.SendCryptoPage,
  })),
);
const ReceiveCryptoPage = lazy(() =>
  import("@/pages/dashboard/ReceiveCryptoPage").then((m) => ({
    default: m.ReceiveCryptoPage,
  })),
);
const AdminOverview = lazy(() =>
  import("@/pages/admin/AdminOverview").then((m) => ({
    default: m.AdminOverview,
  })),
);
const AdminUsers = lazy(() =>
  import("@/pages/admin/AdminUsers").then((m) => ({ default: m.AdminUsers })),
);
const AdminBlog = lazy(() =>
  import("@/pages/admin/AdminBlog").then((m) => ({ default: m.AdminBlog })),
);
const AdminFaq = lazy(() =>
  import("@/pages/admin/AdminFaq").then((m) => ({ default: m.AdminFaq })),
);
const AdminTestimonials = lazy(() =>
  import("@/pages/admin/AdminTestimonials").then((m) => ({
    default: m.AdminTestimonials,
  })),
);
const AdminAnnouncements = lazy(() =>
  import("@/pages/admin/AdminAnnouncements").then((m) => ({
    default: m.AdminAnnouncements,
  })),
);
const AdminNewsletter = lazy(() =>
  import("@/pages/admin/AdminNewsletter").then((m) => ({
    default: m.AdminNewsletter,
  })),
);
const AdminSettings = lazy(() =>
  import("@/pages/admin/AdminSettings").then((m) => ({
    default: m.AdminSettings,
  })),
);
const AdminAuditLogs = lazy(() =>
  import("@/pages/admin/AdminAuditLogs").then((m) => ({
    default: m.AdminAuditLogs,
  })),
);
const AdminBlockchains = lazy(() =>
  import("@/pages/admin/AdminBlockchains").then((m) => ({
    default: m.AdminBlockchains,
  })),
);
const AdminDataViewer = lazy(() =>
  import("@/pages/admin/AdminDataViewer").then((m) => ({
    default: m.AdminDataViewer,
  })),
);
const AdminWallets = lazy(() =>
  import("@/pages/admin/AdminWallets").then((m) => ({
    default: m.AdminWallets,
  })),
);
const AdminRoles = lazy(() =>
  import("@/pages/admin/AdminRoles").then((m) => ({
    default: m.AdminRoles,
  })),
);
const AdminNotifications = lazy(() =>
  import("@/pages/admin/AdminNotifications").then((m) => ({
    default: m.AdminNotifications,
  })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signin" element={<SignInPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <OverviewPage />
                </Suspense>
              }
            />
            <Route
              path="wallets"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <WalletsPage />
                </Suspense>
              }
            />
            <Route
              path="transactions"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <TransactionsPage />
                </Suspense>
              }
            />
            <Route
              path="watchlist"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <WatchlistPage />
                </Suspense>
              }
            />
            <Route
              path="nfts"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <NftsPage />
                </Suspense>
              }
            />
            <Route
              path="staking"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <StakingPage />
                </Suspense>
              }
            />
            <Route
              path="send"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <SendCryptoPage />
                </Suspense>
              }
            />
            <Route
              path="receive"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <ReceiveCryptoPage />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <SettingsPage />
                </Suspense>
              }
            />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminOverview />
                </Suspense>
              }
            />
            <Route
              path="users"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminUsers />
                </Suspense>
              }
            />
            <Route
              path="wallets"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminWallets />
                </Suspense>
              }
            />
            <Route
              path="transactions"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminDataViewer
                    title="Transactions"
                    description="View all platform transactions"
                    table="transactions"
                    searchKeys={["tx_hash", "type"]}
                    columns={[
                      {
                        key: "tx_hash",
                        label: "Hash",
                        render: (r) => (
                          <code className="text-xs">
                            {formatAddress(r.tx_hash as string, 10)}
                          </code>
                        ),
                      },
                      {
                        key: "type",
                        label: "Type",
                        render: (r) => (
                          <Badge variant="secondary">{String(r.type)}</Badge>
                        ),
                      },
                      { key: "direction", label: "Direction" },
                      { key: "amount", label: "Amount" },
                      {
                        key: "usd_value",
                        label: "USD Value",
                        render: (r) => formatCurrency(r.usd_value as number),
                      },
                      {
                        key: "status",
                        label: "Status",
                        render: (r) => (
                          <Badge
                            variant={
                              r.status === "confirmed" ? "success" : "warning"
                            }
                          >
                            {String(r.status)}
                          </Badge>
                        ),
                      },
                      {
                        key: "timestamp",
                        label: "Time",
                        render: (r) => timeAgo(r.timestamp as string),
                      },
                    ]}
                  />
                </Suspense>
              }
            />
            <Route
              path="nfts"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminDataViewer
                    title="NFTs"
                    description="View all NFT holdings"
                    table="nfts"
                    searchKeys={["token_id", "name"]}
                    columns={[
                      { key: "name", label: "Name" },
                      { key: "token_id", label: "Token ID" },
                      {
                        key: "floor_price",
                        label: "Floor Price",
                        render: (r) =>
                          r.floor_price
                            ? formatCurrency(r.floor_price as number)
                            : "—",
                      },
                      {
                        key: "created_at",
                        label: "Added",
                        render: (r) => timeAgo(r.created_at as string),
                      },
                    ]}
                  />
                </Suspense>
              }
            />
            <Route
              path="staking"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminDataViewer
                    title="Staking"
                    description="View all staking positions"
                    table="staking"
                    searchKeys={["protocol", "status"]}
                    columns={[
                      { key: "protocol", label: "Protocol" },
                      { key: "staked_amount", label: "Staked" },
                      { key: "rewards_earned", label: "Rewards" },
                      {
                        key: "apy",
                        label: "APY",
                        render: (r) => (r.apy ? `${r.apy}%` : "—"),
                      },
                      {
                        key: "status",
                        label: "Status",
                        render: (r) => (
                          <Badge
                            variant={
                              r.status === "active" ? "success" : "secondary"
                            }
                          >
                            {String(r.status)}
                          </Badge>
                        ),
                      },
                      {
                        key: "created_at",
                        label: "Created",
                        render: (r) => timeAgo(r.created_at as string),
                      },
                    ]}
                  />
                </Suspense>
              }
            />
            <Route
              path="blog"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminBlog />
                </Suspense>
              }
            />
            <Route
              path="faq"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminFaq />
                </Suspense>
              }
            />
            <Route
              path="testimonials"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminTestimonials />
                </Suspense>
              }
            />
            <Route
              path="announcements"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminAnnouncements />
                </Suspense>
              }
            />
            <Route
              path="newsletter"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminNewsletter />
                </Suspense>
              }
            />
            <Route
              path="notifications"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminNotifications />
                </Suspense>
              }
            />
            <Route
              path="roles"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminRoles />
                </Suspense>
              }
            />
            <Route
              path="support"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminDataViewer
                    title="Support Tickets"
                    description="Manage support tickets"
                    table="support_tickets"
                    searchKeys={["subject", "status"]}
                    columns={[
                      { key: "subject", label: "Subject" },
                      { key: "category", label: "Category" },
                      {
                        key: "priority",
                        label: "Priority",
                        render: (r) => (
                          <Badge
                            variant={
                              r.priority === "high"
                                ? "destructive"
                                : r.priority === "medium"
                                  ? "warning"
                                  : "secondary"
                            }
                          >
                            {String(r.priority)}
                          </Badge>
                        ),
                      },
                      {
                        key: "status",
                        label: "Status",
                        render: (r) => (
                          <Badge
                            variant={
                              r.status === "open" ? "default" : "success"
                            }
                          >
                            {String(r.status)}
                          </Badge>
                        ),
                      },
                      {
                        key: "created_at",
                        label: "Created",
                        render: (r) => timeAgo(r.created_at as string),
                      },
                    ]}
                  />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminSettings />
                </Suspense>
              }
            />
            <Route
              path="audit-logs"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminAuditLogs />
                </Suspense>
              }
            />
            <Route
              path="analytics"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminDataViewer
                    title="Analytics"
                    description="Platform analytics events"
                    table="analytics_events"
                    searchKeys={["event_type"]}
                    columns={[
                      {
                        key: "event_type",
                        label: "Event Type",
                        render: (r) => (
                          <Badge variant="outline">
                            {String(r.event_type)}
                          </Badge>
                        ),
                      },
                      { key: "page_url", label: "Page" },
                      { key: "referrer", label: "Referrer" },
                      {
                        key: "created_at",
                        label: "Time",
                        render: (r) => timeAgo(r.created_at as string),
                      },
                    ]}
                  />
                </Suspense>
              }
            />
            <Route
              path="blockchains"
              element={
                <Suspense fallback={<LoaderFallback />}>
                  <AdminBlockchains />
                </Suspense>
              }
            />
          </Route>

          <Route path="*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

function LoaderFallback() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
