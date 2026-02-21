import { NextRequest, NextResponse } from "next/server";

const UNISWAP_CHECK_APPROVAL_URL = "https://trade-api.gateway.uniswap.org/v1/check_approval";

export async function POST(request: NextRequest) {
  const apiKey = process.env.UNISWAP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Uniswap API not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { walletAddress, token, amount, chainId = 11155111 } = body;

    if (!walletAddress || !token || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: walletAddress, token, amount" },
        { status: 400 }
      );
    }

    const response = await fetch(UNISWAP_CHECK_APPROVAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "x-universal-router-version": "2.0",
      },
      body: JSON.stringify({
        walletAddress,
        token,
        amount: String(amount),
        chainId: Number(chainId),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail ?? data.error ?? "Check approval failed" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Check approval request failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
