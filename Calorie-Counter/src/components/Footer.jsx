import { useBoundStore } from '../store/useBoundStore';
import { CameraIcon } from './icons';

export default function Footer() {
  const toggleWaitlist = useBoundStore((state) => state.toggleWaitlist);
  const setView = useBoundStore((state) => state.setView);

  return (
    <footer className="bg-[#2C3768] text-white relative overflow-hidden">
      {/* Decorative top edge */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00F090] via-[#E92A43] to-[#3CE8E3]" />

      {/* Main footer content */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        {/* CTA banner */}
        <div className="bg-[#00F090]/10 border border-[#00F090]/20 rounded-3xl p-8 lg:p-12 mb-16 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl lg:text-3xl font-black tracking-tight mb-2">
              Ready to start tracking?
            </h3>
            <p className="text-white/60 text-sm font-medium">
              Scan your first plate in under 10 seconds.
            </p>
          </div>
          <button
            onClick={() => setView('scan')}
            className="bg-[#00F090] text-[#2C3768] font-black text-sm px-8 py-4 rounded-full shadow-lg hover:shadow-[0_0_24px_rgba(0,240,144,0.3)] transition-all duration-300 flex items-center gap-2 flex-shrink-0"
          >
            <CameraIcon className="w-5 h-5" />
            Scan Now
          </button>
        </div>

        {/* Footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-16">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[#00F090] transform rotate-12" />
              <span className="text-xl font-black tracking-tight">Kaloriq</span>
            </div>
            <p className="text-white/40 text-xs leading-relaxed max-w-[220px]">
              AI-powered calorie tracking built for Nigerian food. From jollof to suya, every meal counts.
            </p>
          </div>

          {/* Product column */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider text-white/30 mb-4">Product</h4>
            <ul className="space-y-3">
              <li><button onClick={() => setView('scan')} className="text-sm text-white/60 hover:text-[#00F090] transition-colors font-medium">Scan a Plate</button></li>
              <li><button onClick={() => setView('dashboard')} className="text-sm text-white/60 hover:text-[#00F090] transition-colors font-medium">Dashboard</button></li>
              <li><button onClick={toggleWaitlist} className="text-sm text-white/60 hover:text-[#00F090] transition-colors font-medium">Join Waitlist</button></li>
            </ul>
          </div>

          {/* Features column */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider text-white/30 mb-4">Features</h4>
            <ul className="space-y-3">
              <li><span className="text-sm text-white/60 font-medium">AI Dish Recognition</span></li>
              <li><span className="text-sm text-white/60 font-medium">44+ Nigerian Snacks</span></li>
              <li><span className="text-sm text-white/60 font-medium">WAFCT Nutrient Data</span></li>
              <li><span className="text-sm text-white/60 font-medium">Weekly Streak Tracking</span></li>
            </ul>
          </div>

          {/* Legal column */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider text-white/30 mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><span className="text-sm text-white/60 font-medium">Privacy Policy</span></li>
              <li><span className="text-sm text-white/60 font-medium">Terms of Service</span></li>
              <li><span className="text-sm text-white/60 font-medium">Data Sources</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs font-medium">
            &copy; {new Date().getFullYear()} Kaloriq. Built for Lagos, Abuja, and everywhere in between.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider">Powered by FAO WAFCT &middot; Open Food Facts</span>
          </div>
        </div>
      </div>
    </footer>
  );
}