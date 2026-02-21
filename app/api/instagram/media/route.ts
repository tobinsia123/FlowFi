import { NextRequest, NextResponse } from "next/server";
import type { InstagramMedia } from "@/lib/types";

const INSTAGRAM_GRAPH_URL = "https://graph.instagram.com";

interface InstagramUserResponse {
  id: string;
  username: string;
  account_type?: string;
  media_count?: number;
}

interface InstagramMediaResponse {
  id: string;
  media_type: string;
  media_url?: string;
  permalink?: string;
  timestamp: string;
  username?: string;
  like_count?: number;
  comments_count?: number;
}

async function fetchWithToken<T>(
  accessToken: string,
  path: string,
  fields: string
): Promise<T> {
  const url = `${INSTAGRAM_GRAPH_URL}${path}?fields=${fields}&access_token=${accessToken}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Instagram API error: ${res.status}`);
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
    const userData = await fetchWithToken<InstagramUserResponse>(
      accessToken,
      "/me",
      "id,username,account_type,media_count"
    );

    const mediaResponse = await fetchWithToken<{ data: InstagramMediaResponse[]; paging?: { next?: string } }>(
      accessToken,
      "/me/media",
      "id,media_type,media_url,permalink,timestamp,username"
    );

    const media = mediaResponse.data ?? [];
    const limit = Math.min(media.length, 25);
    const mediaIds = media.slice(0, limit).map((m) => m.id);

    const mediaWithMetrics: InstagramMedia[] = await Promise.all(
      mediaIds.map(async (id) => {
        const mediaDetail = await fetchWithToken<InstagramMediaResponse>(
          accessToken,
          `/${id}`,
          "id,media_type,media_url,permalink,timestamp,username,like_count,comments_count"
        );
        return {
          id: mediaDetail.id,
          media_type: mediaDetail.media_type as "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM",
          media_url: mediaDetail.media_url ?? "",
          permalink: mediaDetail.permalink,
          timestamp: mediaDetail.timestamp,
          username: mediaDetail.username,
          like_count: mediaDetail.like_count ?? 0,
          comments_count: mediaDetail.comments_count ?? 0,
        };
      })
    );

    return NextResponse.json({
      user: userData,
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
