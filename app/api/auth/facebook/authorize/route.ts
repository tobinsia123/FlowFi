import { NextResponse } from "next/server";

export async function GET() {
  const authUrl =
    `https://www.facebook.com/v25.0/dialog/oauth?` +
    `client_id=${process.env.FACEBOOK_APP_ID}` +
    `&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}` +
    `&scope=instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement` +
    `&response_type=code`;

  return NextResponse.redirect(authUrl);
}