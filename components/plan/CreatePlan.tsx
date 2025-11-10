import React, { useState } from 'react';
import { createPlan } from '../../services/firebase/plans';
import { CreatePlanData } from '../../types/plan';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

interface CreatePlanProps {
  onPlanCreated: (planId: string) => void;
}

const CreatePlan: React.FC<CreatePlanProps> = ({ onPlanCreated }) => {
  const { currentUser } = useAuth();
  const [destination, setDestination] = useState('');
  const [tripDates, setTripDates] = useState('');
  const [groupVibe, setGroupVibe] = useState('');
  const [mustDoList, setMustDoList] = useState('');
  const [vetoList, setVetoList] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setError('You must be logged in to create a plan');
      return;
    }

    setLoading(true);

    try {
      const planData: CreatePlanData = {
        destination,
        tripDates,
        groupVibe,
        mustDoList,
        vetoList,
      };

      const planId = await createPlan(currentUser.uid, planData);
      onPlanCreated(planId);
    } catch (err: any) {
      setError(err.message || 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  const isFormIncomplete = !destination || !tripDates || !groupVibe;

  return (
    <div className="bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-slate-100">Create Group Trip Plan</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-800/50 border border-red-600 text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Destination <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="e.g., Tokyo, Japan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Trip Dates <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={tripDates}
              onChange={(e) => setTripDates(e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="e.g., July 10-17, 2024"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Group Vibe <span className="text-red-400">*</span>
          </label>
          <textarea
            value={groupVibe}
            onChange={(e) => setGroupVibe(e.target.value)}
            required
            rows={3}
            className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="e.g., Relaxed, foodie, adventure-seekers on a moderate budget"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Must-Do List (optional)
          </label>
          <textarea
            value={mustDoList}
            onChange={(e) => setMustDoList(e.target.value)}
            rows={2}
            className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="e.g., Visit the Eiffel Tower, eat croissants"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Veto List (optional)
          </label>
          <textarea
            value={vetoList}
            onChange={(e) => setVetoList(e.target.value)}
            rows={2}
            className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="e.g., No museums, no seafood"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || isFormIncomplete}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg shadow-lg"
          >
            {loading ? 'Creating Plan...' : 'Create Plan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePlan;

