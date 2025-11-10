import React, { useState, useEffect } from 'react';
import { getCreatorPlans } from '../../services/firebase/plans';
import { Plan } from '../../types/plan';
import LoadingSpinner from '../LoadingSpinner';

interface PlansListProps {
  creatorId: string;
  onSelectPlan: (planId: string) => void;
  onCreateNew: () => void;
}

const PlansList: React.FC<PlansListProps> = ({ creatorId, onSelectPlan, onCreateNew }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, [creatorId]);

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const plansList = await getCreatorPlans(creatorId);
      setPlans(plansList);
    } catch (err: any) {
      setError(err.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800 p-6 rounded-xl">
        <p className="text-red-400">{error}</p>
        <button
          onClick={loadPlans}
          className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-100">My Trip Plans</h2>
        <button
          onClick={onCreateNew}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          + Create New Plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-6 text-lg">
            You don't have any trip plans yet.
          </p>
          <button
            onClick={onCreateNew}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
          >
            Create Your First Plan
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => onSelectPlan(plan.id)}
              className="bg-slate-700 p-6 rounded-lg border-2 border-slate-600 hover:border-cyan-500 cursor-pointer transition-colors"
            >
              <h3 className="text-xl font-bold text-white mb-2">{plan.destination}</h3>
              <div className="text-sm text-slate-400 space-y-1 mb-4">
                <p>📅 {plan.tripDates}</p>
                <p>👥 {plan.memberIds?.length || 0} member(s)</p>
                <p>Status: <span className="capitalize">{plan.status}</span></p>
                {plan.itinerary && (
                  <p className="text-cyan-400">✓ Itinerary generated</p>
                )}
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-slate-500">
                  Created {plan.createdAt.toLocaleDateString()}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPlan(plan.id);
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-1.5 px-4 rounded-lg transition-colors text-sm"
                >
                  View Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlansList;

