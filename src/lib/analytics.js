// Google Analytics utility functions
// This file provides helper functions for tracking custom events

// Check if gtag is available
export const isGtagAvailable = () => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Track a custom event
export const trackEvent = (eventName, parameters = {}) => {
  if (!isGtagAvailable()) {
    console.warn('Google Analytics not available');
    return;
  }

  try {
    window.gtag('event', eventName, {
      ...parameters,
      event_category: parameters.category || 'engagement',
      event_label: parameters.label || '',
      value: parameters.value || 0,
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

// Track page views
export const trackPageView = (url, title) => {
  if (!isGtagAvailable()) {
    return;
  }

  try {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_title: title,
      page_location: url,
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

// Track user authentication events
export const trackAuthEvent = (action, method = 'email') => {
  trackEvent('user_authentication', {
    action: action, // 'login', 'signup', 'logout'
    method: method,
    category: 'authentication',
  });
};

// Track exam practice events
export const trackPracticeEvent = (action, examType, difficulty = null) => {
  trackEvent('exam_practice', {
    action: action, // 'started', 'completed', 'abandoned'
    exam_type: examType,
    difficulty: difficulty,
    category: 'education',
  });
};

// Track test events
export const trackTestEvent = (action, testId, score = null) => {
  trackEvent('test_attempt', {
    action: action, // 'started', 'completed', 'abandoned'
    test_id: testId,
    score: score,
    category: 'assessment',
  });
};

// Track content engagement
export const trackContentEvent = (action, contentType, contentId) => {
  trackEvent('content_engagement', {
    action: action, // 'viewed', 'shared', 'downloaded'
    content_type: contentType, // 'article', 'video', 'practice'
    content_id: contentId,
    category: 'content',
  });
};

// Track e-commerce events
export const trackEcommerceEvent = (action, transactionId, value, currency = 'INR') => {
  trackEvent('purchase', {
    action: action, // 'initiated', 'completed', 'cancelled'
    transaction_id: transactionId,
    value: value,
    currency: currency,
    category: 'ecommerce',
  });
};

// Track search events
export const trackSearchEvent = (searchTerm, resultsCount = 0) => {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
    category: 'search',
  });
};

// Track error events
export const trackErrorEvent = (errorType, errorMessage, page = null) => {
  trackEvent('error', {
    error_type: errorType,
    error_message: errorMessage,
    page: page || window.location.pathname,
    category: 'error',
  });
};

// Track social sharing
export const trackSocialShare = (platform, contentType, contentId) => {
  trackEvent('social_share', {
    platform: platform, // 'facebook', 'twitter', 'linkedin', etc.
    content_type: contentType,
    content_id: contentId,
    category: 'social',
  });
};

// Track video events
export const trackVideoEvent = (action, videoId, duration = null, progress = null) => {
  trackEvent('video_interaction', {
    action: action, // 'play', 'pause', 'complete', 'seek'
    video_id: videoId,
    duration: duration,
    progress: progress,
    category: 'video',
  });
};

// Track form submissions
export const trackFormEvent = (formName, action, success = true) => {
  trackEvent('form_submission', {
    form_name: formName,
    action: action, // 'submit', 'abandon', 'error'
    success: success,
    category: 'form',
  });
};

// Track button clicks
export const trackButtonClick = (buttonName, location, value = null) => {
  trackEvent('button_click', {
    button_name: buttonName,
    location: location,
    value: value,
    category: 'interaction',
  });
};

// Track navigation events
export const trackNavigation = (fromPage, toPage, method = 'click') => {
  trackEvent('navigation', {
    from_page: fromPage,
    to_page: toPage,
    method: method, // 'click', 'back', 'forward'
    category: 'navigation',
  });
};

// Track time on page
export const trackTimeOnPage = (page, timeSpent) => {
  trackEvent('time_on_page', {
    page: page,
    time_spent: timeSpent,
    category: 'engagement',
  });
};

// Track scroll depth
export const trackScrollDepth = (depth, page) => {
  trackEvent('scroll_depth', {
    scroll_depth: depth, // percentage (0-100)
    page: page,
    category: 'engagement',
  });
};

// Track outbound clicks
export const trackOutboundClick = (url, linkText) => {
  trackEvent('outbound_click', {
    url: url,
    link_text: linkText,
    category: 'outbound',
  });
};

// Track file downloads
export const trackDownload = (fileName, fileType, fileSize = null) => {
  trackEvent('file_download', {
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize,
    category: 'download',
  });
};

// Initialize analytics (call this in your app)
export const initializeAnalytics = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    // Track initial page view
    trackPageView(window.location.href, document.title);
    
    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        if (scrollPercent % 25 === 0) { // Track at 25%, 50%, 75%, 100%
          trackScrollDepth(scrollPercent, window.location.pathname);
        }
      }
    });

    // Track time on page
    const startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      trackTimeOnPage(window.location.pathname, timeSpent);
    });
  }
};

const analytics = {
  trackEvent,
  trackPageView,
  trackAuthEvent,
  trackPracticeEvent,
  trackTestEvent,
  trackContentEvent,
  trackEcommerceEvent,
  trackSearchEvent,
  trackErrorEvent,
  trackSocialShare,
  trackVideoEvent,
  trackFormEvent,
  trackButtonClick,
  trackNavigation,
  trackTimeOnPage,
  trackScrollDepth,
  trackOutboundClick,
  trackDownload,
  initializeAnalytics,
};

export default analytics;
