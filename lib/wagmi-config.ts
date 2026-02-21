import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";

const FALLBACK_PROJECT_ID = "4bc00f380b74daa44a3d7c800f1a6335";
const envProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? process.env.WALLETCONNECT_PROJECT_ID;
const projectId =
  typeof envProjectId === "string" && envProjectId.trim().length > 0
    ? envProjectId.trim()
    : FALLBACK_PROJECT_ID;
if (projectId === FALLBACK_PROJECT_ID) {
  console.warn(
    "[wagmi-config] WalletConnect project ID missing in env; using fallback hackathon project ID."
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
