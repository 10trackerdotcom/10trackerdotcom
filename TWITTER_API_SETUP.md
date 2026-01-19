# Twitter API Setup Guide

This guide will help you set up the Twitter posting API for your application.

## 📋 Prerequisites

You already have:
- ✅ Consumer Key (API Key): `psY6JJqTCaFvfsQd1LijrYTm0`
- ✅ Consumer Secret (API Secret): `C0tQXRJmuAbJRm17vjOMmXXJPaQrpOwM7ixAiWWQZeXa7or13j`
- ✅ Bearer Token: `AAAAAAAAAAAAAAAAAAAAADlv7AEAAAAAkyi3FF3GZqvAdYC2L2lAEffSyx8%3D7HMoV1VXd4InfHnPaaqbdvi9fjXunIPWDnPXfMYtOP2SUWtpFX`

## 🔑 Required: Access Token and Access Token Secret

To post tweets, you need **Access Token** and **Access Token Secret**. These are different from the Bearer Token (which is read-only).

### Step 1: Go to Twitter Developer Portal

1. Visit [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Sign in with your Twitter account
3. Select your app (or create a new one if needed)

### Step 2: Generate Access Tokens

1. In your app dashboard, go to **"Keys and tokens"** tab
2. Scroll down to **"Access Token and Secret"** section
3. Click **"Generate"** button
4. **Important**: Copy both:
   - **Access Token** (starts with numbers/letters)
   - **Access Token Secret** (long string)

⚠️ **Note**: The Access Token Secret is only shown once. Make sure to copy it immediately!

### Step 3: Set Up Environment Variables

Create or update your `.env.local` file in the project root:

```env
# Twitter API Credentials (OAuth 1.0a - Used for posting tweets)
TWITTER_CONSUMER_KEY=psY6JJqTCaFvfsQd1LijrYTm0
TWITTER_CONSUMER_SECRET=C0tQXRJmuAbJRm17vjOMmXXJPaQrpOwM7ixAiWWQZeXa7or13j
TWITTER_ACCESS_TOKEN=1985226959861989376-lH7NEpoSSsiBysutKtaJEO8UvthKCO
TWITTER_ACCESS_TOKEN_SECRET=3ROQmUi4BgshKGlM0sjlb0nifqKDIMH23gfBHUk3v5dnk

# OAuth 2.0 Credentials (Optional - stored for future use, not currently used for posting)
TWITTER_CLIENT_ID=QUhDXzlDNWJvV21fZzFrN09peFA6MTpjaQ
TWITTER_CLIENT_SECRET=jLkEKmJZwYVl0eDEZTmtk696NY3_4UtBDhOhst-6QeTfc6y153

# Optional: Bearer Token (for read-only operations)
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAADlv7AEAAAAAkyi3FF3GZqvAdYC2L2lAEffSyx8%3D7HMoV1VXd4InfHnPaaqbdvi9fjXunIPWDnPXfMYtOP2SUWtpFX
```

**Note**: 
- This API uses **OAuth 1.0a** for posting tweets (simpler and more direct)
- OAuth 2.0 credentials are stored but not currently used for posting
- The API code includes these values as fallbacks, but for security, you should still add them to your `.env.local` file

**Note**: The API code includes these values as fallbacks, but for security, you should still add them to your `.env.local` file.

### Step 4: Verify App Permissions ⚠️ CRITICAL

**This is the most common issue!** Make sure your Twitter app has the correct permissions:

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Select your app
3. Click on the **"Settings"** tab (gear icon)
4. Scroll down to **"App permissions"** section
5. **Change it to "Read and Write"** (required for posting tweets)
6. Click **"Save"** button
7. **IMPORTANT**: After changing permissions, you MUST:
   - Go back to **"Keys and tokens"** tab
   - **Regenerate your Access Token and Access Token Secret**
   - Update your `.env.local` file with the new tokens
   - Wait a few minutes for changes to propagate

⚠️ **Note**: If you get a 403 error saying "not configured with the appropriate oauth1 app permissions", it means:
- Your app permissions are set to "Read only" instead of "Read and Write"
- OR you haven't regenerated your Access Token after changing permissions

### Step 5: Test the API

Once you've set up the environment variables, you can test the API:

**Endpoint**: `POST /api/twitterpost`

**Request Body**:
```json
{
  "title": "Your tweet text here",
  "link": "https://example.com" // Optional
}
```

**Example using cURL**:
```bash
curl -X POST http://localhost:3000/api/twitterpost \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hello from CatTracker! 🐱",
    "link": "https://yourwebsite.com"
  }'
```

**Example using JavaScript (fetch)**:
```javascript
const response = await fetch('/api/twitterpost', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Hello from CatTracker! 🐱',
    link: 'https://yourwebsite.com'
  })
});

const data = await response.json();
console.log(data);
```

## 📝 API Response

### Success Response (200):
```json
{
  "success": true,
  "message": "Tweet posted successfully",
  "data": {
    "id": "1234567890123456789",
    "text": "Your tweet text here https://example.com",
    "tweetUrl": "https://twitter.com/i/web/status/1234567890123456789"
  }
}
```

### Error Response (400/500):
```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message",
  "statusCode": 400
}
```

## 🔒 Security Notes

1. **Never commit `.env.local` to version control** - it's already in `.gitignore`
2. **Keep your credentials secure** - don't share them publicly
3. **Rotate tokens** if they're ever compromised
4. **Use environment variables** - never hardcode credentials in your code

## ⚠️ Important Limitations

- **Character Limit**: Tweets are limited to 280 characters
- **Rate Limits**: Twitter API has rate limits (check your app's limits in the developer portal)
- **URL Shortening**: Twitter automatically shortens URLs, so they take up ~23 characters regardless of actual length

## 🐛 Troubleshooting

### Error: "Your client app is not configured with the appropriate oauth1 app permissions" (403)

**This is the most common error!** Here's how to fix it:

1. **Go to Twitter Developer Portal**: https://developer.twitter.com/en/portal/dashboard
2. **Select your app** from the list
3. **Click "Settings" tab** (gear icon ⚙️)
4. **Find "App permissions"** section
5. **Change from "Read only" to "Read and Write"**
6. **Click "Save"**
7. **Go to "Keys and tokens" tab**
8. **Scroll to "Access Token and Secret"**
9. **Click "Regenerate"** button
10. **Copy the new Access Token and Access Token Secret**
11. **Update your `.env.local` file** with the new tokens
12. **Restart your development server**
13. **Wait 2-3 minutes** for changes to propagate

⚠️ **Important**: You MUST regenerate your Access Token after changing permissions, otherwise the old token will still have "Read only" permissions!

### Error: "Twitter access token and access token secret are required"
- Make sure you've set `TWITTER_ACCESS_TOKEN` and `TWITTER_ACCESS_TOKEN_SECRET` in `.env.local`
- Restart your development server after adding environment variables

### Error: "Forbidden" or "Unauthorized" (other than permissions)
- Verify your access tokens are correct and recently generated
- Make sure you're using the correct consumer key/secret pair
- Check that all credentials match the same Twitter app

### Error: "Tweet text exceeds 280 character limit"
- Reduce the length of your title
- URLs count as ~23 characters regardless of actual length

## 📚 Additional Resources

- [Twitter API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [OAuth 1.0a Guide](https://developer.twitter.com/en/docs/authentication/oauth-1-0a)
- [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
