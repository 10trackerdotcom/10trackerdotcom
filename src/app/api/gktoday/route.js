import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Default category for gktoday links (using 'latest_jobs' as it's one of the allowed categories)
const GKTODAY_CATEGORY = 'news';

export async function GET(request) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase configuration is missing',
        },
        { status: 500 }
      );
    }

    const gktodayUrl = 'https://www.gktoday.in/';
    
    // Fetch the HTML content
    let html;
    try {
      const response = await axios.get(gktodayUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://www.gktoday.in/",
        },
        timeout: 15000, // 15 second timeout
      });
      html = response.data;
    } catch (fetchError) {
      console.error('Error fetching gktoday page:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch gktoday page',
          details: fetchError.message,
        },
        { status: 500 }
      );
    }

    const $ = cheerio.load(html);

    // Get only the first (latest) post item
    const $firstPost = $('.home-post-item').first();
    
    if ($firstPost.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No posts found on the page',
          message: 'No new links found'
        },
        { status: 404 }
      );
    }
    
    // Extract image URL
    const imageUrl = $firstPost.find('.featured-image img').attr('src') || 
                    $firstPost.find('.featured-image img').attr('data-src') || 
                    null;
    
    // Extract title from the anchor tag
    const title = $firstPost.find('.post-data h3 a').text().trim() || null;
    
    // Extract link from the anchor tag
    let link = $firstPost.find('.post-data h3 a').attr('href') || null;
    
    // Validate that we have essential data
    if (!title || !link) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required data (title or link)',
          message: 'No new links found'
        },
        { status: 404 }
      );
    }

    // Normalize link - ensure it's a full URL
    if (link && !link.startsWith('http')) {
      link = link.startsWith('/') 
        ? `https://www.gktoday.in${link}` 
        : `https://www.gktoday.in/${link}`;
    }
    
    // Extract description - text after the title link and before the meta paragraph
    const $postData = $firstPost.find('.post-data');
    
    // Clone post-data to work with it
    const $clone = $postData.clone();
    
    // Remove the h3 title and meta paragraph
    $clone.find('h3').remove();
    $clone.find('.home-post-data-meta').remove();
    
    // Get the remaining text as description
    let description = $clone.text().trim();
    
    // Clean up description - remove extra whitespace and newlines
    description = description.replace(/\s+/g, ' ').trim();

    // Check if link already exists in database
    try {
      const { data: existingLink, error: checkError } = await supabase
        .from('sarkari_result_links')
        .select('id, url, title, created_at')
        .eq('url', link)
        .maybeSingle(); // Use maybeSingle() to return null if not found instead of error

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is fine
        console.error('Error checking existing link:', checkError);
        // Continue to try saving even if check fails
      }

      // If link already exists, return "no new links found"
      if (existingLink) {
        return NextResponse.json({
          success: true,
          message: 'No new links found',
          data: {
            title: existingLink.title,
            link: existingLink.url,
            description: description || null,
            imageUrl: imageUrl || null,
            exists: true,
            createdAt: existingLink.created_at,
          },
        });
      }
    } catch (dbCheckError) {
      console.error('Error during database check:', dbCheckError);
      // Continue to try saving even if check fails
    }

    // Link doesn't exist, save it to database
    try {
      const { data: savedLink, error: saveError } = await supabase
        .from('sarkari_result_links')
        .insert({
          category: GKTODAY_CATEGORY,
          title: title,
          url: link,
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving link to database:', saveError);
        
        // Check if it's a unique constraint violation (link was added between check and insert)
        if (saveError.code === '23505' || saveError.message?.includes('unique')) {
          return NextResponse.json({
            success: true,
            message: 'No new links found',
            data: {
              title,
              link,
              description: description || null,
              imageUrl: imageUrl || null,
              exists: true,
            },
          });
        }

        // For other errors, return error but still return the scraped data
        return NextResponse.json({
          success: false,
          error: 'Failed to save link to database',
          details: saveError.message,
          data: {
            title,
            link,
            description: description || null,
            imageUrl: imageUrl || null,
          },
        }, { status: 500 });
      }

      // Successfully saved - now call twitterpost API
      let twitterPostResult = null;
      let twitterPostError = null;
      let twitterPostCalled = false;

      // Only call Twitter API if we have a title (required parameter)
      if (title) {
        twitterPostCalled = true;
        try {
          const twitterPostResponse = await axios.post('https://www.10tracker.com/api/twitterpost', {
            title: title,
            imageUrl: imageUrl || '', // Send empty string if imageUrl is null
          }, {
            timeout: 30000, // 30 second timeout for Twitter API
            headers: {
              'Content-Type': 'application/json',
            },
          });

          twitterPostResult = {
            success: twitterPostResponse.data?.success || false,
            message: twitterPostResponse.data?.message || 'Tweet posted',
            tweetId: twitterPostResponse.data?.data?.tweetId || null,
          };
        } catch (twitterError) {
          console.error('Error posting to Twitter:', twitterError.response?.data || twitterError.message);
          twitterPostError = {
            message: twitterError.response?.data?.error || twitterError.message || 'Failed to post to Twitter',
            status: twitterError.response?.status || null,
          };
          // Don't fail the whole request if Twitter posting fails
        }
      }

      // Build response object
      const response = {
        success: true,
        message: 'New link found and saved',
        data: {
          title: savedLink.title,
          link: savedLink.url,
          description: description || null,
          imageUrl: imageUrl || null,
          id: savedLink.id,
          createdAt: savedLink.created_at,
        },
        twitterPostCalled: twitterPostCalled,
      };

      // Only include Twitter post fields if API was called
      if (twitterPostCalled) {
        if (twitterPostResult) {
          response.twitterPost = twitterPostResult;
        }
        if (twitterPostError) {
          response.twitterPostError = twitterPostError;
        }
      }

      return NextResponse.json(response);

    } catch (dbSaveError) {
      console.error('Unexpected error saving to database:', dbSaveError);
      // Return scraped data even if save fails
      return NextResponse.json({
        success: false,
        error: 'Failed to save link to database',
        details: dbSaveError.message,
        data: {
          title,
          link,
          description: description || null,
          imageUrl: imageUrl || null,
        },
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error fetching gktoday data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch gktoday data',
        message: 'No new links found',
      },
      { status: 500 }
    );
  }
}
