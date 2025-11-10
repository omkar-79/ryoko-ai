import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import CreatePlan from './components/plan/CreatePlan';
import PlanDashboard from './components/plan/PlanDashboard';
import JoinPlan from './components/plan/JoinPlan';
import PlansList from './components/plan/PlansList';
import LoadingSpinner from './components/LoadingSpinner';

type View =
  | 'auth'
  | 'login'
  | 'register'
  | 'plans-list'
  | 'create-plan'
  | 'plan-dashboard'
  | 'join-plan'
  | 'member-view';

const App: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [view, setView] = useState<View>('auth');
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Check URL for magic link or invite code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('planId') || window.location.pathname.split('/join/')[1]?.split('?')[0];
    const code = urlParams.get('code');

    if (planId) {
      setCurrentPlanId(planId);
      setView('join-plan');
    } else if (code) {
      setInviteCode(code);
      setView('join-plan');
    }
  }, []);

  // Determine initial view based on auth state
  useEffect(() => {
    if (authLoading) return;

    if (currentUser) {
      // User is logged in - show plans list or dashboard
      if (currentPlanId) {
        setView('plan-dashboard');
      } else {
        setView('plans-list');
      }
    } else {
      // Not logged in - check if joining a plan
      if (currentPlanId || inviteCode) {
        setView('join-plan');
      } else {
        setView('auth');
      }
    }
  }, [currentUser, authLoading, currentPlanId, inviteCode]);

  const handleAuthSuccess = () => {
    setView('plans-list');
  };

  const handlePlanCreated = (planId: string) => {
    setCurrentPlanId(planId);
    setView('plan-dashboard');
  };

  const handleJoinSuccess = (planId: string, memberId: string) => {
    setCurrentPlanId(planId);
    setCurrentMemberId(memberId);
    setView('member-view');
  };

  const handleMemberAuthSuccess = (planId: string, member: any) => {
    setCurrentPlanId(planId);
    setCurrentMemberId(member.id);
    setView('member-view');
  };

  const handleLogout = () => {
    setCurrentPlanId(null);
    setCurrentMemberId(null);
    setView('auth');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans">
      <Header
        showAuthButtons={currentUser !== null}
        onLogout={handleLogout}
      />
            <main className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Auth Views */}
          {view === 'auth' && (
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-2xl font-bold text-slate-100 mb-4">
                Welcome to Atlas AI Trip Planner
              </h2>
              <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
                <div className="bg-slate-800 p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-slate-100 mb-2">Create a Plan</h3>
                  <p className="text-slate-400 mb-4">
                    Register or login to create and manage group trip plans
                  </p>
                  <button
                    onClick={() => setView('login')}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-colors mb-2"
                  >
                    Login / Register
                  </button>
                                </div>
                <div className="bg-slate-800 p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-slate-100 mb-2">Join a Plan</h3>
                  <p className="text-slate-400 mb-4">
                    Enter an invite code to join an existing trip plan
                  </p>
                  <button
                    onClick={() => setView('join-plan')}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    Join Plan
                                    </button>
                                </div>
              </div>
                        </div>
                    )}

          {view === 'login' && (
            <Login
              onSwitchToRegister={() => setView('register')}
              onSuccess={handleAuthSuccess}
            />
          )}

          {view === 'register' && (
            <Register
              onSwitchToLogin={() => setView('login')}
              onSuccess={handleAuthSuccess}
            />
          )}

          {/* Plan Creator Views */}
          {view === 'plans-list' && currentUser && (
            <div>
              <PlansList
                creatorId={currentUser.uid}
                onSelectPlan={handlePlanCreated}
                onCreateNew={() => setView('create-plan')}
              />
            </div>
          )}

          {view === 'create-plan' && currentUser && (
            <div>
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-100">Create New Plan</h2>
                <button
                  onClick={() => setView('plans-list')}
                  className="text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  Back to Plans
                </button>
              </div>
              <CreatePlan onPlanCreated={handlePlanCreated} />
            </div>
          )}

          {view === 'plan-dashboard' && currentPlanId && currentUser && (
                        <div>
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-100">Plan Dashboard</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setCurrentPlanId(null);
                      setView('plans-list');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 text-sm"
                  >
                    My Plans
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPlanId(null);
                      setView('create-plan');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 text-sm"
                  >
                    Create New Plan
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-slate-300 text-sm"
                  >
                    Logout
                  </button>
                </div>
              </div>
              <PlanDashboard planId={currentPlanId} isCreator={true} />
            </div>
          )}

          {/* Member Views */}
          {view === 'join-plan' && (
            <div>
              <div className="mb-6">
                <button
                  onClick={() => setView('auth')}
                  className="text-cyan-400 hover:text-cyan-300 text-sm mb-4"
                >
                  ← Back to Home
                </button>
              </div>
              <JoinPlan
                inviteCode={inviteCode || undefined}
                planId={currentPlanId || undefined}
                onJoinSuccess={handleJoinSuccess}
                onAuthSuccess={handleMemberAuthSuccess}
              />
            </div>
          )}


          {view === 'member-view' && currentPlanId && (
            <div>
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-100">Trip Plan</h2>
                <button
                  onClick={() => {
                    setCurrentPlanId(null);
                    setCurrentMemberId(null);
                    setView('auth');
                  }}
                  className="text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  Leave Plan
                </button>
              </div>
              <PlanDashboard planId={currentPlanId} isCreator={false} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;
