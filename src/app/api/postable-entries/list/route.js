import { createClient } from '@supabase/supabase-js';
import { verifyAdminAuth } from '@/middleware/adminAuth';

// Helper function to get Supabase client (prefers service role for admin operations)
function getSupabaseClient(useServiceRole = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = useServiceRole && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return createClient(url, key);
}

// GET - List all entries (admin only, for admin UI)
export async function GET(request) {
  try {
    const { isAdmin, error: authError } = await verifyAdminAuth(request);
    
    if (!isAdmin) {
      return Response.json(
        { success: false, error: authError || 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isPosted = searchParams.get('is_posted');
    const limit = parseInt(searchParams.get('limit')) || 100;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Use service role key for admin operations if available
    const adminSupabase = getSupabaseClient(true);

    let query = adminSupabase
      .from('postable_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by is_posted status if provided
    if (isPosted !== null && isPosted !== undefined) {
      query = query.eq('is_posted', isPosted === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get total count
    let countQuery = adminSupabase
      .from('postable_entries')
      .select('*', { count: 'exact', head: true });

    if (isPosted !== null && isPosted !== undefined) {
      countQuery = countQuery.eq('is_posted', isPosted === 'true');
    }

    const { count, error: countError } = await countQuery;

    return Response.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      }
    });
  } catch (error) {
    console.error('Error listing postable entries:', error);
    return Response.json(
      { success: false, error: 'Failed to list entries', message: error.message },
      { status: 500 }
    );
  }
}
