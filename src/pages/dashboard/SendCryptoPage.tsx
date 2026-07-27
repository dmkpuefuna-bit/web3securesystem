import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  AlertCircle,
  Check,
  ChevronRight,
  ArrowLeft,
  Fuel,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Badge not used in this file
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import { formatAddress, cn } from "@/lib/utils";
import type { Wallet as WalletType, Blockchain } from "@/lib/types";

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

const SUPPORTED_TOKENS = [
  { symbol: "ETH", name: "Ethereum", isNative: true, decimals: 18 },
  { symbol: "USDT", name: "Tether USD", isNative: false, decimals: 6 },
  { symbol: "USDC", name: "USD Coin", isNative: false, decimals: 6 },
  { symbol: "DAI", name: "Dai Stablecoin", isNative: false, decimals: 18 },
  { symbol: "LINK", name: "Chainlink", isNative: false, decimals: 18 },
  { symbol: "UNI", name: "Uniswap", isNative: false, decimals: 18 },
  { symbol: "WBTC", name: "Wrapped BTC", isNative: false, decimals: 8 },
];

type Step = "form" | "review" | "signing" | "success" | "error";

export function SendCryptoPage() {
  const { effectiveUserId } = useAuthStore();
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [blockchains, setBlockchains] = useState<Blockchain[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [selectedChainId, setSelectedChainId] = useState<number | "">("");
  const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0]);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!effectiveUserId) return;
      const [walletsRes, chainRes] = await Promise.all([
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
      const w = (walletsRes.data as unknown as WalletType[]) ?? [];
      const c = (chainRes.data as unknown as Blockchain[]) ?? [];
      setWallets(w);
      setBlockchains(c);
      if (w.length > 0) setSelectedWalletId(w[0].id);
      setLoading(false);
    })();
  }, [effectiveUserId]);

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
  const selectedChain = blockchains.find((b) => b.chain_id === selectedChainId);

  useEffect(() => {
    if (
      !selectedChain ||
      !recipient ||
      !amount ||
      !ADDRESS_REGEX.test(recipient)
    ) {
      setGasEstimate(null);
      return;
    }
    setGasEstimate("~0.001 ETH");
  }, [selectedChain, recipient, amount]);

  const handleSend = async () => {
    setError(null);
    setStep("signing");

    try {
      if (!window.ethereum)
        throw new Error(
          "MetaMask is not installed. Please install MetaMask to send crypto.",
        );
      if (!selectedWallet) throw new Error("No wallet selected.");
      if (!selectedChain) throw new Error("No network selected.");
      if (!ADDRESS_REGEX.test(recipient))
        throw new Error("Invalid recipient address.");
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0)
        throw new Error("Invalid amount.");

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [
          { chainId: `0x${(selectedChain.chain_id ?? 0).toString(16)}` },
        ],
      });

      const valueWei = BigInt(
        Math.floor(parsedAmount * Math.pow(10, selectedToken.decimals)),
      );

      const txParams: Record<string, string> = {
        from: selectedWallet.address,
        to: recipient,
        value: `0x${valueWei.toString(16)}`,
      };

      if (!selectedToken.isNative) {
        const transferData = `0xa9059cbb${recipient.slice(2).padStart(64, "0")}${valueWei.toString(16).padStart(64, "0")}`;
        txParams.data = transferData;
      }

      const hash = (await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams],
      })) as string;

      setTxHash(hash);
      setStep("success");

      if (effectiveUserId) {
        await supabase.from("transactions").insert({
          user_id: effectiveUserId,
          wallet_id: selectedWallet.id,
          tx_hash: hash,
          type: selectedToken.isNative ? "send" : "send_token",
          direction: "out",
          amount: parsedAmount,
          chain_id: selectedChain.chain_id,
          status: "pending",
          timestamp: new Date().toISOString(),
        });

        await supabase.rpc("log_audit", {
          p_action: "transaction.sent",
          p_entity_type: "transaction",
          p_details: {
            hash,
            amount: parsedAmount,
            token: selectedToken.symbol,
            recipient,
          } as unknown as never,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setStep("error");
    }
  };

  const resetForm = () => {
    setStep("form");
    setRecipient("");
    setAmount("");
    setTxHash(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Send Crypto</h1>
        <p className="text-sm text-muted-foreground">
          Transfer tokens to any wallet address
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="glass p-6">
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>From Wallet</Label>
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-secondary/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {wallets.length === 0 && (
                      <option value="">No wallets connected</option>
                    )}
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label ?? formatAddress(w.address, 8)} ({w.provider})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Network</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {blockchains.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => setSelectedChainId(chain.chain_id ?? 0)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border p-3 text-sm transition-all",
                          selectedChainId === chain.chain_id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-accent",
                        )}
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                          {chain.symbol.slice(0, 2)}
                        </div>
                        {chain.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Token</Label>
                  <div className="flex flex-wrap gap-2">
                    {SUPPORTED_TOKENS.map((token) => (
                      <button
                        key={token.symbol}
                        onClick={() => setSelectedToken(token)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-sm transition-all",
                          selectedToken.symbol === token.symbol
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-accent",
                        )}
                      >
                        {token.symbol}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Address</Label>
                  <Input
                    id="recipient"
                    placeholder="0x... or ENS name"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className={cn(
                      recipient &&
                        !ADDRESS_REGEX.test(recipient) &&
                        "border-destructive/50",
                    )}
                  />
                  {recipient && !ADDRESS_REGEX.test(recipient) && (
                    <p className="text-xs text-destructive">
                      Invalid address format
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="amount">Amount</Label>
                    <button className="text-xs text-primary hover:underline">
                      MAX
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      step="any"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {selectedToken.symbol}
                    </span>
                  </div>
                </div>

                {gasEstimate && (
                  <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 p-3 text-sm">
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Est. Gas:</span>
                    <span className="font-medium">{gasEstimate}</span>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={() => setStep("review")}
                  disabled={
                    !selectedWallet ||
                    !selectedChain ||
                    !recipient ||
                    !amount ||
                    !ADDRESS_REGEX.test(recipient)
                  }
                >
                  Review Transaction <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="glass p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" /> Review Transaction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReviewRow
                  label="From"
                  value={
                    selectedWallet
                      ? formatAddress(selectedWallet.address, 10)
                      : "—"
                  }
                />
                <ReviewRow label="To" value={formatAddress(recipient, 10)} />
                <ReviewRow label="Network" value={selectedChain?.name ?? "—"} />
                <ReviewRow label="Token" value={selectedToken.symbol} />
                <ReviewRow
                  label="Amount"
                  value={`${amount} ${selectedToken.symbol}`}
                />
                {gasEstimate && (
                  <ReviewRow label="Est. Gas" value={gasEstimate} />
                )}

                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Double-check the recipient address. Transactions on the
                    blockchain are irreversible.
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep("form")}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    variant="gradient"
                    className="flex-1"
                    onClick={handleSend}
                  >
                    <Send className="h-4 w-4" /> Confirm & Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "signing" && (
          <motion.div
            key="signing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="glass p-8">
              <CardContent className="flex flex-col items-center gap-4 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <h3 className="text-lg font-semibold">Waiting for Signature</h3>
                <p className="text-sm text-muted-foreground">
                  Please confirm the transaction in your MetaMask wallet.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "success" && txHash && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="glass p-8">
              <CardContent className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold">Transaction Submitted</h3>
                <p className="text-sm text-muted-foreground">
                  Your transaction has been broadcast to the network.
                </p>
                <div className="w-full rounded-lg border border-border/50 bg-secondary/30 p-3 text-left">
                  <p className="text-xs text-muted-foreground">
                    Transaction Hash
                  </p>
                  <code className="text-sm break-all">{txHash}</code>
                </div>
                {selectedChain?.explorer_url && (
                  <a
                    href={`${selectedChain.explorer_url}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View on Explorer
                  </a>
                )}
                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={resetForm}
                >
                  Send Another Transaction
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="glass p-8">
              <CardContent className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold">Transaction Failed</h3>
                <p className="text-sm text-destructive">{error}</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("form")}>
                    <ArrowLeft className="h-4 w-4" /> Back to Form
                  </Button>
                  <Button variant="gradient" onClick={handleSend}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
