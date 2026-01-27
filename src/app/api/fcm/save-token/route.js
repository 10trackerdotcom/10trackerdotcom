// api/fcm/save-token/route.js
// API route to save FCM token to database with enrollment tracking

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper function to categorize enrollment source
function categorizeEnrollmentSource(source) {
  if (!source) return 'unknown';
  
  const sourceLower = source.toLowerCase();
  
  // Articles category
  if (sourceLower.includes('/articles') || sourceLower.includes('article')) {
    return 'articles';
  }
  
  // Homepage
  if (sourceLower === '/' || sourceLower.includes('/home')) {
    return 'home';
  }
  
  // Exams/Practice
  if (sourceLower.includes('/exams') || sourceLower.includes('/practice')) {
    return 'exams';
  }
  
  // Specific exam categories
  if (sourceLower.includes('/gate')) {
    return 'gate';
  }
  if (sourceLower.includes('/cat')) {
    return 'cat';
  }
  if (sourceLower.includes('/upsc')) {
    return 'upsc';
  }
  if (sourceLower.includes('/jee')) {
    return 'jee';
  }
  
  // Jobs
  if (sourceLower.includes('/jobs') || sourceLower.includes('job')) {
    return 'jobs';
  }
  
  // Results
  if (sourceLower.includes('/results') || sourceLower.includes('result')) {
    return 'results';
  }
  
  return 'other';
}

export async function POST(request) {
  try {
    const { token, userId, enrollmentSource, deviceInfo } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'FCM token is required' },
        { status: 400 }
      );
    }

    // Get current URL if enrollment source not provided
    const source = enrollmentSource || '/';
    const category = categorizeEnrollmentSource(source);

    // Get device info if available
    const deviceData = deviceInfo || {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      platform: typeof navigator !== 'undefined' ? navigator.platform : null,
    };

    // Upsert token to database
    const { data, error } = await supabase
      .from('fcm_tokens')
      .upsert({
        token,
        user_id: userId || null,
        enrollment_source: source,
        enrollment_category: category,
        device_info: deviceData,
        is_active: true,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'token',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('Supabase error saving FCM token:', error);
      throw error;
    }

    console.log('✅ FCM Token saved to database:', {
      token: token.substring(0, 50) + '...',
      category,
      source,
      userId
    });

    return NextResponse.json({
      success: true,
      message: 'FCM token saved successfully',
      data: {
        category,
        source,
        tokenId: data?.[0]?.id
      }
    });
  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save FCM token',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

