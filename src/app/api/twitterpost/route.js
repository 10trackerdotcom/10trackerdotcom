// src/app/api/twitterpost/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import axios from "axios";

/**
 * OAuth 1.0a signature generation for Twitter API
 */
function generateOAuthSignature(
  method,
  url,
  params,
  consumerSecret,
  tokenSecret = ""
) {
  // Create parameter string
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&");

  // Create signature base string
  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join("&");

  // Create signing key
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

  // Generate signature
  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(signatureBaseString)
    .digest("base64");

  return signature;
}

/**
 * Generate OAuth 1.0a authorization header
 */
function generateAuthHeader(
  method,
  url,
  consumerKey,
  consumerSecret,
  accessToken,
  accessTokenSecret,
  additionalParams = {}
) {
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_token: accessToken,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_version: "1.0",
    ...additionalParams,
  };

  // Generate signature
  const signature = generateOAuthSignature(
    method,
    url,
    { ...oauthParams, ...additionalParams },
    consumerSecret,
    accessTokenSecret
  );

  oauthParams.oauth_signature = signature;

  // Create authorization header
  const authHeader =
    "OAuth " +
    Object.keys(oauthParams)
      .sort()
      .map(
        (key) =>
          `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`
      )
      .join(", ");

  return authHeader;
}

/**
 * POST endpoint to post content on Twitter
 * 
 * Required parameters:
 * - title: The title/text content of the tweet (max 280 characters)
 * - link: Optional URL to include in the tweet
 * 
 * Note: You need to set up environment variables:
 * - TWITTER_CONSUMER_KEY
 * - TWITTER_CONSUMER_SECRET
 * - TWITTER_ACCESS_TOKEN
 * - TWITTER_ACCESS_TOKEN_SECRET
 */
