import { createClient } from '@supabase/supabase-js';
import { verifyAdminAuth } from '@/middleware/adminAuth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET - Fetch all published articles (public)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = parseInt(searchParams.get('offset')) || 0;

    let query = supabase
      .from('published_articles')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return Response.json({
      success: true,
      data: data || [],
      pagination: {
        limit,
        offset,
        hasMore: data?.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

// POST - Create new article (admin only)
export async function POST(request) {
  try {
    const { isAdmin, error: authError } = await verifyAdminAuth(request);
    
    if (!isAdmin) {
      return Response.json(
        { success: false, error: authError || 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, excerpt, category, tags, featured_image_url, is_featured } = body;

    if (!title || !content || !category) {
      return Response.json(
        { success: false, error: 'Title, content, and category are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('articles')
      .insert({
        title,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        category,
        tags: tags || [],
        featured_image_url,
        is_featured: is_featured || false,
        author_email: 'jain10gunjan@gmail.com',
        status: 'published'
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      data,
      message: 'Article created successfully'
    });
  } catch (error) {
    console.error('Error creating article:', error);
    return Response.json(
      { success: false, error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
