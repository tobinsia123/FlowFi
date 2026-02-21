import { NextRequest, NextResponse } from "next/server";

const UNISWAP_API_URL = "https://trade-api.gateway.uniswap.org/v1/quote";

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
    const {
      tokenIn,
      tokenOut,
      amount,
      chainId = 11155111,
      swapper,
      type = "EXACT_INPUT",
    } = body;

    if (!tokenIn || !tokenOut || !amount || !swapper) {
      return NextResponse.json(
        { error: "Missing required fields: tokenIn, tokenOut, amount, swapper" },
        { status: 400 }
      );
    }

    const chainIdNum = typeof chainId === "string" ? parseInt(chainId, 10) : chainId;

    const response = await fetch(UNISWAP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "x-universal-router-version": "2.0",
      },
      body: JSON.stringify({
        type: type ?? "EXACT_INPUT",
        amount: String(amount),
        tokenInChainId: chainIdNum,
        tokenOutChainId: chainIdNum,
        tokenIn,
        tokenOut,
        swapper,
        slippageTolerance: 0.5,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error ?? data.detail ?? "Uniswap API error" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Quote request failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
