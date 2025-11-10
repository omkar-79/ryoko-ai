import React, { useState, useEffect } from 'react';
import { getPlanByInviteCode, getPlan } from '../../services/firebase/plans';
import { checkMemberExists, createMember, authenticateMember, getPlanMembers } from '../../services/firebase/members';
import { Plan } from '../../types/plan';
import { CreateMemberData, MemberPreferences, MemberPublic } from '../../types/member';
import { validatePasscode } from '../../utils/passcode';
import LoadingSpinner from '../LoadingSpinner';

interface JoinPlanProps {
  inviteCode?: string;
  planId?: string;
  onJoinSuccess: (planId: string, memberId: string) => void;
  onAuthSuccess?: (planId: string, member: MemberPublic) => void;
}

type Step = 'code' | 'member-list' | 'passcode' | 'form';

const JoinPlan: React.FC<JoinPlanProps> = ({ inviteCode, planId, onJoinSuccess, onAuthSuccess }) => {
  const [code, setCode] = useState(inviteCode || '');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [members, setMembers] = useState<MemberPublic[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberPublic | null>(null);
  const [step, setStep] = useState<Step>('code');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [preferences, setPreferences] = useState<MemberPreferences>({
    budget: '',
    interests: [],
    dietary: [],
    accessibility: [],
    mustDo: [],
    veto: [],
  });

  // If planId is provided, load plan directly
  useEffect(() => {
    if (planId && !inviteCode) {
      loadPlanById(planId);
    }
  }, [planId]);

  const loadPlanById = async (planId: string) => {
    setLoading(true);
    setError(null);
    try {
      const planData = await getPlan(planId);
      if (planData) {
        setPlan(planData);
        const membersList = await getPlanMembers(planId);
        setMembers(membersList);
        // Show member list if members exist, otherwise show form
        setStep(membersList.length > 0 ? 'member-list' : 'form');
      } else {
        setError('Plan not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const planData = await getPlanByInviteCode(code.toUpperCase());
      if (planData) {
        setPlan(planData);
        const membersList = await getPlanMembers(planData.id);
        setMembers(membersList);
        // Show member list if members exist, otherwise show form
        setStep(membersList.length > 0 ? 'member-list' : 'form');
      } else {
        setError('Invalid invite code. Please check and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSelect = (member: MemberPublic) => {
    setSelectedMember(member);
    setStep('passcode');
  };

  const handlePasscodeAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passcode || !plan || !selectedMember) {
      setError('Please enter your passcode');
      return;
    }

    setLoading(true);

    try {
      const member = await authenticateMember({
        planId: plan.id,
        name: selectedMember.name,
        passcode,
      });

      if (onAuthSuccess) {
        onAuthSuccess(plan.id, member);
      } else {
        onJoinSuccess(plan.id, member.id);
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect passcode. Please try again.');
      setLoading(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passcode
    const passcodeValidation = validatePasscode(passcode);
    if (!passcodeValidation.valid) {
      setError(passcodeValidation.error || 'Invalid passcode');
      return;
    }

    if (passcode !== confirmPasscode) {
      setError('Passcodes do not match');
      return;
    }

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!plan) {
      setError('Plan not loaded');
      return;
    }

    // Check if member already exists
    const exists = await checkMemberExists(plan.id, name.trim());
    if (exists) {
      setError('A member with this name already exists. Please go back and select your name from the list.');
      return;
    }

    setLoading(true);

    try {
      const memberData: CreateMemberData = {
        planId: plan.id,
        name: name.trim(),
        passcode,
        preferences,
      };

      const memberId = await createMember(memberData);
      
      // Only redirect on success
      setLoading(false);
      onJoinSuccess(plan.id, memberId);
    } catch (err: any) {
      console.error('Error joining plan:', err);
      setError(err.message || 'Failed to join plan. Please try again.');
      setLoading(false);
    }
  };

  // Loading state
  if (loading && !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <LoadingSpinner />
      </div>
    );
  }

  // Step 1: Enter Invite Code
  if (step === 'code') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 md:p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Join Trip Plan
              </h2>
              <p className="text-gray-600">
                Enter the invite code shared by the plan creator
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCodeSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  maxLength={8}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl font-mono tracking-widest"
                  placeholder="ABC123"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !code}
                className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                {loading ? 'Loading...' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Member List (if members exist)
  if (step === 'member-list') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 md:p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Welcome to {plan?.destination || 'Trip Plan'}
              </h2>
              <p className="text-gray-600">
                Select your name if you've joined before, or join as a new member
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {members.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Returning Members</h3>
                <div className="space-y-3">
                  {members.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleMemberSelect(member)}
                      className="w-full text-left p-4 rounded-lg border-2 border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <div className="font-semibold text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setStep('code')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex-1 bg-black hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Join as New Member
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Passcode Entry (for returning members)
  if (step === 'passcode') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 md:p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {selectedMember?.name}!
              </h2>
              <p className="text-gray-600">
                Enter your passcode to access the plan
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handlePasscodeAuth} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Passcode
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  required
                  maxLength={6}
                  autoFocus
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl font-mono tracking-widest"
                  placeholder="••••"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep('member-list');
                    setPasscode('');
                    setSelectedMember(null);
                    setError(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !passcode}
                  className="flex-1 bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? 'Authenticating...' : 'Access Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Join Form (for new members)
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Join {plan?.destination || 'Trip Plan'}
            </h2>
            <p className="text-gray-600">
              Enter your details to join this trip plan
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleJoinSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="John Doe"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Set Passcode (4-6 digits) <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="1234"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You'll use this to access the plan later
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Passcode <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="1234"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Budget Range (optional)
              </label>
              <input
                type="text"
                value={preferences.budget || ''}
                onChange={(e) => setPreferences({ ...preferences, budget: e.target.value })}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., $100-200 per day"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Interests (optional)
              </label>
              <input
                type="text"
                value={preferences.interests?.join(', ') || ''}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    interests: e.target.value.split(',').map((i) => i.trim()).filter(Boolean),
                  })
                }
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., food, culture, adventure"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dietary Restrictions (optional)
              </label>
              <input
                type="text"
                value={preferences.dietary?.join(', ') || ''}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    dietary: e.target.value.split(',').map((d) => d.trim()).filter(Boolean),
                  })
                }
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., vegetarian, no seafood"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Must-Do Items (optional)
              </label>
              <textarea
                value={preferences.mustDo?.join(', ') || ''}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    mustDo: e.target.value.split(',').map((m) => m.trim()).filter(Boolean),
                  })
                }
                rows={2}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="e.g., Visit Eiffel Tower, try local cuisine"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Veto Items (optional)
              </label>
              <textarea
                value={preferences.veto?.join(', ') || ''}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    veto: e.target.value.split(',').map((v) => v.trim()).filter(Boolean),
                  })
                }
                rows={2}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="e.g., No museums, no early mornings"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  if (members.length > 0) {
                    setStep('member-list');
                  } else {
                    setStep('code');
                  }
                  setName('');
                  setPasscode('');
                  setConfirmPasscode('');
                  setError(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !name || !passcode}
                className="flex-1 bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? 'Joining...' : 'Join Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinPlan;
