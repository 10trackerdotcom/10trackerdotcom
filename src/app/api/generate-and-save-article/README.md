# Article Generation API - Modular Routes

This directory contains a modular API system for generating and saving articles. The original monolithic API has been split into 3 separate, focused endpoints for better maintainability, error handling, and reusability.

## Architecture

The article generation process is split into 3 independent API routes:

1. **`/search-facts`** - Web search and fact extraction
2. **`/create-article`** - Article generation and expansion
3. **`/save-article`** - Database persistence

## API Routes

### 1. Search Facts API

**Endpoint:** `POST /api/generate-and-save-article/search-facts`

**Purpose:** Performs web search using OpenAI and extracts verified factual information about a topic.

**Request Body:**
```json
{
  "headline": "Netflix and Warner Bros acquisition news"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "factualNotes": "Verified facts about the topic...",
    "headline": "Netflix and Warner Bros acquisition news",
    "processingTimeMs": 5234
  },
  "meta": {
    "tokensUsed": 900,
    "model": "gpt-4.1-mini",
    "webSearchUsed": true
  }
}
```

**Features:**
- ✅ Web search with OpenAI
- ✅ Timeout handling (30 seconds)
- ✅ Input validation
- ✅ Error handling for rate limits, timeouts, and API errors
- ✅ Minimum content validation

**Error Codes:**
- `400` - Invalid request (missing/invalid headline)
- `429` - Rate limit exceeded
- `500` - API error or configuration issue
- `504` - Request timeout

---

### 2. Create Article API

**Endpoint:** `POST /api/generate-and-save-article/create-article`

**Purpose:** Generates a news article from factual notes and expands it to meet word count requirements (500-700 words).

**Request Body:**
```json
{
  "headline": "Netflix and Warner Bros acquisition news",
  "factualNotes": "Verified facts from web search...",
  "expandToWordCount": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Netflix and Warner Bros: Latest Acquisition Updates",
    "description": "Article description...",
    "article": "# Introduction\n\nArticle content in markdown...",
    "articleHtml": "<div class=\"article-body\">...</div>",
    "wordCount": 623
  },
  "meta": {
    "processingTimeMs": 8456,
    "expansionPerformed": true,
    "expansionAttempts": 1,
    "tokensUsed": 2600,
    "model": "gpt-4.1-nano"
  }
}
```

**Features:**
- ✅ Article generation from factual notes
- ✅ Automatic expansion to 500-700 words (with retry logic)
- ✅ Markdown to HTML conversion
- ✅ Word count validation
- ✅ Up to 3 expansion attempts if needed
- ✅ Handles word count boundaries (min/max)

**Error Codes:**
- `400` - Invalid request (missing/invalid inputs)
- `429` - Rate limit exceeded
- `500` - Generation/expansion failed
- `504` - Request timeout

---

### 3. Save Article API

**Endpoint:** `POST /api/generate-and-save-article/save-article`

**Purpose:** Saves a generated article to Supabase database with validation, duplicate checking, and posts to SteinHQ.

**Request Body:**
```json
{
  "title": "Netflix and Warner Bros: Latest Acquisition Updates",
  "description": "Article description...",
  "article": "# Introduction\n\nArticle content in markdown...",
  "category": "news",
  "image_url": "https://example.com/image.jpg",
  "author_email": "author@example.com",
  "status": "published",
  "checkDuplicate": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Article saved successfully",
  "data": {
    "id": 123,
    "title": "Netflix and Warner Bros: Latest Acquisition Updates",
    "slug": "netflix-and-warner-bros-latest-acquisition-updates",
    "category": "news",
    "excerpt": "Article description...",
    "featured_image_url": "https://example.com/image.jpg",
    "status": "published",
    "created_at": "2024-01-15T10:30:00Z",
    "url": "/articles/netflix-and-warner-bros-latest-acquisition-updates",
    "suggested_subreddit": "r/indianews"
  },
  "meta": {
    "processingTimeMs": 1234,
    "duplicateCheck": true,
    "steinhqPosted": true
  }
}
```

**Features:**
- ✅ Comprehensive input validation
- ✅ Duplicate article checking (by title)
- ✅ Category existence validation
- ✅ URL validation for images
- ✅ HTML conversion
- ✅ Database transaction safety
- ✅ Non-blocking SteinHQ posting
- ✅ Round-robin subreddit suggestion
- ✅ Proper error handling for database constraints

