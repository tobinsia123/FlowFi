import { NextRequest, NextResponse } from "next/server";
import type { InstagramMedia } from "@/lib/types";

const GRAPH_URL = "https://graph.facebook.com/v19.0";

interface PageAccount {
  id: string;
  access_token: string;
  name?: string;
}

interface PagesResponse {
  data: PageAccount[];
}

interface IGBAResponse {
  instagram_business_account?: { id: string };
}

interface IGUserResponse {
  username: string;
  profile_picture_url?: string;
}

interface MediaItem {
  id: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  timestamp: string;
  caption?: string;
}

interface MediaListResponse {
  data: MediaItem[];
  paging?: { next?: string };
}

interface InsightsResponse {
  data: { name: string; values: { value: number }[] }[];
}

async function graphGet<T>(
  path: string,
  params: Record<string, string>,
  accessToken: string
): Promise<T> {
  const searchParams = new URLSearchParams({ ...params, access_token: accessToken });
  const url = `${GRAPH_URL}${path}?${searchParams.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Graph API error: ${res.status}`);
  }
  return res.json();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accessToken = searchParams.get("access_token");

  if (!accessToken) {
    return NextResponse.json(
      { error: "Missing access_token" },
      { status: 400 }
    );
  }

  try {
    const pagesRes = await graphGet<PagesResponse>(
      "/me/accounts",
      { fields: "id,access_token,name" },
      accessToken
    );

    const pages = pagesRes.data ?? [];
    if (pages.length === 0) {
      return NextResponse.json(
        { error: "No Facebook Pages found. Connect a Page linked to an Instagram Business/Creator account." },
        { status: 400 }
      );
    }

    const page = pages[0];
    const pageToken = page.access_token;

    const igbaRes = await graphGet<IGBAResponse>(
      `/${page.id}`,
      { fields: "instagram_business_account" },
      pageToken
    );

    const igAccountId = igbaRes.instagram_business_account?.id;
    if (!igAccountId) {
      return NextResponse.json(
        { error: "No Instagram Business Account linked to this Page. Link an IG Business/Creator account in Meta Business Settings." },
        { status: 400 }
      );
    }

    const userRes = await graphGet<IGUserResponse>(
      `/${igAccountId}`,
      { fields: "username,profile_picture_url" },
      pageToken
    );

    const mediaRes = await graphGet<MediaListResponse>(
      `/${igAccountId}/media`,
      { fields: "id,media_type,media_url,permalink,timestamp,caption" },
      pageToken
    );

    const mediaList = mediaRes.data ?? [];
    const limit = Math.min(mediaList.length, 25);
    const slice = mediaList.slice(0, limit);

    const mediaWithMetrics: InstagramMedia[] = await Promise.all(
      slice.map(async (m) => {
        let engagement = 0;
        try {
          const insightsRes = await graphGet<InsightsResponse>(
            `/${m.id}/insights`,
            { metric: "engagement" },
            pageToken
          );
          const engagementVal = insightsRes.data?.[0]?.values?.[0]?.value;
          engagement = typeof engagementVal === "number" ? engagementVal : 0;
        } catch {
          // Insights may be unavailable for some media (e.g. albums, or delay)
        }
        return {
          id: m.id,
          media_type: (m.media_type as "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM") ?? "IMAGE",
          media_url: m.media_url ?? "",
          permalink: m.permalink,
          timestamp: m.timestamp,
          username: userRes.username,
          like_count: engagement,
          comments_count: 0,
        };
      })
    );

    return NextResponse.json({
      user: {
        id: igAccountId,
        username: userRes.username,
      },
      media: mediaWithMetrics,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch Instagram data";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
