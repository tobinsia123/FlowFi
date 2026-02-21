"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AnalyticsPanel } from "@/components/analytics-panel";
import { HedgePanel } from "@/components/hedge-panel";
import { calculateEngagementVolatility } from "@/lib/engagement";
import type { EngagementMetrics } from "@/lib/types";
import {
  DEMO_USERNAME,
  UNDERPERFORMING_ADS,
  PERFORMING_WELL_ADS,
} from "@/lib/mock-demo";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, ChevronDown } from "lucide-react";

type Scenario = "down" | "up";

interface ScenarioMessages {
  error: string | null;
  txHash: string | null;
}

const initialMessages: ScenarioMessages = { error: null, txHash: null };

export default function Page() {
  const [scenario, setScenario] = useState<Scenario>("down");
  const [underIndex, setUnderIndex] = useState(0);
  const [upIndex, setUpIndex] = useState(0);
  const [messagesByScenario, setMessagesByScenario] = useState<Record<Scenario, ScenarioMessages>>({
    down: { ...initialMessages },
    up: { ...initialMessages },
  });

  const ads = scenario === "down" ? UNDERPERFORMING_ADS : PERFORMING_WELL_ADS;
  const adIndex = scenario === "down" ? underIndex : upIndex;
  const selectedAd = ads[adIndex];
  const mockMedia = selectedAd.media;

  const metrics = useMemo<EngagementMetrics | null>(
    () => calculateEngagementVolatility(mockMedia),
    [mockMedia]
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-radial">
      <Header />
      <main className="flex-1 container mx-auto max-w-6xl px-6 py-10">
        {/* Scenario tabs + dropdown: higher on page */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex rounded-lg border border-border/50 bg-card/40 p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setScenario("down")}
                className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                  scenario === "down"
                    ? "bg-destructive/15 text-destructive shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <TrendingDown className="h-4 w-4 shrink-0" />
                Underperforming Ads
              </button>
              <button
                type="button"
                onClick={() => setScenario("up")}
                className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                  scenario === "up"
                    ? "bg-success/15 text-success shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <TrendingUp className="h-4 w-4 shrink-0" />
                Ads Performing Well
              </button>
            </div>
            <div className="relative">
              <label htmlFor="ad-select" className="sr-only">
                Select ad
              </label>
              <select
                id="ad-select"
                value={adIndex}
                onChange={(e) => {
                  const i = Number(e.target.value);
                  if (scenario === "down") setUnderIndex(i);
                  else setUpIndex(i);
                }}
                className="h-10 min-w-[220px] appearance-none rounded-lg border border-border/50 bg-card/60 pl-3 pr-9 py-2 text-sm text-foreground shadow-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                {ads.map((ad, i) => (
                  <option key={ad.id} value={i}>
                    {ad.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">@{DEMO_USERNAME}</p>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Creator Treasury Risk
          </h1>
          <p className="mt-1 text-muted-foreground">
            Connect your wallet to hedge ad revenue volatility with DeFi.
          </p>
          <Badge variant="secondary" className="mt-2 text-xs font-normal">
            Proof of concept
          </Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <AnalyticsPanel username={DEMO_USERNAME} media={mockMedia} />
          </div>
          <div className="lg:pt-0">
            <HedgePanel
              key={scenario}
              metrics={metrics}
              disabled={false}
              scenarioKey={scenario}
              error={messagesByScenario[scenario].error}
              txHash={messagesByScenario[scenario].txHash}
              onError={(value) =>
                setMessagesByScenario((prev) => ({
                  ...prev,
                  [scenario]: { ...prev[scenario], error: value },
                }))
              }
              onTxHash={(value) =>
                setMessagesByScenario((prev) => ({
                  ...prev,
                  [scenario]: { ...prev[scenario], txHash: value },
                }))
              }
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
