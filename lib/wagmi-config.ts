import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!projectId || projectId.trim() === "") {
  throw new Error(
    "Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID. Get a free project ID at https://cloud.walletconnect.com and add it to your .env file."
  );
}

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? "https://rpc.sepolia.org";

export const config = getDefaultConfig({
  appName: "FlowFi - InfluenceHedge",
  projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(rpcUrl),
  },
});
