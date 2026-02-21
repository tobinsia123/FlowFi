import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code returned" }, { status: 400 });
  }

  const tokenRes = await fetch(
    `https://graph.facebook.com/v25.0/oauth/access_token?` +
      `client_id=${process.env.FACEBOOK_APP_ID}` +
      `&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}` +
      `&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
      `&code=${code}`
  );

  const tokenData = await tokenRes.json();

  return NextResponse.json(tokenData);
}