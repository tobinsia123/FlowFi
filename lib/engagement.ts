import type { InstagramMedia } from "@/lib/types";
import type { EngagementMetrics } from "@/lib/types";
import { VOLATILITY_THRESHOLD } from "@/lib/constants";

export function calculateEngagementVolatility(media: InstagramMedia[]): EngagementMetrics {
  if (media.length === 0) {
    return {
      averageEngagement: 0,
      volatilityScore: 0,
      trendDirection: "stable",
      riskLevel: "low",
    };
  }

  const postsWithEngagement = media
    .map((m) => {
      const likes = m.like_count ?? 0;
      const comments = m.comments_count ?? 0;
      return { engagement: likes + comments, timestamp: new Date(m.timestamp).getTime() };
    })
    .filter((p) => p.engagement >= 0)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (postsWithEngagement.length === 0) {
    return {
      averageEngagement: 0,
      volatilityScore: 0,
      trendDirection: "stable",
      riskLevel: "low",
    };
  }

  const engagementValues = postsWithEngagement.map((p) => p.engagement);
  const averageEngagement =
    engagementValues.reduce((a, b) => a + b, 0) / engagementValues.length;

  const variance =
    engagementValues.reduce((sum, val) => sum + Math.pow(val - averageEngagement, 2), 0) /
    engagementValues.length;
  const stdDev = Math.sqrt(variance);
  const volatilityScore = averageEngagement > 0 ? stdDev / averageEngagement : 0;

  const midPoint = Math.floor(postsWithEngagement.length / 2);
  const firstHalfAvg =
    postsWithEngagement.slice(0, midPoint).reduce((s, p) => s + p.engagement, 0) /
    Math.max(midPoint, 1);
  const secondHalfAvg =
    postsWithEngagement.slice(midPoint).reduce((s, p) => s + p.engagement, 0) /
    Math.max(postsWithEngagement.length - midPoint, 1);

  let trendDirection: "up" | "down" | "stable" = "stable";
  const trendDelta = secondHalfAvg - firstHalfAvg;
  const trendThreshold = averageEngagement * 0.1;
  if (trendDelta > trendThreshold) trendDirection = "up";
  else if (trendDelta < -trendThreshold) trendDirection = "down";

  let riskLevel: "low" | "medium" | "high" = "low";
  if (volatilityScore > VOLATILITY_THRESHOLD * 2 || trendDirection === "down") {
    riskLevel = "high";
  } else if (volatilityScore > VOLATILITY_THRESHOLD || trendDirection === "stable") {
    riskLevel = "medium";
  }

  return {
    averageEngagement: Math.round(averageEngagement * 100) / 100,
    volatilityScore: Math.round(volatilityScore * 1000) / 1000,
    trendDirection,
    riskLevel,
  };
}
