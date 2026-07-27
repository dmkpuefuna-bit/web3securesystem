import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Image, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import type { NFT } from "@/lib/types";

export function NftsPage() {
  const { effectiveUserId } = useAuthStore();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!effectiveUserId) return;
      const { data } = await supabase
        .from("nfts")
        .select("*, collection:nft_collections(*)")
        .eq("user_id", effectiveUserId)
        .order("created_at", { ascending: false });
      setNfts((data as unknown as NFT[]) ?? []);
      setLoading(false);
    })();
  }, [effectiveUserId]);

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
        <h1 className="text-2xl font-bold">NFT Gallery</h1>
        <p className="text-sm text-muted-foreground">
          Your NFT collection across all wallets
        </p>
      </div>

      {nfts.length === 0 ? (
        <Card className="glass p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Image className="h-7 w-7" />
          </div>
          <p className="font-medium">No NFTs yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            NFTs from your connected wallets will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {nfts.map((nft, i) => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass group overflow-hidden transition-all hover:border-primary/30 hover:glow">
                <div className="aspect-square overflow-hidden bg-gradient-to-br from-primary-500/20 via-secondary to-primary-700/20">
                  {nft.image_url ? (
                    <img
                      src={nft.image_url}
                      alt={nft.name ?? "NFT"}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Image className="h-16 w-16 text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {nft.name ?? `#${nft.token_id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {nft.collection?.name ?? "Unknown Collection"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      #{nft.token_id}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    {nft.floor_price && (
                      <span className="text-muted-foreground">
                        Floor:{" "}
                        <span className="text-foreground">
                          {formatCurrency(nft.floor_price)}
                        </span>
                      </span>
                    )}
                    {nft.last_price && (
                      <span className="text-muted-foreground">
                        Last:{" "}
                        <span className="text-foreground">
                          {formatCurrency(nft.last_price)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
