import { createClient } from '@supabase/supabase-js';
import { verifyAdminAuth } from '@/middleware/adminAuth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET - Fetch single article by ID or slug
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    // Check if id is numeric (actual ID) or string (slug)
    const isNumeric = /^\d+$/.test(id);
    
    let { data, error } = await supabase
      .from('published_articles')
      .select('*')
      .eq(isNumeric ? 'id' : 'slug', isNumeric ? parseInt(id) : id)
      .single();

    if (error) throw error;

    // Increment view count
    await supabase
      .from('articles')
      .update({ view_count: data.view_count + 1 })
      .eq('id', data.id);

    return Response.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return Response.json(
      { success: false, error: 'Article not found' },
      { status: 404 }
    );
  }
}

// PUT - Update article (admin only)
export async function PUT(request, { params }) {
  try {
    const { isAdmin, error: authError } = await verifyAdminAuth(request);
    
    if (!isAdmin) {
      return Response.json(
        { success: false, error: authError || 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, excerpt, category, tags, featured_image_url, is_featured, status, social_media_embeds } = body;

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (excerpt) updateData.excerpt = excerpt;
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags;
    if (featured_image_url) updateData.featured_image_url = featured_image_url;
    if (typeof is_featured === 'boolean') updateData.is_featured = is_featured;
    if (status) updateData.status = status;
    if (social_media_embeds !== undefined) updateData.social_media_embeds = social_media_embeds;

    const { data, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      data,
      message: 'Article updated successfully'
    });
  } catch (error) {
    console.error('Error updating article:', error);
    return Response.json(
      { success: false, error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

// DELETE - Delete article (admin only)
export async function DELETE(request, { params }) {
  try {
    const { isAdmin, error: authError } = await verifyAdminAuth(request);
    
    if (!isAdmin) {
      return Response.json(
        { success: false, error: authError || 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return Response.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    return Response.json(
      { success: false, error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
