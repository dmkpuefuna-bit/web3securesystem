import { useEffect, useState } from "react";
import { Link2, Loader2, Power } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import type { Blockchain } from "@/lib/types";

export function AdminBlockchains() {
  const [chains, setChains] = useState<Blockchain[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("blockchains")
      .select("*")
      .order("sort_order", { ascending: true });
    setChains((data as unknown as Blockchain[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (chain: Blockchain) => {
    await supabase
      .from("blockchains")
      .update({ is_active: !chain.is_active })
      .eq("id", chain.id);
    await load();
  };

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
        <h1 className="text-2xl font-bold">Blockchain Networks</h1>
        <p className="text-sm text-muted-foreground">
          Manage supported blockchain networks
        </p>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Networks ({chains.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chains.map((chain) => (
              <div
                key={chain.id}
                className="flex items-center justify-between rounded-lg border border-border/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{chain.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {chain.symbol} • Chain ID: {chain.chain_id ?? "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={chain.is_active ? "success" : "secondary"}>
                    {chain.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <button
                    onClick={() => toggleActive(chain)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Power className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
