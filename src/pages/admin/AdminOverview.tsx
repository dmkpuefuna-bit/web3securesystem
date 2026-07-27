import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Wallet,
  Activity,
  Image,
  TrendingUp,
  FileText,
  Mail,
  Shield,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { formatNumber } from "@/lib/utils";

export function AdminOverview() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const tables = [
          "profiles",
          "wallets",
          "transactions",
          "nfts",
          "staking",
          "blog_posts",
          "newsletter_subscribers",
          "audit_logs",
        ];
        const counts: Record<string, number> = {};
        for (const table of tables) {
          const { count, error } = await supabase
            .from(table)
            .select("*", { count: "exact", head: true });
          if (error) {
            throw error;
          }
          counts[table] = count ?? 0;
        }
        setStats(counts);
      } catch (err) {
        setError(
          (err as Error).message || "Failed to load admin overview data.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = [
    {
      label: "Total Users",
      value: stats.profiles ?? 0,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Connected Wallets",
      value: stats.wallets ?? 0,
      icon: Wallet,
      color: "text-success",
    },
    {
      label: "Transactions",
      value: stats.transactions ?? 0,
      icon: Activity,
      color: "text-warning",
    },
    {
      label: "NFTs Tracked",
      value: stats.nfts ?? 0,
      icon: Image,
      color: "text-primary",
    },
    {
      label: "Staking Positions",
      value: stats.staking ?? 0,
      icon: TrendingUp,
      color: "text-success",
    },
    {
      label: "Blog Posts",
      value: stats.blog_posts ?? 0,
      icon: FileText,
      color: "text-warning",
    },
    {
      label: "Newsletter Subs",
      value: stats.newsletter_subscribers ?? 0,
      icon: Mail,
      color: "text-primary",
    },
    {
      label: "Audit Logs",
      value: stats.audit_logs ?? 0,
      icon: Shield,
      color: "text-success",
    },
  ];

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
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-sm text-muted-foreground">
          Platform statistics and management
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="glass p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {card.label}
                </span>
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10",
                    card.color,
                  )}
                >
                  <card.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold">
                {formatNumber(card.value)}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
