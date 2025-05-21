'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initMixpanel, trackPageView, identifyUser, isTrackingEnabled } from '@/lib/mixpanelClient';
import { useAuth } from '@/contexts/AuthContext';

// Create a separate component for tracking that uses searchParams
function MixpanelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [initialized, setInitialized] = useState(false);
  const { user } = useAuth();
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  // Check if tracking is enabled (cloud mode)
  useEffect(() => {
    setTrackingEnabled(isTrackingEnabled());
  }, []);

  // Initialize Mixpanel only in cloud mode
  useEffect(() => {
    if (!initialized && trackingEnabled) {
      initMixpanel();
      setInitialized(true);
    }
  }, [initialized, trackingEnabled]);

  // Track page views
  useEffect(() => {
    if (initialized && trackingEnabled) {
      // Combine pathname and search params to get full URL
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      trackPageView(url);
    }
  }, [pathname, searchParams, initialized, trackingEnabled]);

  // Identify user when logged in
  useEffect(() => {
    if (initialized && trackingEnabled && user) {
      // Safe access of user properties with fallbacks
      identifyUser(user.id, {
        // Use optional chaining and type-safe property access
        $email: typeof user.email === 'string' ? user.email : '',
        $created: new Date().toISOString(), // Default to current time if no creation date
      });
    }
  }, [user, initialized, trackingEnabled]);

  return null;
}

// Main provider component with Suspense boundary
export default function MixpanelProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <MixpanelTracker />
      </Suspense>
      {children}
    </>
  );
} 