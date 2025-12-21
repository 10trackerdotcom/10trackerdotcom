/**
 * Client-side API cache utility
 * Prevents duplicate API calls and reduces server load
 */

const cache = new Map();
const pendingRequests = new Map();

// Default TTL: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Get cached data or fetch if not cached/expired
 * @param {string} key - Cache key (usually the API endpoint)
 * @param {Function} fetchFn - Function that returns a Promise with the data
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Promise} - Cached or fresh data
 */
export async function getCachedData(key, fetchFn, ttl = DEFAULT_TTL) {
  const now = Date.now();
  const cached = cache.get(key);

  // Return cached data if valid
  if (cached && (now - cached.timestamp) < ttl) {
    return cached.data;
  }

  // If there's already a pending request for this key, return that promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  // Create new request
  const requestPromise = fetchFn()
    .then((data) => {
      // Cache the result
      cache.set(key, {
        data,
        timestamp: now,
      });
      // Remove from pending
      pendingRequests.delete(key);
      return data;
    })
    .catch((error) => {
      // Remove from pending on error
      pendingRequests.delete(key);
      throw error;
    });

  // Store pending request
  pendingRequests.set(key, requestPromise);

  return requestPromise;
}

/**
 * Invalidate cache for a specific key
 * @param {string} key - Cache key to invalidate
 */
export function invalidateCache(key) {
  cache.delete(key);
}

/**
 * Clear all cache
 */
export function clearCache() {
  cache.clear();
  pendingRequests.clear();
}

/**
 * Get cache stats (for debugging)
 */
export function getCacheStats() {
  return {
    size: cache.size,
    pending: pendingRequests.size,
    keys: Array.from(cache.keys()),
  };
}

