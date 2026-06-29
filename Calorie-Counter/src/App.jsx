import React from 'react';
import Navbar from './components/Navbar';
import HeroSection from './views/HeroSection';
import ProblemSection from './views/ProblemSection';
import CounterSection from './views/CounterSection';
import DecodedSection from './views/DecodedSection';
import StreakSection from './views/StreakSection';
import HowItWorks from './views/HowItWorks';
import { useBoundStore } from './store/useBoundStore';

export default function App() {
  const waitlistOpen = useBoundStore((state) => state.waitlistOpen);
  const toggleWaitlist = useBoundStore((state) => state.toggleWaitlist);

  return (
    <div className="min-h-screen bg-white font-sans text-[#2C3768] relative selection:bg-[#00F090] selection:text-[#2C3768]">
      <Navbar />
      
      <main>
        <HeroSection />
        <ProblemSection />
        <CounterSection />
        <DecodedSection />
        <StreakSection />
        <HowItWorks />
      </main>

      {/* Global Waitlist Popup Modal */}
      {waitlistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C3768]/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] border-2 border-[#2C3768] p-8 max-w-md w-full relative shadow-2xl">
            <button onClick={toggleWaitlist} className="absolute top-4 right-4 text-[#2C3768] font-bold text-lg hover:opacity-70">✕</button>
            <h3 className="text-3xl font-black tracking-tight mb-2">Join the waitlist</h3>
            <p className="text-gray-500 text-sm mb-6 font-medium">Be the first to track local Nigerian dishes with zero estimation guesswork.</p>
            <input type="email" placeholder="Your email address" className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-4 text-sm focus:outline-none focus:border-[#2C3768]" />
            <button className="w-full bg-[#2C3768] text-white font-bold py-3 rounded-xl shadow-md hover:opacity-90 transition-opacity">Get Early Access</button>
          </div>
        </div>
      )}
    </div>
  );
}