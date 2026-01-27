// api/fcm/enrollment-stats/route.js
// API route to get FCM enrollment statistics

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    // Get enrollment statistics grouped by category
    const { data, error } = await supabase
      .from('fcm_tokens')
      .select('enrollment_category, is_active, user_id')
      .order('enrollment_category');

    if (error) {
      console.error('Error fetching enrollment stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch enrollment statistics', details: error.message },
        { status: 500 }
      );
    }

    // Group and calculate statistics
    const statsMap = {};
    
    data.forEach(token => {
      const category = token.enrollment_category || 'unknown';
      
      if (!statsMap[category]) {
        statsMap[category] = {
          enrollment_category: category,
          total_enrolled: 0,
          active_tokens: 0,
          inactive_tokens: 0,
          unique_users: new Set(),
        };
      }
      
      statsMap[category].total_enrolled++;
      
      if (token.is_active) {
        statsMap[category].active_tokens++;
      } else {
        statsMap[category].inactive_tokens++;
      }
      
      if (token.user_id) {
        statsMap[category].unique_users.add(token.user_id);
      }
    });

    // Convert to array and format
    const stats = Object.values(statsMap).map(stat => ({
      enrollment_category: stat.enrollment_category,
      total_enrolled: stat.total_enrolled,
      active_tokens: stat.active_tokens,
      inactive_tokens: stat.inactive_tokens,
      unique_users: stat.unique_users.size,
    }));

    // Sort by active tokens (descending)
    stats.sort((a, b) => b.active_tokens - a.active_tokens);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in enrollment stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
