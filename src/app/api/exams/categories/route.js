import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Cache exam categories for 5 minutes
const getCachedExamCategories = unstable_cache(
  async () => {
    try {
      // Get unique categories from examtracker table
      const { data, error } = await supabase
        .from('examtracker')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;

      // Get unique categories and count questions per category
      const categoryMap = new Map();
      data?.forEach(item => {
        const cat = item.category?.toLowerCase();
        if (cat) {
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
        }
      });

      // Convert to array with metadata
      const categories = Array.from(categoryMap.entries()).map(([slug, count]) => {
        // Format category name (e.g., "gate-cse" -> "GATE CSE")
        const name = slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toUpperCase())
          .join(' ');

        // Assign icons and colors based on category
        const categoryConfig = {
          'gate-cse': { icon: '💻', color: 'from-blue-500 to-cyan-500' },
          'cat': { icon: '📊', color: 'from-purple-500 to-pink-500' },
          'upsc': { icon: '📚', color: 'from-orange-500 to-red-500' },
          'jee': { icon: '⚛️', color: 'from-green-500 to-emerald-500' },
          'neet': { icon: '🧬', color: 'from-indigo-500 to-blue-500' },
          'ssc': { icon: '📋', color: 'from-yellow-500 to-orange-500' },
        };

        const config =  { 
          icon: '📖', 
          color: 'from-neutral-500 to-neutral-600' 
        };

        return {
          slug,
          name,
          count,
          icon: config.icon,
          color: config.color,
        };
      });

      // Sort by count (most questions first)
      return categories.sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error fetching exam categories:', error);
      return [];
    }
  },
  ['exam-categories'],
  {
    revalidate: 300, // 5 minutes
    tags: ['exam-categories'],
  }
);

export async function GET() {
  try {
    const categories = await getCachedExamCategories();
    
    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error in exam categories API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch exam categories' 
      },
      { status: 500 }
    );
  }
}

