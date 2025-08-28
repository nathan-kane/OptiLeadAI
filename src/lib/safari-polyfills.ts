// Safari/iOS compatibility polyfills
// This file addresses common Safari compatibility issues

// Fix for Safari's handling of dynamic imports
if (typeof window !== 'undefined') {
  // Polyfill for Safari's incomplete Promise support
  if (!window.Promise.allSettled) {
    window.Promise.allSettled = function(promises: Promise<any>[]) {
      return Promise.all(
        promises.map((promise: Promise<any>) =>
          Promise.resolve(promise)
            .then(value => ({ status: 'fulfilled' as const, value }))
            .catch(reason => ({ status: 'rejected' as const, reason }))
        )
      );
    };
  }

  // Fix for Safari's localStorage issues in private mode
  try {
    const testKey = '__safari_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
  } catch (e) {
    // Create a fallback storage for Safari private mode
    const fallbackStorage: { [key: string]: string } = {};
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => fallbackStorage[key] || null,
        setItem: (key: string, value: string) => { fallbackStorage[key] = value; },
        removeItem: (key: string) => { delete fallbackStorage[key]; },
        clear: () => { Object.keys(fallbackStorage).forEach(key => delete fallbackStorage[key]); },
        get length() { return Object.keys(fallbackStorage).length; },
        key: (index: number) => Object.keys(fallbackStorage)[index] || null
      },
      writable: false
    });
  }

  // Fix for Safari's fetch issues with certain headers
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    // Ensure headers are properly formatted for Safari
    if (init && init.headers) {
      const headers = new Headers(init.headers);
      init.headers = headers;
    }
    return originalFetch.call(this, input, init);
  };
}

export {};
