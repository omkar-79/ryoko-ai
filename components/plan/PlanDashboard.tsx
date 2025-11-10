import React, { useState, useEffect } from 'react';
import { getPlan } from '../../services/firebase/plans';
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
    loadPlan();
    const unsubscribe = subscribeToPlanMembers(planId, (membersList) => {
      setMembers(membersList);
    });

    return () => unsubscribe();
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
      // Aggregate member preferences
      const allPreferences = members.map((m) => m.preferences);
      const aggregatedVibe = aggregatePreferences(allPreferences, plan.groupVibe);
      const aggregatedMustDo = aggregateMustDo(allPreferences, plan.mustDoList);
      const aggregatedVeto = aggregateVeto(allPreferences, plan.vetoList);

      // Generate itinerary
      const result = await generateItinerary(
        plan.destination,
        plan.tripDates,
        aggregatedVibe,
        aggregatedMustDo,
        aggregatedVeto
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

  const aggregatePreferences = (preferences: any[], baseVibe: string): string => {
    const budgets = preferences.map((p) => p.budget).filter(Boolean);
    const interests = preferences.flatMap((p) => p.interests || []).filter(Boolean);
    const dietary = preferences.flatMap((p) => p.dietary || []).filter(Boolean);

    let aggregated = baseVibe;
    if (budgets.length > 0) {
      aggregated += ` Budget considerations: ${budgets.join(', ')}.`;
    }
    if (interests.length > 0) {
      aggregated += ` Group interests: ${interests.join(', ')}.`;
    }
    if (dietary.length > 0) {
      aggregated += ` Dietary needs: ${dietary.join(', ')}.`;
    }

    return aggregated;
  };

  const aggregateMustDo = (preferences: any[], baseMustDo: string): string => {
    const memberMustDo = preferences.flatMap((p) => p.mustDo || []).filter(Boolean);
    if (memberMustDo.length > 0) {
      return `${baseMustDo} ${memberMustDo.join(', ')}`;
    }
    return baseMustDo;
  };

  const aggregateVeto = (preferences: any[], baseVeto: string): string => {
    const memberVeto = preferences.flatMap((p) => p.veto || []).filter(Boolean);
    if (memberVeto.length > 0) {
      return `${baseVeto} ${memberVeto.join(', ')}`;
    }
    return baseVeto;
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
        <div className="grid md:grid-cols-2 gap-4 text-slate-300">
          <div>
            <span className="font-semibold">Dates:</span> {plan.tripDates}
          </div>
          <div>
            <span className="font-semibold">Status:</span> {plan.status}
          </div>
        </div>
        <p className="mt-4 text-slate-300">{plan.groupVibe}</p>
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