export async function POST(request) {
  try {
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      // Check if it's a JSON parse error
      if (jsonError instanceof SyntaxError || jsonError.message?.includes('JSON')) {
        return NextResponse.json(
          {
            error: "Invalid JSON in request body",
            message: jsonError.message || "The request body must be valid JSON",
            details: "Expected JSON format: { \"title\": \"your tweet text\", \"link\": \"optional url\" }",
            example: { title: "Hello World", link: "https://example.com" },
          },
          { status: 400 }
        );
      }
      // For other errors (like empty body), provide a generic message
      return NextResponse.json(
        {
          error: "Failed to parse request body",
          message: jsonError.message || "Please ensure the request body is valid JSON",
          details: "Make sure to send a JSON object with Content-Type: application/json header",
          example: { title: "Hello World", link: "https://example.com" },
        },
        { status: 400 }
      );
    }

    // Check if body is null or undefined
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          error: "Invalid request body",
          message: "Request body must be a JSON object",
          example: { title: "Hello World", link: "https://example.com" },
        },
        { status: 400 }
      );
    }

    const { title, link } = body;

    // Validate input
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Get Twitter credentials from environment variables (with fallbacks for quick setup)
    // Note: We use OAuth 1.0a for posting tweets (simpler and more direct)
    const consumerKey = process.env.TWITTER_CONSUMER_KEY || "psY6JJqTCaFvfsQd1LijrYTm0";
    const consumerSecret = process.env.TWITTER_CONSUMER_SECRET || "C0tQXRJmuAbJRm17vjOMmXXJPaQrpOwM7ixAiWWQZeXa7or13j";
    const accessToken = process.env.TWITTER_ACCESS_TOKEN || "1985226959861989376-lH7NEpoSSsiBysutKtaJEO8UvthKCO";
    const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET || "3ROQmUi4BgshKGlM0sjlb0nifqKDIMH23gfBHUk3v5dnk";
    
    // OAuth 2.0 credentials (stored for potential future use, but not used for posting tweets)
    const clientId = process.env.TWITTER_CLIENT_ID || "QUhDXzlDNWJvV21fZzFrN09peFA6MTpjaQ";
    const clientSecret = process.env.TWITTER_CLIENT_SECRET || "jLkEKmJZwYVl0eDEZTmtk696NY3_4UtBDhOhst-6QeTfc6y153";

    // Validate that we have all required credentials
    if (!accessToken || !accessTokenSecret || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        {
          error: "Twitter credentials are incomplete",
          message: "Please ensure all Twitter API credentials are configured (consumer key, consumer secret, access token, and access token secret).",
        },
        { status: 400 }
      );
    }

    // Construct tweet text
    let tweetText = title.trim();
    
    // Add link if provided
    if (link) {
      // Validate URL format
      try {
        new URL(link);
        // Twitter automatically shortens URLs, so we can append it
        // Make sure total length doesn't exceed 280 characters
        const linkLength = link.length + 1; // +1 for space
        const maxTitleLength = 280 - linkLength;
        
        if (tweetText.length > maxTitleLength) {
          tweetText = tweetText.substring(0, maxTitleLength - 3) + "...";
        }
        
        tweetText = `${tweetText} ${link}`;
      } catch (urlError) {
        return NextResponse.json(
          { error: "Invalid URL format for link parameter" },
          { status: 400 }
        );
      }
    }

    // Check tweet length (Twitter limit is 280 characters)
    if (tweetText.length > 280) {
      return NextResponse.json(
        {
          error: "Tweet text exceeds 280 character limit",
          currentLength: tweetText.length,
          maxLength: 280,
        },
        { status: 400 }
      );
    }

    // Twitter API v2 endpoint for posting tweets
    const apiUrl = "https://api.twitter.com/2/tweets";

    // Generate OAuth 1.0a authorization header
    const authHeader = generateAuthHeader(
      "POST",
      apiUrl,
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret
    );

    // Prepare request body
    const requestBody = {
      text: tweetText,
    };

    // Make request to Twitter API
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Tweet posted successfully",
        data: {
          id: response.data.data?.id,
          text: response.data.data?.text,
          tweetUrl: `https://twitter.com/i/web/status/${response.data.data?.id}`,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Twitter API error:", error);

    // Handle specific Twitter API errors
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      const errorType = errorData?.type || "";

      // Special handling for permission errors (403)
      if (status === 403 && errorType.includes("oauth1-permissions")) {
        return NextResponse.json(
          {
            success: false,
            error: "Twitter API Permission Error",
            message: errorData?.detail || "Your Twitter app doesn't have the required permissions",
            statusCode: 403,
            fixInstructions: {
              step1: "Go to https://developer.twitter.com/en/portal/dashboard",
              step2: "Select your app",
              step3: "Click on 'Settings' tab",
              step4: "Under 'App permissions', change it to 'Read and Write'",
              step5: "Click 'Save' and wait a few minutes for changes to propagate",
              step6: "Regenerate your Access Token and Access Token Secret (they may need to be regenerated after permission change)",
              step7: "Update your environment variables with the new tokens",
              important: "After changing permissions, you MUST regenerate your Access Token and Access Token Secret for the changes to take effect!"
            },
            details: errorData,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Twitter API error",
          message: errorData?.detail || errorData?.title || error.message,
          statusCode: status,
          details: errorData,
        },
        { status: status >= 400 && status < 500 ? status : 500 }
      );
    }

    // Handle network or other errors
    return NextResponse.json(
      {
        success: false,
        error: "Failed to post tweet",
        message: error.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// Keep the GET endpoint for backward compatibility (if needed)
export async function GET(request) {
  try {
    const url = "http://nitter.net/search?f=tweets&q=IndianTechGuide";

    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    });

    return NextResponse.json({
      status: res.status,
      htmlLength: res.data?.length || 0,
      html: res.data,
    });
  } catch (error) {
    console.error("Twitterpost API error:", error.message);

    return NextResponse.json(
      {
        error: "Failed to fetch Nitter page",
        message: error.message,
      },
      { status: 500 }
    );
  }
}