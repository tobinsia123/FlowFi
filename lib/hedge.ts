import type { EngagementMetrics, HedgeRecommendation } from "@/lib/types";
import { SEPOLIA_TOKEN_ADDRESSES } from "@/lib/constants";
import { VOLATILITY_THRESHOLD } from "@/lib/constants";

export function getHedgeRecommendation(metrics: EngagementMetrics): HedgeRecommendation {
  const { trendDirection, volatilityScore } = metrics;

  if (trendDirection === "down" && volatilityScore > VOLATILITY_THRESHOLD) {
    return {
      recommendedTokenIn: SEPOLIA_TOKEN_ADDRESSES.ETH,
      recommendedTokenOut: SEPOLIA_TOKEN_ADDRESSES.USDC,
      reasoning:
        "Engagement is declining with high volatility. Hedging into USDC protects your treasury from creator income instability.",
    };
  }

  if (trendDirection === "up") {
    return {
      recommendedTokenIn: SEPOLIA_TOKEN_ADDRESSES.USDC,
      recommendedTokenOut: SEPOLIA_TOKEN_ADDRESSES.ETH,
      reasoning:
        "Engagement is trending up. Allocating to ETH captures upside from creator growth.",
    };
  }

  return {
    recommendedTokenIn: SEPOLIA_TOKEN_ADDRESSES.USDC,
    recommendedTokenOut: SEPOLIA_TOKEN_ADDRESSES.ETH,
    reasoning:
      "Engagement is stable. Maintaining exposure to growth assets with a balanced allocation.",
  };
}
