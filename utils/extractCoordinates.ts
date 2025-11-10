/**
 * Extracts coordinates from various Google Maps URI formats
 * Handles: @lat,lng, ?q=lat,lng, ?ll=lat,lng, center=lat,lng, CID, place_id, and search queries
 */

declare global {
  interface Window {
    google: {
      maps: {
        Geocoder: new () => {
          geocode: (request: { address?: string; placeId?: string }, callback: (results: any, status: string) => void) => void;
        };
      };
    };
  }
}

export interface CoordinateResult {
  coordinates: { lat: number; lng: number } | null;
  needsGeocoding: boolean;
  geocodingQuery?: string; // The query to use for geocoding (for CID or search queries)
  placeId?: string; // If a place_id was found
  cid?: string; // If a CID was found
}

/**
 * Extracts coordinates directly from URL patterns that contain lat/lng
 */
export function extractCoordinatesFromUrl(url: string): CoordinateResult {
  if (!url || typeof url !== 'string') {
    return { coordinates: null, needsGeocoding: false };
  }

  try {
    // Format 1: https://www.google.com/maps/place/.../@lat,lng or @lat,lng,zoom
    // Matches: @40.7128,-74.0060 or @40.7128,-74.0060,15z
    const coordsMatch = url.match(/@([-\d.]+),([-\d.]+)(?:,(\d+))?/);
    if (coordsMatch) {
      const lat = parseFloat(coordsMatch[1]);
      const lng = parseFloat(coordsMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { coordinates: { lat, lng }, needsGeocoding: false };
      }
    }

    // Format 2: https://maps.google.com/?q=lat,lng (numeric coordinates)
    const qNumericMatch = url.match(/[?&]q=([-\d.]+),([-\d.]+)(?:&|$)/);
    if (qNumericMatch) {
      const lat = parseFloat(qNumericMatch[1]);
      const lng = parseFloat(qNumericMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { coordinates: { lat, lng }, needsGeocoding: false };
      }
    }

    // Format 3: https://maps.google.com/?ll=lat,lng
    const llMatch = url.match(/[?&]ll=([-\d.]+),([-\d.]+)/);
    if (llMatch) {
      const lat = parseFloat(llMatch[1]);
      const lng = parseFloat(llMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { coordinates: { lat, lng }, needsGeocoding: false };
      }
    }

    // Format 4: https://maps.google.com/maps?center=lat,lng
    const centerMatch = url.match(/center=([-\d.]+),([-\d.]+)/);
    if (centerMatch) {
      const lat = parseFloat(centerMatch[1]);
      const lng = parseFloat(centerMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { coordinates: { lat, lng }, needsGeocoding: false };
      }
    }

    // Format 5: CID (Customer ID) - https://www.google.com/maps?cid=458080891732897462
    // These need geocoding via Places API
    const cidMatch = url.match(/[?&]cid=([^&]+)/);
    if (cidMatch) {
      const cid = decodeURIComponent(cidMatch[1]);
      return {
        coordinates: null,
        needsGeocoding: true,
        cid,
        // For geocoding, we'll need to use Places API with CID
        geocodingQuery: `cid:${cid}`
      };
    }

    // Format 6: Place ID - https://maps.google.com/?place_id=ChIJ...
    const placeIdMatch = url.match(/place_id=([^&]+)/);
    if (placeIdMatch) {
      const placeId = decodeURIComponent(placeIdMatch[1]);
      return {
        coordinates: null,
        needsGeocoding: true,
        placeId,
        geocodingQuery: placeId
      };
    }

    // Format 7: Search query - https://www.google.com/maps/search/?api=1&query=Upper%20West%20Side
    const searchQueryMatch = url.match(/[?&]query=([^&]+)/);
    if (searchQueryMatch) {
      const query = decodeURIComponent(searchQueryMatch[1]);
      return {
        coordinates: null,
        needsGeocoding: true,
        geocodingQuery: query
      };
    }

    // Format 8: /place/... URLs that might have coordinates in the path
    const placePathMatch = url.match(/\/place\/[^/@]+@([-\d.]+),([-\d.]+)/);
    if (placePathMatch) {
      const lat = parseFloat(placePathMatch[1]);
      const lng = parseFloat(placePathMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { coordinates: { lat, lng }, needsGeocoding: false };
      }
    }

  } catch (e) {
    console.warn('Error extracting coordinates from URL:', url, e);
  }

  return { coordinates: null, needsGeocoding: false };
}

