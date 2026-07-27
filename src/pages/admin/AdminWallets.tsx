import { useEffect, useState } from "react";
import {
  Loader2,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { formatAddress, timeAgo } from "@/lib/utils";
import type { Wallet, WalletBalance, Profile } from "@/lib/types";

interface WalletWithDetails extends Wallet {
  profile?: Pick<Profile, "user_id" | "email" | "full_name">;
  balances?: WalletBalance[];
}

export function AdminWallets() {
  const [wallets, setWallets] = useState<WalletWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWallets, setExpandedWallets] = useState<
    Record<string, boolean>
  >({});
  const [activeEdit, setActiveEdit] = useState<{
    id: string;
    user_id: string;
    label: string;
    is_primary: boolean;
  } | null>(null);
  const [walletSaving, setWalletSaving] = useState(false);
  const [balanceEdits, setBalanceEdits] = useState<
    Record<string, { balance: string; usd_value: string }>
  >({});
  const [balanceSaving, setBalanceSaving] = useState<Record<string, boolean>>(
    {},
  );

  const loadWallets = async () => {
    setLoading(true);
    setError(null);

    const { data: walletsData, error: walletsError } = await supabase
      .from("wallets")
      .select("*")
      .order("created_at", { ascending: false });

    if (walletsError) {
      setError(walletsError.message);
      setWallets([]);
      setLoading(false);
      return;
    }

    const walletList = (walletsData as Wallet[]) ?? [];
    const userIds = Array.from(
      new Set(walletList.map((wallet) => wallet.user_id)),
    );
    const walletIds = walletList.map((wallet) => wallet.id);

    const profilesPromise =
      userIds.length > 0
        ? supabase
            .from("profiles")
            .select("user_id, email, full_name")
            .in("user_id", userIds)
        : Promise.resolve({ data: [], error: null } as const);

    const balancesPromise =
      walletIds.length > 0
        ? supabase
            .from("wallet_balances")
            .select("*, asset:crypto_assets(*)")
            .in("wallet_id", walletIds)
        : Promise.resolve({ data: [], error: null } as const);

    const [profilesResult, balancesResult] = await Promise.all([
      profilesPromise,
      balancesPromise,
    ] as const);

    if (profilesResult.error) {
      setError(profilesResult.error.message);
      setWallets([]);
      setLoading(false);
      return;
    }

    if (balancesResult.error) {
      setError(balancesResult.error.message);
      setWallets([]);
      setLoading(false);
      return;
    }

    const profileMap = new Map<
      string,
      Pick<Profile, "user_id" | "email" | "full_name">
    >();
    (profilesResult.data as Profile[] | null)?.forEach((profile) => {
      if (profile) {
        profileMap.set(profile.user_id, {
          user_id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
        });
      }
    });

    const balancesByWallet = new Map<string, WalletBalance[]>();
    (balancesResult.data as WalletBalance[] | null)?.forEach((balance) => {
      if (!balance) return;
      const existing = balancesByWallet.get(balance.wallet_id) ?? [];
      balancesByWallet.set(balance.wallet_id, [...existing, balance]);
    });

    setWallets(
      walletList.map((wallet) => ({
        ...wallet,
        profile: profileMap.get(wallet.user_id) ?? undefined,
        balances: balancesByWallet.get(wallet.id) ?? [],
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const handleToggle = (walletId: string) => {
    setExpandedWallets((prev) => ({
      ...prev,
      [walletId]: !prev[walletId],
    }));
  };

  const openEdit = (wallet: WalletWithDetails) => {
    setActiveEdit({
      id: wallet.id,
      user_id: wallet.user_id,
      label: wallet.label ?? "",
      is_primary: wallet.is_primary,
    });
  };

  const saveWallet = async () => {
    if (!activeEdit) return;
    setWalletSaving(true);
    setError(null);

    if (activeEdit.is_primary) {
      await supabase
        .from("wallets")
        .update({ is_primary: false })
        .eq("user_id", activeEdit.user_id)
        .neq("id", activeEdit.id);
    }

    const { error: updateError } = await supabase
      .from("wallets")
      .update({
        label: activeEdit.label || null,
        is_primary: activeEdit.is_primary,
      })
      .eq("id", activeEdit.id);

    if (updateError) {
      setError(updateError.message);
      setWalletSaving(false);
      return;
    }

    await loadWallets();
    setActiveEdit(null);
    setWalletSaving(false);
  };

  const deleteWallet = async (walletId: string) => {
    if (!window.confirm("Delete this wallet and all linked balances?")) return;
    setError(null);
    setLoading(true);
    const { error: deleteError } = await supabase
      .from("wallets")
      .delete()
      .eq("id", walletId);
    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }
    await loadWallets();
  };

  const handleBalanceFieldChange = (
    balanceId: string,
    field: "balance" | "usd_value",
    value: string,
  ) => {
    setBalanceEdits((prev) => ({
      ...prev,
      [balanceId]: {
        balance: prev[balanceId]?.balance ?? "",
        usd_value: prev[balanceId]?.usd_value ?? "",
        [field]: value,
      },
    }));
  };

  const saveBalance = async (balance: WalletBalance) => {
    const edit = balanceEdits[balance.id];
    if (!edit) return;
    setBalanceSaving((prev) => ({ ...prev, [balance.id]: true }));
    const { error: updateError } = await supabase
      .from("wallet_balances")
      .update({
        balance: Number(edit.balance),
        usd_value: Number(edit.usd_value),
      })
      .eq("id", balance.id);
    if (updateError) {
      setError(updateError.message);
      setBalanceSaving((prev) => ({ ...prev, [balance.id]: false }));
      return;
    }

    await loadWallets();
    setBalanceSaving((prev) => ({ ...prev, [balance.id]: false }));
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
        <h1 className="text-2xl font-bold">Admin Wallet Management</h1>
        <p className="text-sm text-muted-foreground">
          View, update, and manage wallets and balance records.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="glass">
        <CardHeader>
          <CardTitle>Wallets ({wallets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {wallets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No wallets found.
            </p>
          ) : (
            <div className="space-y-4">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="rounded-2xl border border-border/50 bg-secondary/50 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>User:</span>
                        <span className="font-medium text-foreground">
                          {wallet.profile?.email ?? wallet.user_id}
                        </span>
                        {wallet.profile?.full_name && (
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                            {wallet.profile.full_name}
                          </span>
                        )}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Wallet Address
                          </p>
                          <p className="font-mono text-sm">
                            {formatAddress(wallet.address, 12)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Provider
                          </p>
                          <p className="text-sm">{wallet.provider}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Primary
                          </p>
                          <Badge
                            variant={
                              wallet.is_primary ? "success" : "secondary"
                            }
                          >
                            {wallet.is_primary ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(wallet)}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit wallet
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteWallet(wallet.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleToggle(wallet.id)}
                      >
                        {expandedWallets[wallet.id] ? (
                          <>
                            <ChevronUp className="mr-2 h-4 w-4" />
                            Hide balances
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 h-4 w-4" />
                            Show balances
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {expandedWallets[wallet.id] && (
                    <div className="mt-4 rounded-2xl border border-border/50 bg-background/80 p-4">
                      <h3 className="text-sm font-semibold">Balances</h3>
                      {wallet.balances?.length ? (
                        <div className="mt-3 space-y-3">
                          {wallet.balances.map((balance) => {
                            const edit = balanceEdits[balance.id] ?? {
                              balance: String(balance.balance ?? ""),
                              usd_value: String(balance.usd_value ?? ""),
                            };
                            return (
                              <div
                                key={balance.id}
                                className="grid gap-3 rounded-2xl border border-border/50 bg-secondary/30 p-3 sm:grid-cols-[1fr_auto]"
                              >
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Asset
                                    </p>
                                    <p className="font-medium">
                                      {balance.asset?.symbol ?? "Unknown"} -{" "}
                                      {balance.asset?.name ?? "Asset"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Last Synced
                                    </p>
                                    <p className="text-sm">
                                      {balance.last_synced_at
                                        ? timeAgo(balance.last_synced_at)
                                        : "Never"}
                                    </p>
                                  </div>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <div>
                                    <label className="text-xs text-muted-foreground">
                                      Balance
                                    </label>
                                    <Input
                                      value={edit.balance}
                                      onChange={(e) =>
                                        handleBalanceFieldChange(
                                          balance.id,
                                          "balance",
                                          e.target.value,
                                        )
                                      }
                                      type="number"
                                      step="any"
                                      min="0"
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-muted-foreground">
                                      USD Value
                                    </label>
                                    <Input
                                      value={edit.usd_value}
                                      onChange={(e) =>
                                        handleBalanceFieldChange(
                                          balance.id,
                                          "usd_value",
                                          e.target.value,
                                        )
                                      }
                                      type="number"
                                      step="any"
                                      min="0"
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-end justify-end gap-2 sm:col-span-2">
                                  <Button
                                    size="sm"
                                    onClick={() => saveBalance(balance)}
                                    disabled={balanceSaving[balance.id]}
                                  >
                                    {balanceSaving[balance.id] ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Save
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">
                          No balance records available for this wallet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {activeEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle>Edit Wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Label
                </label>
                <Input
                  value={activeEdit.label}
                  onChange={(e) =>
                    setActiveEdit((prev) =>
                      prev ? { ...prev, label: e.target.value } : prev,
                    )
                  }
                  className="mt-2"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="isPrimary"
                  type="checkbox"
                  checked={activeEdit.is_primary}
                  onChange={(e) =>
                    setActiveEdit((prev) =>
                      prev ? { ...prev, is_primary: e.target.checked } : prev,
                    )
                  }
                  className="h-4 w-4 rounded border-border bg-background"
                />
                <label
                  htmlFor="isPrimary"
                  className="text-sm text-muted-foreground"
                >
                  Mark as primary wallet
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={saveWallet} disabled={walletSaving}>
                  {walletSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save changes
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setActiveEdit(null)}
                  disabled={walletSaving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
