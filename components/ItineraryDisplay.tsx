
import React from 'react';
import { Itinerary, DailyPlan, Hotel, GroundingChunk } from '../types';
import { MapPinIcon, ClockIcon, HotelIcon, SuitcaseIcon, VibeIcon, GemIcon } from './IconComponents';

interface ItineraryDisplayProps {
  itinerary: Itinerary;
  sources: GroundingChunk[];
}

const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ itinerary, sources }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
      <header className="text-center p-6 border-b-2 border-cyan-400">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-100">{itinerary.tripTitle}</h1>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-cyan-400 mb-3 flex items-center"><VibeIcon className="w-6 h-6 mr-3"/> Vibe Check</h2>
          <p className="text-slate-300">{itinerary.vibeCheck}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-cyan-400 mb-3 flex items-center"><SuitcaseIcon className="w-6 h-6 mr-3"/> Packing List</h2>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            {itinerary.packingList.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-slate-100 mb-4 flex items-center"><HotelIcon className="w-8 h-8 mr-3 text-cyan-400"/> Recommended Hotels</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {itinerary.recommendedHotels.map((hotel: Hotel, index: number) => (
            <div key={index} className="bg-slate-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-white">{hotel.name}</h3>
              <p className="text-sm text-cyan-400 flex items-center mt-1 mb-2">
                <MapPinIcon className="w-4 h-4 mr-2"/>{hotel.location}
                {hotel.googleMapsLink && (
                  <a 
                    href={hotel.googleMapsLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-cyan-300 hover:text-cyan-200 underline text-xs"
                    title="Open in Google Maps"
                  >
                    View on Maps
                  </a>
                )}
              </p>
              <p className="text-slate-300">{hotel.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-slate-100 mb-4">Daily Itinerary</h2>
        <div className="space-y-6">
          {itinerary.dailyItinerary.map((day: DailyPlan, index: number) => (
            <div key={index} className="bg-slate-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold text-cyan-400 border-b border-slate-600 pb-2 mb-4">{day.day}: <span className="text-white">{day.title}</span></h3>
              <div className="space-y-6">
                {day.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-24 text-right font-semibold text-cyan-400 flex items-center justify-end">
                            <ClockIcon className="w-4 h-4 mr-1.5" />
                            <span>{item.time}</span>
                        </div>
                        <div className="w-px h-full bg-slate-600 mt-2"></div>
                    </div>
                    <div className="pb-6 w-full">
                      <div className="flex items-start justify-between">
                        <p className="text-xl font-semibold text-white">{item.activity}</p>
                        {item.googleMapsLink && (
                          <a 
                            href={item.googleMapsLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-cyan-400 hover:text-cyan-300 text-sm underline flex items-center"
                            title="Open in Google Maps"
                          >
                            <MapPinIcon className="w-4 h-4 mr-1"/>
                            Maps
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 flex items-center mt-1">
                        <MapPinIcon className="w-4 h-4 mr-2"/>{item.location}
                        {item.locationUri && (
                          <a 
                            href={item.locationUri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-cyan-400 hover:text-cyan-300 text-xs underline"
                            title="View neighborhood on Google Maps"
                          >
                            View Area
                          </a>
                        )}
                      </p>
                      <p className="text-slate-300 mt-2">{item.description}</p>
                      {item.hiddenGem && (
                        <div className="mt-4 bg-slate-700/50 p-4 rounded-lg border-l-4 border-cyan-500">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-cyan-400 flex items-center"><GemIcon className="w-5 h-5 mr-2"/> Hidden Gem: {item.hiddenGem.name}</h4>
                            {item.hiddenGem.googleMapsLink && (
                              <a 
                                href={item.hiddenGem.googleMapsLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-2 text-cyan-400 hover:text-cyan-300 text-xs underline flex items-center"
                                title="Open in Google Maps"
                              >
                                <MapPinIcon className="w-3 h-3 mr-1"/>
                                Maps
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 flex items-center mt-1">
                            <MapPinIcon className="w-4 h-4 mr-2"/>{item.hiddenGem.location}
                            {item.hiddenGem.locationUri && (
                              <a 
                                href={item.hiddenGem.locationUri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-2 text-cyan-400 hover:text-cyan-300 text-xs underline"
                                title="View neighborhood on Google Maps"
                              >
                                View Area
                              </a>
                            )}
                          </p>
                           <p className="text-slate-300 mt-2 text-sm">{item.hiddenGem.description}</p>
                        </div>
                      )}
                    </div>
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
