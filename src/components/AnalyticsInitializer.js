'use client';

import { useEffect } from 'react';
import { initializeAnalytics } from '@/lib/analytics';

const AnalyticsInitializer = () => {
  useEffect(() => {
    // Initialize analytics when the component mounts
    initializeAnalytics();
  }, []);

  // This component doesn't render anything
  return null;
};

export default AnalyticsInitializer;
