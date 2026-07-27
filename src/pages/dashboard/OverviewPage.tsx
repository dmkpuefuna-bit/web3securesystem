import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Image,
  Activity,
  Star,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Badge not currently used in this file
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import { fetchMarketData } from "@/lib/api";
import {
  formatCurrency,
  formatPercent,
  formatAddress,
  formatNumber,
  timeAgo,
  cn,
} from "@/lib/utils";
import type {
  Wallet as WalletType,
  Transaction,
  UserAsset,
  NFT,
  Notification,
  CoinGeckoMarket,
} from "@/lib/types";

export function OverviewPage() {
  const { effectiveUserId } = useAuthStore();
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [assets, setAssets] = useState<UserAsset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [marketData, setMarketData] = useState<CoinGeckoMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!effectiveUserId) return;
      setLoading(true);
      setError(null);
      try {
        const [walletsRes, assetsRes, txRes, nftRes, notifRes] =
          await Promise.all([
            supabase
              .from("wallets")
              .select("*")
              .eq("user_id", effectiveUserId)
              .order("created_at", { ascending: false }),
            supabase
              .from("user_assets")
              .select("*, asset:crypto_assets(*)")
              .eq("user_id", effectiveUserId)
              .order("total_usd_value", { ascending: false }),
            supabase
              .from("transactions")
              .select("*, asset:crypto_assets(*)")
              .eq("user_id", effectiveUserId)
              .order("timestamp", { ascending: false })
              .limit(10),
            supabase
              .from("nfts")
              .select("*, collection:nft_collections(*)")
              .eq("user_id", effectiveUserId)
              .order("created_at", { ascending: false })
              .limit(6),
            supabase
              .from("notifications")
              .select("*")
              .eq("user_id", effectiveUserId)
              .order("created_at", { ascending: false })
              .limit(5),
          ]);

        setWallets((walletsRes.data as unknown as WalletType[]) ?? []);
        setAssets((assetsRes.data as unknown as UserAsset[]) ?? []);
        setTransactions((txRes.data as unknown as Transaction[]) ?? []);
        setNfts((nftRes.data as unknown as NFT[]) ?? []);
        setNotifications((notifRes.data as unknown as Notification[]) ?? []);

        try {
          const markets = await fetchMarketData(10, 1);
          setMarketData(markets);
        } catch {
          // CoinGecko may rate-limit
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [effectiveUserId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const totalValue = assets.reduce(
    (sum, a) => sum + (a.total_usd_value ?? 0),
    0,
  );
  const totalChange = assets.reduce((sum, a) => {
    const pct = a.asset?.price_change_percentage_24h ?? 0;
    return sum + (a.total_usd_value ?? 0) * (pct / 100);
  }, 0);
  const totalChangePct = totalValue > 0 ? (totalChange / totalValue) * 100 : 0;

  const stats = [
    {
      label: "Portfolio Value",
      value: formatCurrency(totalValue),
      change: formatPercent(totalChangePct),
      positive: totalChangePct >= 0,
      icon: Wallet,
    },
    {
      label: "Connected Wallets",
      value: wallets.length.toString(),
      change: `${wallets.filter((w) => w.is_primary).length} primary`,
      icon: Wallet,
    },
    {
      label: "NFT Holdings",
      value: nfts.length.toString(),
      change: "across collections",
      icon: Image,
    },
    {
      label: "Total Transactions",
      value: transactions.length.toString(),
      change: "recent activity",
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your portfolio
          </p>
        </div>
        <Link to="/dashboard/wallets">
          <Button variant="gradient">
            <Plus className="h-4 w-4" /> Connect Wallet
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {stat.label}
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold">{stat.value}</p>
              <p
                className={cn(
                  "mt-1 text-xs",
                  stat.positive === true && "text-success",
                  stat.positive === false && "text-destructive",
                  stat.positive === undefined && "text-muted-foreground",
                )}
              >
                {stat.change}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Asset Holdings */}
        <Card className="glass lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Token Holdings</CardTitle>
            <Link
              to="/dashboard/wallets"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No assets yet"
                description="Connect a wallet to start tracking your tokens."
                action={
                  <Link to="/dashboard/wallets">
                    <Button variant="outline" size="sm">
                      Connect Wallet
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-2">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      {asset.asset?.logo_url ? (
                        <img
                          src={asset.asset.logo_url}
                          alt={asset.asset.name}
                          className="h-8 w-8 rounded-full"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          {asset.asset?.symbol?.[0]?.toUpperCase() ?? "T"}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {asset.asset?.name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(asset.total_balance)}{" "}
                          {asset.asset?.symbol?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(asset.total_usd_value)}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          (asset.asset?.price_change_percentage_24h ?? 0) >= 0
                            ? "text-success"
                            : "text-destructive",
                        )}
                      >
                        {formatPercent(
                          asset.asset?.price_change_percentage_24h,
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="rounded-lg border border-border/50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{notif.title}</p>
                      {!notif.is_read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    {notif.message && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {notif.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Transactions */}
        <Card className="glass lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Link
              to="/dashboard/transactions"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No transactions yet"
                description="Your on-chain activity will appear here."
              />
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full",
                          tx.direction === "in"
                            ? "bg-success/15 text-success"
                            : "bg-destructive/15 text-destructive",
                        )}
                      >
                        {tx.direction === "in" ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {tx.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatAddress(tx.tx_hash, 8)} •{" "}
                          {timeAgo(tx.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {tx.amount && (
                        <p className="text-sm font-medium">
                          {formatNumber(tx.amount)}{" "}
                          {tx.asset?.symbol?.toUpperCase()}
                        </p>
                      )}
                      {tx.usd_value && (
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(tx.usd_value)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market Watchlist */}
        <Card className="glass">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Market Overview</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {marketData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Market data unavailable.
              </p>
            ) : (
              <div className="space-y-2">
                {marketData.slice(0, 6).map((coin) => (
                  <div
                    key={coin.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="h-6 w-6 rounded-full"
                        loading="lazy"
                      />
                      <span className="text-sm font-medium">
                        {coin.symbol.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(coin.current_price)}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          coin.price_change_percentage_24h >= 0
                            ? "text-success"
                            : "text-destructive",
                        )}
                      >
                        {formatPercent(coin.price_change_percentage_24h)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
