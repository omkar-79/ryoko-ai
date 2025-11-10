import React from 'react';

interface TravelDoodlesProps {
  className?: string;
}

const TravelDoodles: React.FC<TravelDoodlesProps> = ({ className = '' }) => {
  return (
    <div className={`absolute pointer-events-none hidden md:block ${className}`}>
      {/* Airplane */}
      <div className="absolute top-10 right-10 text-3xl md:text-4xl opacity-10 md:opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>
        ✈️
      </div>
      {/* Suitcase */}
      <div className="absolute top-20 left-10 text-2xl md:text-3xl opacity-10 md:opacity-20 animate-pulse" style={{ animationDuration: '2s' }}>
        🧳
      </div>
      {/* Camera */}
      <div className="absolute bottom-10 right-20 text-2xl md:text-3xl opacity-10 md:opacity-20 animate-bounce" style={{ animationDuration: '4s' }}>
        📷
      </div>
      {/* Map */}
      <div className="absolute bottom-20 left-20 text-2xl md:text-3xl opacity-10 md:opacity-20 animate-pulse" style={{ animationDuration: '2.5s' }}>
        🗺️
      </div>
      {/* Sun */}
      <div className="absolute top-5 left-1/2 text-2xl md:text-3xl opacity-10 md:opacity-20 animate-spin" style={{ animationDuration: '10s' }}>
        ☀️
      </div>
    </div>
  );
};

export default TravelDoodles;

