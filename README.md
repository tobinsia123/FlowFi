# FlowFi — InfluenceHedge

FlowFi is a SocialFi risk management dashboard for Instagram creators. When engagement fluctuates, creator income becomes volatile. FlowFi connects Instagram analytics with DeFi to recommend treasury hedges—swapping to stablecoin when engagement drops, or allocating to growth assets when it rises—powered by the Uniswap API.

## How Instagram is Used

We use the **Instagram Basic Display API** (official Meta API, no scraping):

1. **OAuth flow**: Users connect via Instagram login; we exchange the authorization code for a short-lived access token on our backend.
2. **Data fetching**: We fetch `user_profile` and `user_media` to retrieve username, recent posts, like counts, and comment counts.
3. **Engagement analysis**: We compute average engagement, volatility score, trend direction (up/down/stable), and risk level from this media data.
4. **Hedge recommendations**: Based on the analysis, we recommend either hedging ETH → USDC (engagement down, high volatility) or allocating USDC → ETH (engagement up or stable).

We do not store tokens or sensitive data server-side beyond what the OAuth flow requires.

## How Uniswap API is Used

All Uniswap API calls go through backend routes to protect the API key:

1. **Quote route** (`/api/uniswap/quote`): Accepts token pair, amount, and swapper address; forwards a POST request to `https://trade-api.gateway.uniswap.org/v1/quote` with `x-api-key` and `x-universal-router-version: 2.0`. Returns expected output, gas estimate, price impact, and route.
2. **Swap route** (`/api/uniswap/swap`): Accepts quote, permit data, and signature; forwards to `/v1/swap` and returns the transaction calldata for the user to sign and broadcast via wagmi.
3. **Execution**: The frontend uses wagmi + viem to send the transaction on Sepolia. Users see the tx hash and an Etherscan link.

The app targets **Sepolia** for the hackathon. Native ETH and USDC (testnet) are used for swaps.

## Demo Script

1. **Setup**
   - Copy `.env.example` to `.env`
   - Add `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_REDIRECT_URI` (e.g. `http://localhost:3000/api/auth/instagram/callback`)
   - Add `UNISWAP_API_KEY` (from [Uniswap Developer Portal](https://developers.uniswap.org/dashboard))
   - Add `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (from [WalletConnect Cloud](https://cloud.walletconnect.com))
   - Run `npm install` then `npm run dev`

2. **Connect Instagram**
   - Click "Connect Instagram" and complete the OAuth flow
   - After redirect, the dashboard fetches your media and displays analytics

3. **View Analytics**
   - Left panel: profile name, average engagement, volatility score, risk level badge
   - Engagement trend chart shows recent post performance

4. **Get Hedge Recommendation**
   - Right panel shows the recommendation (ETH → USDC or USDC → ETH) and reasoning

5. **Execute Hedge**
   - Enter an amount and click "Get Quote"
   - Review expected output, gas, and price impact
   - Connect wallet (RainbowKit) and click "Execute Hedge"
   - Sign permit (if required) and transaction
   - View tx hash and Etherscan link

6. **Tech stack**
   - Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui
   - wagmi + viem + RainbowKit
   - Uniswap Trading API v1 (quote + swap)
   - Instagram Basic Display API

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/instagram/   # OAuth authorize + callback
│   │   ├── instagram/media   # Proxy for media fetch
│   │   └── uniswap/          # quote + swap (API key protected)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── header.tsx
│   ├── analytics-panel.tsx
│   ├── hedge-panel.tsx
│   ├── footer.tsx
│   └── ui/
├── lib/
│   ├── engagement.ts         # calculateEngagementVolatility
│   ├── hedge.ts              # getHedgeRecommendation
│   ├── constants.ts
│   ├── types.ts
│   ├── utils.ts
│   ├── wagmi.tsx
│   └── wagmi-config.ts
└── package.json
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `INSTAGRAM_CLIENT_ID` | Instagram app client ID |
| `INSTAGRAM_CLIENT_SECRET` | Instagram app client secret |
| `INSTAGRAM_REDIRECT_URI` | OAuth redirect (e.g. `http://localhost:3000/api/auth/instagram/callback`) |
| `UNISWAP_API_KEY` | Uniswap Trading API key |
| `NEXT_PUBLIC_CHAIN_ID` | `11155111` for Sepolia |
| `NEXT_PUBLIC_RPC_URL` | Sepolia RPC URL |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID |

## Deploy

- Optimized for **Vercel** deployment. Set the env vars in the Vercel dashboard and add your production `INSTAGRAM_REDIRECT_URI` to the Instagram app settings.

## License

MIT
