# FCM Database Integration & Batch Sending Setup

## 📋 Overview

This system now tracks FCM token enrollments by category, saves tokens to Supabase, and supports batch sending of notifications to users based on their enrollment category.

## 🗄️ Database Setup

### Step 1: Run SQL Schema

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `fcm_tokens_schema.sql`
4. Execute the SQL script

This will create:
- `fcm_tokens` table - stores all FCM tokens with enrollment tracking
- `fcm_enrollment_stats` view - statistics by category
- `fcm_enrollment_by_source` view - statistics by source URL
- Helper functions for batch token retrieval
- Indexes for performance
- RLS policies for security

### Step 2: Verify Tables

After running the SQL, verify:
- `fcm_tokens` table exists
- Views are created
- Indexes are created

## 🎯 Features

### 1. Enrollment Tracking

When a user enables notifications:
- **Enrollment Source**: The URL/page where they enrolled (e.g., `/articles`, `/home`)
- **Enrollment Category**: Auto-categorized based on source:
  - `articles` - from articles pages
  - `home` - from homepage
  - `exams` - from exams/practice pages
  - `gate`, `cat`, `upsc`, `jee` - specific exam categories
  - `jobs` - from job pages
  - `results` - from results pages
  - `other` - other pages

### 2. Token Storage

Tokens are saved with:
- User ID (if authenticated)
- Enrollment source URL
- Enrollment category
- Device information
- Active status
- Timestamps

### 3. Batch Sending

Notifications can be sent:
- **Single Token**: To one specific device
- **By Category**: To all users in a category (e.g., all "articles" users)
- **To All**: To all active users across all categories

**Batch Processing**:
- Automatically splits large token lists into batches of 100
- Sends batches sequentially with small delays
- Marks invalid tokens as inactive automatically
- Provides detailed success/failure reports

## 📊 Admin UI

### Access

Navigate to: `/admin/notifications`

### Features

1. **Enrollment Statistics Panel** (Left Side)
   - Shows enrollment count per category
   - Active vs inactive tokens
   - Unique users per category
   - Total active users

2. **Send Notification Form** (Right Side)
   - Three send modes:
     - **Single Token**: Test with one device
     - **By Category**: Send to all users in a category
     - **All Users**: Broadcast to everyone
   - Notification fields:
     - Title (required, max 100 chars)
     - Message (required, max 500 chars)
     - Image URL (optional)
     - Link URL (optional)

3. **Results Display**
   - Success/failure status
   - Detailed batch results
   - Copy JSON response

## 🔧 API Endpoints

### 1. Save Token
**POST** `/api/fcm/save-token`

```json
{
  "token": "fcm-token-here",
  "userId": "user-id-optional",
  "enrollmentSource": "/articles",
  "deviceInfo": {
    "userAgent": "...",
    "platform": "..."
  }
}
```

### 2. Send Notification
**POST** `/api/fcm/send-notification`

**Single Token:**
```json
{
  "title": "Notification Title",
  "body": "Notification message",
  "token": "fcm-token-here",
  "image": "https://example.com/image.jpg",
  "url": "/articles/article-slug"
}
```

**By Category:**
```json
{
  "title": "Notification Title",
  "body": "Notification message",
  "category": "articles",
  "image": "https://example.com/image.jpg",
  "url": "/articles/article-slug"
}
```

**To All Users:**
```json
{
  "title": "Notification Title",
  "body": "Notification message",
  "sendToAll": true,
  "image": "https://example.com/image.jpg",
  "url": "/articles/article-slug"
}
```

### 3. Get Enrollment Stats
**GET** `/api/fcm/enrollment-stats`

Returns:
```json
[
  {
    "enrollment_category": "articles",
    "total_enrolled": 150,
    "active_tokens": 145,
    "inactive_tokens": 5,
    "unique_users": 120
  },
  ...
]
```

## 📈 How It Works

### Enrollment Flow

1. User clicks notification button on any page
2. Browser requests notification permission
3. FCM token is generated
4. Token is saved to database with:
   - Current page URL as `enrollment_source`
   - Auto-categorized as `enrollment_category`
   - Device information
   - User ID (if authenticated)

### Sending Flow

1. Admin selects send mode (Token/Category/All)
2. If Category or All:
   - System queries database for active tokens
   - Filters by category if specified
   - Splits tokens into batches of 100
3. Sends notifications in batches:
   - Batch 1: tokens 1-100
   - Batch 2: tokens 101-200
   - etc.
4. Marks invalid tokens as inactive
5. Returns detailed results

## 🎨 Category Mapping

The system automatically categorizes enrollment sources:

| Source Pattern | Category |
|---------------|----------|
| `/articles`, `article` | `articles` |
| `/`, `/home` | `home` |
| `/exams`, `/practice` | `exams` |
| `/gate` | `gate` |
| `/cat` | `cat` |
| `/upsc` | `upsc` |
| `/jee` | `jee` |
| `/jobs`, `job` | `jobs` |
| `/results`, `result` | `results` |
| Other | `other` |

## 🔍 Database Queries

### Get Active Tokens by Category
```sql
SELECT token, user_id, enrollment_source
FROM fcm_tokens
WHERE is_active = TRUE
  AND enrollment_category = 'articles'
ORDER BY enrollment_timestamp DESC;
```

### Get Enrollment Statistics
```sql
SELECT * FROM fcm_enrollment_stats;
```

### Get Statistics by Source
```sql
SELECT * FROM fcm_enrollment_by_source;
```

## 🚀 Usage Examples

### Send to All Article Readers
```javascript
fetch('/api/fcm/send-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'New Article Published!',
    body: 'Check out our latest article on GATE CSE tips',
    category: 'articles',
    url: '/articles/gate-cse-tips'
  })
});
```

### Send to All Users
```javascript
fetch('/api/fcm/send-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Important Update',
    body: 'We have exciting news for everyone!',
    sendToAll: true,
    url: '/updates'
  })
});
```

## 📝 Notes

- **Batch Size**: Default is 100 tokens per batch (configurable)
- **Rate Limiting**: 100ms delay between batches
- **Invalid Tokens**: Automatically marked as inactive
- **Statistics**: Auto-refreshed after sending notifications
- **Security**: RLS policies allow public insert, but restrict sensitive operations

## 🔐 Security

- RLS (Row Level Security) enabled on `fcm_tokens` table
- Public can insert their own tokens
- Admin can view all statistics
- Tokens are automatically cleaned up when invalid

## 🐛 Troubleshooting

### No tokens found for category
- Check if users have enrolled from that category
- Verify tokens are marked as `is_active = TRUE`
- Check enrollment statistics in admin UI

### Batch sending fails
- Check Firebase Admin SDK is initialized
- Verify service account is configured
- Check server logs for specific errors

### Statistics not updating
- Click "Refresh Stats" button
- Check database connection
- Verify views are created correctly

---

## Quick Reference

- **Database Schema**: `fcm_tokens_schema.sql`
- **Admin UI**: `/admin/notifications`
- **Save Token API**: `/api/fcm/save-token`
- **Send Notification API**: `/api/fcm/send-notification`
- **Stats API**: `/api/fcm/enrollment-stats`