/**
 * Geocodes a query (place name, CID, or place_id) using Google Maps JavaScript API Geocoder
 * Returns coordinates if successful. This avoids CORS issues by using the JavaScript API.
 * Automatically loads the Google Maps API if not already loaded.
 */
export async function geocodeQuery(query: string, placeName?: string): Promise<{ lat: number; lng: number } | null> {
  // Load Google Maps API if not already loaded
  try {
    const { loadGoogleMapsAPI } = await import('./loadGoogleMapsAPI');
    await loadGoogleMapsAPI();
  } catch (error) {
    console.warn('Failed to load Google Maps API:', error);
    return null;
  }

  // Check if Google Maps JavaScript API is loaded
  if (typeof window === 'undefined' || !window.google || !window.google.maps) {
    console.warn('Google Maps JavaScript API not loaded. Cannot geocode:', query);
    return null;
  }

  try {
    const geocoder = new window.google.maps.Geocoder();
    
    // For CID format, geocode by place name (CID requires Places API which has CORS restrictions)
    if (query.startsWith('cid:')) {
      const nameToGeocode = placeName || query.replace('cid:', '');
      console.log('Geocoding CID by name:', nameToGeocode);
      
      return new Promise((resolve) => {
        geocoder.geocode({ address: nameToGeocode }, (results: any, status: string) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            console.log('✅ Successfully geocoded CID:', nameToGeocode, 'to', location.lat(), location.lng());
            resolve({ lat: location.lat(), lng: location.lng() });
          } else {
            console.warn('❌ Geocoding failed for CID:', nameToGeocode, 'Status:', status);
            resolve(null);
          }
        });
      });
    }
    
    // For place_id format
    if (query.match(/^ChIJ/)) {
      return new Promise((resolve) => {
        geocoder.geocode({ placeId: query }, (results: any, status: string) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            console.log('✅ Successfully geocoded place_id:', query, 'to', location.lat(), location.lng());
            resolve({ lat: location.lat(), lng: location.lng() });
          } else {
            console.warn('❌ Geocoding failed for place_id:', query, 'Status:', status);
            resolve(null);
          }
        });
      });
    }
    
    // For regular address/query strings
    return new Promise((resolve) => {
      geocoder.geocode({ address: query }, (results: any, status: string) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          console.log('✅ Successfully geocoded query:', query, 'to', location.lat(), location.lng());
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          console.warn('❌ Geocoding failed for query:', query, 'Status:', status);
          resolve(null);
        }
      });
    });
  } catch (e) {
    console.warn('Error geocoding query:', query, e);
    return null;
  }
}

/**
 * Extracts coordinates from URL, with geocoding fallback if needed
 * This is the main function to use - it handles all cases including geocoding
 * @param url - The Google Maps URL
 * @param placeName - Optional place name to use for geocoding (useful for CID URLs)
 */
export async function getCoordinatesFromUrl(
  url: string,
  placeName?: string
): Promise<{ lat: number; lng: number } | null> {
  const result = extractCoordinatesFromUrl(url);

  // If we have coordinates directly, return them
  if (result.coordinates) {
    return result.coordinates;
  }

  // If we need geocoding and have a query, geocode it
  if (result.needsGeocoding && result.geocodingQuery) {
    return await geocodeQuery(result.geocodingQuery, placeName);
  }

  return null;
}

