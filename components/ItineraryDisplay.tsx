import React from 'react';
import { Itinerary, DailyPlan, Hotel, GroundingChunk } from '../types';
import ExpandableItineraryCard from './ExpandableItineraryCard';

interface ItineraryDisplayProps {
  itinerary: Itinerary;
  sources: GroundingChunk[];
}

const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ itinerary, sources }) => {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Trip Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 text-7xl md:text-9xl opacity-10">✈️</div>
        <div className="absolute bottom-0 left-0 text-6xl md:text-8xl opacity-10">🌍</div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-3 break-words">{itinerary.tripTitle}</h1>
          <div className="flex flex-wrap gap-4 mt-4 text-sm md:text-base">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
              <span>📅</span>
              <span>{itinerary.dailyItinerary.length} Days</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
              <span>📍</span>
              <span>{itinerary.dailyItinerary.reduce((acc, day) => acc + day.items.length, 0)} Activities</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
              <span>🏨</span>
              <span>{itinerary.recommendedHotels.length} Hotels</span>
            </div>
          </div>
        </div>
      </div>

      {/* Essential Info Cards */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl md:rounded-2xl p-5 md:p-6 border-2 border-blue-200">
          <h2 className="text-lg md:text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <span>Trip Vibe</span>
          </h2>
          <p className="text-sm md:text-base text-gray-700 leading-relaxed">{itinerary.vibeCheck}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl md:rounded-2xl p-5 md:p-6 border-2 border-green-200">
          <h2 className="text-lg md:text-xl font-bold text-green-800 mb-3 flex items-center gap-2">
            <span className="text-2xl">🧳</span>
            <span>Packing Essentials</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {itinerary.packingList.map((item, index) => (
              <span 
                key={index} 
                className="bg-white px-3 py-1.5 rounded-full text-xs md:text-sm text-gray-700 border border-green-200"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Hotels - Quick Reference */}
      {itinerary.recommendedHotels.length > 0 && (
        <div className="bg-white rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg border border-gray-200">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-3xl">🏨</span>
            <span>Recommended Hotels</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {itinerary.recommendedHotels.map((hotel: Hotel, index: number) => (
              <div 
                key={index} 
                className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all"
              >
                <h3 className="font-bold text-gray-800 mb-2 text-sm md:text-base break-words">{hotel.name}</h3>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg">📍</span>
                  <p className="text-xs text-gray-600 flex-1 break-words">{hotel.location}</p>
                </div>
                {hotel.googleMapsLink && (
                  <a 
                    href={hotel.googleMapsLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <span>🗺️</span>
                    Open Maps
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Itinerary - Travel Timeline */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-3xl">📅</span>
          <span>Daily Itinerary</span>
        </h2>
        <div className="space-y-6 md:space-y-8">
          {itinerary.dailyItinerary.map((day: DailyPlan, dayIndex: number) => (
            <div key={dayIndex} className="bg-white rounded-xl md:rounded-2xl shadow-lg border-2 border-indigo-100 overflow-hidden">
              {/* Day Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 md:p-6 text-white">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl md:text-4xl">
                      {dayIndex === 0 ? '🌅' : dayIndex === itinerary.dailyItinerary.length - 1 ? '🌇' : '☀️'}
                    </span>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold">{day.day}</h3>
                      <p className="text-sm md:text-base text-indigo-100">{day.title}</p>
                    </div>
                  </div>
                  <div className="bg-white/20 px-3 py-1.5 rounded-full text-sm">
                    {day.items.length} activities
                  </div>
                </div>
              </div>

              {/* Activities Timeline - Expandable Cards */}
              <div className="p-4 md:p-6 space-y-3">
                {day.items.map((item, itemIndex) => (
                  <ExpandableItineraryCard
                    key={itemIndex}
                    item={item}
                    dayTitle={day.title}
                    dayNumber={dayIndex + 1}
                    sources={sources}
                  />
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
