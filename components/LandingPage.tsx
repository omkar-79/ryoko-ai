import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      navigate(`/join?code=${inviteCode.trim().toUpperCase()}`);
    }
  };

  // Travel destination images - using Unsplash for high-quality travel photos
  const destinations = [
    {
      name: 'Tokyo',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
      alt: 'Tokyo skyline at night'
    },
    {
      name: 'Paris',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
      alt: 'Eiffel Tower in Paris'
    },
    {
      name: 'New York',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop',
      alt: 'New York City skyline'
    },
    {
      name: 'Bali',
      image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&h=600&fit=crop',
      alt: 'Bali tropical beach'
    },
    {
      name: 'Santorini',
      image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&h=600&fit=crop',
      alt: 'Santorini white buildings'
    },
    {
      name: 'Dubai',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
      alt: 'Dubai modern architecture'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Create Your Plan',
      description: 'Set your destination, dates, and vibe. Tell us what you\'re into and what you want to avoid.'
    },
    {
      number: '02',
      title: 'Invite Your Squad',
      description: 'Share an invite code with your friends. They add their preferences and you all plan together.'
    },
    {
      number: '03',
      title: 'Get Your Itinerary',
      description: 'We generate a personalized day-by-day plan with hotels, activities, and hidden gems tailored to your group.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Simple Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Ryoko AI
            </div>
            <div className="flex gap-4">
              <button
                onClick={onGetStarted}
                className="text-gray-700 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={onGetStarted}
                className="bg-black text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-800 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4 md:px-8">
        {/* Doodles - subtle and tasteful */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-10 w-32 h-32 border-2 border-blue-200 rounded-full opacity-20 rotate-45"></div>
          <div className="absolute bottom-20 left-10 w-24 h-24 border-2 border-purple-200 rounded-full opacity-20"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 border-2 border-pink-200 rounded-full opacity-20"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Plan trips that actually hit
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Stop the group chat chaos. Get a real itinerary that everyone actually wants to follow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onGetStarted}
                className="bg-black text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Join with Invite Code Section */}
          <div className="mt-12 max-w-md mx-auto">
            <div className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                Have an invite code?
              </h3>
              <form onSubmit={handleJoinWithCode} className="space-y-3">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter invite code"
                  maxLength={8}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
                />
                <button
                  type="submit"
                  disabled={!inviteCode.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Join Plan
                </button>
              </form>
            </div>
          </div>

          {/* Destination Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-16">
            {destinations.map((dest, index) => (
              <div
                key={index}
                className="relative group overflow-hidden rounded-2xl aspect-[4/3] cursor-pointer"
              >
                <img
                  src={dest.image}
                  alt={dest.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-bold text-lg">{dest.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three steps to your perfect trip
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-6xl md:text-7xl font-bold text-gray-100 absolute -top-4 -left-2 z-0">
                  {step.number}
                </div>
                <div className="relative z-10 bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 md:px-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Group planning made simple
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Everyone adds their must-dos and vetoes. We combine it all into one cohesive plan that works for the whole group.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <span className="text-gray-700">Real-time collaboration with your travel squad</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <span className="text-gray-700">AI-powered recommendations based on your vibe</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <span className="text-gray-700">Detailed day-by-day itineraries with maps</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-gray-100">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      A
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Alex</div>
                      <div className="text-sm text-gray-600">Budget: $100-200/day</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                      S
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Sam</div>
                      <div className="text-sm text-gray-600">Interests: Food, Art</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold">
                      J
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Jordan</div>
                      <div className="text-sm text-gray-600">Must-do: Beach time</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to plan your next adventure?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who've ditched the spreadsheets and group chat chaos.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white text-black px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start Planning
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

