import { loadGoogleMapsAPI } from './loadGoogleMapsAPI';

declare global {
  interface Window {
    google: {
      maps: {
        LatLng: new (lat: number, lng: number) => any;
        places: {
          PlacesService: new (element: HTMLElement) => {
            textSearch: (request: any, callback: (results: any, status: string) => void) => void;
            getDetails: (request: any, callback: (place: any, status: string) => void) => void;
          };
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
            [key: string]: string;
          };
        };
      };
    };
  }
}

/**
 * Gets place ID from a Google Maps URL (CID, place_id, coordinates, or by searching)
 */
async function getPlaceIdFromUrl(url: string, placeName?: string): Promise<string | null> {
  // Try to extract place_id directly from URL
  const placeIdMatch = url.match(/place_id=([^&]+)/);
  if (placeIdMatch) {
    return decodeURIComponent(placeIdMatch[1]);
  }

  // Try to extract coordinates and find nearby place
  const coordsMatch = url.match(/@([-\d.]+),([-\d.]+)/);
  if (coordsMatch && placeName) {
    const lat = parseFloat(coordsMatch[1]);
    const lng = parseFloat(coordsMatch[2]);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      try {
        await loadGoogleMapsAPI();
        
        if (typeof window === 'undefined' || !window.google || !window.google.maps) {
          return null;
        }

        const service = new window.google.maps.places.PlacesService(document.createElement('div'));
        
        return new Promise((resolve) => {
          // Use nearby search with the place name
          const request = {
            query: placeName,
            location: new window.google.maps.LatLng(lat, lng),
            radius: 100, // Search within 100 meters
            fields: ['place_id', 'name', 'photos'],
          };

          service.textSearch(request, (results: any, status: string) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
              // Find the best match (exact name match preferred)
              const exactMatch = results.find((r: any) => 
                r.name.toLowerCase() === placeName.toLowerCase()
              );
              const match = exactMatch || results[0];
              resolve(match.place_id || null);
            } else {
              resolve(null);
            }
          });
        });
      } catch (e) {
        console.warn('Error finding place ID from coordinates:', e);
        return null;
      }
    }
  }

  // For CID URLs, we need to find the place using Places API
  const cidMatch = url.match(/[?&]cid=([^&]+)/);
  if (cidMatch && placeName) {
    try {
      await loadGoogleMapsAPI();
      
      if (typeof window === 'undefined' || !window.google || !window.google.maps) {
        return null;
      }

      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      
      return new Promise((resolve) => {
        const request = {
          query: placeName,
          fields: ['place_id', 'name', 'photos'],
        };

        service.textSearch(request, (results: any, status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            // Find the best match (exact name match preferred)
            const exactMatch = results.find((r: any) => 
              r.name.toLowerCase() === placeName.toLowerCase()
            );
            const match = exactMatch || results[0];
            resolve(match.place_id || null);
          } else {
            resolve(null);
          }
        });
      });
    } catch (e) {
      console.warn('Error finding place ID for CID:', e);
      return null;
    }
  }

  // For search query URLs, try to find place by name
  const searchQueryMatch = url.match(/[?&]query=([^&]+)/);
  if (searchQueryMatch && placeName) {
    try {
      await loadGoogleMapsAPI();
      
      if (typeof window === 'undefined' || !window.google || !window.google.maps) {
        return null;
      }

      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      
      return new Promise((resolve) => {
        const request = {
          query: placeName,
          fields: ['place_id', 'name', 'photos'],
        };

        service.textSearch(request, (results: any, status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            const exactMatch = results.find((r: any) => 
              r.name.toLowerCase() === placeName.toLowerCase()
            );
            const match = exactMatch || results[0];
            resolve(match.place_id || null);
          } else {
            resolve(null);
          }
        });
      });
    } catch (e) {
      console.warn('Error finding place ID for search query:', e);
      return null;
    }
  }

  return null;
}

/**
 * Gets place photos from Google Places API
 * Returns the best photo URL for a place
 */
export async function getPlacePhoto(
  url: string,
  placeName?: string
): Promise<string | null> {
  try {
    await loadGoogleMapsAPI();
    
    if (typeof window === 'undefined' || !window.google || !window.google.maps) {
      return null;
    }

    // Get place ID
    const placeId = await getPlaceIdFromUrl(url, placeName);
    if (!placeId) {
      return null;
    }

    // Get place details with photos
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    
    return new Promise((resolve) => {
      const request = {
        placeId,
        fields: ['photos', 'name'],
      };

      service.getDetails(request, (place: any, status: string) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place && place.photos && place.photos.length > 0) {
          // Get the first (usually best) photo
          const photo = place.photos[0];
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          
          if (apiKey && photo.getUrl) {
            // Use getUrl method which handles the photo reference
            const photoUrl = photo.getUrl({
              maxWidth: 800,
              maxHeight: 600,
            });
            resolve(photoUrl);
          } else if (apiKey && photo.photo_reference) {
            // Fallback: construct URL manually
            const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`;
            resolve(photoUrl);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  } catch (e) {
    console.warn('Error getting place photo:', e);
    return null;
  }
}

