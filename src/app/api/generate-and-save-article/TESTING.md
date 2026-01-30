# Testing Guide for Article Generation APIs

This guide provides multiple ways to test the new modular API routes.

## Quick Test Methods

### Method 1: Using cURL (Command Line)

#### Test Search Facts API
```bash
curl -X POST http://localhost:3000/api/generate-and-save-article/search-facts \
  -H "Content-Type: application/json" \
  -d '{"headline": "Netflix and Warner Bros acquisition news"}'
```

#### Test Create Article API
```bash
curl -X POST http://localhost:3000/api/generate-and-save-article/create-article \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "Netflix and Warner Bros acquisition news",
    "factualNotes": "Netflix announced plans to acquire Warner Bros in 2024. The deal is valued at $50 billion. Official confirmation came from both companies on January 15, 2024.",
    "expandToWordCount": true
  }'
```

#### Test Save Article API
```bash
curl -X POST http://localhost:3000/api/generate-and-save-article/save-article \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Netflix and Warner Bros: Latest Acquisition Updates",
    "description": "Breaking news about the major acquisition",
    "article": "# Introduction\n\nThis is a test article about Netflix and Warner Bros acquisition.\n\n## Key Points\n\n- Deal announced in 2024\n- Valued at $50 billion\n- Official confirmation received",
    "category": "news",
    "image_url": "https://example.com/image.jpg",
    "status": "published"
  }'
```

### Method 2: Using Browser Console

Open your browser's developer console and run:

```javascript
// Test Search Facts
fetch('/api/generate-and-save-article/search-facts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ headline: 'Netflix and Warner Bros acquisition news' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);

// Test Create Article
fetch('/api/generate-and-save-article/create-article', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    headline: 'Netflix and Warner Bros acquisition news',
    factualNotes: 'Netflix announced plans to acquire Warner Bros in 2024. The deal is valued at $50 billion.',
    expandToWordCount: true
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);

// Test Save Article
fetch('/api/generate-and-save-article/save-article', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test Article',
    description: 'Test description',
    article: '# Test\n\nThis is a test article.',
    category: 'news',
    status: 'published'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Method 3: Using Postman/Insomnia

1. **Search Facts API**
   - Method: `POST`
   - URL: `http://localhost:3000/api/generate-and-save-article/search-facts`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "headline": "Netflix and Warner Bros acquisition news"
     }
     ```

2. **Create Article API**
   - Method: `POST`
   - URL: `http://localhost:3000/api/generate-and-save-article/create-article`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "headline": "Netflix and Warner Bros acquisition news",
       "factualNotes": "Your factual notes here...",
       "expandToWordCount": true
     }
     ```

3. **Save Article API**
   - Method: `POST`
   - URL: `http://localhost:3000/api/generate-and-save-article/save-article`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "title": "Test Article",
       "description": "Test description",
       "article": "# Test\n\nArticle content here...",
       "category": "news",
       "status": "published"
     }
     ```

### Method 4: Using the Test Page

See `test-page.js` for a complete test interface.

## Complete Flow Test

Test all 3 APIs in sequence:

```javascript
async function testCompleteFlow() {
  const headline = "Netflix and Warner Bros acquisition news";
  const category = "news";
  const imageUrl = "https://example.com/image.jpg";

  try {
    // Step 1: Search Facts
    console.log('Step 1: Searching for facts...');
    const searchRes = await fetch('/api/generate-and-save-article/search-facts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headline })
    });
    const searchData = await searchRes.json();
    
    if (!searchData.success) {
      throw new Error(`Search failed: ${searchData.error}`);
    }
    console.log('✅ Facts found:', searchData.data.factualNotes.substring(0, 100) + '...');

    // Step 2: Create Article
    console.log('Step 2: Creating article...');
    const createRes = await fetch('/api/generate-and-save-article/create-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headline,
        factualNotes: searchData.data.factualNotes,
        expandToWordCount: true
      })
    });
    const createData = await createRes.json();
    
    if (!createData.success) {
      throw new Error(`Article creation failed: ${createData.error}`);
    }
    console.log('✅ Article created:', createData.data.wordCount, 'words');

    // Step 3: Save Article
    console.log('Step 3: Saving article...');
    const saveRes = await fetch('/api/generate-and-save-article/save-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: createData.data.title,
        description: createData.data.description,
        article: createData.data.article,
        category,
        image_url: imageUrl,
        status: 'published'
      })
    });
    const saveData = await saveRes.json();
    
    if (!saveData.success) {
      throw new Error(`Save failed: ${saveData.error}`);
    }
    console.log('✅ Article saved:', saveData.data.url);
    console.log('✅ Suggested subreddit:', saveData.data.suggested_subreddit);
    
    return saveData;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testCompleteFlow();
