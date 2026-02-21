"use client";

import { useState } from "react";
import { useAccount, useSendTransaction, useSignTypedData } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getHedgeRecommendation } from "@/lib/hedge";
import type { EngagementMetrics } from "@/lib/types";
import type { HedgeRecommendation } from "@/lib/types";
import { SEPOLIA_TOKEN_ADDRESSES } from "@/lib/constants";
import { ETH_DECIMALS, USDC_DECIMALS } from "@/lib/constants";
import { formatUnits, parseUnits } from "viem";

const TOKEN_LABELS: Record<string, string> = {
  [SEPOLIA_TOKEN_ADDRESSES.ETH]: "ETH",
  [SEPOLIA_TOKEN_ADDRESSES.USDC]: "USDC",
};

interface HedgePanelProps {
  metrics: EngagementMetrics | null;
  disabled: boolean;
}

interface UniswapQuoteResponse {
  quote: unknown;
  permitData: unknown;
  permitTransaction?: unknown;
  routing: string;
}

export function HedgePanel({ metrics, disabled }: HedgePanelProps) {
  const { address } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { signTypedDataAsync } = useSignTypedData();

  const [amount, setAmount] = useState("0.01");
  const [quote, setQuote] = useState<UniswapQuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recommendation = metrics ? getHedgeRecommendation(metrics) : null;

  const handleGetQuote = async () => {
    if (!address || !recommendation) return;
    setLoading(true);
    setError(null);
    setQuote(null);
    try {
      const tokenIn = recommendation.recommendedTokenIn;
      const decimals = tokenIn === SEPOLIA_TOKEN_ADDRESSES.ETH ? ETH_DECIMALS : USDC_DECIMALS;
      const amountWei = parseUnits(amount, decimals);

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

  const handleExecute = async () => {
    if (!address || !quote) return;
    setLoading(true);
    setError(null);
    try {
      const { quote: q, permitData } = quote;
      let signature: string | undefined;

      if (permitData && typeof permitData === "object") {
        const pd = permitData as {
          domain: object;
          types: Record<string, unknown>;
          message?: Record<string, unknown>;
          values?: object;
          primaryType?: string;
        };
        const message = pd.message ?? pd.values;
        if (!message) throw new Error("Invalid permit data");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signature = await signTypedDataAsync({
          domain: pd.domain,
          types: pd.types,
          message: typeof message === "object" ? message : {},
          primaryType: pd.primaryType,
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

      const tx = swapData.swap as { to: string; data: string; value: string; chainId: number };
      const hash = await sendTransactionAsync({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: BigInt(tx.value ?? "0"),
        chainId: tx.chainId,
      });
      setTxHash(hash);
      setQuote(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Execute failed");
    } finally {
      setLoading(false);
    }
  };

  const isSwapToStable = recommendation?.recommendedTokenOut === SEPOLIA_TOKEN_ADDRESSES.USDC;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Hedge Engine</CardTitle>
        {recommendation && (
          <Badge variant={isSwapToStable ? "secondary" : "success"}>
            {isSwapToStable ? "Hedge to USDC" : "Allocate to ETH"}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendation ? (
          <>
            <p className="text-sm text-muted-foreground">{recommendation.reasoning}</p>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Swap Amount</p>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.01"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {quote && (
              <QuotePanel quote={quote} recommendation={recommendation} />
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {txHash && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">Transaction</p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </a>
              </div>
            )}

            <div className="flex gap-2">
              {!quote ? (
                <Button
                  onClick={handleGetQuote}
                  disabled={disabled || loading || !address}
                  className="flex-1"
                >
                  {loading ? "Loading..." : "Get Quote"}
                </Button>
              ) : (
                <Button
                  onClick={handleExecute}
                  disabled={disabled || loading || !address}
                  className="flex-1"
                >
                  {loading ? "Executing..." : "Execute Hedge"}
                </Button>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Connect Instagram to see hedge recommendations based on your engagement metrics.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function QuotePanel({ quote, recommendation }: { quote: UniswapQuoteResponse; recommendation: HedgeRecommendation }) {
  const q = quote.quote as Record<string, unknown>;
  const input = q?.input as { amount?: string } | undefined;
  const output = q?.output as { amount?: string } | undefined;
  const gasFee = q?.gasFee as string | undefined;
  const routeString = q?.routeString as string | undefined;
  const priceImpact = q?.priceImpact as number | undefined;

  const inputLabel = TOKEN_LABELS[recommendation.recommendedTokenIn] ?? "Token";
  const outputLabel = TOKEN_LABELS[recommendation.recommendedTokenOut] ?? "Token";
  const inputDecimals = recommendation.recommendedTokenIn === SEPOLIA_TOKEN_ADDRESSES.ETH ? ETH_DECIMALS : USDC_DECIMALS;
  const outputDecimals = recommendation.recommendedTokenOut === SEPOLIA_TOKEN_ADDRESSES.ETH ? ETH_DECIMALS : USDC_DECIMALS;

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <p className="text-xs font-medium">Quote</p>
      <div className="flex justify-between text-sm">
        <span>{inputLabel}</span>
        <span>{input?.amount ? formatUnits(BigInt(input.amount), inputDecimals) : "-"}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>{outputLabel}</span>
        <span>{output?.amount ? formatUnits(BigInt(output.amount), outputDecimals) : "-"}</span>
      </div>
      {gasFee && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Est. Gas</span>
          <span>{formatUnits(BigInt(gasFee), 18)} ETH</span>
        </div>
      )}
      {typeof priceImpact === "number" && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Price Impact</span>
          <span>{priceImpact.toFixed(2)}%</span>
        </div>
      )}
      {routeString && (
        <p className="truncate text-xs text-muted-foreground" title={routeString}>
          Route: {routeString}
        </p>
      )}
    </div>
  );
}
