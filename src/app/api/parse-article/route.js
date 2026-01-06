import { NextResponse } from 'next/server';
import { marked } from 'marked';

// Configure marked to support tables and other features
marked.setOptions({
  breaks: true,
  gfm: true, // GitHub Flavored Markdown (supports tables)
});

/**
 * POST /api/parse-article
 * Accepts JSON with article content and converts markdown to HTML
 * 
 * Request body:
 * {
 *   "success": true,
 *   "article": "markdown content here..."
 * }
 * 
 * Returns HTML wrapped content
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Check if article content exists
    if (!body.article) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Article content is required' 
        },
        { status: 400 }
      );
    }

    const markdownContent = body.article;
    
    // Parse markdown to HTML
    const htmlContent = marked.parse(markdownContent);
    
    // Wrap in a container div with proper styling
    const wrappedHtml = `
      <div class="article-content prose prose-lg max-w-none">
        <style>
          .article-content {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.7;
            color: #333;
          }
          .article-content h1, .article-content h2, .article-content h3, .article-content h4 {
            font-weight: 700;
            margin-top: 1.5em;
            margin-bottom: 0.75em;
            color: #1a1a1a;
          }
          .article-content h1 {
            font-size: 2em;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 0.5em;
          }
          .article-content h2 {
            font-size: 1.5em;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 0.3em;
          }
          .article-content h3 {
            font-size: 1.25em;
          }
          .article-content p {
            margin-bottom: 1em;
          }
          .article-content ul, .article-content ol {
            margin-bottom: 1em;
            padding-left: 2em;
          }
          .article-content li {
            margin-bottom: 0.5em;
          }
          .article-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5em 0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow-x: auto;
            display: block;
          }
          .article-content table thead {
            background-color: #f3f4f6;
          }
          .article-content table th {
            padding: 12px 16px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #d1d5db;
            color: #1f2937;
          }
          .article-content table td {
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
          }
          .article-content table tbody tr:hover {
            background-color: #f9fafb;
          }
          .article-content table tbody tr:last-child td {
            border-bottom: none;
          }
          .article-content a {
            color: #2563eb;
            text-decoration: underline;
            transition: color 0.2s;
          }
          .article-content a:hover {
            color: #1d4ed8;
          }
          .article-content strong {
            font-weight: 600;
            color: #1a1a1a;
          }
          .article-content hr {
            border: none;
            border-top: 2px solid #e5e7eb;
            margin: 2em 0;
          }
          @media (max-width: 768px) {
            .article-content table {
              font-size: 0.875rem;
            }
            .article-content table th,
            .article-content table td {
              padding: 8px 12px;
            }
          }
        </style>
        ${htmlContent}
      </div>
    `;

    return NextResponse.json({
      success: true,
      html: wrappedHtml,
      rawHtml: htmlContent // Also return raw HTML without wrapper
    });

  } catch (error) {
    console.error('Error parsing article:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to parse article' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/parse-article
 * Returns example usage
 */
export async function GET() {
  return NextResponse.json({
    message: 'POST JSON data to parse markdown article to HTML',
    example: {
      success: true,
      article: '**Title:**\n\n| Column 1 | Column 2 |\n|----------|----------|\n| Data 1   | Data 2   |'
    },
    usage: 'POST to this endpoint with JSON body containing "article" field with markdown content'
  });
}
