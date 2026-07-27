import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  Loader2,
  Search,
  X,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// Button import removed because it's unused
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import { fetchMarketData } from "@/lib/api";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type {
  Watchlist,
  WatchlistItem,
  CoinGeckoMarket,
  CryptoAsset,
} from "@/lib/types";

export function WatchlistPage() {
  const { effectiveUserId } = useAuthStore();
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [marketData, setMarketData] = useState<CoinGeckoMarket[]>([]);
  const [allAssets, setAllAssets] = useState<CryptoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<CryptoAsset[]>([]);

  useEffect(() => {
    (async () => {
      if (!effectiveUserId) return;
      const { data: wl } = await supabase
        .from("watchlists")
        .select("*")
        .eq("user_id", effectiveUserId)
        .maybeSingle();

      if (wl) {
        setWatchlist(wl as Watchlist);
        const { data: wlItems } = await supabase
          .from("watchlist_items")
          .select("*, asset:crypto_assets(*)")
          .eq("watchlist_id", (wl as Watchlist).id);
        setItems((wlItems as unknown as WatchlistItem[]) ?? []);
      } else {
        const { data: newWl } = await supabase
          .from("watchlists")
          .insert({ user_id: effectiveUserId, name: "My Watchlist" })
          .select()
          .single();
        setWatchlist(newWl as Watchlist);
      }

      const { data: assets } = await supabase
        .from("crypto_assets")
        .select("*")
        .limit(100);
      setAllAssets((assets as unknown as CryptoAsset[]) ?? []);

      try {
        const markets = await fetchMarketData(50, 1);
        setMarketData(markets);
      } catch {
        /* rate limit */
      }

      setLoading(false);
    })();
  }, [effectiveUserId]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const q = search.toLowerCase();
    setSearchResults(
      allAssets
        .filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.symbol.toLowerCase().includes(q),
        )
        .slice(0, 5),
    );
  }, [search, allAssets]);

  const addToWatchlist = async (assetId: string) => {
    if (!watchlist) return;
    await supabase.from("watchlist_items").insert({
      watchlist_id: watchlist.id,
      asset_id: assetId,
    });
    const { data } = await supabase
      .from("watchlist_items")
      .select("*, asset:crypto_assets(*)")
      .eq("watchlist_id", watchlist.id);
    setItems((data as unknown as WatchlistItem[]) ?? []);
    setSearch("");
  };

  const removeFromWatchlist = async (itemId: string) => {
    await supabase.from("watchlist_items").delete().eq("id", itemId);
    setItems(items.filter((i) => i.id !== itemId));
  };

  const getMarketData = (coingeckoId: string) =>
    marketData.find((m) => m.id === coingeckoId);

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
        <h1 className="text-2xl font-bold">Watchlist</h1>
        <p className="text-sm text-muted-foreground">
          Track assets you're interested in
        </p>
      </div>

      <Card className="glass p-6">
        <h3 className="font-semibold">Add to Watchlist</h3>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for assets..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
              {searchResults.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => addToWatchlist(asset.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent"
                >
                  {asset.logo_url && (
                    <img
                      src={asset.logo_url}
                      alt={asset.name}
                      className="h-6 w-6 rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {asset.symbol.toUpperCase()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Your Watchlist ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Star className="h-6 w-6" />
              </div>
              <p className="font-medium">Your watchlist is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Search above to add assets to your watchlist.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, i) => {
                const market = item.asset
                  ? getMarketData(item.asset.coingecko_id)
                  : null;
                const price =
                  market?.current_price ?? item.asset?.current_price ?? 0;
                const change =
                  market?.price_change_percentage_24h ??
                  item.asset?.price_change_percentage_24h ??
                  0;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      {item.asset?.logo_url ? (
                        <img
                          src={item.asset.logo_url}
                          alt={item.asset.name}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          {item.asset?.symbol?.[0]?.toUpperCase() ?? "T"}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {item.asset?.name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.asset?.symbol?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(price)}</p>
                        <p
                          className={cn(
                            "flex items-center justify-end gap-1 text-xs",
                            change >= 0 ? "text-success" : "text-destructive",
                          )}
                        >
                          {change >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {formatPercent(change)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromWatchlist(item.id)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
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
