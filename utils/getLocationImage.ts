import { GroundingChunk } from '../types';
import { extractCoordinatesFromUrl, getCoordinatesFromUrl } from './extractCoordinates';
import { getPlacePhoto } from './getPlacePhoto';

/**
 * Extracts place ID or coordinates from a Google Maps URI
 * Now uses the comprehensive coordinate extraction utility
 * @param url - The Google Maps URL
 * @param activityName - The activity/place name to use for geocoding (useful for CID URLs)
 */
async function extractPlaceInfo(url: string, activityName?: string): Promise<{ placeId?: string; coordinates?: { lat: number; lng: number } } | null> {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Try to extract place_id from URL
    const placeIdMatch = url.match(/place_id=([^&]+)/);
    if (placeIdMatch) {
      return { placeId: decodeURIComponent(placeIdMatch[1]) };
    }

    // Use the comprehensive coordinate extraction
    const result = extractCoordinatesFromUrl(url);
    
    // If we have coordinates directly, return them
    if (result.coordinates) {
      return { coordinates: result.coordinates };
    }

    // If we need geocoding, try to geocode
    // For CID URLs, use the activity name for better geocoding results
    if (result.needsGeocoding && result.geocodingQuery) {
      // Prefer activity name, then try to extract from URL
      let placeName: string | undefined = activityName;
      
      if (!placeName && url.includes('/place/')) {
        const placeMatch = url.match(/\/place\/([^/@?]+)/);
        if (placeMatch) {
          placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
        }
      }
      
      const coordinates = await getCoordinatesFromUrl(url, placeName);
      if (coordinates) {
        return { coordinates };
      }
    }
  } catch (e) {
    console.warn('Error extracting place info from URL:', url, e);
  }

  return null;
}

/**
 * Generates a Google Maps Static API image URL
 */
function generateStaticMapImage(placeInfo: { placeId?: string; coordinates?: { lat: number; lng: number } }): string | null {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('Google Maps API key not found, cannot generate static map images');
    return null;
  }

  try {
    if (placeInfo.placeId) {
      // Use place_id for Static Maps API
      return `https://maps.googleapis.com/maps/api/staticmap?center=place_id:${placeInfo.placeId}&zoom=15&size=800x600&maptype=roadmap&markers=color:red%7Cplace_id:${placeInfo.placeId}&key=${apiKey}`;
    } else if (placeInfo.coordinates) {
      // Use coordinates for Static Maps API
      const { lat, lng } = placeInfo.coordinates;
      return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=800x600&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${apiKey}`;
    }
  } catch (e) {
    console.warn('Error generating static map image:', e);
  }

  return null;
}

/**
 * Finds matching source for an activity name
 */
function findMatchingSource(activityName: string, sources: GroundingChunk[]): GroundingChunk | null {
  const normalizedActivity = activityName.toLowerCase().trim();
  
  for (const source of sources) {
    // Check maps title
    if (source.maps?.title) {
      const normalizedTitle = source.maps.title.toLowerCase().trim();
      // Check for exact match or if activity contains title or vice versa
      if (normalizedActivity === normalizedTitle || 
          normalizedActivity.includes(normalizedTitle) || 
          normalizedTitle.includes(normalizedActivity)) {
        return source;
      }
    }
    
    // Check web title as fallback
    if (source.web?.title) {
      const normalizedTitle = source.web.title.toLowerCase().trim();
      if (normalizedActivity === normalizedTitle || 
          normalizedActivity.includes(normalizedTitle) || 
          normalizedTitle.includes(normalizedActivity)) {
        return source;
      }
    }
  }
  
  return null;
}

/**
 * Gets location image from grounding sources or generates from Google Maps URI
 * Now fetches actual place photos from Google Places API instead of static map images
 */
export async function getLocationImage(
  activityName: string,
  googleMapsLink: string | null,
  sources: GroundingChunk[]
): Promise<string | null> {
  // First, try to find a matching source
  const matchingSource = findMatchingSource(activityName, sources);
  
  // Prefer maps source over web source
  const sourceUri = matchingSource?.maps?.uri || matchingSource?.web?.uri || googleMapsLink;
  
  // Try to get actual place photo from Google Places API
  if (sourceUri) {
    try {
      const photoUrl = await getPlacePhoto(sourceUri, activityName);
      if (photoUrl) {
        return photoUrl;
      }
    } catch (error) {
      console.warn('Error getting place photo from source URI:', error);
    }
  }
  
  // If we have a Google Maps link but no matching source, try to get photo from it
  if (googleMapsLink) {
    try {
      const photoUrl = await getPlacePhoto(googleMapsLink, activityName);
      if (photoUrl) {
        return photoUrl;
      }
    } catch (error) {
      console.warn('Error getting place photo from Google Maps link:', error);
    }
  }
  
  // Fallback: If we can't get a photo, try to get coordinates and generate a static map
  // (This is a last resort - we prefer actual photos)
  if (sourceUri) {
    const placeInfo = await extractPlaceInfo(sourceUri, activityName);
    if (placeInfo) {
      const staticMapUrl = generateStaticMapImage(placeInfo);
      if (staticMapUrl) {
        return staticMapUrl;
      }
    }
  }
  
  if (googleMapsLink) {
    const placeInfo = await extractPlaceInfo(googleMapsLink, activityName);
    if (placeInfo) {
      const staticMapUrl = generateStaticMapImage(placeInfo);
      if (staticMapUrl) {
        return staticMapUrl;
      }
    }
  }
  
  return null;
}

