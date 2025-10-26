// app/api/auth/google/callback/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=missing_code`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: '344372948744-ivgk5uvb6jogsciuqh7polhucr2u5gk6.apps.googleusercontent.com',
        client_secret: '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',
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      console.error('Token Error:', tokens.error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=token_error`);
    }

    // Get user info with the access token
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();
    
    // Create a URL to redirect with user info
    // Note: In production, you'd typically set server-side sessions or httpOnly cookies
    const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/auth-handler`);
    redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify(userInfo)));
    redirectUrl.searchParams.set('token', tokens.access_token);
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth Error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=auth_error`);
  }
}
