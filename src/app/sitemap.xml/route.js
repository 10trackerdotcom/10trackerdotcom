import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase credentials are available
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. Sitemap will only include static pages.');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET() {
  const baseUrl = 'https://10tracker.com';
  
  console.log('Generating sitemap for:', baseUrl);
  
  // Static pages
  const staticPages = [
     
    {
      url: '/articles',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
     
     
  ];

  // Fetch all articles from database
  let articles = [];
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('slug, updated_at, created_at')
        .order('created_at', { ascending: false });

      if (!error && data) {
        console.log(`Found ${data.length} articles in database`);
        articles = data.map(article => ({
          url: `/articles/${article.slug}`,
          lastModified: new Date(article.updated_at || article.created_at),
          changeFrequency: 'weekly',
          priority: 0.6, // All articles get same priority
        }));
        console.log(`Added ${articles.length} articles to sitemap`);
      } else {
        console.error('Error fetching articles:', error);
      }
    } catch (error) {
      console.error('Error fetching articles for sitemap:', error);
      // Continue with empty articles array if database fails
      articles = [];
    }
  } else {
    console.warn('Supabase not available, skipping articles from sitemap');
  }

  const allPages = [...staticPages, ...articles];
  
  console.log(`Total pages in sitemap: ${allPages.length} (${staticPages.length} static + ${articles.length} articles)`);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(page => {
    return `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastModified.toISOString()}</lastmod>
    <changefreq>${page.changeFrequency}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  })
  .join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
