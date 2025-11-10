import React, { useState, useMemo } from 'react';
import { Itinerary, DailyPlan } from '../types';
import GoogleMapsWithMarkers from './GoogleMapsWithMarkers';

interface TravelMapProps {
  itinerary: Itinerary;
}

interface Location {
  name: string;
  link: string;
  day: string;
  time?: string;
  type: 'hotel' | 'activity' | 'hidden-gem';
  placeId?: string;
  coordinates?: { lat: number; lng: number };
}

const TravelMap: React.FC<TravelMapProps> = ({ itinerary }) => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Extract all locations with Google Maps links from the itinerary
  const locations: Location[] = useMemo(() => {
    const locs: Location[] = [];

    // Add hotels
    itinerary.recommendedHotels.forEach((hotel) => {
      if (hotel.googleMapsLink) {
        // Extract coordinates and place ID from Google Maps URL
        const coordinates = extractCoordinatesFromUrl(hotel.googleMapsLink);
        const placeId = extractPlaceIdFromUrl(hotel.googleMapsLink);
        locs.push({
          name: hotel.name,
          link: hotel.googleMapsLink,
          day: 'Hotels',
          type: 'hotel',
          placeId,
          coordinates: coordinates || undefined,
        });
      }
    });

    // Add activities and hidden gems from daily itinerary
    itinerary.dailyItinerary.forEach((day: DailyPlan) => {
      day.items.forEach((item) => {
        if (item.googleMapsLink) {
          const coordinates = extractCoordinatesFromUrl(item.googleMapsLink);
          const placeId = extractPlaceIdFromUrl(item.googleMapsLink);
          locs.push({
            name: item.activity,
            link: item.googleMapsLink,
            day: day.day,
            time: item.time,
            type: 'activity',
            placeId,
            coordinates: coordinates || undefined,
          });
        }
        if (item.hiddenGem?.googleMapsLink) {
          const coordinates = extractCoordinatesFromUrl(item.hiddenGem.googleMapsLink);
          const placeId = extractPlaceIdFromUrl(item.hiddenGem.googleMapsLink);
          locs.push({
            name: item.hiddenGem.name,
            link: item.hiddenGem.googleMapsLink,
            day: day.day,
            time: item.time,
            type: 'hidden-gem',
            placeId,
            coordinates: coordinates || undefined,
          });
        }
      });
    });

    return locs;
  }, [itinerary]);

  // Extract coordinates from Google Maps URL
  function extractCoordinatesFromUrl(url: string): { lat: number; lng: number } | null {
    try {
      // Format: https://www.google.com/maps/place/.../@lat,lng
      const coordsMatch = url.match(/@([-\d.]+),([-\d.]+)/);
      if (coordsMatch) {
        return {
          lat: parseFloat(coordsMatch[1]),
          lng: parseFloat(coordsMatch[2])
        };
      }
      
      // Format: https://maps.google.com/?q=lat,lng
      const qMatch = url.match(/[?&]q=([-\d.]+),([-\d.]+)/);
      if (qMatch) {
        return {
          lat: parseFloat(qMatch[1]),
          lng: parseFloat(qMatch[2])
        };
      }
    } catch (e) {
      console.warn('Could not extract coordinates from URL:', url);
    }
    return null;
  }

  // Extract place ID from Google Maps URL
  function extractPlaceIdFromUrl(url: string): string | undefined {
    try {
      // Handle different Google Maps URL formats
      // Format 1: https://maps.google.com/?q=place_id:ChIJ...
      const placeIdMatch = url.match(/place_id=([^&]+)/);
      if (placeIdMatch) return placeIdMatch[1];

      // Format 2: Extract coordinates
      const coords = extractCoordinatesFromUrl(url);
      if (coords) {
        return `${coords.lat},${coords.lng}`;
      }

      // Format 3: Extract location name from URL
      const placeMatch = url.match(/\/place\/([^/@]+)/);
      if (placeMatch) {
        return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      }
    } catch (e) {
      console.warn('Could not extract place info from URL:', url);
    }
    return undefined;
  }

  // Calculate center point from all locations
  const getMapCenter = () => {
    const locationsWithCoords = locations.filter(loc => loc.coordinates);
    
    if (locationsWithCoords.length === 0) {
      // Fallback to destination name
      return {
        query: itinerary.tripTitle.split(':')[0] || 
               itinerary.dailyItinerary[0]?.items[0]?.location || 
               itinerary.dailyItinerary[0]?.title || 
               'Unknown Location',
        hasCoords: false
      };
    }
    
    // Calculate average of all coordinates
    const avgLat = locationsWithCoords.reduce((sum, loc) => sum + loc.coordinates!.lat, 0) / locationsWithCoords.length;
    const avgLng = locationsWithCoords.reduce((sum, loc) => sum + loc.coordinates!.lng, 0) / locationsWithCoords.length;
    
    return {
      lat: avgLat,
      lng: avgLng,
      hasCoords: true
    };
  };

  // Create Google Maps URL with all locations
  const getGoogleMapsUrl = () => {
    // Create a URL that opens Google Maps with multiple locations
    // We'll use the first location as the center and add others as waypoints
    if (locations.length === 0) {
      const center = getMapCenter();
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.query)}`;
    }
    
    // Use the first location's link as the base, or create a search with all location names
    const locationNames = locations.map(loc => loc.name).join(', ');
    const destination = itinerary.tripTitle.split(':')[0] || locations[0].name;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationNames)}`;
  };

  // Get map embed URL with all locations (requires Google Maps API key)
  const getMapEmbedUrl = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return null;
    }
    
    const center = getMapCenter();
    
    // If we have coordinates, use them; otherwise use query
    if (center.hasCoords && 'lat' in center) {
      // Use center coordinates and show all locations
      // For multiple markers, we'd need to use the JavaScript API
      // For now, center on the average location
      return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${center.lat},${center.lng}&zoom=12`;
    } else {
      // Fallback to search query
      return `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${encodeURIComponent(center.query)}&zoom=12`;
    }
  };

  if (locations.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">🗺️</div>
        <p className="text-gray-600">Map view coming soon! Click on individual locations to view them on Google Maps.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-3xl md:text-4xl">🗺️</span>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800">All Trip Locations</h3>
            <p className="text-xs md:text-sm text-gray-600">
              {locations.length} places to explore
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              viewMode === 'map'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🗺️ Map
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            📋 List
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="space-y-4">
          {/* Map Legend */}
          <div className="bg-white rounded-lg p-3 border border-gray-200 flex flex-wrap items-center gap-4 text-sm">
            <span className="font-semibold text-gray-700">Map Legend:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
              <span className="text-gray-600">Hotels</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-teal-500 border-2 border-white"></div>
              <span className="text-gray-600">Activities</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-white"></div>
              <span className="text-gray-600">Hidden Gems</span>
            </div>
            <span className="text-gray-500 text-xs ml-auto">💡 Click markers for details</span>
          </div>

          {/* Interactive Map with Custom Markers */}
          <div className="bg-white rounded-lg overflow-hidden shadow-md">
            <GoogleMapsWithMarkers itinerary={itinerary} />
          </div>
          
          {/* Link to open in Google Maps with all locations */}
          <a
            href={getGoogleMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
          >
            <span>🗺️</span>
            <span>Open All {locations.length} Locations in Google Maps</span>
            <span>→</span>
          </a>
          
          {/* Quick access to individual locations */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-semibold">📍 Quick Access:</span> Click any location below to view it on Google Maps
            </p>
            <div className="flex flex-wrap gap-2">
              {locations.slice(0, 6).map((location, index) => (
                <a
                  key={index}
                  href={location.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
                >
                  {location.type === 'hotel' ? '🏨' : location.type === 'hidden-gem' ? '💎' : '📍'} {location.name.length > 25 ? location.name.substring(0, 25) + '...' : location.name}
                </a>
              ))}
              {locations.length > 6 && (
                <span className="text-xs text-gray-500 px-3 py-1.5 self-center">
                  +{locations.length - 6} more
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-1">
                <span>🏨</span>
                <span className="text-gray-600">{locations.filter(l => l.type === 'hotel').length} Hotels</span>
              </div>
              <div className="flex items-center gap-1">
                <span>📍</span>
                <span className="text-gray-600">{locations.filter(l => l.type === 'activity').length} Activities</span>
              </div>
              <div className="flex items-center gap-1">
                <span>💎</span>
                <span className="text-gray-600">{locations.filter(l => l.type === 'hidden-gem').length} Hidden Gems</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
          {locations.map((location, index) => (
            <a
              key={index}
              href={location.link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-lg p-3 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border border-gray-200 hover:border-blue-400 group"
            >
              <div className="flex items-start gap-2">
                <div className="text-2xl flex-shrink-0">
                  {location.type === 'hotel' ? '🏨' : location.type === 'hidden-gem' ? '💎' : '📍'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 text-xs md:text-sm mb-1 break-words group-hover:text-blue-600 transition-colors">
                    {location.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{location.day}</span>
                    {location.time && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span>🕐</span>
                          {location.time}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-blue-400 group-hover:text-blue-600 text-sm flex-shrink-0">→</div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default TravelMap;
