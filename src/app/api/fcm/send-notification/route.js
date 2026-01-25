// api/fcm/send-notification/route.js
// API route to send push notifications via FCM using Firebase Admin SDK
// Uses service account for authentication (recommended for production)

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin SDK
let admin = null;
let messaging = null;
let initError = null;

try {
  // Dynamic import to avoid issues if firebase-admin is not installed
  const firebaseAdmin = require('firebase-admin');
  
  // Initialize only if not already initialized
  if (!firebaseAdmin.apps.length) {
    let serviceAccount;
    
    // Try to get service account from environment variable first
    if (process.env.FCM_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT);
        console.log('✅ Using FCM service account from environment variable');
      } catch (parseError) {
        console.error('❌ Failed to parse FCM_SERVICE_ACCOUNT:', parseError);
        throw new Error('Invalid FCM_SERVICE_ACCOUNT JSON in environment variable');
      }
    } else {
      // Try to load from file
      const serviceAccountPath = path.join(process.cwd(), 'service_account.json');
      
      if (fs.existsSync(serviceAccountPath)) {
        try {
          const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
          serviceAccount = JSON.parse(serviceAccountContent);
          console.log('✅ Loaded FCM service account from file:', serviceAccountPath);
        } catch (fileError) {
          console.error('❌ Failed to read service_account.json:', fileError);
          throw new Error('Failed to read service_account.json file');
        }
      } else {
        console.error('❌ service_account.json not found at:', serviceAccountPath);
        throw new Error('Service account file not found. Please set FCM_SERVICE_ACCOUNT env var or add service_account.json to project root');
      }
    }
    
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount),
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully');
  }
  
  admin = firebaseAdmin;
  messaging = admin.messaging();
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization error:', error);
  initError = error;
  if (error.message?.includes('Cannot find module')) {
    console.error('💡 Make sure firebase-admin is installed: npm install firebase-admin');
  }
}

export async function POST(request) {
  try {
    // Check if Firebase Admin is initialized
    if (!admin || !messaging) {
      const errorMessage = initError 
        ? `Firebase Admin SDK initialization failed: ${initError.message}`
        : 'Firebase Admin SDK is not initialized. Please install firebase-admin and configure service account.';
      
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: initError?.message?.includes('Cannot find module') 
            ? 'Run: npm install firebase-admin'
            : 'Check service_account.json or set FCM_SERVICE_ACCOUNT environment variable',
          details: initError?.message
        },
        { status: 500 }
      );
    }

    const { 
      token, // Single token or array of tokens
      title,
      body,
      image,
      data,
      topic, // Optional: send to topic instead of token
    } = await request.json();

    console.log('📤 Received notification request:', {
      hasToken: !!token,
      hasTopic: !!topic,
      title,
      bodyLength: body?.length,
      hasImage: !!image,
      hasData: !!data
    });

    // Validate required fields
    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Build notification payload
    const notificationPayload = {
      title,
      body,
      ...(image && { image }),
    };

    let result;

    if (topic) {
      // Send to topic
      const message = {
        notification: notificationPayload,
        data: data || {},
        topic: topic,
      };
      
      console.log('📨 Sending to topic:', topic);
      console.log('📦 Message payload:', JSON.stringify(message, null, 2));
      
      result = await messaging.send(message);
      console.log('✅ Topic message sent, message ID:', result);
    } else if (token) {
      // Send to specific token(s)
      const tokens = Array.isArray(token) ? token : [token];
      
      console.log(`📨 Sending to ${tokens.length} token(s)`);
      
      if (tokens.length === 1) {
        // Single token
        const message = {
          notification: notificationPayload,
          data: data || {},
          token: tokens[0],
        };
        
        console.log('📦 Single token message:', {
          token: tokens[0].substring(0, 50) + '...',
          notification: notificationPayload,
          dataKeys: Object.keys(data || {})
        });
        
        result = await messaging.send(message);
        console.log('✅ Single token message sent, message ID:', result);
      } else {
        // Multiple tokens - use sendMulticast
        const message = {
          notification: notificationPayload,
          data: data || {},
        };
        
        console.log('📦 Multicast message:', {
          tokenCount: tokens.length,
          notification: notificationPayload,
          dataKeys: Object.keys(data || {})
        });
        
        const multicastResult = await messaging.sendMulticast({
          tokens: tokens,
          ...message,
        });
        
        console.log('✅ Multicast result:', {
          successCount: multicastResult.successCount,
          failureCount: multicastResult.failureCount,
          responses: multicastResult.responses.map((r, i) => ({
            index: i,
            success: r.success,
            error: r.error?.code || r.error?.message
          }))
        });
        
        result = {
          successCount: multicastResult.successCount,
          failureCount: multicastResult.failureCount,
          responses: multicastResult.responses,
        };
      }
    } else {
      return NextResponse.json(
        { error: 'Either token or topic is required' },
        { status: 400 }
      );
    }

    console.log('✅ Notification sent successfully:', {
      mode: topic ? 'topic' : (Array.isArray(token) ? 'multicast' : 'single'),
      target: topic || (Array.isArray(token) ? `${token.length} tokens` : 'single token'),
      result: result
    });

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      result,
    });
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    // Handle specific FCM errors
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      return NextResponse.json(
        { 
          error: 'Invalid or unregistered token',
          code: error.code,
          message: 'The FCM token is invalid or the device is no longer registered'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to send notification',
        code: error.code || 'unknown'
      },
      { status: 500 }
    );
  }
}

