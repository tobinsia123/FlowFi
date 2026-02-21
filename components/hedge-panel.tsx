"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  usePublicClient,
  useSendTransaction,
  useSignTypedData,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getHedgeRecommendation } from "@/lib/hedge";
import type { EngagementMetrics } from "@/lib/types";
import type { HedgeRecommendation } from "@/lib/types";
import { SEPOLIA_TOKEN_ADDRESSES } from "@/lib/constants";
import { ETH_DECIMALS, USDC_DECIMALS } from "@/lib/constants";
import { formatUnits, parseUnits, waitForTransactionReceipt } from "viem";
import { Shield, ArrowRightLeft, ExternalLink, Loader2, Wallet, Zap } from "lucide-react";

const TOKEN_LABELS: Record<string, string> = {
  [SEPOLIA_TOKEN_ADDRESSES.ETH]: "ETH",
  [SEPOLIA_TOKEN_ADDRESSES.USDC]: "USDC",
};

interface HedgePanelProps {
  metrics: EngagementMetrics | null;
  disabled: boolean;
  /** Scenario key so parent can scope error/txHash per tab (e.g. "down" | "up") */
  scenarioKey?: string;
  /** Controlled error message (scoped per scenario by parent) */
  error?: string | null;
  /** Controlled tx hash (scoped per scenario by parent) */
  txHash?: string | null;
  /** Called when error should be set (parent stores by scenarioKey) */
  onError?: (value: string | null) => void;
  /** Called when tx hash should be set (parent stores by scenarioKey) */
  onTxHash?: (value: string | null) => void;
}

interface UniswapQuoteResponse {
  quote: unknown;
  permitData: unknown;
  permitTransaction?: unknown;
  routing: string;
}

const CHAIN_ID_SEPOLIA = 11155111;

