
import { Itinerary, GroundingChunk } from '../types';

/**
 * Normalizes a string for matching by removing special characters, converting to lowercase,
 * and removing extra spaces
 */
function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
}

/**
 * Checks if two strings are similar enough to be considered a match
 */
function isSimilarMatch(str1: string, str2: string): boolean {
    const normalized1 = normalizeString(str1);
    const normalized2 = normalizeString(str2);
    
    // Exact match after normalization
    if (normalized1 === normalized2) return true;
    
    // Check if one contains the other (for partial matches)
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        // Only consider it a match if the shorter string is at least 60% of the longer one
        const minLength = Math.min(normalized1.length, normalized2.length);
        const maxLength = Math.max(normalized1.length, normalized2.length);
        return minLength / maxLength >= 0.6;
    }
    
    return false;
}

/**
 * Finds the best matching Google Maps URI for a given place name
 */
function findMatchingUri(placeName: string, sources: GroundingChunk[]): string | null {
    // Skip generic descriptions that don't represent specific places
    const genericKeywords = ['near', 'around', 'in', 'at', 'explore', 'dinner', 'lunch', 'breakfast', 'depart', 'transit', 'airport'];
    const normalizedPlace = normalizeString(placeName);
    const isGeneric = genericKeywords.some(keyword => normalizedPlace.includes(keyword)) && 
                      normalizedPlace.split(' ').length <= 4;
    
    if (isGeneric) {
        // Don't try to match generic descriptions
        return null;
    }
    
    // First, try exact matches
    for (const source of sources) {
        if (source.maps?.title && isSimilarMatch(placeName, source.maps.title)) {
            return source.maps.uri;
        }
    }
    
    // If no exact match, try partial matches with place name words
    const placeWords = normalizedPlace.split(' ').filter(w => w.length > 2);
    
    if (placeWords.length === 0) {
        return null;
    }
    
    let bestMatch: { source: GroundingChunk; score: number } | null = null;
    
    for (const source of sources) {
        if (source.maps?.title) {
            const sourceTitle = normalizeString(source.maps.title);
            // Count matching words
            const matchingWords = placeWords.filter(word => sourceTitle.includes(word));
            const score = matchingWords.length / placeWords.length;
            
            // Require at least 50% word match
            if (score >= 0.5 && (!bestMatch || score > bestMatch.score)) {
                bestMatch = { source, score };
            }
        }
    }
    
    return bestMatch ? bestMatch.source.maps!.uri : null;
}

/**
 * Generates a Google Maps search URL for a neighborhood/location
 */
function generateNeighborhoodMapsUrl(location: string): string {
    // Clean the location string and create a search URL
    const encodedLocation = encodeURIComponent(location);
    return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
}

/**
 * Finds a neighborhood URI from sources or generates a search URL
 */
function findNeighborhoodUri(location: string, sources: GroundingChunk[]): string {
    // First try to find an exact match in sources (for neighborhoods that were looked up)
    const normalizedLocation = normalizeString(location);
    
    for (const source of sources) {
        if (source.maps?.title) {
            const sourceTitle = normalizeString(source.maps.title);
            // Check if it's a neighborhood match (exact or contains the location)
            if (sourceTitle === normalizedLocation || 
                sourceTitle.includes(normalizedLocation) || 
                normalizedLocation.includes(sourceTitle)) {
                // Check if it's likely a neighborhood (not a specific business)
                const isNeighborhood = !sourceTitle.includes('restaurant') && 
                                      !sourceTitle.includes('hotel') && 
                                      !sourceTitle.includes('cafe') &&
                                      !sourceTitle.includes('store') &&
                                      !sourceTitle.includes('museum');
                if (isNeighborhood) {
                    return source.maps.uri;
                }
            }
        }
    }
    
    // If no match found, generate a search URL
    return generateNeighborhoodMapsUrl(location);
}

/**
 * Matches Google Maps URIs from sources to itinerary items
 * This is now used as a fallback - the model should include URIs directly in the JSON response
 */
export function matchSourcesToItinerary(
    itinerary: Itinerary,
    sources: GroundingChunk[]
): Itinerary {
    // Create a deep copy to avoid mutating the original
    const matchedItinerary: Itinerary = JSON.parse(JSON.stringify(itinerary));
    
    // Match hotels - only if they don't already have a URI
    matchedItinerary.recommendedHotels = matchedItinerary.recommendedHotels.map(hotel => {
        // Only try to match if the model didn't provide a URI
        if (!hotel.googleMapsLink) {
            const uri = findMatchingUri(hotel.name, sources);
            return {
                ...hotel,
                googleMapsLink: uri
            };
        }
        return hotel;
    });
    
    // Match daily itinerary items - only if they don't already have a URI
    matchedItinerary.dailyItinerary = matchedItinerary.dailyItinerary.map(day => ({
        ...day,
        items: day.items.map(item => {
            // Only try to match if the model didn't provide a URI
            const activityUri = item.googleMapsLink || findMatchingUri(item.activity, sources);
            
            // Get neighborhood URI for the location field
            const locationUri = findNeighborhoodUri(item.location, sources);
            
            let hiddenGem = item.hiddenGem;
            if (hiddenGem) {
                const hiddenGemObj: any = {
                    ...hiddenGem,
                    googleMapsLink: hiddenGem.googleMapsLink || null,
                };
                
                // Only include locationUri if it exists
                if (hiddenGem.locationUri) {
                    hiddenGemObj.locationUri = hiddenGem.locationUri;
                } else if (!hiddenGem.googleMapsLink) {
                    // Try to find URI if not already set
                    const hiddenGemUri = findMatchingUri(hiddenGem.name, sources);
                    const hiddenGemLocationUri = findNeighborhoodUri(hiddenGem.location, sources);
                    hiddenGemObj.googleMapsLink = hiddenGemUri || null;
                    if (hiddenGemLocationUri) {
                        hiddenGemObj.locationUri = hiddenGemLocationUri;
                    }
                }
                
                hiddenGem = hiddenGemObj;
            }
            
            // Build the return object, only including optional fields if they have values
            const returnItem: any = {
                ...item,
                googleMapsLink: activityUri || null,
            };
            
            // Only include locationUri if it exists
            if (locationUri) {
                returnItem.locationUri = locationUri;
            }
            
            // Only include hiddenGem if it exists
            if (hiddenGem) {
                returnItem.hiddenGem = hiddenGem;
            }
            
            return returnItem;
        })
    }));
    
    return matchedItinerary;
}

