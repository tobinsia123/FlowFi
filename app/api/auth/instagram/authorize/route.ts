import { NextResponse } from "next/server";

const INSTAGRAM_AUTH_URL = "https://api.instagram.com/oauth/authorize";
const SCOPES = ["user_profile", "user_media"];

export async function GET() {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Instagram OAuth not configured" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(","),
  });

  const authUrl = `${INSTAGRAM_AUTH_URL}?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
