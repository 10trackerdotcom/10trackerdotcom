// src/app/api/twitterpost/route.js
import axios from "axios";

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

    return new Response(JSON.stringify({
      status: res.status,
      htmlLength: res.data?.length || 0,
      html: res.data, // zarurat ho to
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Twitterpost API error:", error.message);

    return new Response(JSON.stringify({
      error: "Failed to fetch Nitter page",
      message: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}