import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Loader2, Lock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  timeAgo,
} from "@/lib/utils";
import type { StakingPosition } from "@/lib/types";

export function StakingPage() {
  const { effectiveUserId } = useAuthStore();
  const [positions, setPositions] = useState<StakingPosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!effectiveUserId) return;
      const { data } = await supabase
        .from("staking")
        .select("*, asset:crypto_assets(*)")
        .eq("user_id", effectiveUserId)
        .order("created_at", { ascending: false });
      setPositions((data as unknown as StakingPosition[]) ?? []);
      setLoading(false);
    })();
  }, [effectiveUserId]);

  const totalStaked = positions.reduce(
    (sum, p) => sum + (p.staked_amount ?? 0) * (p.asset?.current_price ?? 0),
    0,
  );
  const totalRewards = positions.reduce(
    (sum, p) => sum + (p.rewards_earned ?? 0) * (p.asset?.current_price ?? 0),
    0,
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staking</h1>
          <p className="text-sm text-muted-foreground">
            Your staking positions and rewards
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass p-5">
          <p className="text-sm text-muted-foreground">Total Staked</p>
          <p className="mt-2 text-2xl font-bold">
            {formatCurrency(totalStaked)}
          </p>
        </Card>
        <Card className="glass p-5">
          <p className="text-sm text-muted-foreground">Total Rewards</p>
          <p className="mt-2 text-2xl font-bold text-success">
            {formatCurrency(totalRewards)}
          </p>
        </Card>
        <Card className="glass p-5">
          <p className="text-sm text-muted-foreground">Active Positions</p>
          <p className="mt-2 text-2xl font-bold">
            {positions.filter((p) => p.status === "active").length}
          </p>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Staking Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <p className="font-medium">No staking positions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your staking positions will appear here once synced.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((pos, i) => (
                <motion.div
                  key={pos.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    {pos.asset?.logo_url ? (
                      <img
                        src={pos.asset.logo_url}
                        alt={pos.asset.name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {pos.asset?.symbol?.[0]?.toUpperCase() ?? "S"}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        {pos.asset?.name ?? pos.protocol}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pos.protocol}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Staked</p>
                      <p className="font-medium">
                        {formatNumber(pos.staked_amount)}{" "}
                        {pos.asset?.symbol?.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Rewards</p>
                      <p className="font-medium text-success">
                        {formatNumber(pos.rewards_earned)}{" "}
                        {pos.asset?.symbol?.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">APY</p>
                      <p className="font-medium">
                        {pos.apy ? formatPercent(pos.apy) : "—"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={
                          pos.status === "active" ? "success" : "secondary"
                        }
                      >
                        {pos.status}
                      </Badge>
                      {pos.lock_until && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="h-3 w-3" /> {timeAgo(pos.lock_until)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
