/**
 * Node.js script to test Article Generation APIs
 * 
 * Usage:
 *   node test-apis.js
 * 
 * Make sure to set environment variables or update the BASE_URL
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Test data
const testHeadline = 'Netflix and Warner Bros acquisition news';
const testCategory = 'news';
const testImageUrl = 'https://example.com/image.jpg';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testSearchFacts() {
  logStep('SEARCH FACTS', 'Testing search facts API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/generate-and-save-article/search-facts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headline: testHeadline })
    });

    const data = await response.json();
    
    if (!data.success) {
      logError(`Search failed: ${data.error}`);
      if (data.details) logError(`Details: ${data.details}`);
      return null;
    }

    logSuccess(`Facts found (${data.data.factualNotes.length} characters)`);
    log(`Processing time: ${data.meta.processingTimeMs}ms`, 'blue');
    log(`Preview: ${data.data.factualNotes.substring(0, 100)}...`, 'blue');
    
    return data.data;
  } catch (error) {
    logError(`Request failed: ${error.message}`);
    return null;
  }
}

async function testCreateArticle(factualNotes) {
  logStep('CREATE ARTICLE', 'Testing create article API...');
  
  // Use provided notes or generate test notes
  const notes = factualNotes || `${testHeadline}: Test factual information for article generation.`;
  
  try {
    const response = await fetch(`${BASE_URL}/api/generate-and-save-article/create-article`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headline: testHeadline,
        factualNotes: notes,
        expandToWordCount: true
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      logError(`Article creation failed: ${data.error}`);
      if (data.details) logError(`Details: ${data.details}`);
      return null;
    }

    logSuccess(`Article created (${data.data.wordCount} words)`);
    log(`Title: ${data.data.title}`, 'blue');
    log(`Processing time: ${data.meta.processingTimeMs}ms`, 'blue');
    log(`Expansion performed: ${data.meta.expansionPerformed}`, 'blue');
    
    return data.data;
  } catch (error) {
    logError(`Request failed: ${error.message}`);
    return null;
  }
}

async function testSaveArticle(articleData) {
  logStep('SAVE ARTICLE', 'Testing save article API...');
  
  // Use provided article or create test data
  const data = articleData || {
    title: testHeadline,
    description: 'Test article description',
    article: '# Test Article\n\nThis is a test article for testing the save API.'
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/generate-and-save-article/save-article`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        description: data.description || '',
        article: data.article,
        category: testCategory,
        image_url: testImageUrl,
        status: 'published'
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      logError(`Save failed: ${result.error}`);
      if (result.details) logError(`Details: ${result.details}`);
      if (result.duplicate) {
        logWarning('This is a duplicate article (409 Conflict)');
      }
      return null;
    }

    logSuccess(`Article saved successfully!`);
    log(`ID: ${result.data.id}`, 'blue');
    log(`Slug: ${result.data.slug}`, 'blue');
    log(`URL: ${result.data.url}`, 'blue');
    log(`Category: ${result.data.category}`, 'blue');
    log(`Suggested Subreddit: ${result.data.suggested_subreddit || 'N/A'}`, 'blue');
    log(`Processing time: ${result.meta.processingTimeMs}ms`, 'blue');
    
    return result.data;
  } catch (error) {
    logError(`Request failed: ${error.message}`);
    return null;
  }
}

async function testCompleteFlow() {
  log('\n' + '='.repeat(60), 'bright');
  log('TESTING COMPLETE FLOW', 'bright');
  log('='.repeat(60), 'bright');
  
  const startTime = Date.now();
  
  // Step 1: Search Facts
  const facts = await testSearchFacts();
  if (!facts) {
    logError('Cannot continue - search facts failed');
    return;
  }
  
  // Step 2: Create Article
  const article = await testCreateArticle(facts.factualNotes);
  if (!article) {
    logError('Cannot continue - article creation failed');
    return;
  }
  
  // Step 3: Save Article
  const saved = await testSaveArticle(article);
  if (!saved) {
    logError('Cannot continue - save failed');
    return;
  }
  
  const totalTime = Date.now() - startTime;
  
  log('\n' + '='.repeat(60), 'bright');
  logSuccess('COMPLETE FLOW SUCCESSFUL!');
  log(`Total time: ${totalTime}ms`, 'blue');
  log('='.repeat(60), 'bright');
  
  return { facts, article, saved, totalTime };
}

async function testErrorCases() {
  log('\n' + '='.repeat(60), 'bright');
  log('TESTING ERROR CASES', 'bright');
  log('='.repeat(60), 'bright');
  
  // Test missing headline
  logStep('ERROR TEST', 'Testing missing headline...');
  try {
    const response = await fetch(`${BASE_URL}/api/generate-and-save-article/search-facts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await response.json();
    if (!data.success) {
      logSuccess(`Expected error received: ${data.error}`);
    } else {
      logError('Expected error but got success');
    }
  } catch (error) {
    logError(`Request failed: ${error.message}`);
  }
  
  // Test invalid category
  logStep('ERROR TEST', 'Testing invalid category...');
  try {
    const response = await fetch(`${BASE_URL}/api/generate-and-save-article/save-article`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test',
        article: 'Content...',
        category: 'invalid-category-that-does-not-exist-12345'
      })
    });
    const data = await response.json();
    if (!data.success) {
      logSuccess(`Expected error received: ${data.error}`);
    } else {
      logError('Expected error but got success');
    }
  } catch (error) {
    logError(`Request failed: ${error.message}`);
  }
}

// Main execution
async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('ARTICLE GENERATION API TEST SUITE', 'bright');
  log('='.repeat(60), 'bright');
  log(`Base URL: ${BASE_URL}`, 'blue');
  log(`Test Headline: ${testHeadline}`, 'blue');
  log(`Test Category: ${testCategory}`, 'blue');
  
  const args = process.argv.slice(2);
  const testType = args[0] || 'complete';
  
  switch (testType) {
    case 'search':
      await testSearchFacts();
      break;
    case 'create':
      await testCreateArticle();
      break;
    case 'save':
      await testSaveArticle();
      break;
    case 'complete':
      await testCompleteFlow();
      break;
    case 'errors':
      await testErrorCases();
      break;
    case 'all':
      await testSearchFacts();
      await testCreateArticle();
      await testSaveArticle();
      await testCompleteFlow();
      await testErrorCases();
      break;
    default:
      logError(`Unknown test type: ${testType}`);
      log('Available options: search, create, save, complete, errors, all', 'yellow');
  }
}

// Run tests
main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
