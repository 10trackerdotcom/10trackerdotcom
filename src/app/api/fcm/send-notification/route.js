// api/fcm/send-notification/route.js
// API route to send push notifications via FCM using Firebase Admin SDK
// Uses service account for authentication (recommended for production)

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Initialize Firebase Admin SDK
let admin = null;
let messaging = null;

try {
  // Dynamic import to avoid issues if firebase-admin is not installed
  const firebaseAdmin = require('firebase-admin');
  
  // Initialize only if not already initialized
  if (!firebaseAdmin.apps.length) {
    // Get service account from environment variable or file
    const serviceAccount = process.env.FCM_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FCM_SERVICE_ACCOUNT)
      : require('../../../../service_account.json');
    
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount),
    });
  }
  
  admin = firebaseAdmin;
  messaging = admin.messaging();
} catch (error) {
  console.error('Firebase Admin SDK initialization error:', error);
  console.error('Make sure firebase-admin is installed: npm install firebase-admin');
}

export async function POST(request) {
  try {
    // Check if Firebase Admin is initialized
    if (!admin || !messaging) {
      return NextResponse.json(
        { 
          error: 'Firebase Admin SDK is not initialized. Please install firebase-admin and configure service account.',
          hint: 'Run: npm install firebase-admin'
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
      category, // Optional: send to all users in a category (e.g., 'articles', 'exams')
      sendToAll, // Optional: send to all active users
      batchSize = 100, // Batch size for sending (default 100)
    } = await request.json();

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
    let tokensToSend = [];

    // If category or sendToAll is specified, fetch tokens from database
    if (category || sendToAll) {
      console.log(`📊 Fetching tokens from database: ${sendToAll ? 'all users' : `category: ${category}`}`);
      
      let query = supabase
        .from('fcm_tokens')
        .select('token, user_id, enrollment_category, enrollment_source')
        .eq('is_active', true);
      
      if (category && !sendToAll) {
        query = query.eq('enrollment_category', category);
      }
      
      const { data: tokensData, error: tokensError } = await query;
      
      if (tokensError) {
        console.error('❌ Error fetching tokens from database:', tokensError);
        return NextResponse.json(
          { error: 'Failed to fetch tokens from database', details: tokensError.message },
          { status: 500 }
        );
      }
      
      if (!tokensData || tokensData.length === 0) {
        return NextResponse.json(
          { error: `No active tokens found${category ? ` for category: ${category}` : ''}` },
          { status: 404 }
        );
      }
      
      tokensToSend = tokensData.map(t => t.token);
      console.log(`✅ Found ${tokensToSend.length} active tokens`);
    } else if (token) {
      // Use provided token(s)
      tokensToSend = Array.isArray(token) ? token : [token];
    }

    // Send notifications
    if (topic) {
      // Send to topic
      const message = {
        notification: notificationPayload,
        data: data || {},
        topic: topic,
      };
      
      result = await messaging.send(message);
      console.log('✅ Topic message sent, message ID:', result);
    } else if (tokensToSend.length > 0) {
      // Send to tokens (from DB or provided)
      const totalTokens = tokensToSend.length;
      const batches = [];
      
      // Split into batches of batchSize
      for (let i = 0; i < totalTokens; i += batchSize) {
        batches.push(tokensToSend.slice(i, i + batchSize));
      }
      
      console.log(`📦 Sending to ${totalTokens} tokens in ${batches.length} batch(es) of ${batchSize}`);
      
      const message = {
        notification: notificationPayload,
        data: data || {},
      };
      
      let totalSuccess = 0;
      let totalFailure = 0;
      const batchResults = [];
      
      // Send each batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`📤 Sending batch ${i + 1}/${batches.length} (${batch.length} tokens)...`);
        
        try {
          if (batch.length === 1) {
            // Single token in batch
            const singleResult = await messaging.send({
              ...message,
              token: batch[0],
            });
            totalSuccess++;
            batchResults.push({
              batch: i + 1,
              success: true,
              tokensInBatch: 1,
              messageId: singleResult
            });
          } else {
            // Multiple tokens - use sendMulticast
            const multicastResult = await messaging.sendMulticast({
              tokens: batch,
              ...message,
            });
            
            totalSuccess += multicastResult.successCount;
            totalFailure += multicastResult.failureCount;
            
            // Mark invalid tokens as inactive in database
            if (multicastResult.failureCount > 0) {
              multicastResult.responses.forEach((response, index) => {
                if (!response.success) {
                  const token = batch[index];
                  
                  // Check if token is invalid/unregistered
                  if (response.error?.code === 'messaging/invalid-registration-token' ||
                      response.error?.code === 'messaging/registration-token-not-registered') {
                    // Mark token as inactive in database
                    supabase
                      .from('fcm_tokens')
                      .update({ is_active: false, updated_at: new Date().toISOString() })
                      .eq('token', token)
                      .then(({ error }) => {
                        if (error) {
                          console.error(`Failed to mark token as inactive:`, error);
                        } else {
                          console.log(`✅ Marked invalid token as inactive`);
                        }
                      });
                  }
                }
              });
            }
            
            batchResults.push({
              batch: i + 1,
              successCount: multicastResult.successCount,
              failureCount: multicastResult.failureCount,
              tokensInBatch: batch.length
            });
          }
        } catch (batchError) {
          console.error(`❌ Error sending batch ${i + 1}:`, batchError);
          totalFailure += batch.length;
          batchResults.push({
            batch: i + 1,
            success: false,
            error: batchError.message,
            tokensInBatch: batch.length
          });
        }
        
        // Small delay between batches to avoid rate limiting
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      result = {
        totalTokens,
        totalBatches: batches.length,
        successCount: totalSuccess,
        failureCount: totalFailure,
        batchResults,
      };
      
      console.log('✅ Batch sending completed:', result);
    } else {
      return NextResponse.json(
        { error: 'Either token, topic, category, or sendToAll is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      result,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    
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

