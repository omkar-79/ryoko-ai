import { Itinerary, GroundingChunk } from '../types';

export interface Plan {
  id: string;
  creatorId: string;
  destination: string;
  tripDates: string;
  groupVibe: string;
  mustDoList: string;
  vetoList: string;
  inviteCode: string; // Unique 6-8 digit code
  status: 'draft' | 'active' | 'completed';
  itinerary: Itinerary | null;
  sources: GroundingChunk[];
  createdAt: Date;
  updatedAt: Date;
  memberIds: string[]; // Array of member document IDs
}

export interface CreatePlanData {
  destination: string;
  tripDates: string;
  groupVibe: string;
  mustDoList: string;
  vetoList: string;
}

