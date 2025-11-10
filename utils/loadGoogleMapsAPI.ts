/**
 * Utility to load Google Maps JavaScript API on demand
 * Returns a promise that resolves when the API is ready
 */

let loadPromise: Promise<void> | null = null;
let isLoaded = false;

/**
 * Checks if Google Maps API is currently loaded
 */
function checkIfLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.google && window.google.maps);
}

/**
 * Loads Google Maps JavaScript API if not already loaded
 * Returns a promise that resolves when the API is ready
 */
export function loadGoogleMapsAPI(): Promise<void> {
  // If already loaded, return immediately
  if (checkIfLoaded()) {
    isLoaded = true;
    return Promise.resolve();
  }

  // If already loading, return the existing promise
  if (loadPromise) {
    return loadPromise;
  }

  // Check if script tag already exists
  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]') as HTMLScriptElement;
  if (existingScript) {
    loadPromise = new Promise((resolve, reject) => {
      // Check if already loaded
      if (checkIfLoaded()) {
        isLoaded = true;
        resolve();
        return;
      }

      // Wait for the script to load
      const checkInterval = setInterval(() => {
        if (checkIfLoaded()) {
          clearInterval(checkInterval);
          isLoaded = true;
          resolve();
        }
      }, 100);

      // Also listen for load event
      existingScript.addEventListener('load', () => {
        clearInterval(checkInterval);
        isLoaded = true;
        resolve();
      });

      existingScript.addEventListener('error', () => {
        clearInterval(checkInterval);
        loadPromise = null;
        reject(new Error('Failed to load Google Maps script'));
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!checkIfLoaded()) {
          loadPromise = null;
          reject(new Error('Google Maps API loading timeout'));
        }
      }, 10000);
    });
    return loadPromise;
  }

  // Load the script
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key not found. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file'));
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Double check it's actually loaded
      if (checkIfLoaded()) {
        isLoaded = true;
        resolve();
      } else {
        // Wait a bit more
        setTimeout(() => {
          if (checkIfLoaded()) {
            isLoaded = true;
            resolve();
          } else {
            loadPromise = null;
            reject(new Error('Google Maps API loaded but not available'));
          }
        }, 500);
      }
    };
    
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps script'));
    };
    
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Checks if Google Maps API is loaded
 */
export function isGoogleMapsAPILoaded(): boolean {
  return checkIfLoaded();
}

