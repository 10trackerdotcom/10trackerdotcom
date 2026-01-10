// api/fcm/send-notification/route.js
// API route to send push notifications via FCM
// 
// IMPORTANT: This uses the Legacy FCM API. For production, consider using:
// 1. Firebase Admin SDK with service account (recommended)
// 2. FCM v1 API with OAuth2 authentication

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { 
      token, // Single token or array of tokens
      title,
      body,
      image,
      data,
      topic, // Optional: send to topic instead of token
    } = await request.json();

    // Validate required fields
    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Get FCM server key from environment variables (Legacy API)
    const serverKey = process.env.FCM_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { error: 'FCM server key is not configured. Please set FCM_SERVER_KEY in your .env file' },
        { status: 500 }
      );
    }

    // Build notification payload for Legacy API
    const payload = {
      notification: {
        title,
        body,
        ...(image && { image }),
      },
      ...(data && { data }),
    };

    let fcmEndpoint;
    let finalPayload;

    if (topic) {
      // Send to topic
      fcmEndpoint = 'https://fcm.googleapis.com/fcm/send';
      finalPayload = {
        to: `/topics/${topic}`,
        ...payload,
      };
    } else if (token) {
      // Send to specific token(s)
      const tokens = Array.isArray(token) ? token : [token];
      
      if (tokens.length === 1) {
        // Single token
        fcmEndpoint = 'https://fcm.googleapis.com/fcm/send';
        finalPayload = {
          to: tokens[0],
          ...payload,
        };
      } else {
        // Multiple tokens - use multicast
        fcmEndpoint = 'https://fcm.googleapis.com/fcm/send';
        finalPayload = {
          registration_ids: tokens,
          ...payload,
        };
      }
    } else {
      return NextResponse.json(
        { error: 'Either token or topic is required' },
        { status: 400 }
      );
    }

    // Send notification using Legacy FCM API
    const response = await fetch(fcmEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `key=${serverKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('FCM API Error:', result);
      throw new Error(result.error || 'Failed to send notification');
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      result,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}

// NOTE: For production, consider using Firebase Admin SDK:
// 
// import admin from 'firebase-admin';
// 
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }
// 
// const message = {
//   notification: { title, body },
//   data: data || {},
//   token: token,
// };
// 
// await admin.messaging().send(message);

