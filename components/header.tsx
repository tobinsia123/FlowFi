"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";

export function Header({
  instagramConnected,
}: {
  instagramConnected: boolean;
}) {
  const handleConnectInstagram = useCallback(() => {
    if (instagramConnected) return;
    window.location.href = "/api/auth/instagram/authorize";
  }, [instagramConnected]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <a href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">FlowFi</span>
          <span className="text-xs text-muted-foreground">InfluenceHedge</span>
        </a>

        <div className="flex items-center gap-3">
          <Button
            variant={instagramConnected ? "secondary" : "default"}
            size="sm"
            onClick={handleConnectInstagram}
          >
            {instagramConnected ? "Instagram ✓" : "Connect Instagram"}
          </Button>
          <ConnectButton chainStatus="icon" showBalance={false} />
        </div>
      </div>
    </header>
  );
}
