# Firebase Cloud Messaging (FCM) Push Notifications Setup Guide

This guide will walk you through setting up Firebase Cloud Messaging (FCM) push notifications in your Next.js project.

## Prerequisites

1. Firebase project already set up (you have this)
2. Firebase SDK already installed (version 11.4.0 is installed)

## Step 1: Get Firebase Keys and Configuration

### 1.1 Get VAPID Key (Web Push Certificate)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `examtracker-6731e`
3. Go to **Project Settings** (gear icon) → **Cloud Messaging** tab
4. Scroll down to **Web configuration** section
5. Under **Web Push certificates**, you'll see:
   - If no certificate exists, click **Generate key pair**
   - Copy the **Key pair** value (this is your VAPID key)

### 1.2 Get Server Key (for sending notifications from backend)

1. In the same **Cloud Messaging** tab
2. Look for **Cloud Messaging API (Legacy)** section
3. Copy the **Server key** (this is your FCM server key)
   - **Note**: If you don't see this, you may need to enable the Legacy API or use the newer FCM v1 API with a service account

### 1.3 Alternative: Use Service Account (Recommended for Production)

For better security, use a service account instead of the server key:

1. Go to **Project Settings** → **Service Accounts** tab
2. Click **Generate new private key**
3. Download the JSON file (keep this secure!)
4. You'll need to use `firebase-admin` package to use this

## Step 2: Install Required Packages

**Note**: You mentioned you'll install packages manually. Here are the packages you need:

### Required (Already Installed):
- `firebase` (^11.4.0) ✅ Already in package.json

### Optional (for server-side sending):
- `firebase-admin` - For sending notifications from server using service account

Add to your `package.json` dependencies (if you want server-side sending):
```json
"firebase-admin": "^12.0.0"
```

## Step 3: Environment Variables

Create or update your `.env.local` file with the following:

```env
# Firebase FCM VAPID Key (from Step 1.1)
NEXT_PUBLIC_FCM_VAPID_KEY=your-vapid-key-here

# Firebase FCM Server Key (from Step 1.2) - for sending notifications
FCM_SERVER_KEY=your-server-key-here

# OR use Service Account (recommended for production)
# FCM_SERVICE_ACCOUNT_PATH=./path/to/service-account-key.json
```

**Important**: 
- `NEXT_PUBLIC_FCM_VAPID_KEY` must start with `NEXT_PUBLIC_` to be accessible in the browser
- `FCM_SERVER_KEY` should NOT be exposed to the client (don't use `NEXT_PUBLIC_` prefix)

## Step 4: Update Database Schema (Optional)

If you want to store FCM tokens in your database, create a table. Here are examples:

### For Supabase/PostgreSQL:
```sql
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  user_id TEXT, -- Optional: link to your users table
  device_info JSONB, -- Optional: store device information
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token ON fcm_tokens(token);
```

### For MongoDB:
```javascript
// Collection: fcm_tokens
{
  token: String (unique, required),
  userId: String (optional),
  deviceInfo: Object (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## Step 5: Update API Routes

The API routes are already created, but you need to implement database storage:

### 5.1 Update `src/app/api/fcm/save-token/route.js`

Uncomment and implement the database save logic based on your database (Supabase/MongoDB/etc.)

### 5.2 Update `src/app/api/fcm/send-notification/route.js`

The current implementation uses the server key. For production, consider:
- Using `firebase-admin` with service account
- Adding authentication/authorization
- Rate limiting
- Error handling

## Step 6: Test the Integration

### 6.1 Test Token Generation

1. Start your development server: `npm run dev`
2. Open your app in a browser
3. Open browser console (F12)
4. You should see:
   - Service Worker registration message
   - FCM token (if permission is granted)

### 6.2 Test Notification Permission

You can create a test button to request permission:

```jsx
// Example component
'use client';
import { useFCMToken } from '@/lib/fcm';

export default function NotificationButton() {
  const { token, permission, requestPermission } = useFCMToken();

  if (permission === 'granted') {
    return <div>Notifications enabled! Token: {token?.substring(0, 20)}...</div>;
  }

  return (
    <button onClick={requestPermission}>
      Enable Notifications
    </button>
  );
}
```

### 6.3 Test Sending a Notification

You can test sending a notification using the API:

```bash
curl -X POST http://localhost:3000/api/fcm/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_FCM_TOKEN_HERE",
    "title": "Test Notification",
    "body": "This is a test notification",
    "data": {
      "url": "/articles/test"
    }
  }'
