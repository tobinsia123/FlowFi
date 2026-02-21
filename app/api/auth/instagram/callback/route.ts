import { NextRequest, NextResponse } from "next/server";

const INSTAGRAM_TOKEN_URL = "https://api.instagram.com/oauth/access_token";

interface InstagramTokenResponse {
  access_token: string;
  user_id: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("error", error);
    redirectUrl.searchParams.set("error_description", errorDescription ?? "Unknown error");
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/?error=config", request.url));
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(INSTAGRAM_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("error", "token_exchange_failed");
    redirectUrl.searchParams.set("detail", JSON.stringify(errorData));
    return NextResponse.redirect(redirectUrl);
  }

  const data = (await response.json()) as InstagramTokenResponse;

  const redirectUrl = new URL("/", request.url);
  redirectUrl.searchParams.set("instagram_token", data.access_token);
  redirectUrl.searchParams.set("instagram_user_id", String(data.user_id));

  return NextResponse.redirect(redirectUrl);
}
