import { useBoundStore } from '../store/useBoundStore';

export default function Navbar() {
  const setView = useBoundStore((state) => state.setView);
  const currentView = useBoundStore((state) => state.currentView);
  const toggleWaitlist = useBoundStore((state) => state.toggleWaitlist);
  const isAuthenticated = useBoundStore((state) => state.isAuthenticated);
  const user = useBoundStore((state) => state.user);
  const signout = useBoundStore((state) => state.signout);

  const goToPortal = () => {
    const { isAuthenticated: authed } = useBoundStore.getState();
    setView(authed ? 'dashboard' : 'signin');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
        <div className="w-8 h-8 rounded-xl bg-[#00F090] transform rotate-12 transition-transform hover:rotate-45 duration-300" />
        <span className="text-2xl font-black text-[#2C3768] tracking-tight">NaijaCounts</span>
      </div>
      
      <div className="flex flex-wrap items-center gap-4">
        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-[#2C3768]/80">
          <button 
            onClick={() => setView('landing')} 
            className={`hover:text-[#E92A43] transition-colors ${currentView === 'landing' ? 'text-[#E92A43] font-bold' : ''}`}
          >
            Scan Overview
          </button>
        </div>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
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
            className="bg-[#2C3768] text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-[0_4px_14px_rgba(44,55,104,0.25)] hover:scale-105 transition-all duration-200"
          >
            My Portal
          </button>
        )}

        <button 
          onClick={toggleWaitlist}
          className="bg-[#00F090]/20 border border-[#00F090] text-[#2C3768] text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#00F090] transition-colors duration-200"
        >
          Join Waitlist
        </button>
      </div>
    </nav>
  );
}