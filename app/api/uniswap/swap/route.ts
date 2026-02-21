import { NextRequest, NextResponse } from "next/server";

const UNISWAP_SWAP_URL = "https://trade-api.gateway.uniswap.org/v1/swap";

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
    const { quote, permitData, signature } = body;

    if (!quote) {
      return NextResponse.json(
        { error: "Missing required field: quote" },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      quote,
    };
    if (permitData) payload.permitData = permitData;
    if (signature) payload.signature = signature;

    const response = await fetch(UNISWAP_SWAP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "x-universal-router-version": "2.0",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error ?? data.detail ?? "Uniswap swap request failed" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Swap request failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
