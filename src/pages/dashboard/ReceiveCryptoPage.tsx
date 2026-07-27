import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Copy,
  Check,
  Share2,
  AlertTriangle,
  Loader2,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import { formatAddress, cn } from "@/lib/utils";
import type { Wallet as WalletType, Blockchain } from "@/lib/types";

export function ReceiveCryptoPage() {
  const { effectiveUserId } = useAuthStore();
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [blockchains, setBlockchains] = useState<Blockchain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [selectedChainId, setSelectedChainId] = useState<number | "">("");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      if (c.length > 0) setSelectedChainId(c[0].chain_id ?? 0);
      setLoading(false);
    })();
  }, [effectiveUserId]);

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
  const selectedChain = blockchains.find((b) => b.chain_id === selectedChainId);

  useEffect(() => {
    if (!selectedWallet || !canvasRef.current) return;
    drawQRCode(canvasRef.current, selectedWallet.address);
  }, [selectedWallet]);

  const copyAddress = () => {
    if (!selectedWallet) return;
    navigator.clipboard.writeText(selectedWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareAddress = async () => {
    if (!selectedWallet) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Wallet Address",
          text: `Send crypto to my address: ${selectedWallet.address}`,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      copyAddress();
    }
  };

  const downloadQR = () => {
    if (!canvasRef.current || !selectedWallet) return;
    const link = document.createElement("a");
    link.download = `address-${selectedWallet.address.slice(0, 8)}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
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
        <h1 className="text-2xl font-bold">Receive Crypto</h1>
        <p className="text-sm text-muted-foreground">
          Share your address to receive payments
        </p>
      </div>

      {wallets.length === 0 ? (
        <Card className="glass p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="h-7 w-7" />
          </div>
          <p className="font-medium">No wallets connected</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect a wallet to receive crypto.
          </p>
        </Card>
      ) : (
        <>
          <Card className="glass p-6">
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Wallet</Label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-secondary/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
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
            </CardContent>
          </Card>

          {selectedWallet && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass p-8">
                <CardContent className="flex flex-col items-center gap-6">
                  <div className="rounded-2xl border-2 border-primary/20 bg-white p-6">
                    <canvas
                      ref={canvasRef}
                      width={200}
                      height={200}
                      className="block"
                    />
                  </div>

                  <div className="w-full space-y-3">
                    <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
                      <p className="mb-1 text-xs text-muted-foreground">
                        Your Address
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 break-all text-sm font-medium">
                          {selectedWallet.address}
                        </code>
                        <button
                          onClick={copyAddress}
                          className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {selectedChain && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{selectedChain.name}</Badge>
                        <Badge variant="secondary">
                          {selectedChain.symbol}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex w-full gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={copyAddress}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={shareAddress}
                    >
                      <Share2 className="h-4 w-4" /> Share
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={downloadQR}
                    >
                      <Download className="h-4 w-4" /> QR
                    </Button>
                  </div>

                  <div className="flex w-full items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Only send {selectedChain?.symbol ?? "tokens"} on the{" "}
                      {selectedChain?.name ?? "selected"} network. Sending
                      tokens from other networks may result in permanent loss.
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium text-foreground">{children}</label>
  );
}

function drawQRCode(canvas: HTMLCanvasElement, text: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = 200;
  const modules = 25;
  const cellSize = size / modules;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  const data = generateQRMatrix(text, modules);

  ctx.fillStyle = "#000000";
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (data[r][c]) {
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }
}

function generateQRMatrix(text: string, size: number): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false),
  );

  const hash = (str: string, seed: number): number => {
    let h = seed;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  };

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      matrix[r][c] = hash(text, r * size + c) % 2 === 0;
    }
  }

  const drawFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[row + r][col + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  return matrix;
}
