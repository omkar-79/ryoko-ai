import React, { useState, useEffect } from 'react';
import { getPlan, subscribeToPlan, updatePlan } from '../../services/firebase/plans';
import { getPlanMembers, subscribeToPlanMembers } from '../../services/firebase/members';
import { generateItinerary } from '../../services/geminiService';
import { matchSourcesToItinerary } from '../../utils/matchSources';
import { saveItineraryToPlan } from '../../services/firebase/plans';
import { Plan } from '../../types/plan';
import { MemberPublic } from '../../types/member';
import { Itinerary, GroundingChunk } from '../../types';
import ItineraryDisplay from '../ItineraryDisplay';
import LoadingSpinner from '../LoadingSpinner';
import TravelDoodles from '../TravelDoodles';

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
  
  // Edit states for group preferences
  const [editingGroupVibe, setEditingGroupVibe] = useState(false);
  const [editingMustDo, setEditingMustDo] = useState(false);
  const [editingVeto, setEditingVeto] = useState(false);
  const [editGroupVibe, setEditGroupVibe] = useState('');
  const [editMustDo, setEditMustDo] = useState('');
  const [editVeto, setEditVeto] = useState('');
  const [saving, setSaving] = useState(false);

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

  // Initialize edit values when plan loads (only if not currently editing)
  useEffect(() => {
    if (plan) {
      if (!editingGroupVibe) setEditGroupVibe(plan.groupVibe || '');
      if (!editingMustDo) setEditMustDo(plan.mustDoList || '');
      if (!editingVeto) setEditVeto(plan.vetoList || '');
    }
  }, [plan, editingGroupVibe, editingMustDo, editingVeto]);

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

  const handleSaveGroupVibe = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      await updatePlan(planId, { groupVibe: editGroupVibe });
      setEditingGroupVibe(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update group vibe');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMustDo = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      await updatePlan(planId, { mustDoList: editMustDo });
      setEditingMustDo(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update must-do items');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVeto = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      await updatePlan(planId, { vetoList: editVeto });
      setEditingVeto(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update veto items');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = (field: 'groupVibe' | 'mustDo' | 'veto') => {
    if (!plan) return;
    if (field === 'groupVibe') {
      setEditGroupVibe(plan.groupVibe || '');
      setEditingGroupVibe(false);
    } else if (field === 'mustDo') {
      setEditMustDo(plan.mustDoList || '');
      setEditingMustDo(false);
    } else if (field === 'veto') {
      setEditVeto(plan.vetoList || '');
      setEditingVeto(false);
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
    <div className="space-y-4 md:space-y-6 relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 md:py-8 px-4 md:px-0">
      <TravelDoodles />
      
      {/* Plan Info - Travel Card Style */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl md:rounded-2xl p-5 md:p-8 shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 text-5xl md:text-7xl opacity-10">✈️</div>
        <div className="absolute bottom-0 left-0 text-4xl md:text-6xl opacity-10">🌍</div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl md:text-5xl">🌍</span>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold mb-1 break-words">{plan.destination}</h1>
              <p className="text-blue-100 text-sm md:text-base">Your Adventure Awaits</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2">
              <span className="text-xl">📅</span>
              <div>
                <div className="text-xs text-blue-100">Trip Dates</div>
                <div className="font-semibold text-sm md:text-base">{plan.tripDates}</div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2">
              <span className="text-xl">✅</span>
              <div>
                <div className="text-xs text-blue-100">Status</div>
                <div className="font-semibold text-sm md:text-base capitalize">{plan.status}</div>
              </div>
            </div>
            {plan.itinerary && (
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2">
                <span className="text-xl">🗺️</span>
                <div>
                  <div className="text-xs text-blue-100">Itinerary</div>
                  <div className="font-semibold text-sm md:text-base">Ready</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Aggregated Group Preferences */}
      <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-2xl shadow-xl border-2 border-purple-100">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <span className="text-2xl md:text-3xl">👥</span>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Group Preferences</h2>
        </div>
        
        <div className="space-y-4 md:space-y-6">
          {/* Group Vibe - Editable */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-5 rounded-xl border-l-4 border-blue-400">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base md:text-lg font-semibold text-blue-700 flex items-center gap-2">
                <span>✨</span> Group Vibe
              </h3>
              {!editingGroupVibe ? (
                <button
                  onClick={() => setEditingGroupVibe(true)}
                  className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-semibold bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-lg transition-colors"
                >
                  ✏️ Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveGroupVibe}
                    disabled={saving}
                    className="text-xs md:text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 px-3 py-1 rounded-lg transition-colors"
                  >
                    {saving ? '💾 Saving...' : '💾 Save'}
                  </button>
                  <button
                    onClick={() => handleCancelEdit('groupVibe')}
                    disabled={saving}
                    className="text-xs md:text-sm text-gray-600 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 px-3 py-1 rounded-lg transition-colors"
                  >
                    ✖️ Cancel
                  </button>
                </div>
              )}
            </div>
            {editingGroupVibe ? (
              <textarea
                value={editGroupVibe}
                onChange={(e) => setEditGroupVibe(e.target.value)}
                className="w-full p-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base text-gray-700 min-h-[100px]"
                placeholder="Enter group vibe..."
              />
            ) : (
              <p className="text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                {plan.groupVibe || 'No group vibe set yet'}
              </p>
            )}
          </div>

          {/* Must-Do Items - Editable */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 md:p-5 rounded-xl border-l-4 border-green-400">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base md:text-lg font-semibold text-green-700 flex items-center gap-2">
                <span>✅</span> Must-Do Items
              </h3>
              {!editingMustDo ? (
                <button
                  onClick={() => setEditingMustDo(true)}
                  className="text-xs md:text-sm text-green-600 hover:text-green-700 font-semibold bg-green-100 hover:bg-green-200 px-3 py-1 rounded-lg transition-colors"
                >
                  ✏️ Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveMustDo}
                    disabled={saving}
                    className="text-xs md:text-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 px-3 py-1 rounded-lg transition-colors"
                  >
                    {saving ? '💾 Saving...' : '💾 Save'}
                  </button>
                  <button
                    onClick={() => handleCancelEdit('mustDo')}
                    disabled={saving}
                    className="text-xs md:text-sm text-gray-600 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 px-3 py-1 rounded-lg transition-colors"
                  >
                    ✖️ Cancel
                  </button>
                </div>
              )}
            </div>
            {editingMustDo ? (
              <textarea
                value={editMustDo}
                onChange={(e) => setEditMustDo(e.target.value)}
                className="w-full p-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base text-gray-700 min-h-[80px]"
                placeholder="Enter must-do items (comma-separated)..."
              />
            ) : (
              <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap">
                {plan.mustDoList || 'No must-do items set yet'}
              </p>
            )}
          </div>

          {/* Veto Items - Editable */}
          <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 md:p-5 rounded-xl border-l-4 border-red-400">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base md:text-lg font-semibold text-red-700 flex items-center gap-2">
                <span>🚫</span> Veto Items
              </h3>
              {!editingVeto ? (
                <button
                  onClick={() => setEditingVeto(true)}
                  className="text-xs md:text-sm text-red-600 hover:text-red-700 font-semibold bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors"
                >
                  ✏️ Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveVeto}
                    disabled={saving}
                    className="text-xs md:text-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 px-3 py-1 rounded-lg transition-colors"
                  >
                    {saving ? '💾 Saving...' : '💾 Save'}
                  </button>
                  <button
                    onClick={() => handleCancelEdit('veto')}
                    disabled={saving}
                    className="text-xs md:text-sm text-gray-600 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 px-3 py-1 rounded-lg transition-colors"
                  >
                    ✖️ Cancel
                  </button>
                </div>
              )}
            </div>
            {editingVeto ? (
              <textarea
                value={editVeto}
                onChange={(e) => setEditVeto(e.target.value)}
                className="w-full p-3 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm md:text-base text-gray-700 min-h-[80px]"
                placeholder="Enter veto items (comma-separated)..."
              />
            ) : (
              <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap">
                {plan.vetoList || 'No veto items set yet'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Invite Section (Creator Only) */}
      {isCreator && (
        <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-2xl shadow-xl border-2 border-yellow-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 text-3xl md:text-5xl opacity-10">🎫</div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <span className="text-2xl md:text-3xl">📨</span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Invite Team Members</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Code
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={plan.inviteCode}
                    readOnly
                    className="flex-1 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl py-3 px-4 text-gray-800 font-mono text-lg md:text-xl text-center font-bold shadow-inner"
                  />
                  <button
                    onClick={copyInviteCode}
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-3 px-4 md:px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px]"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-2xl shadow-xl border-2 border-green-100">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <span className="text-2xl md:text-3xl">👨‍👩‍👧‍👦</span>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            Team Members ({members.length})
          </h2>
        </div>
        {members.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">👋</div>
            <p className="text-gray-600">No members yet. Share the invite code to get started!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">👤</div>
                    <div>
                      <div className="font-semibold text-gray-800 text-lg">{member.name}</div>
                      {member.preferences.budget && (
                        <div className="text-sm text-gray-600 mt-1">
                          💰 {member.preferences.budget}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Itinerary (Creator Only) */}
      {isCreator && (
        <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-2xl shadow-xl border-2 border-indigo-100">
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <span className="text-2xl md:text-3xl">✨</span>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Generate Itinerary</h2>
          </div>
          {plan.itinerary ? (
            <div>
              <ItineraryDisplay
                itinerary={plan.itinerary}
                sources={plan.sources || []}
              />
              <button
                onClick={handleGenerateItinerary}
                disabled={generating}
                className="mt-4 md:mt-6 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 md:px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto min-h-[44px] text-sm md:text-base"
              >
                {generating ? '🔄 Regenerating...' : '🔄 Regenerate Itinerary'}
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-gray-600 mb-6 text-lg">
                Generate a personalized itinerary based on your trip details and member preferences.
              </p>
              <button
                onClick={handleGenerateItinerary}
                disabled={generating}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 md:px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-base md:text-lg w-full sm:w-auto min-h-[48px]"
              >
                {generating ? '✨ Generating...' : '✨ Generate Itinerary'}
              </button>
            </div>
          )}

          {generating && (
            <div className="mt-6 text-center">
              <LoadingSpinner />
              <p className="text-gray-600 mt-4">
                ✨ Creating your perfect itinerary... This may take 30-60 seconds.
              </p>
            </div>
          )}
        </div>
      )}

      {/* View Itinerary (Members) */}
      {!isCreator && plan.itinerary && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-indigo-100">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🗺️</span>
            <h2 className="text-2xl font-bold text-gray-800">Trip Itinerary</h2>
          </div>
          <ItineraryDisplay
            itinerary={plan.itinerary}
            sources={plan.sources || []}
          />
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⚠️</span>
            <p className="font-bold text-lg">Error</p>
          </div>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default PlanDashboard;

