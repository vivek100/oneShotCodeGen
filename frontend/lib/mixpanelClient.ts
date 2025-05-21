import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
const CLOUD_MODE = process.env.NEXT_PUBLIC_CLOUD_MODE === 'true';

// Helper to check if tracking should be enabled
const shouldTrack = () => {
  // Only track when in cloud mode and in browser environment
  return CLOUD_MODE && typeof window !== 'undefined';
};

export const initMixpanel = () => {
  if (!shouldTrack()) {
    console.info('Mixpanel tracking disabled. Running in open source mode.');
    return;
  }

  if (!MIXPANEL_TOKEN) {
    console.warn('Mixpanel token is missing! Check your .env file.');
    return;
  }

  mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV === 'development',
    persistence: "localStorage",
    autocapture: {
      pageview: "full-url",
      click: true,
      input: true,
      scroll: true,
      submit: true,
      capture_text_content: false,
    }
  });
};

export const trackPageView = (url: string) => {
  if (!shouldTrack()) return;
  
  mixpanel.track("$mp_web_page_view", {
    url,
    timestamp: new Date().toISOString(),
  });
};

export const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
  if (!shouldTrack()) return;
  
  mixpanel.identify(userId);
  
  if (userProperties) {
    mixpanel.people.set(userProperties);
  }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (!shouldTrack()) return;
  
  mixpanel.track(eventName, {
    timestamp: new Date().toISOString(),
    ...properties,
  });
};

// Special tracking for chat messages
export const trackChatMessage = (message: string, projectId: string) => {
  if (!shouldTrack()) return;
  
  mixpanel.track("Chat Message Sent", {
    projectId,
    messageLength: message.length,
    timestamp: new Date().toISOString(),
  });
};

// Track errors
export const trackError = (errorMessage: string, errorDetails?: Record<string, any>) => {
  if (!shouldTrack()) return;
  
  mixpanel.track("Error", {
    errorMessage,
    ...errorDetails,
    timestamp: new Date().toISOString(),
  });
};

// Is tracking enabled
export const isTrackingEnabled = shouldTrack;

// Get user-friendly tracking status
export const getTrackingStatus = () => {
  if (!CLOUD_MODE) {
    return {
      enabled: false,
      message: "Analytics tracking is disabled (open source mode)",
      mode: "open-source"
    };
  }
  
  if (!MIXPANEL_TOKEN) {
    return {
      enabled: false,
      message: "Analytics tracking is disabled (missing API token)",
      mode: "cloud-no-token"
    };
  }
  
  return {
    enabled: true,
    message: "Analytics tracking is enabled (cloud mode)",
    mode: "cloud"
  };
};

// Export mixpanel to use it directly in components if needed
export { mixpanel }; 