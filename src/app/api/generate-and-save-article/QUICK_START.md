# Quick Start - Testing the APIs

## 🚀 Fastest Way to Test

### Option 1: Use the Test Page (Recommended)

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Open in browser:
   ```
   http://localhost:3000/test-article-apis
   ```

3. Fill in the form and click test buttons!

### Option 2: Browser Console

Open browser console (F12) and paste:

```javascript
// Quick test - Search Facts
fetch('/api/generate-and-save-article/search-facts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ headline: 'Netflix acquisition news' })
})
.then(r => r.json())
.then(console.log);
```

### Option 3: Command Line (cURL)

```bash
curl -X POST http://localhost:3000/api/generate-and-save-article/search-facts \
  -H "Content-Type: application/json" \
  -d '{"headline": "Netflix acquisition news"}'
```

### Option 4: Node.js Script

```bash
# Test complete flow
node test-apis.js complete

# Test individual APIs
node test-apis.js search
node test-apis.js create
node test-apis.js save
```

## 📋 Test Checklist

- [ ] Test page loads at `/test-article-apis`
- [ ] Search Facts API returns factual notes
- [ ] Create Article API generates article
- [ ] Save Article API saves to database
- [ ] Complete flow works end-to-end
- [ ] Error handling works (try invalid inputs)

## 🔧 Prerequisites

Make sure you have:
- ✅ Environment variables set (`.env.local`)
- ✅ Database tables created
- ✅ Valid category exists (e.g., "news")
- ✅ Dev server running

## 📚 More Info

- Full testing guide: `TESTING.md`
- API documentation: `README.md`
- Test page: `/test-article-apis`
- Test script: `test-apis.js`
