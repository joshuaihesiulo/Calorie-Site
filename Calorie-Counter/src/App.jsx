import { useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './views/HeroSection';
import ProblemSection from './views/ProblemSection';
import CounterSection from './views/CounterSection';
import DecodedSection from './views/DecodedSection';
import StreakSection from './views/StreakSection';
import HowItWorks from './views/HowItWorks';
import { useBoundStore } from './store/useBoundStore';
import { watchAuthState } from './firebase/auth';
import { XIcon } from './components/icons';

// Interactive App Flow Views
import SignUpView from './components/SignUpView';
import SignInView from './components/SignInView';
import ScanView from './components/ScanView';
import ScanResultView from './components/ScanResultView';
import DailyDashboardView from './components/DailyDashboardView';

export default function App() {
  const waitlistOpen = useBoundStore((state) => state.waitlistOpen);
  const toggleWaitlist = useBoundStore((state) => state.toggleWaitlist);
  const currentView = useBoundStore((state) => state.currentView);
  const setView = useBoundStore((state) => state.setView);
  const isAuthenticated = useBoundStore((state) => state.isAuthenticated);

  useEffect(() => {
    const unsubscribe = watchAuthState((user) => useBoundStore.getState().setAuthUser(user));
    return unsubscribe;
  }, []);

  const goToPortal = () => {
    const { isAuthenticated: authed } = useBoundStore.getState();
    setView(authed ? 'dashboard' : 'signin');
  };

  // Signed-in users never see the auth screens — route them straight to their dashboard.
  const effectiveView =
    isAuthenticated && (currentView === 'signin' || currentView === 'signup') ? 'dashboard' : currentView;

  return (
    <div className="min-h-screen bg-white font-sans text-[#2C3768] relative selection:bg-[#00F090] selection:text-[#2C3768]">
      <Navbar />
      
      {currentView === 'landing' ? (
        <main>
          <div className="relative">
            <HeroSection />
            <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
              <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 px-6">
                <div className="lg:col-span-6 lg:col-start-4 text-center flex flex-col items-center">
                  <div className="mt-[27.5rem] sm:mt-[21.5rem] flex flex-col sm:flex-row gap-4 w-full justify-center pointer-events-auto">
                    <button 
                      onClick={goToPortal}
                      className="bg-transparent text-transparent pointer-events-auto w-full sm:w-52 h-14 cursor-pointer rounded-2xl"
                      title="Launch App Workspace"
                    >
                      Sign Up Trigger Intercept
                    </button>
                    <button 
                      onClick={() => setView('signin')}
                      className="bg-transparent text-transparent pointer-events-auto w-full sm:w-52 h-14 cursor-pointer rounded-2xl"
                      title="Login Portal"
                    >
                      Sign In Trigger Intercept
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <ProblemSection />
          <CounterSection />
          <DecodedSection />
          <StreakSection />
          <HowItWorks />
        </main>
      ) : (
        <main className="bg-[#F9F8F4] py-8 sm:py-12 px-4 min-h-[90vh] flex items-center justify-center transition-all duration-300">
          <div className="w-full max-w-md lg:max-w-5xl xl:max-w-6xl bg-white rounded-[2rem] lg:rounded-[3rem] shadow-[0_24px_60px_rgba(44,55,104,0.12)] border-4 border-[#2C3768]/10 overflow-hidden">
            {effectiveView === 'signup' && <SignUpView />}
            {effectiveView === 'signin' && <SignInView />}
            {effectiveView === 'scan' && <ScanView />}
            {effectiveView === 'result' && <ScanResultView />}
            {effectiveView === 'dashboard' && <DailyDashboardView />}
          </div>
        </main>
      )}

      {waitlistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C3768]/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] border-2 border-[#2C3768] p-8 max-w-md w-full relative shadow-2xl">
            <button onClick={toggleWaitlist} className="absolute top-4 right-4 text-[#2C3768] hover:opacity-70" aria-label="Close waitlist dialog">
              <XIcon className="w-5 h-5" />
            </button>
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