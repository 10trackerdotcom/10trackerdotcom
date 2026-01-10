// api/fcm/delete-token/route.js
// API route to delete FCM token from database

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'FCM token is required' },
        { status: 400 }
      );
    }

    // TODO: Delete token from your database
    // Example with Supabase or MongoDB:
    /*
    // For Supabase:
    const { error } = await supabase
      .from('fcm_tokens')
      .delete()
      .eq('token', token);

    if (error) {
      throw error;
    }
    */

    // For now, just return success
    // You should implement database deletion based on your setup
    console.log('FCM Token deleted:', token);

    return NextResponse.json({
      success: true,
      message: 'FCM token deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting FCM token:', error);
    return NextResponse.json(
      { error: 'Failed to delete FCM token' },
      { status: 500 }
    );
  }
}

