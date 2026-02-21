"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <img
            src="/flowfi-icon.png"
            alt="FlowFi"
            className="h-9 w-9 rounded-lg object-contain"
          />
          <span className="text-lg">FlowFi</span>
        </a>

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
    </header>
  );
}
