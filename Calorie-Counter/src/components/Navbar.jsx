import { useState } from 'react';
import { useBoundStore } from '../store/useBoundStore';
import { MenuIcon, XIcon } from './icons';

export default function Navbar() {
  const setView = useBoundStore((state) => state.setView);
  const currentView = useBoundStore((state) => state.currentView);
  const toggleWaitlist = useBoundStore((state) => state.toggleWaitlist);
  const isAuthenticated = useBoundStore((state) => state.isAuthenticated);
  const user = useBoundStore((state) => state.user);
  const signout = useBoundStore((state) => state.signout);
  const [mobileOpen, setMobileOpen] = useState(false);

  const goToPortal = () => {
    const { isAuthenticated: authed } = useBoundStore.getState();
    setView(authed ? 'dashboard' : 'signin');
  };

  const navTo = (view) => {
    setView(view);
    setMobileOpen(false);
  };

  const closeAndSignout = () => {
    setMobileOpen(false);
    signout();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navTo('landing')}>
        <div className="w-8 h-8 rounded-xl bg-[#00F090] transform rotate-12 transition-transform hover:rotate-45 duration-300" />
        <span className="text-2xl font-black font-display text-[#2C3768] tracking-tight">Kaloriq</span>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-[#2C3768]/80">
          <button
            onClick={() => navTo('landing')}
            className={`hover:text-[#E92A43] transition-colors ${currentView === 'landing' ? 'text-[#E92A43] font-bold' : ''}`}
          >
            Scan Overview
          </button>
        </div>

        {isAuthenticated && user ? (
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full pl-1.5 pr-4 py-1.5">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.name || 'User'} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#2C3768] text-white flex items-center justify-center text-xs font-black">
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs font-bold text-[#2C3768] max-w-[120px] truncate">{user.name || user.email}</span>
            </div>
            <button
              onClick={signout}
              className="text-xs font-bold text-[#E92A43] hover:underline"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={goToPortal}
            className="hidden md:block bg-[#2C3768] text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-[0_4px_14px_rgba(44,55,104,0.25)] hover:scale-105 transition-all duration-200"
          >
            My Portal
          </button>
        )}

        <button
          onClick={toggleWaitlist}
          className="hidden md:block bg-[#00F090]/20 border border-[#00F090] text-[#2C3768] text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#00F090] transition-colors duration-200"
        >
          Join Waitlist
        </button>

        <button
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          className="md:hidden w-11 h-11 rounded-xl bg-[#2C3768] text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
        >
          {mobileOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden w-full bg-white/95 border border-gray-100 shadow-xl rounded-2xl p-3 flex flex-col gap-2 animate-fadeIn">
          <button
            onClick={() => navTo('landing')}
            className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-colors ${
              currentView === 'landing' ? 'bg-[#00F090]/20 text-[#2C3768]' : 'bg-gray-50 text-[#2C3768] active:bg-[#00F090]/20'
            }`}
          >
            Scan Overview
          </button>
          <button
            onClick={() => navTo(isAuthenticated ? 'dashboard' : 'signin')}
            className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold bg-gray-50 text-[#2C3768] active:bg-[#00F090]/20 transition-colors"
          >
            My Dashboard
          </button>
          <button
            onClick={() => {
              setMobileOpen(false);
              toggleWaitlist();
            }}
            className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold bg-gray-50 text-[#2C3768] active:bg-[#00F090]/20 transition-colors"
          >
            Join Waitlist
          </button>

          <div className="h-px bg-gray-100 my-1" />

          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-3 px-2 py-1">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name || 'User'} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#2C3768] text-white flex items-center justify-center text-xs font-black">
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-xs font-black text-[#2C3768] block truncate">{user.name || user.email}</span>
                  <span className="text-[10px] font-bold text-gray-400">Signed in</span>
                </div>
              </div>
              <button
                onClick={closeAndSignout}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-[#E92A43] bg-[#E92A43]/5 active:bg-[#E92A43]/15 transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={goToPortal}
              className="w-full bg-[#2C3768] text-white text-sm font-bold px-4 py-3.5 rounded-xl shadow-md active:scale-[0.99] transition-all"
            >
              My Portal
            </button>
          )}
        </div>
      )}
    </nav>
  );
}