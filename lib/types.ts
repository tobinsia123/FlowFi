export interface InstagramMedia {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  permalink?: string;
  timestamp: string;
  username?: string;
  like_count?: number;
  comments_count?: number;
}

export interface InstagramUser {
  id: string;
  username: string;
  account_type?: string;
  media_count?: number;
}

export interface EngagementMetrics {
  averageEngagement: number;
  volatilityScore: number;
  trendDirection: "up" | "down" | "stable";
  riskLevel: "low" | "medium" | "high";
}

export interface HedgeRecommendation {
  recommendedTokenIn: string;
  recommendedTokenOut: string;
  reasoning: string;
}

export interface UniswapQuoteResponse {
  requestId: string;
  quote: unknown;
  routing: string;
  permitData: unknown;
}
