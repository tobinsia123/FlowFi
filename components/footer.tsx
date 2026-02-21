import { Github, Shield, Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/30 py-8">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-6">
            <a
              href="https://app.uniswap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Zap className="h-4 w-4" />
              Powered by Uniswap API
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              Wallet addresses never stored
            </span>
            <span>ETHDenver · Uniswap Bounty</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
