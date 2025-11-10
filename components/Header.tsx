
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center p-6 bg-slate-800 text-white">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
        Atlas <span className="text-cyan-400">AI</span>
      </h1>
      <p className="mt-2 text-lg text-slate-300">Your Personal Trip Logistics Coordinator</p>
    </header>
  );
};

export default Header;