```

## Error Testing

### Test Invalid Inputs

```javascript
// Test missing headline
fetch('/api/generate-and-save-article/search-facts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
.then(r => r.json())
.then(data => console.log('Expected error:', data));

// Test invalid category
fetch('/api/generate-and-save-article/save-article', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test',
    article: 'Content...',
    category: 'invalid-category-that-does-not-exist'
  })
})
.then(r => r.json())
.then(data => console.log('Expected error:', data));

// Test duplicate article
fetch('/api/generate-and-save-article/save-article', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Existing Article Title', // Use a title that already exists
    article: 'Content...',
    category: 'news'
  })
})
.then(r => r.json())
.then(data => console.log('Expected 409 conflict:', data));
```

### Test Edge Cases

```javascript
// Test very long headline
fetch('/api/generate-and-save-article/search-facts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    headline: 'A'.repeat(600) // Exceeds 500 char limit
  })
})
.then(r => r.json())
.then(data => console.log('Expected validation error:', data));

// Test empty article
fetch('/api/generate-and-save-article/save-article', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test',
    article: '', // Empty article
    category: 'news'
  })
})
.then(r => r.json())
.then(data => console.log('Expected validation error:', data));

// Test invalid URL
fetch('/api/generate-and-save-article/save-article', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test',
    article: 'Content...',
    category: 'news',
    image_url: 'not-a-valid-url'
  })
})
.then(r => r.json())
.then(data => console.log('Expected URL validation error:', data));
```

## API Documentation Endpoints

Each API has a GET endpoint that returns documentation:

```bash
# Get Search Facts API docs
curl http://localhost:3000/api/generate-and-save-article/search-facts

# Get Create Article API docs
curl http://localhost:3000/api/generate-and-save-article/create-article

# Get Save Article API docs
curl http://localhost:3000/api/generate-and-save-article/save-article
```

## Testing Checklist

### Search Facts API
- [ ] Valid headline returns factual notes
- [ ] Empty headline returns 400 error
- [ ] Missing headline returns 400 error
- [ ] Very long headline returns validation error
- [ ] API timeout handling (if API is slow)
- [ ] Rate limit handling (429 error)

### Create Article API
- [ ] Valid inputs generate article
- [ ] Article expands to 500-700 words
- [ ] Missing factualNotes returns 400 error
- [ ] Invalid JSON from model is handled gracefully
- [ ] Word count validation works
- [ ] HTML conversion works correctly

### Save Article API
- [ ] Valid article saves successfully
- [ ] Duplicate title returns 409 error
- [ ] Invalid category returns 400 error
- [ ] Invalid URL returns 400 error
- [ ] Missing required fields return 400 error
- [ ] SteinHQ posting doesn't block response
- [ ] Subreddit suggestion works

### Integration Tests
- [ ] Complete flow (all 3 APIs) works end-to-end
- [ ] Error in step 1 doesn't break step 2
- [ ] Error in step 2 doesn't break step 3
- [ ] Data flows correctly between steps

## Performance Testing

```javascript
// Test response times
async function testPerformance() {
  const start = Date.now();
  
  const response = await fetch('/api/generate-and-save-article/search-facts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ headline: 'Test headline' })
  });
  
  const data = await response.json();
  const duration = Date.now() - start;
  
  console.log(`Response time: ${duration}ms`);
  console.log(`API reported time: ${data.meta?.processingTimeMs}ms`);
}
```

## Environment Setup

Before testing, ensure:

1. **Environment Variables are set:**
   ```bash
   OPENAI_API_KEY=your_key_here
   NEXT_PUBLIC_SUPABASE_URL=your_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   ```

2. **Database tables exist:**
   - `articles`
   - `article_categories`
   - `subreddit_tracking` (auto-created)

3. **Valid categories exist:**
   - Check that your test category (e.g., "news") exists in `article_categories` table

4. **Server is running:**
   ```bash
   npm run dev
   ```

## Troubleshooting

### Common Issues

1. **"OpenAI API key is not configured"**
   - Check `.env.local` file
   - Restart dev server after adding env vars

2. **"Category does not exist"**
   - Run `articles_setup.sql` in Supabase
   - Or create category manually

3. **"Request timeout"**
   - OpenAI API might be slow
   - Check network connection
   - Increase timeout if needed

4. **"Rate limit exceeded"**
   - Wait a few minutes
   - Check OpenAI usage limits
   - Implement retry logic

5. **CORS errors**
   - Make sure you're testing from the same origin
   - Check Next.js API route configuration

## Next Steps

1. Use the test page (`test-page.js`) for interactive testing
2. Create automated tests using Jest/Vitest
3. Set up integration tests in CI/CD
4. Monitor API performance in production
