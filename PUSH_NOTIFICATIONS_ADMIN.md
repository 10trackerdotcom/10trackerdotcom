# Push Notifications Admin UI

## 📍 Access

The push notifications admin panel is available at:
**`/admin/notifications`**

Only accessible to admin users (`jain10gunjan@gmail.com`).

## 🎯 Features

### Send Modes

1. **Single Token**
   - Send to one specific device
   - Requires FCM token

2. **Multiple Tokens**
   - Send to multiple devices at once
   - Enter tokens separated by commas or new lines
   - Supports multicast delivery

3. **Topic**
   - Send to all users subscribed to a topic
   - Users can subscribe to topics (e.g., "new-articles", "job-updates")
   - Broadcast to multiple users efficiently

### Notification Fields

- **Title** (Required, max 100 chars)
  - Appears as notification title
  - Keep it concise (under 50 chars recommended)

- **Message** (Required, max 500 chars)
  - Notification body text
  - Keep it actionable and clear

- **Image URL** (Optional)
  - Large image to display in notification
  - Must be publicly accessible URL
  - Recommended: 500x300px or larger

- **Link URL** (Optional)
  - URL to open when user clicks notification
  - Can be relative (e.g., `/articles/article-slug`) or absolute
  - Stored in notification data

## 🚀 Usage

### Step 1: Access Admin Panel
1. Sign in as admin (`jain10gunjan@gmail.com`)
2. Navigate to `/admin/notifications`
3. Or click "Admin" in user menu → Notifications

### Step 2: Choose Send Mode
- Click on the send mode card (Single Token, Multiple Tokens, or Topic)

### Step 3: Fill Notification Details
1. Enter **Title** (required)
2. Enter **Message** (required)
3. Optionally add **Image URL**
4. Optionally add **Link URL**

### Step 4: Add Recipients
- **Single Token**: Enter FCM token
- **Multiple Tokens**: Enter tokens (comma or newline separated)
- **Topic**: Enter topic name (e.g., "new-articles")

### Step 5: Send
- Click "Send Notification" button
- Wait for confirmation
- Check result details if needed

## 📋 Examples

### Example 1: New Article Notification
```
Title: New Article Published
Message: Check out our latest article on GATE CSE preparation tips!
Image: https://example.com/article-image.jpg
URL: /articles/gate-cse-preparation-tips
Topic: new-articles
```

### Example 2: Job Update
```
Title: New Job Opening
Message: Software Engineer position at Google is now open!
Image: https://example.com/job-image.jpg
URL: /jobs/google-software-engineer
Topic: job-updates
```

### Example 3: Test Notification (Single Device)
```
Title: Test Notification
Message: This is a test notification
Token: [user's FCM token]
```

## 🔍 Getting FCM Tokens

### For Testing
1. User enables notifications on your site
2. Check browser console for FCM token
3. Or check backend logs (if token saving is implemented)

### For Production
- Tokens should be stored in database when users enable notifications
- Query database to get tokens for specific users or all users

## 📊 Response Details

After sending, you'll see:
- ✅ Success message with delivery details
- ❌ Error message with specific error code
- Response JSON with FCM API response

### Success Response
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "result": {
    "successCount": 1,
    "failureCount": 0
  }
}
```

### Error Responses
- **Invalid Token**: Token is invalid or device unregistered
- **Permission Error**: Firebase Admin SDK not configured
- **Validation Error**: Missing required fields

## 🛠️ Troubleshooting

### "Firebase Admin SDK is not initialized"
- Install firebase-admin: `npm install firebase-admin`
- Ensure `service_account.json` exists in project root
- Or set `FCM_SERVICE_ACCOUNT` environment variable

### "Invalid or unregistered token"
- Token may have expired
- User may have uninstalled app or cleared data
- Request new token from user

### "Topic not found"
- Topics are created automatically when first message is sent
- Users need to subscribe to topics first (client-side)

## 💡 Best Practices

1. **Keep Titles Short**: Under 50 characters for best display
2. **Clear Messages**: Be specific and actionable
3. **Use Topics**: For broadcasting to multiple users
4. **Test First**: Always test with a single token first
5. **Monitor Results**: Check success/failure counts
6. **Image Optimization**: Use optimized images (under 1MB)
7. **Relevant URLs**: Link to relevant content

## 🔐 Security

- Only admin users can access this page
- All API calls are server-side
- FCM tokens are not exposed to client
- Service account credentials are server-only

## 📱 Testing

1. Enable notifications on a test device
2. Get the FCM token from console/logs
3. Send a test notification using "Single Token" mode
4. Verify notification is received
5. Test clicking notification opens correct URL

---

## Quick Links

- Admin Panel: `/admin/notifications`
- API Endpoint: `/api/fcm/send-notification`
- FCM Setup Guide: `FCM_SETUP_GUIDE.md`
- Token Error Fix: `FCM_TOKEN_ERROR_FIX.md`
