import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

const sitemapUrl = "https://www.moneycontrol.com/news/news-sitemap.xml";

function getHeaders({ type = "xml" } = {}) {
  if (type === "html") {
    return {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Referer: "https://www.moneycontrol.com/",
      Origin: "https://www.moneycontrol.com",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-User": "?1",
      "Cache-Control": "max-age=0",
    };
  }

  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/xml, text/xml, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Referer: "https://www.moneycontrol.com/",
    Origin: "https://www.moneycontrol.com",
    Connection: "keep-alive",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
  };
}

function mapMoneycontrolCategory(articleUrl) {
  // User mapping rules:
  // - world-news => world
  // - news/world => world
  // - news/india => india
  // - news/business/economy => economy
  // - news/technology => technology

  if (/\/news\/world-news\//i.test(articleUrl) || /\/news\/world\//i.test(articleUrl)) {
    return "world-news";
  }
  if (/\/news\/india\//i.test(articleUrl)) {
    return "news";
  }
  if (/\/news\/business\/economy\//i.test(articleUrl)) {
    return "news";
  }
  if (/\/news\/technology\//i.test(articleUrl)) {
    return "technology";
  }
  return null;
}

function isAllowedUrl(articleUrl) {
  return Boolean(mapMoneycontrolCategory(articleUrl));
}

// Fetch and parse the Moneycontrol sitemap
async function fetchSitemap() {
  try {
    const { data } = await axios.get(sitemapUrl, {
      headers: getHeaders({ type: "xml" }),
    });

    // Parse XML using cheerio
    const $ = cheerio.load(data, { xmlMode: true });
    const urls = [];

    $('url').each((i, elem) => {
      const loc = $(elem).find('loc').text();
      if (loc) {
        urls.push(loc);
      }
    });

    return urls;
  } catch (error) {
    console.error("Error fetching sitemap or parsing XML:", error);
    throw error;
  }
}

function isDisallowedTitle(title) {
  if (!title) return false;
  const t = title.toLowerCase();
  return t.includes("moneycontrol pro") || t.includes("moneycontrol");
}

async function fetchArticleContent(articleUrl) {
  try {
    const { data } = await axios.get(articleUrl, {
      headers: getHeaders({ type: "html" }),
    });
    const $ = cheerio.load(data);

    // Extract title
    const title = $(".article_title, .artTitle").text().trim();

    // Get image URL if available
    const imageUrl = $(".article_image_wrapper .article_image img").attr("data-src") || 
                     $(".article_image_wrapper .article_image img").attr("src") || 
                     null;

    const category = mapMoneycontrolCategory(articleUrl);

    return {
      title,
      link: articleUrl,
      imageUrl,
      category: category || null,
    };
  } catch (error) {
    console.error("Error fetching or parsing the article:", error);
    throw error;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const categoryParam = searchParams.get('category'); // optional: world|india|economy|technology

    // If a specific URL is provided, fetch that article
    if (url) {
      const articleData = await fetchArticleContent(url);
      return NextResponse.json({
        success: true,
        data: articleData,
      });
    }

    // By default, fetch ONLY the latest matching item from sitemap (only allowed categories)
    const urls = await fetchSitemap();
    const cat = categoryParam ? String(categoryParam).toLowerCase() : null;

    if (urls && urls.length > 0) {
      for (const u of urls) {
        if (!isAllowedUrl(u)) continue;
        if (cat && mapMoneycontrolCategory(u) !== cat) continue;

        const articleData = await fetchArticleContent(u);
        if (isDisallowedTitle(articleData.title)) {
          // Skip titles containing Moneycontrol / Moneycontrol Pro
          continue;
        }

        return NextResponse.json({
          success: true,
          data: {
            ...articleData,
            category: mapMoneycontrolCategory(u) || articleData.category || null,
          },
        });
      }
    }
    
    return NextResponse.json(
      { success: false, error: "No latest data found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch data",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    const articleData = await fetchArticleContent(url);
    return NextResponse.json({
      success: true,
      data: articleData,
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch article",
      },
      { status: 500 }
    );
  }
}
