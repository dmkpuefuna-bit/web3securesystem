import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Plus,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Link2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import { formatAddress, formatCurrency, formatNumber } from "@/lib/utils";
import type {
  Wallet as WalletType,
  WalletBalance,
  Blockchain,
} from "@/lib/types";

declare global {
  interface Window {
    ethereum?: {
      request: (args: {
        method: string;
        params?: unknown[];
      }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (
        event: string,
        handler: (...args: unknown[]) => void,
      ) => void;
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
      isRabby?: boolean;
      isTrust?: boolean;
      isOKExWallet?: boolean;
    };
  }
}

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function WalletsPage() {
  const { effectiveUserId } = useAuthStore();
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [balances, setBalances] = useState<Record<string, WalletBalance[]>>({});
  const [blockchains, setBlockchains] = useState<Blockchain[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [walletLabel, setWalletLabel] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [manualChain, setManualChain] = useState("");
  const [manualProvider, setManualProvider] = useState("manual");
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    (async () => {
      if (!effectiveUserId) return;
      const [walletsRes, blockchainsRes] = await Promise.all([
        supabase
          .from("wallets")
          .select("*")
          .eq("user_id", effectiveUserId)
          .order("created_at", { ascending: false }),
        supabase
          .from("blockchains")
          .select("*")
          .eq("is_active", true)
          .order("sort_order"),
      ]);
      setWallets((walletsRes.data as unknown as WalletType[]) ?? []);
      setBlockchains((blockchainsRes.data as unknown as Blockchain[]) ?? []);
      setLoading(false);
    })();
  }, [effectiveUserId]);

  const loadBalances = async (walletId: string) => {
    const { data } = await supabase
      .from("wallet_balances")
      .select("*, asset:crypto_assets(*)")
      .eq("wallet_id", walletId);
    if (data) {
      setBalances((prev) => ({
        ...prev,
        [walletId]: data as unknown as WalletBalance[],
      }));
    }
  };

  useEffect(() => {
    wallets.forEach((w) => loadBalances(w.id));
  }, [wallets]);

  const reloadWallets = async () => {
    if (!effectiveUserId) return;
    const { data: updated } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", effectiveUserId)
      .order("created_at", { ascending: false });
    setWallets((updated as unknown as WalletType[]) ?? []);
  };

  const connectMetaMask = async () => {
    setError(null);
    setSuccess(null);
    setConnecting(true);
    try {
      if (!window.ethereum) {
        setShowManual(true);
        setError(
          "MetaMask browser extension was not detected. You can connect your wallet manually by entering your address below.",
        );
        return;
      }
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const address = accounts[0];
      const chainIdHex = (await window.ethereum.request({
        method: "eth_chainId",
      })) as string;
      const chainId = parseInt(chainIdHex, 16);

      if (!effectiveUserId) return;

      const { error: insertError } = await supabase.from("wallets").upsert(
        {
          user_id: effectiveUserId,
          address: address.toLowerCase(),
          chain_id: chainId || null,
          provider: "metamask",
          label: walletLabel || "MetaMask Wallet",
          is_primary: wallets.length === 0,
        },
        { onConflict: "user_id,address" },
      );

      if (insertError) throw new Error(insertError.message);

      await reloadWallets();
      setWalletLabel("");
      setSuccess("MetaMask wallet connected successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };

  const connectManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const address = manualAddress.trim().toLowerCase();
    if (!ADDRESS_REGEX.test(address)) {
      setError(
        "Please enter a valid wallet address (0x followed by 40 hex characters).",
      );
      return;
    }

    if (!effectiveUserId) return;

    const selectedChain = blockchains.find((b) => b.id === manualChain);

    setConnecting(true);
    try {
      const { error: insertError } = await supabase.from("wallets").upsert(
        {
          user_id: effectiveUserId,
          address,
          chain_id: selectedChain?.chain_id ?? null,
          blockchain_id: selectedChain?.id ?? null,
          provider: manualProvider || "manual",
          label: walletLabel || `${selectedChain?.name ?? "Manual"} Wallet`,
          is_primary: wallets.length === 0,
        },
        { onConflict: "user_id,address" },
      );

      if (insertError) throw new Error(insertError.message);

      await reloadWallets();
      setManualAddress("");
      setWalletLabel("");
      setManualChain("");
      setShowManual(false);
      setSuccess("Wallet added successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add wallet");
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async (walletId: string) => {
    await supabase.from("wallets").delete().eq("id", walletId);
    setWallets(wallets.filter((w) => w.id !== walletId));
  };

  const copyAddress = (address: string, id: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getBlockchain = (wallet: WalletType) => {
    if (wallet.blockchain_id)
      return blockchains.find((b) => b.id === wallet.blockchain_id);
    if (wallet.chain_id)
      return blockchains.find((b) => b.chain_id === wallet.chain_id);
    return undefined;
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
        <h1 className="text-2xl font-bold">Wallets</h1>
        <p className="text-sm text-muted-foreground">
          Connect and manage your wallets
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          <Check className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Connect New Wallet */}
      <Card className="glass p-6">
        <h3 className="font-semibold">Connect a New Wallet</h3>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="label">Wallet Label (optional)</Label>
            <Input
              id="label"
              placeholder="e.g. Main Trading Wallet"
              value={walletLabel}
              onChange={(e) => setWalletLabel(e.target.value)}
            />
          </div>
          <Button
            variant="gradient"
            onClick={connectMetaMask}
            disabled={connecting}
          >
            {connecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Connect MetaMask
          </Button>
          <Button variant="outline" onClick={() => setShowManual(!showManual)}>
            <Link2 className="h-4 w-4" />
            Enter Manually
          </Button>
        </div>

        {/* Manual Wallet Entry */}
        {showManual && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            onSubmit={connectManual}
            className="mt-4 space-y-4 rounded-lg border border-border bg-secondary/30 p-4"
          >
            <div className="space-y-2">
              <Label htmlFor="address">Wallet Address</Label>
              <Input
                id="address"
                placeholder="0x..."
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter any EVM-compatible wallet address (Ethereum, Base,
                Polygon, etc.)
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="chain">Blockchain</Label>
                <select
                  id="chain"
                  value={manualChain}
                  onChange={(e) => setManualChain(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-secondary/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select chain (optional)</option>
                  {blockchains.map((chain) => (
                    <option key={chain.id} value={chain.id}>
                      {chain.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">Wallet Provider</Label>
                <select
                  id="provider"
                  value={manualProvider}
                  onChange={(e) => setManualProvider(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-secondary/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="manual">Manual</option>
                  <option value="metamask">MetaMask</option>
                  <option value="walletconnect">WalletConnect</option>
                  <option value="coinbase">Coinbase</option>
                  <option value="trust">Trust Wallet</option>
                  <option value="rabby">Rabby</option>
                  <option value="okx">OKX</option>
                </select>
              </div>
            </div>
            <Button type="submit" disabled={connecting}>
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Wallet
            </Button>
          </motion.form>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "MetaMask",
            "WalletConnect",
            "Coinbase",
            "Trust",
            "Rabby",
            "OKX",
          ].map((p) => (
            <Badge key={p} variant="outline" className="px-3 py-1">
              {p}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Connected Wallets */}
      <div className="grid gap-4">
        {wallets.length === 0 ? (
          <Card className="glass p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="h-7 w-7" />
            </div>
            <p className="font-medium">No wallets connected</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect a wallet to start tracking your assets.
            </p>
          </Card>
        ) : (
          wallets.map((wallet, i) => {
            const chain = getBlockchain(wallet);
            const walletBals = balances[wallet.id] ?? [];
            const totalUsd = walletBals.reduce(
              (sum, b) => sum + (b.usd_value ?? 0),
              0,
            );
            return (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-700 shadow-lg shadow-primary-500/20">
                        <Wallet className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {wallet.label ?? "Wallet"}
                          </p>
                          {wallet.is_primary && (
                            <Badge variant="default">Primary</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <code className="text-sm text-muted-foreground">
                            {formatAddress(wallet.address, 8)}
                          </code>
                          <button
                            onClick={() =>
                              copyAddress(wallet.address, wallet.id)
                            }
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {copiedId === wallet.id ? (
                              <Check className="h-3.5 w-3.5 text-success" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          {chain?.explorer_url && (
                            <a
                              href={`${chain.explorer_url}/address/${wallet.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="secondary">{wallet.provider}</Badge>
                          {chain && (
                            <Badge variant="outline">{chain.name}</Badge>
                          )}
                          {wallet.ens_name && (
                            <Badge variant="outline">{wallet.ens_name}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {formatCurrency(totalUsd)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {walletBals.length} tokens
                        </p>
                      </div>
                      <button
                        onClick={() => disconnectWallet(wallet.id)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Disconnect"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {walletBals.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-border pt-4">
                      {walletBals.map((bal) => (
                        <div
                          key={bal.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {bal.asset?.symbol?.toUpperCase()} —{" "}
                            {formatNumber(bal.balance)}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(bal.usd_value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
