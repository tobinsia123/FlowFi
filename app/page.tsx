"use client";

import { useEffect, useState, Suspense } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AnalyticsPanel } from "@/components/analytics-panel";
import { HedgePanel } from "@/components/hedge-panel";
import { calculateEngagementVolatility } from "@/lib/engagement";
import type { InstagramMedia } from "@/lib/types";
import type { EngagementMetrics } from "@/lib/types";

function MainContent() {
  const [instagramToken, setInstagramToken] = useState<string | null>(null);
  const [instagramUserId, setInstagramUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [media, setMedia] = useState<InstagramMedia[]>([]);
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("instagram_token");
    const userId = params.get("instagram_user_id");
    if (token && userId) {
      try {
        sessionStorage.setItem("instagram_token", token);
        sessionStorage.setItem("instagram_user_id", userId);
      } catch {
        // sessionStorage may be unavailable
      }
      setInstagramToken(token);
      setInstagramUserId(userId);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("instagram_token");
      const storedUserId = sessionStorage.getItem("instagram_user_id");
      if (stored && storedUserId) {
        setInstagramToken(stored);
        setInstagramUserId(storedUserId);
      }
    }
  }, []);

  useEffect(() => {
    if (!instagramToken) {
      setUsername("");
      setMedia([]);
      setMetrics(null);
      return;
    }
    const fetchMedia = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/instagram/media?access_token=${encodeURIComponent(instagramToken)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
        setUsername(data.user?.username ?? "Unknown");
        setMedia(data.media ?? []);
        const m = calculateEngagementVolatility(data.media ?? []);
        setMetrics(m);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load Instagram data");
        setUsername("");
        setMedia([]);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [instagramToken]);

  const instagramConnected = Boolean(instagramToken);

  return (
    <div className="min-h-screen flex flex-col">
      <Header instagramConnected={instagramConnected} />
      <main className="flex-1 container px-4 py-8">
        {error && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            {loading ? (
              <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">
                Loading Instagram data...
              </div>
            ) : instagramConnected && username ? (
              <AnalyticsPanel username={username} media={media} />
            ) : (
              <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">
                Connect Instagram to view your analytics.
              </div>
            )}
          </div>
          <div>
            <HedgePanel
              metrics={metrics}
              disabled={!instagramConnected || loading}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <MainContent />
    </Suspense>
  );
}
