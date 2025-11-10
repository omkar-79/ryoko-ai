
import { GoogleGenAI } from "@google/genai";
import { GroundingChunk } from '../types';

const getAtlasPrompt = (
    destination: string,
    tripDates: string,
    groupVibe: string,
    mustDoList: string,
    vetoList: string
) => {
    return `
You are 'Atlas', an elite AI logistics coordinator. Your job is to create a trip itinerary.
Your entire response MUST be a single, valid JSON object. Do not include any text, markdown formatting, or explanations outside of the JSON structure.
Here are the trip details:
Destination: ${destination}
Trip Dates: ${tripDates}
Group Vibe: ${groupVibe}
Must-Do List: ${mustDoList}
Veto List: ${vetoList}
CRITICAL DATA SOURCING & JSON STRUCTURE:
Use Both Tools Strategically: 
- Use Google Search to discover and find the best places (hotels, activities, restaurants, hidden gems) based on the destination and requirements.
- Use Google Maps Grounding to get detailed place information, exact locations, and Google Maps URIs for the places you've identified.
- Use the tools efficiently: Search for places, then use Maps for key places to get their URIs. You don't need to use Maps for every single place - focus on the most important ones.
Use Exact Official Names: You MUST use the exact, unmodified, official name from the tools as the value for the "name" or "activity" fields in your JSON. This is critical for accurate location data.
Google Maps Links: When you use Google Maps Grounding to get information about a place, you will receive a Google Maps URI in the grounding metadata. You MUST include this exact URI in the "googleMapsLink" field for that place in your JSON response. For places where you don't use Google Maps Grounding or don't have a URI, set "googleMapsLink" to null. This is critical - always include the Google Maps URI from the grounding metadata when available.
For Neighborhoods: When you mention a neighborhood or area in the "location" field (e.g., "Shibuya", "Shinjuku"), you can also use Google Maps Grounding to get a Google Maps URI for that neighborhood. If you get a URI for the neighborhood, you can include it in a "locationUri" field (optional). However, if you don't have a neighborhood URI, that's fine - the system can generate one.
No Generic Places: Generic descriptions like "a cool bakery" are forbidden. You must always use the tools to find and name a specific place like "Gontran Cherrier Shinjuku".
IMPORTANT: Generate the complete JSON response in a single turn. Do not make excessive tool calls. Use tools efficiently to gather information, then provide the complete itinerary with Google Maps URIs included directly in the JSON.
Generate a JSON object with the following structure:
{
"tripTitle": "A fun, 'Genz' style name for the trip, using emojis.",
"vibeCheck": "A 2-sentence summary that captures the group's vibe.",
"packingList": ["A brief, fun packing list based on the destination and dates.", "Include 2-3 items."],
"recommendedHotels": [
{
"name": "Hotel Name 1 (exact name from tool)",
"description": "Why it's a good fit (location, price, vibe).",
"location": "General neighborhood or area (from tool).",
"googleMapsLink": "https://maps.google.com/... (Google Maps URI from grounding metadata, or null if not available)"
},
{
"name": "Hotel Name 2 (exact name from tool)",
"description": "Brief description.",
"location": "General neighborhood or area (from tool).",
"googleMapsLink": "https://maps.google.com/... (Google Maps URI from grounding metadata, or null if not available)"
}
],
"dailyItinerary": [
{
"day": "Day 1",
"title": "A catchy title for the day's plan.",
"items": [
{
"time": "e.g., 10:30 AM",
"activity": "Name of the activity (exact name from tool).",
"location": "Neighborhood or area (from tool).",
"description": "A brief description of what to do.",
"googleMapsLink": "https://maps.google.com/... (Google Maps URI from grounding metadata, or null if not available)",
"hiddenGem": {
"name": "Name of the hidden gem (exact name from tool).",
"location": "Neighborhood or area (from tool).",
"description": "Why it's a cool suggestion.",
"googleMapsLink": "https://maps.google.com/... (Google Maps URI from grounding metadata, or null if not available)"
}
},
{
"time": "e.g., 1:00 PM",
"activity": "Ichiran Shibuya (exact name from tool)",
"location": "Shibuya (from tool)",
"description": "Enjoy a bowl of classic tonkotsu ramen at this famous spot.",
"googleMapsLink": "https://maps.google.com/... (Google Maps URI from grounding metadata, or null if not available)"
}
]
}
]
}
CRITICAL LOGIC:
(Distance/Time): Group activities by neighborhood to be efficient.
(Vetoes): Strictly follow the "Veto List" (e.g., no plans before 10:00 AM if "no early mornings" is a veto).
(Creative Suggestions): Include at least one relevant "hiddenGem" suggestion per day. The hiddenGem property is optional.
`;
};

