import type { InstagramMedia } from "@/lib/types";

const DEMO_USERNAME = "demo_creator";

// Use fixed base date so server and client render identical content (avoids hydration mismatch)
const FIXED_BASE_MS = 1737504000000; // 2025-01-22 00:00:00 UTC

function makeMediaList(engagementSequence: number[], prefix: string): InstagramMedia[] {
  const dayMs = 24 * 60 * 60 * 1000;
  return engagementSequence.map((engagement, i) => {
    const timestamp = new Date(FIXED_BASE_MS - (engagementSequence.length - i) * dayMs).toISOString();
    const likes = Math.floor(engagement * 0.85);
    const comments = Math.floor(engagement * 0.15);
    return {
      id: `${prefix}_${i}`,
      media_type: "IMAGE" as const,
      media_url: "",
      timestamp,
      like_count: likes,
      comments_count: comments,
    };
  });
}

export interface DemoAd {
  id: string;
  label: string;
  media: InstagramMedia[];
}

/** Underperforming ads: declining engagement → bad stats → recommend hedge to USDC */
export const UNDERPERFORMING_ADS: DemoAd[] = [
  {
    id: "under-1",
    label: "Summer Collection (Declining reach)",
    media: makeMediaList([520, 480, 450, 410, 380, 340, 310, 280, 250, 220, 200, 180], "under1"),
  },
  {
    id: "under-2",
    label: "Brand Collab Q1 (Drop-off)",
    media: makeMediaList([680, 620, 550, 490, 420, 360, 300, 250, 200, 160, 130, 100], "under2"),
  },
  {
    id: "under-3",
    label: "Story Series (Low retention)",
    media: makeMediaList([400, 370, 340, 310, 280, 250, 220, 190, 165, 140, 120, 95], "under3"),
  },
];

/** Performing well ads: rising engagement → good stats → recommend allocate to ETH */
export const PERFORMING_WELL_ADS: DemoAd[] = [
  {
    id: "up-1",
    label: "Viral Reel (Trending)",
    media: makeMediaList([120, 160, 200, 250, 300, 360, 420, 480, 540, 600, 660, 720], "up1"),
  },
  {
    id: "up-2",
    label: "Product Launch (Strong growth)",
    media: makeMediaList([80, 130, 190, 260, 340, 430, 520, 620, 730, 850, 980, 1120], "up2"),
  },
  {
    id: "up-3",
    label: "Tutorial Series (Rising engagement)",
    media: makeMediaList([200, 240, 285, 335, 390, 450, 520, 595, 680, 770, 870, 980], "up3"),
  },
];

/** Legacy exports for compatibility */
export const MOCK_MEDIA_ENGAGEMENT_DOWN = UNDERPERFORMING_ADS[0].media;
export const MOCK_MEDIA_ENGAGEMENT_UP = PERFORMING_WELL_ADS[0].media;

export { DEMO_USERNAME };