**Error Codes:**
- `400` - Validation error (invalid inputs, category doesn't exist)
- `409` - Conflict (duplicate article exists)
- `500` - Database error or internal server error

---

## Usage Examples

### Complete Flow (All 3 APIs)

```javascript
// Step 1: Search for facts
const searchResponse = await fetch('/api/generate-and-save-article/search-facts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    headline: "Netflix and Warner Bros acquisition news"
  })
});

const searchData = await searchResponse.json();
if (!searchData.success) {
  console.error('Search failed:', searchData.error);
  return;
}

// Step 2: Create article
const createResponse = await fetch('/api/generate-and-save-article/create-article', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    headline: "Netflix and Warner Bros acquisition news",
    factualNotes: searchData.data.factualNotes,
    expandToWordCount: true
  })
});

const createData = await createResponse.json();
if (!createData.success) {
  console.error('Article creation failed:', createData.error);
  return;
}

// Step 3: Save article
const saveResponse = await fetch('/api/generate-and-save-article/save-article', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: createData.data.title,
    description: createData.data.description,
    article: createData.data.article,
    category: "news",
    image_url: "https://example.com/image.jpg",
    status: "published"
  })
});

const saveData = await saveResponse.json();
if (saveData.success) {
  console.log('Article saved:', saveData.data.url);
} else {
  console.error('Save failed:', saveData.error);
}
```

### Individual API Usage

You can also use each API independently:

```javascript
// Just search for facts
const facts = await fetch('/api/generate-and-save-article/search-facts', {
  method: 'POST',
  body: JSON.stringify({ headline: "Your topic" })
}).then(r => r.json());

// Just create an article (with your own facts)
const article = await fetch('/api/generate-and-save-article/create-article', {
  method: 'POST',
  body: JSON.stringify({
    headline: "Your topic",
    factualNotes: "Your own factual notes...",
    expandToWordCount: false
  })
}).then(r => r.json());

// Just save an article (that you created elsewhere)
const saved = await fetch('/api/generate-and-save-article/save-article', {
  method: 'POST',
  body: JSON.stringify({
    title: "Your title",
    article: "Your article content...",
    category: "news"
  })
}).then(r => r.json());
```

---

## Shared Utilities

All routes use shared utilities from `utils.js`:

- `countWords(text)` - Count words in text
- `safeJsonParse(text)` - Robust JSON parsing with error recovery
- `escapeHtml(str)` - XSS protection
- `processInlineFormatting(text)` - Markdown bold to HTML
- `convertToHtml(article)` - Full markdown to HTML conversion
- `isValidUrl(url)` - URL validation
- `validateHeadline(headline)` - Headline validation
- `validateCategory(category)` - Category validation

**Constants:**
- `WORD_COUNT_MIN = 500`
- `WORD_COUNT_MAX = 700`
- `MAX_EXCERPT_LENGTH = 500`
- `MAX_EXPANSION_ATTEMPTS = 3`

---

## Error Handling

All APIs follow consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

**Best Practices:**
1. Always check `success` field before accessing `data`
2. Handle specific error codes (400, 409, 429, 500, 504)
3. Implement retry logic for transient errors (429, 504)
4. Log errors for debugging
5. Show user-friendly error messages

---

## Edge Cases Handled

### Search Facts API
- ✅ Empty or invalid headlines
- ✅ API timeouts
- ✅ Rate limiting
- ✅ Empty or insufficient search results
- ✅ Missing API keys

### Create Article API
- ✅ Invalid JSON from model
- ✅ Articles below minimum word count
- ✅ Articles exceeding maximum word count
- ✅ Expansion failures (with retry)
- ✅ Missing required fields

### Save Article API
- ✅ Duplicate articles (by title)
- ✅ Invalid categories
- ✅ Invalid URLs
- ✅ Database constraint violations
- ✅ SteinHQ posting failures (non-blocking)
- ✅ Subreddit tracking errors (fallback)

---

## Configuration

**Required Environment Variables:**
- `OPENAI_API_KEY` - OpenAI API key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

**Optional Environment Variables:**
- `STEINHQ_API_URL` - SteinHQ API URL (default: 'https://api.steinhq.com')
- `STEINHQ_SHEET_NAME` - SteinHQ sheet name (default: 'Sheet1')

---

## Database Requirements

**Required Tables:**
- `articles` - Main articles table
- `article_categories` - Category definitions
- `subreddit_tracking` - Round-robin tracking (auto-created)

**Table Schema:**
See `articles_setup.sql` for full schema.

---

## Migration from Original API

The original `/api/generate-and-save-article/route.js` remains unchanged. To migrate:

1. Replace single API call with 3 sequential calls
2. Handle errors at each step
3. Pass data between steps
4. Consider implementing a wrapper/orchestrator API if needed

**Example Migration:**
```javascript
// Old way (single API)
const response = await fetch('/api/generate-and-save-article', {
  method: 'POST',
  body: JSON.stringify({ headline, category, image_url })
});

// New way (3 APIs)
const facts = await searchFacts(headline);
const article = await createArticle(headline, facts.factualNotes);
const saved = await saveArticle(article, category, image_url);
```

---

## Testing

Each API can be tested independently:

```bash
# Test search-facts
curl -X POST http://localhost:3000/api/generate-and-save-article/search-facts \
  -H "Content-Type: application/json" \
  -d '{"headline": "Test topic"}'

# Test create-article
curl -X POST http://localhost:3000/api/generate-and-save-article/create-article \
  -H "Content-Type: application/json" \
  -d '{"headline": "Test", "factualNotes": "Test facts..."}'

# Test save-article
curl -X POST http://localhost:3000/api/generate-and-save-article/save-article \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "article": "Content...", "category": "news"}'
```

---

## Performance Considerations

- **Search Facts:** ~5-10 seconds (web search)
- **Create Article:** ~8-15 seconds (generation + expansion)
- **Save Article:** ~1-2 seconds (database operations)

**Total Time:** ~15-30 seconds for complete flow

**Optimization Tips:**
- Cache factual notes for repeated headlines
- Use parallel processing where possible
- Implement request queuing for high traffic
- Monitor API rate limits

---

## Security Notes

- ✅ Input validation on all endpoints
- ✅ XSS protection via HTML escaping
- ✅ URL validation
- ✅ SQL injection protection (via Supabase client)
- ⚠️ No authentication (consider adding middleware)
- ⚠️ No rate limiting (consider adding middleware)

---

## Support

For issues or questions:
1. Check error messages and details
2. Review API documentation (GET endpoints)
3. Check server logs
4. Verify environment variables
5. Test each API independently
