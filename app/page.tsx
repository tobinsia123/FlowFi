"use client";

import { useEffect, useState, Suspense } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AnalyticsPanel, AnalyticsPanelSkeleton } from "@/components/analytics-panel";
import { HedgePanel } from "@/components/hedge-panel";
import { EmptyState } from "@/components/empty-state";
import { calculateEngagementVolatility } from "@/lib/engagement";
import type { InstagramMedia } from "@/lib/types";
import type { EngagementMetrics } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Settings, ExternalLink, X } from "lucide-react";

function MainContent() {
  const [instagramToken, setInstagramToken] = useState<string | null>(null);
  const [instagramUserId, setInstagramUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [media, setMedia] = useState<InstagramMedia[]>([]);
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("instagram_token");
    const userId = params.get("instagram_user_id");
    const err = params.get("error");

    if (err === "instagram_not_configured" || err === "config") {
      setSetupError("instagram_not_configured");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

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

  const handleConnectInstagram = () => {
    window.location.href = "/api/auth/instagram/authorize";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-radial">
      <Header instagramConnected={instagramConnected} />
      <main className="flex-1 container mx-auto max-w-6xl px-6 py-10">
        {setupError === "instagram_not_configured" && (
          <SetupRequiredCard onDismiss={() => setSetupError(null)} />
        )}
        {error && !setupError && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <h1 className="mb-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Creator Treasury Risk
              </h1>
              <p className="text-muted-foreground">
                Analyze engagement volatility and hedge your treasury with DeFi.
              </p>
              {instagramConnected && username && (
                <p className="mt-2 text-sm text-primary">
                  Connected as @{username}
                </p>
              )}
            </div>
            {loading ? (
              <AnalyticsPanelSkeleton />
            ) : instagramConnected && username ? (
              <AnalyticsPanel username={username} media={media} />
            ) : (
              <EmptyState type="instagram" onConnect={handleConnectInstagram} />
            )}
          </div>
          <div className="lg:pt-16">
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

function SetupRequiredCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
            <Settings className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">
              Instagram connection not set up
            </h3>
            <p className="mt-1 text-sm text-amber-700/90 dark:text-amber-300/90">
              This app needs Instagram Basic Display API credentials to connect creator accounts.
              Add <code className="rounded bg-black/10 px-1 py-0.5 text-xs">INSTAGRAM_CLIENT_ID</code>,{" "}
              <code className="rounded bg-black/10 px-1 py-0.5 text-xs">INSTAGRAM_CLIENT_SECRET</code>, and{" "}
              <code className="rounded bg-black/10 px-1 py-0.5 text-xs">INSTAGRAM_REDIRECT_URI</code> to your{" "}
              <code className="rounded bg-black/10 px-1 py-0.5 text-xs">.env</code> file.
            </p>
            <a
              href="https://developers.facebook.com/docs/instagram-basic-display-api/getting-started"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline"
            >
              Instagram Basic Display setup guide
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onDismiss} className="shrink-0 text-amber-700 dark:text-amber-300">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <MainContent />
    </Suspense>
  );
}
