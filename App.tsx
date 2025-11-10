
import React, { useState } from 'react';
import { generateItinerary } from './services/geminiService';
import { Itinerary, GroundingChunk } from './types';
import { matchSourcesToItinerary } from './utils/matchSources';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ItineraryDisplay from './components/ItineraryDisplay';

const InputField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; }> = ({ label, value, onChange, placeholder }) => (
    <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
    </div>
);

const TextAreaField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder: string; rows: number }> = ({ label, value, onChange, placeholder, rows }) => (
    <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
    </div>
);


const App: React.FC = () => {
    const [destination, setDestination] = useState('Tokyo, Japan');
    const [tripDates, setTripDates] = useState('Next spring for 1 week');
    const [groupVibe, setGroupVibe] = useState('Tech-savvy friends who love food, anime, and exploring unique neighborhoods. We\'re on a moderate budget.');
    const [mustDoList, setMustDoList] = useState('Visit the Ghibli Museum, eat at a themed cafe, explore Akihabara, find great ramen.');
    const [vetoList, setVetoList] = useState('No expensive fine dining, no super early mornings before 10 AM.');

    const [itinerary, setItinerary] = useState<Itinerary | null>(null);
    const [sources, setSources] = useState<GroundingChunk[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setItinerary(null);
        setSources([]);

        try {
            const result = await generateItinerary(destination, tripDates, groupVibe, mustDoList, vetoList);
            
            // Validate that we have itinerary JSON
            if (!result.itineraryJson) {
                throw new Error('No itinerary data received from the API');
            }
            
            // Clean the response from markdown and parse
            const cleanedJsonString = result.itineraryJson.replace(/```json|```/g, '').trim();
            
            if (!cleanedJsonString) {
                throw new Error('Empty response after cleaning. The model may not have returned valid JSON.');
            }
            
            const parsedItinerary: Itinerary = JSON.parse(cleanedJsonString);
            
            // The model should now include Google Maps URIs directly in the JSON response.
            // Use matching as a fallback only for places that don't have URIs.
            const matchedItinerary = matchSourcesToItinerary(parsedItinerary, result.sources);
            console.log('Processed itinerary with Google Maps links');

            setItinerary(matchedItinerary);
            setSources(result.sources);
        } catch (err) {
            console.error('Error generating itinerary:', err);
            setError(err instanceof Error ? `Failed to generate itinerary: ${err.message}` : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const isFormIncomplete = !destination || !tripDates || !groupVibe;

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans">
            <Header />
            <main className="p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    {!itinerary && (
                         <div className="bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 text-slate-100">Plan Your Next Adventure</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <InputField label="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g., Paris, France" />
                                    <InputField label="Trip Dates" value={tripDates} onChange={(e) => setTripDates(e.target.value)} placeholder="e.g., July 10-17" />
                                </div>
                                <TextAreaField label="Group Vibe" value={groupVibe} onChange={(e) => setGroupVibe(e.target.value)} placeholder="e.g., Relaxed, foodie, adventure-seekers" rows={3} />
                                <TextAreaField label="Must-Do List" value={mustDoList} onChange={(e) => setMustDoList(e.target.value)} placeholder="e.g., See the Eiffel Tower, eat croissants" rows={2} />
                                <TextAreaField label="Veto List (Things to avoid)" value={vetoList} onChange={(e) => setVetoList(e.target.value)} placeholder="e.g., No museums, no seafood" rows={2} />
                                <div className="pt-4">
                                    <button type="submit" disabled={isLoading || isFormIncomplete} className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg shadow-lg">
                                        {isLoading ? 'Generating...' : 'Create My Itinerary'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {isLoading && (
                        <div className="mt-8">
                            <LoadingSpinner />
                            <p className="text-center text-slate-400 mt-4">
                                Generating your itinerary... This may take 30-60 seconds as we search for the best places and gather location details.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mt-8 p-4 bg-red-800/50 border border-red-600 text-red-200 rounded-lg">
                            <p className="font-bold">An Error Occurred</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {itinerary && (
                        <div>
                            <ItineraryDisplay itinerary={itinerary} sources={sources} />
                             <div className="text-center mt-8">
                                <button
                                    onClick={() => setItinerary(null)}
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg"
                                >
                                    Start a New Plan
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;
