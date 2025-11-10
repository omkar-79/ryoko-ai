
export interface HiddenGem {
  name: string;
  location: string;
  description: string;
  googleMapsLink: string | null;
  locationUri?: string; // Optional URI for the neighborhood/location
}

export interface ItineraryItem {
  time: string;
  activity: string;
  location: string;
  description: string;
  googleMapsLink: string | null;
  locationUri?: string; // Optional URI for the neighborhood/location
  hiddenGem?: HiddenGem;
}

export interface DailyPlan {
  day: string;
  title: string;
  items: ItineraryItem[];
}

export interface Hotel {
  name: string;
  description: string;
  location: string;
  googleMapsLink: string | null;
}

export interface Itinerary {
  tripTitle: string;
  vibeCheck: string;
  packingList: string[];
  recommendedHotels: Hotel[];
  dailyItinerary: DailyPlan[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
        reviewSnippets: {
            uri: string;
            title: string;
        }[]
    }
  };
}
