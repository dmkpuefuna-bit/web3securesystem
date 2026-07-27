import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  ExternalLink,
  Activity,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import {
  formatAddress,
  formatCurrency,
  formatNumber,
  timeAgo,
  cn,
} from "@/lib/utils";
import type { Transaction, Blockchain } from "@/lib/types";

export function TransactionsPage() {
  const { effectiveUserId } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [blockchains, setBlockchains] = useState<Blockchain[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");

  useEffect(() => {
    let isMounted = true;

    (async () => {
      if (!effectiveUserId) {
        if (isMounted) {
          setTransactions([]);
          setBlockchains([]);
          setLoading(false);
        }
        return;
      }

      try {
        const [txRes, chainRes] = await Promise.all([
          supabase
            .from("transactions")
            .select("*, asset:crypto_assets(*)")
            .eq("user_id", effectiveUserId)
            .order("timestamp", { ascending: false }),
          supabase.from("blockchains").select("*").eq("is_active", true),
        ]);

        if (!isMounted) return;

        if (txRes.error) {
          console.error("Error fetching transactions:", txRes.error);
          setTransactions([]);
        } else {
          setTransactions((txRes.data as unknown as Transaction[]) ?? []);
        }

        if (chainRes.error) {
          console.error("Error fetching blockchains:", chainRes.error);
          setBlockchains([]);
        } else {
          setBlockchains((chainRes.data as unknown as Blockchain[]) ?? []);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to load transaction data:", error);
          setTransactions([]);
          setBlockchains([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [effectiveUserId]);

  const filtered = transactions.filter((tx) => {
    if (filter === "all") return true;
    return tx.direction === filter;
  });

  const getChain = (chainId: number | null) =>
    blockchains.find((b) => b.chain_id === chainId);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Your on-chain transaction history
        </p>
      </div>

      <div className="flex gap-2">
        {(["all", "in", "out"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {f === "all" ? "All" : f === "in" ? "Received" : "Sent"}
          </button>
        ))}
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Activity className="h-6 w-6" />
              </div>
              <p className="font-medium">No transactions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your on-chain activity will appear here once you connect a
                wallet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((tx, i) => {
                const chain = getChain(tx.chain_id);
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full",
                          tx.direction === "in"
                            ? "bg-success/15 text-success"
                            : "bg-destructive/15 text-destructive",
                        )}
                      >
                        {tx.direction === "in" ? (
                          <ArrowDownLeft className="h-5 w-5" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium capitalize">{tx.type}</p>
                          {chain && (
                            <Badge variant="outline" className="text-xs">
                              {chain.name}
                            </Badge>
                          )}
                          <Badge
                            variant={
                              tx.status === "confirmed" ? "success" : "warning"
                            }
                            className="text-xs"
                          >
                            {tx.status}
                          </Badge>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <code className="text-xs text-muted-foreground">
                            {formatAddress(tx.tx_hash, 10)}
                          </code>
                          {chain?.explorer_url && (
                            <a
                              href={`${chain.explorer_url}/tx/${tx.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          <span className="text-xs text-muted-foreground">
                            • {timeAgo(tx.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {tx.amount && (
                        <p className="font-medium">
                          {tx.direction === "in" ? "+" : "-"}
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
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
