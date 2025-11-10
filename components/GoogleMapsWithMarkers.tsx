import React, { useEffect, useRef, useState } from 'react';
import { Itinerary, DailyPlan } from '../types';

interface GoogleMapsWithMarkersProps {
  itinerary: Itinerary;
}

interface Location {
  name: string;
  link: string;
  day: string;
  time?: string;
  type: 'hotel' | 'activity' | 'hidden-gem';
  coordinates?: { lat: number; lng: number };
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const GoogleMapsWithMarkers: React.FC<GoogleMapsWithMarkersProps> = ({ itinerary }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Extract all locations with coordinates
  const locations: Location[] = React.useMemo(() => {
    const locs: Location[] = [];

    // Extract coordinates from Google Maps URL
    const extractCoordinates = (url: string): { lat: number; lng: number } | null => {
      try {
        if (!url || typeof url !== 'string') {
          return null;
        }

        // Format 1: https://www.google.com/maps/place/.../@lat,lng or @lat,lng,zoom
        // Matches: @40.7128,-74.0060 or @40.7128,-74.0060,15z
        const coordsMatch = url.match(/@([-\d.]+),([-\d.]+)(?:,(\d+))?/);
        if (coordsMatch) {
          const lat = parseFloat(coordsMatch[1]);
          const lng = parseFloat(coordsMatch[2]);
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lat, lng };
          }
        }

        // Format 2: https://maps.google.com/?q=lat,lng
        const qMatch = url.match(/[?&]q=([-\d.]+),([-\d.]+)/);
        if (qMatch) {
          const lat = parseFloat(qMatch[1]);
          const lng = parseFloat(qMatch[2]);
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lat, lng };
          }
        }

        // Format 3: https://maps.google.com/?ll=lat,lng
        const llMatch = url.match(/[?&]ll=([-\d.]+),([-\d.]+)/);
        if (llMatch) {
          const lat = parseFloat(llMatch[1]);
          const lng = parseFloat(llMatch[2]);
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lat, lng };
          }
        }

        // Format 4: https://maps.google.com/maps?center=lat,lng
        const centerMatch = url.match(/center=([-\d.]+),([-\d.]+)/);
        if (centerMatch) {
          const lat = parseFloat(centerMatch[1]);
          const lng = parseFloat(centerMatch[2]);
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lat, lng };
          }
        }

        // Format 5: CID (Customer ID) - https://www.google.com/maps?cid=458080891732897462
        const cidMatch = url.match(/[?&]cid=([^&]+)/);
        if (cidMatch) {
          console.log('Found CID in URL (needs geocoding):', url);
          // Will be handled by geocoding fallback
          return null; // Return null to trigger geocoding
        }

        // Format 6: Place ID - we'll need to geocode this
        const placeIdMatch = url.match(/place_id=([^&]+)/);
        if (placeIdMatch) {
          console.log('Found place_id in URL (needs geocoding):', url);
          // Will be handled by geocoding fallback
          return null; // Return null to trigger geocoding
        }
      } catch (e) {
        console.warn('Could not extract coordinates from URL:', url, e);
      }
      return null;
    };

    // Add hotels
    itinerary.recommendedHotels.forEach((hotel) => {
      if (hotel.googleMapsLink) {
        const coordinates = extractCoordinates(hotel.googleMapsLink);
        if (coordinates) {
          locs.push({
            name: hotel.name,
            link: hotel.googleMapsLink,
            day: 'Hotels',
            type: 'hotel',
            coordinates,
          });
        } else {
          console.log('Could not extract coordinates for hotel:', hotel.name, hotel.googleMapsLink);
        }
      }
    });

    // Add activities and hidden gems
    itinerary.dailyItinerary.forEach((day: DailyPlan) => {
      day.items.forEach((item) => {
        if (item.googleMapsLink) {
          const coordinates = extractCoordinates(item.googleMapsLink);
          if (coordinates) {
            locs.push({
              name: item.activity,
              link: item.googleMapsLink,
              day: day.day,
              time: item.time,
              type: 'activity',
              coordinates,
            });
          } else {
            console.log('Could not extract coordinates for activity:', item.activity, item.googleMapsLink);
          }
        }
        if (item.hiddenGem?.googleMapsLink) {
          const coordinates = extractCoordinates(item.hiddenGem.googleMapsLink);
          if (coordinates) {
            locs.push({
              name: item.hiddenGem.name,
              link: item.hiddenGem.googleMapsLink,
              day: day.day,
              time: item.time,
              type: 'hidden-gem',
              coordinates,
            });
          } else {
            console.log('Could not extract coordinates for hidden gem:', item.hiddenGem.name, item.hiddenGem.googleMapsLink);
          }
        }
      });
    });

    // Debug: Log how many locations we found
    const totalPlaces = itinerary.recommendedHotels.length + itinerary.dailyItinerary.reduce((sum, day) => sum + day.items.length, 0);
    console.log(`📍 Found ${locs.length} locations with coordinates out of ${totalPlaces} total places`);
    
    if (locs.length === 0 && totalPlaces > 0) {
      console.log('⚠️ No coordinates found - geocoding will be triggered when map loads');
    }

    return locs;
  }, [itinerary]);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError('Google Maps API key not found. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file');
      return;
    }

    // Check if script is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError('Failed to load Google Maps script');
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      const scriptToRemove = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (scriptToRemove) {
        // Don't remove it as other components might use it
      }
    };
  }, []);

  // Geocode place names/place IDs/CIDs to get coordinates (fallback)
  const geocodeLocation = async (url: string, name: string): Promise<{ lat: number; lng: number } | null> => {
    if (!window.google || !window.google.maps) {
      console.warn('Google Maps API not loaded yet');
      return null;
    }

    try {
      const geocoder = new window.google.maps.Geocoder();
      
      // If URL has a CID (Customer ID), we need to use Places API or geocode by name
      const cidMatch = url.match(/[?&]cid=([^&]+)/);
      if (cidMatch) {
        // For CID, we'll geocode using the place name since CID requires Places API
        // which needs additional setup. Geocoding by name should work for most places.
        console.log('Geocoding by name for CID:', name, 'URL:', url);
        return new Promise((resolve) => {
          geocoder.geocode({ address: name }, (results: any, status: string) => {
            if (status === 'OK' && results && results[0]) {
              const location = results[0].geometry.location;
              console.log('✅ Successfully geocoded:', name, 'to', location.lat(), location.lng());
              resolve({ lat: location.lat(), lng: location.lng() });
            } else {
              console.warn('❌ Geocoding failed for CID:', name, 'Status:', status, 'URL:', url);
              // Try with location name + "New York" for better results
              if (status !== 'OK') {
                console.log('Retrying geocoding with location context...');
                geocoder.geocode({ address: `${name}, New York, NY` }, (retryResults: any, retryStatus: string) => {
                  if (retryStatus === 'OK' && retryResults && retryResults[0]) {
                    const retryLocation = retryResults[0].geometry.location;
                    console.log('✅ Successfully geocoded (with context):', name, 'to', retryLocation.lat(), retryLocation.lng());
                    resolve({ lat: retryLocation.lat(), lng: retryLocation.lng() });
                  } else {
                    console.warn('❌ Retry geocoding also failed:', name, 'Status:', retryStatus);
                    resolve(null);
                  }
                });
              } else {
                resolve(null);
              }
            }
          });
        });
      }
      
      // If URL has a place ID, use it
      const placeIdMatch = url.match(/place_id=([^&]+)/);
      if (placeIdMatch) {
        return new Promise((resolve) => {
          geocoder.geocode({ placeId: placeIdMatch[1] }, (results: any, status: string) => {
            if (status === 'OK' && results && results[0]) {
              const location = results[0].geometry.location;
              console.log('Successfully geocoded place_id:', placeIdMatch[1], 'to', location.lat(), location.lng());
              resolve({ lat: location.lat(), lng: location.lng() });
            } else {
              console.warn('Geocoding failed for place_id:', placeIdMatch[1], 'Status:', status);
              resolve(null);
            }
          });
        });
      }
      
      // Otherwise, geocode by address/name
      return new Promise((resolve) => {
        geocoder.geocode({ address: name }, (results: any, status: string) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            console.log('Successfully geocoded:', name, 'to', location.lat(), location.lng());
            resolve({ lat: location.lat(), lng: location.lng() });
          } else {
            console.warn('Geocoding failed for:', name, 'Status:', status);
            resolve(null);
          }
        });
      });
    } catch (e) {
      console.warn('Geocoding failed for:', name, e);
      return null;
    }
  };

  // Initialize map and markers
  useEffect(() => {
    console.log('useEffect triggered - isLoaded:', isLoaded, 'locations.length:', locations.length, 'isGeocoding:', isGeocoding, 'window.google:', !!window.google);
    
    if (!isLoaded) {
      console.log('Waiting for Google Maps API to load...');
      return;
    }
    
    if (!mapRef.current) {
      console.log('Map ref not ready yet...');
      return;
    }
    
    if (!window.google || !window.google.maps) {
      console.log('Google Maps API not available yet...');
      return;
    }

    // If no locations with coordinates, try to geocode them
    if (locations.length === 0 && !isGeocoding) {
      console.log('✅ No locations with coordinates found, starting geocoding...');
      setIsGeocoding(true);
      const geocodeLocations = async () => {
        const geocodedLocs: Location[] = [];
        
        // Try to geocode hotels
        console.log(`Geocoding ${itinerary.recommendedHotels.length} hotels...`);
        for (const hotel of itinerary.recommendedHotels) {
          if (hotel.googleMapsLink && hotel.name) {
            const coords = await geocodeLocation(hotel.googleMapsLink, hotel.name);
            if (coords) {
              geocodedLocs.push({
                name: hotel.name,
                link: hotel.googleMapsLink,
                day: 'Hotels',
                type: 'hotel',
                coordinates: coords,
              });
            }
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Try to geocode activities
        const totalItems = itinerary.dailyItinerary.reduce((sum, day) => sum + day.items.length, 0);
        console.log(`Geocoding ${totalItems} activities...`);
        for (const day of itinerary.dailyItinerary) {
          for (const item of day.items) {
            if (item.googleMapsLink && item.activity) {
              const coords = await geocodeLocation(item.googleMapsLink, item.activity);
              if (coords) {
                geocodedLocs.push({
                  name: item.activity,
                  link: item.googleMapsLink,
                  day: day.day,
                  time: item.time,
                  type: 'activity',
                  coordinates: coords,
                });
              }
            }
            if (item.hiddenGem?.googleMapsLink && item.hiddenGem.name) {
              const coords = await geocodeLocation(item.hiddenGem.googleMapsLink, item.hiddenGem.name);
              if (coords) {
                geocodedLocs.push({
                  name: item.hiddenGem.name,
                  link: item.hiddenGem.googleMapsLink,
                  day: day.day,
                  time: item.time,
                  type: 'hidden-gem',
                  coordinates: coords,
                });
              }
            }
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        console.log(`Geocoding complete! Found ${geocodedLocs.length} locations with coordinates.`);
        setIsGeocoding(false);
        if (geocodedLocs.length > 0) {
          // Re-initialize map with geocoded locations
          initializeMap(geocodedLocs);
        } else {
          console.error('Geocoding failed for all locations. Check console for details.');
          setError('Could not geocode locations. Please check that your Google Maps API key has Geocoding API enabled.');
        }
      };

      geocodeLocations();
      return;
    }

    initializeMap(locations);
  }, [isLoaded, locations, itinerary, isGeocoding]);

  const initializeMap = (locs: Location[]) => {
    if (!mapRef.current || !window.google || locs.length === 0) {
      return;
    }

    try {
      // Calculate center from all locations
      const avgLat = locs.reduce((sum, loc) => sum + loc.coordinates!.lat, 0) / locs.length;
      const avgLng = locs.reduce((sum, loc) => sum + loc.coordinates!.lng, 0) / locs.length;

      // Initialize map
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: avgLat, lng: avgLng },
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      });

      setMap(mapInstance);

      // Create custom marker icons
      const getMarkerIcon = (type: 'hotel' | 'activity' | 'hidden-gem') => {
        const colors = {
          hotel: '#FF6B6B',      // Red for hotels
          activity: '#4ECDC4',    // Teal for activities
          'hidden-gem': '#FFE66D' // Yellow for hidden gems
        };
        
        const emojis = {
          hotel: '🏨',
          activity: '📍',
          'hidden-gem': '💎'
        };

        // Create a custom SVG icon
        const svgIcon = {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: colors[type],
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        };

        return svgIcon;
      };

      // Create markers
      const markerInstances: any[] = [];
      locs.forEach((location) => {
        if (!location.coordinates) return;

        const marker = new window.google.maps.Marker({
          position: location.coordinates,
          map: mapInstance,
          title: location.name,
          icon: getMarkerIcon(location.type),
          animation: window.google.maps.Animation.DROP,
        });

        // Create info window content
        const infoContent = `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #333;">
              ${location.type === 'hotel' ? '🏨' : location.type === 'hidden-gem' ? '💎' : '📍'} ${location.name}
            </h3>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              <strong>Day:</strong> ${location.day}
            </p>
            ${location.time ? `<p style="margin: 4px 0; font-size: 12px; color: #666;"><strong>Time:</strong> ${location.time}</p>` : ''}
            <a 
              href="${location.link}" 
              target="_blank" 
              rel="noopener noreferrer"
              style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #4285F4; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;"
            >
              View on Google Maps →
            </a>
          </div>
        `;

        const infoWindow = new window.google.maps.InfoWindow({
          content: infoContent,
        });

        marker.addListener('click', () => {
          // Close all other info windows
          markerInstances.forEach(m => {
            if (m.infoWindow) {
              m.infoWindow.close();
            }
          });
          infoWindow.open(mapInstance, marker);
        });

        markerInstances.push({ marker, infoWindow });
      });

      setMarkers(markerInstances);

      // Fit bounds to show all markers
      if (markerInstances.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        markerInstances.forEach(({ marker }) => {
          bounds.extend(marker.getPosition()!);
        });
        mapInstance.fitBounds(bounds);
        
        // Don't zoom in too much if there are only a few markers
        if (markerInstances.length <= 3) {
          const listener = window.google.maps.event.addListener(mapInstance, 'bounds_changed', () => {
            if (mapInstance.getZoom()! > 15) {
              mapInstance.setZoom(15);
            }
            window.google.maps.event.removeListener(listener);
          });
        }
      }
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg p-8 text-center shadow-md" style={{ height: '500px' }}>
        <div className="text-6xl mb-4">⚠️</div>
        <h4 className="text-xl font-bold text-gray-800 mb-2">Map Error</h4>
        <p className="text-gray-600 mb-4">{error}</p>
        <p className="text-xs text-gray-500">
          Please add <code className="bg-gray-200 px-2 py-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to your .env file
        </p>
      </div>
    );
  }

  if (locations.length === 0 && !isGeocoding) {
    return (
      <div className="bg-white rounded-lg p-8 text-center shadow-md" style={{ height: '500px' }}>
        <div className="text-6xl mb-4">🗺️</div>
        <h4 className="text-xl font-bold text-gray-800 mb-2">No Locations Found</h4>
        <p className="text-gray-600">No locations with coordinates found in the itinerary.</p>
        <p className="text-sm text-gray-500 mt-2">Geocoding should start automatically...</p>
      </div>
    );
  }

  if (isGeocoding) {
    return (
      <div className="bg-white rounded-lg p-8 text-center shadow-md" style={{ height: '500px' }}>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h4 className="text-xl font-bold text-gray-800 mb-2">Geocoding Locations...</h4>
          <p className="text-gray-600">Converting place names to coordinates. This may take a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="w-full rounded-lg shadow-md"
        style={{ height: '500px' }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapsWithMarkers;

