// api/fcm/save-token/route.js
// API route to save FCM token to database

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { token, userId } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'FCM token is required' },
        { status: 400 }
      );
    }

    // TODO: Save token to your database
    // Example with Supabase or MongoDB:
    /*
    // For Supabase:
    const { data, error } = await supabase
      .from('fcm_tokens')
      .upsert({
        token,
        user_id: userId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'token'
      });

    if (error) {
      throw error;
    }
    */

    // For now, just return success
    // You should implement database storage based on your setup
    console.log('FCM Token received:', { token, userId });

    return NextResponse.json({
      success: true,
      message: 'FCM token saved successfully',
    });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return NextResponse.json(
      { error: 'Failed to save FCM token' },
      { status: 500 }
    );
  }
}