// Retry function with exponential backoff
const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            
            // Check if it's a retryable error (503, 429, or network errors)
            // Handle both direct error objects and nested error structures
            const errorCode = error?.code || error?.error?.code;
            const errorStatus = error?.status || error?.error?.status;
            const errorMessage = error?.message || error?.error?.message || JSON.stringify(error);
            
            const isRetryable = 
                errorCode === 503 || 
                errorStatus === 'UNAVAILABLE' ||
                errorCode === 429 ||
                errorMessage?.includes('503') ||
                errorMessage?.includes('UNAVAILABLE') ||
                errorMessage?.includes('network') ||
                errorMessage?.includes('ECONNRESET');
            
            if (!isRetryable || attempt === maxRetries - 1) {
                throw error;
            }
            
            // Calculate delay with exponential backoff
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
};

export const generateItinerary = async (
    destination: string,
    tripDates: string,
    groupVibe: string,
    mustDoList: string,
    vetoList: string
): Promise<{ itineraryJson: string; sources: GroundingChunk[] }> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = getAtlasPrompt(destination, tripDates, groupVibe, mustDoList, vetoList);

    console.log('Starting API call...');
    
    // Add timeout wrapper to prevent infinite loops
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
            reject(new Error('API call timed out after 120 seconds. The request may be stuck in a tool call loop.'));
        }, 120000); // 2 minute timeout
    });

    try {
        // Wrap API call in retry logic
        const response = await retryWithBackoff(async () => {
            const apiCall = ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    tools: [
                        { googleSearch: {} },
                        { googleMaps: {} }
                    ],
                },
            });

            return await Promise.race([apiCall, timeoutPromise]);
        });
        
        console.log('API call completed, processing response...');

        // Extract text content - try response.text first, then fallback to candidates
        let itineraryJson: string | undefined = response.text;
        
        // Fallback: if response.text is undefined, try to extract from candidates
        if (!itineraryJson && response.candidates?.[0]?.content?.parts) {
            itineraryJson = response.candidates[0].content.parts
                .filter((part: any) => part.text)
                .map((part: any) => part.text)
                .join('');
        }

        // Check if we have text content
        if (!itineraryJson) {
            console.error('Response structure:', JSON.stringify(response, null, 2));
            console.error('Candidates:', response.candidates);
            console.error('Response keys:', Object.keys(response));
            
            // Check if there are tool calls that need to be handled
            const candidate = response.candidates?.[0];
            if (candidate?.content?.parts?.some((part: any) => part.functionCall)) {
                throw new Error('The model is making tool calls that require follow-up. This may indicate the tools are being called in a loop. Try using only one tool at a time.');
            }
            
            throw new Error('No text content in API response. The model may have failed to generate content or the response structure is unexpected.');
        }

        console.log('Successfully extracted itinerary JSON');
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
        console.log(`Found ${sources.length} sources`);

        return { itineraryJson, sources };
    } catch (error: any) {
        console.error('Error in generateItinerary:', error);
        
        // Extract error details (handle both direct and nested error structures)
        const errorCode = error?.code || error?.error?.code;
        const errorStatus = error?.status || error?.error?.status;
        const errorMessage = error?.message || error?.error?.message || JSON.stringify(error);
        
        // Provide user-friendly error messages
        if (errorCode === 503 || errorStatus === 'UNAVAILABLE' || errorMessage?.includes('503') || errorMessage?.includes('UNAVAILABLE')) {
            throw new Error('The API service is temporarily unavailable. This is usually a temporary issue. Please try again in a few moments. If the problem persists, check your API key permissions in Google Cloud Console.');
        }
        
        if (errorCode === 429 || errorMessage?.includes('429')) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        
        if (errorMessage?.includes('API_KEY') || errorMessage?.includes('api key')) {
            throw new Error('API key is missing or invalid. Please check your environment variables.');
        }
        
        if (errorMessage?.includes('timeout')) {
            throw new Error('The request took too long. This might be due to high API load. Please try again.');
        }
        
        // Re-throw with original message if we can't categorize it
        const finalMessage = errorMessage || 'Failed to generate itinerary. Please try again.';
        throw new Error(finalMessage);
    }
};
