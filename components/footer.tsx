export function Footer() {
  return (
    <footer className="border-t border-border py-6">
      <div className="container flex flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground">
        <p>Powered by Uniswap API</p>
        <p>Built for ETHDenver — Uniswap API Bounty</p>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          GitHub
        </a>
        <p className="text-xs">
          We do not store wallet addresses server-side. Your data stays with you.
        </p>
      </div>
    </footer>
  );
}