export function HedgePanel({
  metrics,
  disabled,
  scenarioKey,
  error: controlledError,
  txHash: controlledTxHash,
  onError,
  onTxHash,
}: HedgePanelProps) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: CHAIN_ID_SEPOLIA });
  const { data: walletClient } = useWalletClient({ chainId: CHAIN_ID_SEPOLIA });
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  const { signTypedDataAsync } = useSignTypedData();

  const [amount, setAmount] = useState("0.01");
  const [quote, setQuote] = useState<UniswapQuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const isControlled = onError != null && onTxHash != null;
  const error = isControlled ? (controlledError ?? null) : undefined;
  const txHash = isControlled ? (controlledTxHash ?? null) : undefined;
  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalTxHash, setInternalTxHash] = useState<string | null>(null);

  const displayError = isControlled ? error : internalError;
  const displayTxHash = isControlled ? txHash : internalTxHash;
  const setError = isControlled ? (v: string | null) => onError?.(v) : setInternalError;
  const setTxHash = isControlled ? (v: string | null) => onTxHash?.(v) : setInternalTxHash;

  // Invalidate quote when amount changes so we never execute a stale amount
  useEffect(() => {
    setQuote(null);
  }, [amount]);

  const recommendation = metrics ? getHedgeRecommendation(metrics) : null;
  const isSwapToStable = recommendation?.recommendedTokenOut === SEPOLIA_TOKEN_ADDRESSES.USDC;

  const handleGetQuote = async () => {
    if (!address || !recommendation) return;
    const trimmed = amount.trim();
    if (!trimmed || trimmed === "0" || trimmed === "0.") {
      setError("Enter an amount greater than 0");
      return;
    }
    setLoading(true);
    setError(null);
    setQuote(null);
    try {
      const tokenIn = recommendation.recommendedTokenIn;
      const decimals = tokenIn === SEPOLIA_TOKEN_ADDRESSES.ETH ? ETH_DECIMALS : USDC_DECIMALS;
      let amountWei: bigint;
      try {
        amountWei = parseUnits(trimmed, decimals);
      } catch {
        setError("Invalid amount (use a number, e.g. 0.0001 or 1)");
        setLoading(false);
        return;
      }
      if (amountWei === 0n) {
        setError("Amount is too small");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/uniswap/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenIn,
          tokenOut: recommendation.recommendedTokenOut,
          amount: amountWei.toString(),
          chainId: 11155111,
          swapper: address,
          type: "EXACT_INPUT",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Quote failed");
      setQuote(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Quote failed");
    } finally {
      setLoading(false);
    }
  };

  const sendTx = async (
    tx: { to: string; data: string; value?: string; chainId?: number },
    waitForReceipt = false
  ): Promise<string> => {
    const valueHex = tx.value;
    const value = typeof valueHex === "string" && valueHex.startsWith("0x")
      ? BigInt(valueHex)
      : BigInt(valueHex ?? "0");
    const request = {
      to: tx.to as `0x${string}`,
      data: tx.data as `0x${string}`,
      value,
      chain: sepolia,
    };
    // Prefer wallet client with explicit chain (fixes "chain: undefined" in Phantom/wallets)
    let hash: string;
    if (walletClient) {
      hash = await walletClient.sendTransaction(request);
    } else {
      hash = await sendTransactionAsync({
        to: request.to,
        data: request.data,
        value: request.value,
        chainId: CHAIN_ID_SEPOLIA,
      });
    }
    if (waitForReceipt && publicClient && hash) {
      await waitForTransactionReceipt(publicClient, { hash });
    }
    return hash;
  };

  const handleExecute = async () => {
    if (!address || !quote || !recommendation) return;
    setLoading(true);
    setError(null);
    try {
      // Same as ETH: ensure wallet is on Sepolia before any tx
      if (switchChainAsync) {
        try {
          await switchChainAsync({ chainId: CHAIN_ID_SEPOLIA });
        } catch {
          // already on chain or user rejected
        }
      }

      const { quote: q, permitData } = quote;
      const tokenIn = recommendation.recommendedTokenIn;
      const qObj = q as Record<string, unknown>;
      const inputFromQuote = (qObj?.input as { amount?: string } | undefined)?.amount;
      // Use quote input amount, or derive from current amount state so we never skip approval for USDC
      const inputAmount =
        inputFromQuote ??
        (() => {
          try {
            return parseUnits(amount.trim(), USDC_DECIMALS).toString();
          } catch {
            return undefined;
          }
        })();

      // When swapping from USDC, ensure Permit2 has token approval before swap (avoids TRANSFER_FROM_FAILED)
      if (tokenIn === SEPOLIA_TOKEN_ADDRESSES.USDC && inputAmount) {
        const approvalRes = await fetch("/api/uniswap/check-approval", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address,
            token: SEPOLIA_TOKEN_ADDRESSES.USDC,
            amount: inputAmount,
            chainId: CHAIN_ID_SEPOLIA,
          }),
        });
        const approvalData = await approvalRes.json();
        if (!approvalRes.ok) {
          throw new Error(approvalData.error ?? approvalData.detail ?? "USDC approval check failed");
        }
        if (approvalData.cancel && typeof approvalData.cancel === "object") {
          const cancelTx = approvalData.cancel as {
            to: string;
            data: string;
            value?: string;
            chainId: number;
          };
          await sendTx(cancelTx, true);
        }
        if (approvalData.approval && typeof approvalData.approval === "object") {
          const approvalTx = approvalData.approval as {
            to: string;
            data: string;
            value?: string;
            chainId: number;
          };
          await sendTx(approvalTx, true);
          await new Promise((r) => setTimeout(r, 1500));
        }
      }

      let signature: string | undefined;

      if (permitData && typeof permitData === "object") {
        const pd = permitData as {
          domain: object;
          types: Record<string, unknown>;
          message?: Record<string, unknown>;
          values?: object;
          primaryType?: string;
          primary_type?: string;
        };
        const message = pd.message ?? pd.values;
        if (!message) throw new Error("Invalid permit data");
        // API may omit primaryType or use snake_case; viem requires it to be a key in types
        let primaryType =
          pd.primaryType ??
          (pd as Record<string, unknown>).primary_type as string | undefined;
        if (!primaryType && pd.types && typeof pd.types === "object") {
          primaryType = "PermitSingle" in pd.types ? "PermitSingle" : "PermitBatch" in pd.types ? "PermitBatch" : undefined;
        }
        if (!primaryType) throw new Error("Invalid permit data: missing primary type");
        signature = await signTypedDataAsync({
          domain: pd.domain,
          types: pd.types,
          message: typeof message === "object" ? message : {},
          primaryType,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      }

      const swapRes = await fetch("/api/uniswap/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote: q,
          permitData: permitData ?? undefined,
          signature: signature ?? undefined,
        }),
      });
      const swapData = await swapRes.json();
      if (!swapRes.ok) throw new Error(swapData.error ?? "Swap failed");

      const tx = swapData.swap as { to: string; data: string; value?: string; chainId?: number };
      // USDC→ETH: value must be 0 (same idea as ETH→USDC where value is the ETH amount)
      const swapValue =
        tokenIn === SEPOLIA_TOKEN_ADDRESSES.USDC
          ? "0"
          : typeof tx.value === "string"
            ? tx.value
            : "0";
      const hash = await sendTx({ ...tx, value: swapValue }, false);
      setTxHash(hash);
      setQuote(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Execute failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="card-glow overflow-hidden transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Hedge Engine</CardTitle>
              <p className="text-sm text-muted-foreground">Manage treasury risk</p>
            </div>
          </div>
          {recommendation && (
            <Badge
              variant={isSwapToStable ? "secondary" : "success"}
              className="font-medium"
            >
              {isSwapToStable ? "Hedge to USDC" : "Allocate to ETH"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {recommendation ? (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {recommendation.reasoning}
            </p>
            <p className="text-xs text-muted-foreground">
              {isSwapToStable
                ? "Swap ETH → USDC to protect treasury when engagement drops."
                : "Swap USDC → ETH to capture upside when engagement is rising."}
            </p>

            {!isConnected && (
              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Connect your wallet to get a quote and execute hedges.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                Amount to swap
              </span>
              <div className="relative">
                <Input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.01"
                  className="pr-12 text-base"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {TOKEN_LABELS[recommendation.recommendedTokenIn]}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {["0.0001", "0.001", "0.01", "0.1", "0.5", "1"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className="rounded-md border border-border/60 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 hover:text-foreground"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {quote && (
              <QuotePanel quote={quote} recommendation={recommendation} />
            )}

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {txHash && (
              <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
                <Zap className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-success">Transaction submitted</p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${displayTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    View on Etherscan
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {!quote ? (
                <Button
                  onClick={handleGetQuote}
                  disabled={disabled || loading || !address}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Getting quote...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="h-4 w-4" />
                      Get Quote
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleExecute}
                  disabled={disabled || loading || !address}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Execute Hedge
                    </>
                  )}
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
            <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Select a demo scenario above to see the recommended action.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuotePanel({
  quote,
  recommendation,
}: {
  quote: UniswapQuoteResponse;
  recommendation: HedgeRecommendation;
}) {
  const q = quote.quote as Record<string, unknown>;
  const input = q?.input as { amount?: string } | undefined;
  const output = q?.output as { amount?: string } | undefined;
  const gasFee = q?.gasFee as string | undefined;
  const routeString = q?.routeString as string | undefined;
  const priceImpact = q?.priceImpact as number | undefined;

  const inputLabel = TOKEN_LABELS[recommendation.recommendedTokenIn] ?? "Token";
  const outputLabel = TOKEN_LABELS[recommendation.recommendedTokenOut] ?? "Token";
  const inputDecimals =
    recommendation.recommendedTokenIn === SEPOLIA_TOKEN_ADDRESSES.ETH ? ETH_DECIMALS : USDC_DECIMALS;
  const outputDecimals =
    recommendation.recommendedTokenOut === SEPOLIA_TOKEN_ADDRESSES.ETH ? ETH_DECIMALS : USDC_DECIMALS;

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Quote details
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">You pay</span>
          <span className="font-medium tabular-nums">
            {input?.amount ? formatUnits(BigInt(input.amount), inputDecimals) : "-"} {inputLabel}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">You receive</span>
          <span className="font-medium tabular-nums">
            {output?.amount ? formatUnits(BigInt(output.amount), outputDecimals) : "-"} {outputLabel}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        {gasFee && (
          <span>Est. gas: {formatUnits(BigInt(gasFee), 18)} ETH</span>
        )}
        {typeof priceImpact === "number" && (
          <span>Price impact: {priceImpact.toFixed(2)}%</span>
        )}
      </div>
      {routeString && (
        <p className="truncate text-xs text-muted-foreground" title={routeString}>
          Route: {routeString}
        </p>
      )}
    </div>
  );
}
