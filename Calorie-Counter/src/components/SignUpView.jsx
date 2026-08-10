import { useRef } from 'react';
import { useBoundStore } from '../store/useBoundStore';
import { REAL_FOOD_IMAGES } from '../constants/images';

export default function SignUpView() {
  const setView = useBoundStore((state) => state.setView);
  const signup = useBoundStore((state) => state.signup);
  const nameRef = useRef(null);
  const emailRef = useRef(null);

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] lg:min-h-[75vh]">
      {/* Desktop Brand Panel */}
      <div className="hidden lg:flex lg:w-[380px] xl:w-[420px] bg-[#2C3768] flex-col justify-between p-8 xl:p-10">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#00F090] transform rotate-12" />
            <span className="text-2xl font-black text-white tracking-tight">NaijaCounts</span>
          </div>
          <div className="space-y-6">
            <h3 className="text-white font-black text-2xl tracking-tight leading-tight">
              Track Smarter.<br />Eat Naija.
            </h3>
            <ul className="space-y-4">
              {[
                'Scan any Nigerian dish instantly',
                'Get accurate calorie & macro estimates',
                'Build your personal food diary',
                'Track habits & stay consistent',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#00F090]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] text-[#00F090] font-black">✓</span>
                  </span>
                  <span className="text-sm font-medium text-white/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-auto pt-8">
          <div className="flex gap-3 mb-6">
            {[REAL_FOOD_IMAGES.heroLeft, REAL_FOOD_IMAGES.heroRight, REAL_FOOD_IMAGES.riceBowl].map((img, i) => (
              <div
                key={i}
                className={`w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg ${i === 0 ? 'transform -rotate-6' : i === 1 ? 'transform rotate-3' : 'transform rotate-12'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 p-6 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[#00F090] transform rotate-12" />
              <span className="text-xl font-black tracking-tight">NaijaCounts</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight leading-none mb-3">
              Create Your<br />Naija Account
            </h2>
            <p className="text-gray-500 font-medium text-sm px-4">
              Scan plates, save meals, and learn your macros the Naija way.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); signup(nameRef.current.value, emailRef.current.value); }} className="space-y-4">
            <div className="relative flex items-center">
              <span className="absolute left-4 w-2.5 h-2.5 rounded-full bg-[#00F090]" />
              <input
                ref={nameRef}
                type="text"
                required
                placeholder="Your full name"
                className="w-full pl-10 pr-4 py-4 rounded-2xl border-2 border-gray-100 font-bold text-sm focus:outline-none focus:border-[#2C3768] text-[#2C3768]"
              />
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-4 text-[#E92A43] font-black text-sm">@</span>
              <input
                ref={emailRef}
                type="email"
                required
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-4 rounded-2xl border-2 border-gray-100 font-bold text-sm focus:outline-none focus:border-[#2C3768] text-[#2C3768]"
              />
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-4 w-2 h-2 rounded-full bg-[#FF7A30]" />
              <input
                type="password"
                required
                placeholder="•••••••••••••"
                className="w-full pl-10 pr-4 py-4 rounded-2xl border-2 border-gray-100 font-bold text-sm focus:outline-none focus:border-[#2C3768] text-[#2C3768]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#E92A43] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#E92A43]/20 hover:opacity-95 active:scale-[0.99] transition-all text-base mt-2"
            >
              Sign Up
            </button>
          </form>

          <p className="text-center text-xs font-bold text-gray-500 mt-8">
            Already have an account?{' '}
            <button onClick={() => setView('signin')} className="text-[#2C3768] hover:underline font-black">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}