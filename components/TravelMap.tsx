import React from 'react';
import { Itinerary, DailyPlan } from '../types';

interface TravelMapProps {
  itinerary: Itinerary;
}

const TravelMap: React.FC<TravelMapProps> = ({ itinerary }) => {
  // Extract all locations with Google Maps links from the itinerary
  const locations: Array<{
    name: string;
    link: string;
    day: string;
    time?: string;
    type: 'hotel' | 'activity' | 'hidden-gem';
  }> = [];

  // Add hotels
  itinerary.recommendedHotels.forEach((hotel) => {
    if (hotel.googleMapsLink) {
      locations.push({
        name: hotel.name,
        link: hotel.googleMapsLink,
        day: 'Hotels',
        type: 'hotel',
      });
    }
  });

  // Add activities and hidden gems from daily itinerary
  itinerary.dailyItinerary.forEach((day: DailyPlan) => {
    day.items.forEach((item) => {
      if (item.googleMapsLink) {
        locations.push({
          name: item.activity,
          link: item.googleMapsLink,
          day: day.day,
          time: item.time,
          type: 'activity',
        });
      }
      if (item.hiddenGem?.googleMapsLink) {
        locations.push({
          name: item.hiddenGem.name,
          link: item.hiddenGem.googleMapsLink,
          day: day.day,
          time: item.time,
          type: 'hidden-gem',
        });
      }
    });
  });

  if (locations.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">🗺️</div>
        <p className="text-gray-600">Map view coming soon! Click on individual locations to view them on Google Maps.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <span className="text-2xl md:text-3xl">🗺️</span>
        <h3 className="text-xl md:text-2xl font-bold text-gray-800">Trip Map</h3>
      </div>
      <p className="text-gray-600 mb-4 md:mb-6 text-xs md:text-sm">
        Click on any location to view it on Google Maps
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 max-h-80 md:max-h-96 overflow-y-auto">
        {locations.map((location, index) => (
          <a
            key={index}
            href={location.link}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-3 md:p-4 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 border-transparent hover:border-blue-400 min-h-[80px] flex items-center"
          >
            <div className="flex items-start gap-2 md:gap-3 w-full">
              <div className="text-xl md:text-2xl flex-shrink-0">
                {location.type === 'hotel' ? '🏨' : location.type === 'hidden-gem' ? '💎' : '📍'}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 text-xs md:text-sm mb-1 break-words">
                  {location.name}
                </h4>
                <div className="text-xs text-gray-500">
                  {location.day}
                  {location.time && ` • ${location.time}`}
                </div>
              </div>
              <div className="text-blue-500 text-base md:text-lg flex-shrink-0">→</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default TravelMap;

