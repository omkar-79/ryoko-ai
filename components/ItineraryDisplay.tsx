
import React from 'react';
import { Itinerary, DailyPlan, Hotel, GroundingChunk } from '../types';
import { MapPinIcon, ClockIcon, HotelIcon, SuitcaseIcon, VibeIcon, GemIcon } from './IconComponents';
import TravelMap from './TravelMap';

interface ItineraryDisplayProps {
  itinerary: Itinerary;
  sources: GroundingChunk[];
}

const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ itinerary, sources }) => {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
      <header className="text-center p-6 md:p-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl md:rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 text-5xl md:text-8xl opacity-20">✈️</div>
        <div className="absolute bottom-0 left-0 text-4xl md:text-6xl opacity-20">🌍</div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 break-words px-2">{itinerary.tripTitle}</h1>
        </div>
      </header>

      {/* Travel Map */}
      <TravelMap itinerary={itinerary} />

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg border-2 border-blue-100">
          <h2 className="text-xl md:text-2xl font-semibold text-blue-700 mb-3 flex items-center gap-2">
            <span className="text-2xl md:text-3xl">✨</span> Vibe Check
          </h2>
          <p className="text-sm md:text-base text-gray-700 leading-relaxed">{itinerary.vibeCheck}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg border-2 border-green-100">
          <h2 className="text-xl md:text-2xl font-semibold text-green-700 mb-3 flex items-center gap-2">
            <span className="text-2xl md:text-3xl">🧳</span> Packing List
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            {itinerary.packingList.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-lg">📦</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <span className="text-3xl md:text-4xl">🏨</span>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Recommended Hotels</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {itinerary.recommendedHotels.map((hotel: Hotel, index: number) => (
            <div key={index} className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg border-2 border-orange-100 hover:shadow-xl transition-all duration-200">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 break-words">{hotel.name}</h3>
              <p className="text-xs md:text-sm text-gray-600 flex flex-wrap items-center mt-1 mb-3 gap-1">
                <span className="text-base md:text-lg">📍</span>
                <span className="break-words">{hotel.location}</span>
                {hotel.googleMapsLink && (
                  <a 
                    href={hotel.googleMapsLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 underline text-xs font-semibold flex items-center gap-1 min-h-[44px] px-2"
                    title="Open in Google Maps"
                  >
                    <span>🗺️</span> View on Maps
                  </a>
                )}
              </p>
              <p className="text-sm md:text-base text-gray-700">{hotel.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <span className="text-3xl md:text-4xl">📅</span>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Daily Itinerary</h2>
        </div>
        <div className="space-y-4 md:space-y-6">
          {itinerary.dailyItinerary.map((day: DailyPlan, index: number) => (
            <div key={index} className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg border-2 border-indigo-100">
              <h3 className="text-xl md:text-2xl font-bold text-indigo-600 border-b-2 border-indigo-200 pb-3 mb-4 md:mb-6 flex flex-wrap items-center gap-2">
                <span className="text-2xl md:text-3xl">{index === 0 ? '🌅' : index === itinerary.dailyItinerary.length - 1 ? '🌇' : '☀️'}</span>
                <span className="break-words">{day.day}: <span className="text-gray-700">{day.title}</span></span>
              </h3>
              <div className="space-y-4 md:space-y-6">
                {day.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-5 rounded-xl border-l-4 border-indigo-400 hover:shadow-md transition-all duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                        <div className="flex-1">
                          <p className="text-lg md:text-xl font-semibold text-gray-800 break-words">
                            {item.activity}
                            <span className="text-base md:text-lg font-normal text-indigo-600 ml-2">🕐 {item.time}</span>
                          </p>
                        </div>
                        {item.googleMapsLink && (
                          <a 
                            href={item.googleMapsLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600 text-xs md:text-sm font-semibold flex items-center gap-1 bg-blue-50 px-2 md:px-3 py-1.5 md:py-1 rounded-lg hover:bg-blue-100 transition-colors self-start sm:self-auto min-h-[36px] sm:min-h-[32px]"
                            title="Open in Google Maps"
                          >
                            <span>📍</span>
                            Maps
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 flex items-center mt-2 mb-2">
                        <span className="text-base mr-2">🗺️</span>
                        {item.location}
                        {item.locationUri && (
                          <a 
                            href={item.locationUri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-3 text-blue-500 hover:text-blue-600 text-xs underline font-semibold"
                            title="View neighborhood on Google Maps"
                          >
                            View Area
                          </a>
                        )}
                      </p>
                      <p className="text-gray-700 mt-3 leading-relaxed">{item.description}</p>
                      {item.hiddenGem && (
                        <div className="mt-4 bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-xl border-l-4 border-yellow-400 shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-amber-700 flex items-center gap-2">
                              <span className="text-xl">💎</span>
                              Hidden Gem: {item.hiddenGem.name}
                            </h4>
                            {item.hiddenGem.googleMapsLink && (
                              <a 
                                href={item.hiddenGem.googleMapsLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-500 hover:text-blue-600 text-xs font-semibold flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                                title="Open in Google Maps"
                              >
                                <span>📍</span>
                                Maps
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 flex items-center mt-2 mb-2">
                            <span className="text-base mr-2">🗺️</span>
                            {item.hiddenGem.location}
                            {item.hiddenGem.locationUri && (
                              <a 
                                href={item.hiddenGem.locationUri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-3 text-blue-500 hover:text-blue-600 text-xs underline font-semibold"
                                title="View neighborhood on Google Maps"
                              >
                                View Area
                              </a>
                            )}
                          </p>
                           <p className="text-gray-700 mt-2 text-sm leading-relaxed">{item.hiddenGem.description}</p>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ItineraryDisplay;
