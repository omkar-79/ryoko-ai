import React, { useState, useEffect } from 'react';
import { getPlan, subscribeToPlan } from '../../services/firebase/plans';
import { getPlanMembers, subscribeToPlanMembers } from '../../services/firebase/members';
import { generateItinerary } from '../../services/geminiService';
import { matchSourcesToItinerary } from '../../utils/matchSources';
import { saveItineraryToPlan } from '../../services/firebase/plans';
import { Plan } from '../../types/plan';
import { MemberPublic } from '../../types/member';
import { Itinerary, GroundingChunk } from '../../types';
import ItineraryDisplay from '../ItineraryDisplay';
import LoadingSpinner from '../LoadingSpinner';

interface PlanDashboardProps {
  planId: string;
  isCreator: boolean;
}

const PlanDashboard: React.FC<PlanDashboardProps> = ({ planId, isCreator }) => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [members, setMembers] = useState<MemberPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to plan updates (for aggregated preferences)
    const unsubscribePlan = subscribeToPlan(planId, (planData) => {
      if (planData) {
        setPlan(planData);
      }
    });

    // Subscribe to member updates
    const unsubscribeMembers = subscribeToPlanMembers(planId, (membersList) => {
      setMembers(membersList);
    });

    // Initial load
    loadPlan();

    return () => {
      unsubscribePlan();
      unsubscribeMembers();
    };
  }, [planId]);

  const loadPlan = async () => {
    try {
      const planData = await getPlan(planId);
      setPlan(planData);
    } catch (err: any) {
      setError(err.message || 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateItinerary = async () => {
    if (!plan) return;

    setGenerating(true);
    setError(null);

    try {
      // Use the plan's aggregated data (already stored in plan.groupVibe, plan.mustDoList, plan.vetoList)
      // These are automatically updated when members join or update preferences
      const result = await generateItinerary(
        plan.destination,
        plan.tripDates,
        plan.groupVibe,
        plan.mustDoList,
        plan.vetoList
      );

      if (!result.itineraryJson) {
        throw new Error('No itinerary data received');
      }

      const cleanedJsonString = result.itineraryJson.replace(/```json|```/g, '').trim();
      const parsedItinerary: Itinerary = JSON.parse(cleanedJsonString);
      const matchedItinerary = matchSourcesToItinerary(parsedItinerary, result.sources);

      // Save to plan
      await saveItineraryToPlan(planId, matchedItinerary, result.sources);

      // Reload plan to get updated itinerary
      await loadPlan();
    } catch (err: any) {
      setError(err.message || 'Failed to generate itinerary');
    } finally {
      setGenerating(false);
    }
  };


  const copyInviteCode = () => {
    if (plan?.inviteCode) {
      navigator.clipboard.writeText(plan.inviteCode);
      alert('Invite code copied to clipboard!');
    }
  };

  const copyInviteLink = () => {
    if (plan?.inviteLink) {
      navigator.clipboard.writeText(plan.inviteLink);
      alert('Invite link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="bg-slate-800 p-6 rounded-xl">
        <p className="text-red-400">Plan not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Info */}
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-slate-100 mb-4">{plan.destination}</h1>
        <div className="grid md:grid-cols-2 gap-4 text-slate-300 mb-4">
          <div>
            <span className="font-semibold">Dates:</span> {plan.tripDates}
          </div>
          <div>
            <span className="font-semibold">Status:</span> {plan.status}
          </div>
        </div>
      </div>

      {/* Aggregated Group Preferences */}
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-slate-100 mb-4">Group Preferences</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">Group Vibe</h3>
            <p className="text-slate-300">{plan.groupVibe || 'No group vibe set yet'}</p>
          </div>

          {plan.mustDoList && (
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Must-Do Items</h3>
              <p className="text-slate-300">{plan.mustDoList}</p>
            </div>
          )}

          {plan.vetoList && (
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Veto Items</h3>
              <p className="text-slate-300">{plan.vetoList}</p>
            </div>
          )}
        </div>
      </div>

      {/* Invite Section (Creator Only) */}
      {isCreator && (
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-slate-100 mb-4">Invite Team Members</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Invite Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={plan.inviteCode}
                  readOnly
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white font-mono text-lg text-center"
                />
                <button
                  onClick={copyInviteCode}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Invite Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={plan.inviteLink}
                  readOnly
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white text-sm"
                />
                <button
                  onClick={copyInviteLink}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-slate-100 mb-4">
          Team Members ({members.length})
        </h2>
        {members.length === 0 ? (
          <p className="text-slate-400">No members yet. Share the invite code to get started!</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-slate-700 p-4 rounded-lg flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-white">{member.name}</div>
                  {member.preferences.budget && (
                    <div className="text-sm text-slate-400">
                      Budget: {member.preferences.budget}
                    </div>
                  )}
                </div>
                <div className="text-sm text-slate-400">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Itinerary (Creator Only) */}
      {isCreator && (
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-slate-100 mb-4">Generate Itinerary</h2>
          {plan.itinerary ? (
            <div>
              <ItineraryDisplay
                itinerary={plan.itinerary}
                sources={plan.sources || []}
              />
              <button
                onClick={handleGenerateItinerary}
                disabled={generating}
                className="mt-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                {generating ? 'Regenerating...' : 'Regenerate Itinerary'}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-slate-400 mb-4">
                Generate a personalized itinerary based on your trip details and member preferences.
              </p>
              <button
                onClick={handleGenerateItinerary}
                disabled={generating}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {generating ? 'Generating...' : 'Generate Itinerary'}
              </button>
            </div>
          )}

          {generating && (
            <div className="mt-4">
              <LoadingSpinner />
              <p className="text-center text-slate-400 mt-4">
                Generating itinerary... This may take 30-60 seconds.
              </p>
            </div>
          )}
        </div>
      )}

      {/* View Itinerary (Members) */}
      {!isCreator && plan.itinerary && (
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-slate-100 mb-4">Trip Itinerary</h2>
          <ItineraryDisplay
            itinerary={plan.itinerary}
            sources={plan.sources || []}
          />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-800/50 border border-red-600 text-red-200 rounded-lg">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default PlanDashboard;

