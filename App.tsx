import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import CreatePlan from './components/plan/CreatePlan';
import PlanDashboard from './components/plan/PlanDashboard';
import JoinPlan from './components/plan/JoinPlan';
import PlansList from './components/plan/PlansList';
import LandingPage from './components/LandingPage';
import LoadingSpinner from './components/LoadingSpinner';
import BackButton from './components/BackButton';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return <>{children}</>;
};

// Login Page Component
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      navigate('/plans');
    }
  }, [currentUser, navigate]);

  const handleSuccess = () => {
    navigate('/plans');
  };

  return (
    <div className="max-w-md mx-auto">
      <BackButton to="/" label="Back to Home" className="mb-6" />
      <Login
        onSwitchToRegister={() => navigate('/register')}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

// Register Page Component
const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      navigate('/plans');
    }
  }, [currentUser, navigate]);

  const handleSuccess = () => {
    navigate('/plans');
  };

  return (
    <div className="max-w-md mx-auto">
      <BackButton to="/" label="Back to Home" className="mb-6" />
      <Register
        onSwitchToLogin={() => navigate('/login')}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

// Plans List Page Component
const PlansListPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSelectPlan = (planId: string) => {
    navigate(`/plan/${planId}`);
  };

  const handleCreateNew = () => {
    navigate('/create-plan');
  };

  if (!currentUser) return null;

  return (
    <PlansList
      creatorId={currentUser.uid}
      onSelectPlan={handleSelectPlan}
      onCreateNew={handleCreateNew}
    />
  );
};

// Create Plan Page Component
const CreatePlanPage: React.FC = () => {
  const navigate = useNavigate();

  const handlePlanCreated = (planId: string) => {
    navigate(`/plan/${planId}`);
  };

  return (
    <div>
      <BackButton to="/plans" label="Back to Plans" className="mb-6" />
      <CreatePlan onPlanCreated={handlePlanCreated} />
    </div>
  );
};

// Plan Dashboard Page Component
const PlanDashboardPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  if (!planId) {
    return <Navigate to="/plans" replace />;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <BackButton to="/plans" label="Back to Plans" />
        {currentUser && (
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/create-plan')}
              className="text-cyan-400 hover:text-cyan-300 text-sm"
            >
              Create New Plan
            </button>
          </div>
        )}
      </div>
      <PlanDashboard planId={planId} isCreator={!!currentUser} />
    </div>
);
};

// Join Plan Page Component
const JoinPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('code') || undefined;
  const planId = searchParams.get('planId') || undefined;

  const handleJoinSuccess = (planId: string, memberId: string) => {
    navigate(`/plan/${planId}`);
  };

  const handleAuthSuccess = (planId: string, member: any) => {
    navigate(`/plan/${planId}`);
  };

  return (
    <div>
      <BackButton to="/" label="Back to Home" className="mb-6" />
      <JoinPlan
        inviteCode={inviteCode}
        planId={planId}
        onJoinSuccess={handleJoinSuccess}
        onAuthSuccess={handleAuthSuccess}
        />
    </div>
);
};

// Landing Page Component
const LandingPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      navigate('/plans');
    }
  }, [currentUser, navigate]);

  return (
    <LandingPage onGetStarted={() => navigate('/login')} />
  );
};

const App: React.FC = () => {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-800 font-sans">
      <Routes>
        {/* Landing Page - No Header */}
        <Route path="/" element={<LandingPageWrapper />} />

        {/* Auth Routes */}
        <Route 
          path="/login" 
          element={
            <>
              <Header showAuthButtons={false} />
            <main className="p-4 md:p-8">
                <div className="max-w-6xl mx-auto">
                  <LoginPage />
                                </div>
              </main>
            </>
          } 
        />
        <Route 
          path="/register" 
          element={
            <>
              <Header showAuthButtons={false} />
              <main className="p-4 md:p-8">
                <div className="max-w-6xl mx-auto">
                  <RegisterPage />
                                </div>
              </main>
            </>
          } 
        />

        {/* Join Plan - Public Route */}
        <Route 
          path="/join" 
          element={
            <>
              <Header showAuthButtons={false} />
              <main className="p-4 md:p-8">
                <div className="max-w-6xl mx-auto">
                  <JoinPlanPage />
                        </div>
              </main>
            </>
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/plans"
          element={
            <>
              <Header showAuthButtons={true} />
              <main className="p-4 md:p-8">
                <div className="max-w-6xl mx-auto">
                  <ProtectedRoute>
                    <PlansListPage />
                  </ProtectedRoute>
                            </div>
              </main>
            </>
          }
        />
        <Route
          path="/create-plan"
          element={
            <>
              <Header showAuthButtons={true} />
              <main className="p-4 md:p-8">
                <div className="max-w-6xl mx-auto">
                  <ProtectedRoute>
                    <CreatePlanPage />
                  </ProtectedRoute>
                        </div>
              </main>
            </>
          }
        />
        <Route
          path="/plan/:planId"
          element={
            <>
              <Header showAuthButtons={true} />
              <main className="p-4 md:p-8">
                <div className="max-w-6xl mx-auto">
                  <PlanDashboardPage />
                </div>
            </main>
            </>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
        </div>
    );
};

export default App;
