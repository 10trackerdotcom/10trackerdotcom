import { NextResponse } from "next/server";

/**
 * This app uses Clerk for authentication.
 *
 * A previous experimental Google OAuth flow lived at this endpoint and:
 * - hardcoded OAuth client secrets
 * - redirected to a non-existent handler
 * - stored access tokens in localStorage (not a real session)
 *
 * To avoid trapping new users in a broken flow, we redirect to the Clerk sign-in page.
 */
export async function GET(request) {
  const url = new URL(request.url);
  const redirect = url.searchParams.get("redirect") || "/";

  const signInUrl = new URL("/sign-in", url.origin);
  signInUrl.searchParams.set("redirect", redirect);
  signInUrl.searchParams.set("error", "use_clerk_auth");

  return NextResponse.redirect(signInUrl);
}
