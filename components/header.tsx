"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";
import { Instagram, Wallet } from "lucide-react";

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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <span className="text-lg font-bold">F</span>
          </div>
          <div>
            <span className="text-lg">FlowFi</span>
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">InfluenceHedge</span>
          </div>
        </a>

        <div className="flex items-center gap-3">
          <Button
            variant={instagramConnected ? "secondary" : "default"}
            size="sm"
            onClick={handleConnectInstagram}
            className="gap-2"
          >
            <Instagram className="h-4 w-4" />
            {instagramConnected ? "Connected" : "Connect Instagram"}
          </Button>
          <div className="[&>button]:rounded-lg [&>button]:!h-9 [&>button]:!px-4 [&>button]:text-sm">
            <ConnectButton
              chainStatus="icon"
              showBalance={false}
              accountStatus={{
                smallScreen: "avatar",
                largeScreen: "full",
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
