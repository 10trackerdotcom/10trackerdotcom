// lib/steinhq.js
// Helper function to post articles to SteinHQ API

const STEINHQ_STORAGE_ID = '697627d5affba40a62408c90';
// SteinHQ API base URL - try different formats if one doesn't work
const STEINHQ_BASE_URL = process.env.STEINHQ_API_URL || 'https://api.steinhq.com';
// Sheet name - update this if your sheet has a different name
const STEINHQ_SHEET_NAME = process.env.STEINHQ_SHEET_NAME || 'Sheet1';

/**
 * Post article to SteinHQ
 * @param {string} title - Article title
 * @param {string} link - Full article URL
 * @param {string} subreddit - Subreddit name (optional)
 * @param {string} flairID - Flair ID for the subreddit (optional)
 * @returns {Promise<Object>} Response from SteinHQ API
 */
export async function postToSteinHQ(title, link, subreddit = null, flairID = null, imageurl = null) {
  try {
    const baseUrl = 'https://10tracker.com';
    const fullLink = `${baseUrl}${link}`;

    // Try the endpoint with sheet name first (most common format)
    // Format: https://api.steinhq.com/v1/storages/{storageId}/{sheetName}
    const apiUrl = `${STEINHQ_BASE_URL}/v1/storages/${STEINHQ_STORAGE_ID}/${STEINHQ_SHEET_NAME}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          Title: title,
          Link: fullLink,
          Status: null,
          Subreddit: subreddit,
          FlairID: flairID,
          Imageurl: imageurl,
        }
      ]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SteinHQ API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Article posted to SteinHQ:', { title, link: fullLink });
    return data;
  } catch (error) {
    console.error('❌ Error posting to SteinHQ:', error);
    // Don't throw - we don't want to fail article creation if SteinHQ fails
    return { error: error.message };
  }
}