```

## Step 7: Production Considerations

### 7.1 HTTPS Required
- FCM requires HTTPS in production
- Service workers only work on HTTPS (or localhost)

### 7.2 Update Service Worker
- The service worker file is at `public/firebase-messaging-sw.js`
- Make sure Firebase config matches your production environment

### 7.3 Security
- Never expose `FCM_SERVER_KEY` to the client
- Use authentication for the send-notification API route
- Implement rate limiting
- Validate and sanitize notification content

### 7.4 Error Handling
- Handle token refresh (tokens can expire)
- Handle permission denial gracefully
- Log errors for debugging

## Step 8: Usage Examples

### 8.1 Request Permission and Get Token

```jsx
'use client';
import { useFCMToken } from '@/lib/fcm';

function MyComponent() {
  const { token, permission, requestPermission } = useFCMToken();

  return (
    <div>
      {permission !== 'granted' && (
        <button onClick={requestPermission}>
          Enable Push Notifications
        </button>
      )}
      {token && <p>Token: {token}</p>}
    </div>
  );
}
```

### 8.2 Send Notification from Frontend

```javascript
// Send notification to a specific user
const response = await fetch('/api/fcm/send-notification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: 'user-fcm-token',
    title: 'New Article Published',
    body: 'Check out our latest article!',
    data: {
      url: '/articles/new-article',
      articleId: '123',
    },
  }),
});
```

### 8.3 Send Notification to Topic

```javascript
// Send notification to all users subscribed to a topic
const response = await fetch('/api/fcm/send-notification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    topic: 'new-articles',
    title: 'New Article Published',
    body: 'Check out our latest article!',
    data: {
      url: '/articles/new-article',
    },
  }),
});
```

## Troubleshooting

### Service Worker Not Registering
- Make sure `firebase-messaging-sw.js` is in the `public` folder
- Check browser console for errors
- Ensure you're using HTTPS (or localhost)

### Token Not Generated
- Check that `NEXT_PUBLIC_FCM_VAPID_KEY` is set correctly
- Verify notification permission is granted
- Check browser console for errors

### Notifications Not Received
- Verify the token is valid
- Check that the service worker is active
- Ensure the notification payload is correct
- Check browser notification settings

### CORS Errors
- Make sure your Firebase project allows your domain
- Check Firebase Console → Authentication → Authorized domains

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [FCM Web Setup Guide](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## Files Created/Modified

1. ✅ `src/app/firebase/firebase.js` - Updated with FCM messaging
2. ✅ `public/firebase-messaging-sw.js` - Service worker for background notifications
3. ✅ `src/lib/fcm.js` - FCM utility functions and hooks
4. ✅ `src/components/FCMNotificationProvider.js` - Provider component
5. ✅ `src/app/api/fcm/save-token/route.js` - API to save tokens
6. ✅ `src/app/api/fcm/delete-token/route.js` - API to delete tokens
7. ✅ `src/app/api/fcm/send-notification/route.js` - API to send notifications
8. ✅ `src/app/layout.js` - Updated to include FCMNotificationProvider

## Next Steps

1. Get VAPID key from Firebase Console
2. Add environment variables
3. Install packages (if needed)
4. Update database schema (optional)
5. Implement database storage in API routes
6. Test the integration
7. Add notification UI/UX elements

