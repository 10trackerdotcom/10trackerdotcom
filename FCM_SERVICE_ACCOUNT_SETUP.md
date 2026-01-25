# FCM Service Account Setup Guide

## 🔑 Understanding the Difference

### **FCM_SERVER_KEY** (Legacy - Not Recommended)
- A simple string key from Firebase Console
- Used with deprecated Legacy FCM API
- Less secure
- Being phased out by Google

### **Service Account JSON** (Recommended - What You Have)
- A complete JSON file with credentials
- Used with Firebase Admin SDK
- More secure and flexible
- Modern, production-ready approach

## ✅ What You Have

You have a **Firebase Service Account JSON** file at `service_account.json`. This is the **recommended** method for production.

## 📦 Installation

First, install Firebase Admin SDK:

```bash
npm install firebase-admin
```

## 🔧 Configuration

### Option 1: Use the JSON File Directly (Current Setup)
The code is configured to read from `service_account.json` in the project root.

**Important**: Make sure `service_account.json` is in your `.gitignore` to avoid committing credentials!

### Option 2: Use Environment Variable (More Secure)
Store the service account JSON as an environment variable:

1. Convert the JSON to a single line (or use a JSON minifier)
2. Add to `.env.local`:
```env
FCM_SERVICE_ACCOUNT={"type":"service_account","project_id":"examtracker-6731e",...}
```

The code will automatically use this if set.

## 🚀 How It Works Now

The updated `send-notification` API now:
- ✅ Uses Firebase Admin SDK (modern approach)
- ✅ Reads service account from `service_account.json` or `FCM_SERVICE_ACCOUNT` env var
- ✅ Supports single token, multiple tokens (multicast), and topics
- ✅ Better error handling with specific error codes
- ✅ Production-ready implementation

## 📝 Environment Variables

You now need:
```env
# Client-side (for token generation)
NEXT_PUBLIC_FCM_VAPID_KEY=your-vapid-key-here

# Server-side (optional - if using env var instead of file)
FCM_SERVICE_ACCOUNT={"type":"service_account",...}
```

**Note**: You NO LONGER need `FCM_SERVER_KEY` - the service account replaces it!

## 🔒 Security Best Practices

1. **Never commit `service_account.json` to git**
   - Add to `.gitignore`:
   ```
   service_account.json
   ```

2. **Use environment variables in production**
   - Store service account JSON in your hosting platform's environment variables
   - Use `FCM_SERVICE_ACCOUNT` env var

3. **Restrict service account permissions**
   - Only grant necessary Firebase permissions
   - Use IAM roles to limit access

## 🧪 Testing

After installing `firebase-admin`, test the API:

```bash
curl -X POST http://localhost:3000/api/fcm/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_FCM_TOKEN",
    "title": "Test Notification",
    "body": "Testing Firebase Admin SDK",
    "data": {
      "url": "/articles/test"
    }
  }'
```

## 📊 Benefits of Service Account

1. ✅ More secure than server key
2. ✅ Better error messages
3. ✅ Supports all FCM features
4. ✅ Future-proof (not deprecated)
5. ✅ Better rate limiting
6. ✅ Can be scoped with IAM roles

## ⚠️ Migration Notes

- Old code used `FCM_SERVER_KEY` → Now uses service account
- Old code used Legacy API → Now uses Firebase Admin SDK
- API endpoint remains the same: `/api/fcm/send-notification`
- Request/response format unchanged
