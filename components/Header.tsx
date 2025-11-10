
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onLogout?: () => void;
  showAuthButtons?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onLogout, showAuthButtons = false }) => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  return (
    <header className="bg-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-center flex-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Atlas <span className="text-cyan-400">AI</span>
          </h1>
          <p className="mt-1 text-sm md:text-base text-slate-300">
            Your Personal Trip Logistics Coordinator
          </p>
        </div>
        {showAuthButtons && currentUser && (
          <div className="flex items-center gap-4">
            <span className="text-slate-300 text-sm">{currentUser.email}</span>
            <button
              onClick={handleLogout}
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
