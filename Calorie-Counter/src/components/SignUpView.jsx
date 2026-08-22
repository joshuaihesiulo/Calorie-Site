import { useRef } from 'react';
import { useBoundStore } from '../store/useBoundStore';
import { REAL_FOOD_IMAGES } from '../constants/images';
import { CheckIcon } from './icons';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function SignUpView() {
  const setView = useBoundStore((state) => state.setView);
  const signup = useBoundStore((state) => state.signup);
  const signinWithGoogle = useBoundStore((state) => state.signinWithGoogle);
  const authLoading = useBoundStore((state) => state.authLoading);
  const authError = useBoundStore((state) => state.authError);
  const clearAuthError = useBoundStore((state) => state.clearAuthError);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    clearAuthError();
    signup(nameRef.current.value, emailRef.current.value, passwordRef.current.value);
  };

  const handleGoogle = () => {
    clearAuthError();
    signinWithGoogle();
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] lg:min-h-[75vh]">
      {/* Desktop Brand Panel */}
      <div className="hidden lg:flex lg:w-[380px] xl:w-[420px] bg-[#2C3768] flex-col justify-between p-8 xl:p-10">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#00F090] transform rotate-12" />
            <span className="text-2xl font-black text-white tracking-tight">Kaloriq</span>
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
                    <CheckIcon className="w-3 h-3 text-[#00F090]" />
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
              <span className="text-xl font-black tracking-tight">Kaloriq</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight leading-none mb-3">
              Create Your<br />Naija Account
            </h2>
            <p className="text-gray-500 font-medium text-sm px-4">
              Scan plates, save meals, and learn your macros the Naija way.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={authLoading}
            className="w-full bg-white border-2 border-gray-100 hover:bg-gray-50 text-[#2C3768] font-black py-4 rounded-2xl transition-all text-sm flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <GoogleIcon />
            Sign Up with Google
          </button>

          <div className="flex items-center gap-3 my-6">
            <span className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">or use email</span>
            <span className="flex-1 h-px bg-gray-100" />
          </div>

          {authError && (
            <div className="bg-[#E92A43]/10 border border-[#E92A43]/30 text-[#E92A43] text-xs font-bold px-4 py-3 rounded-xl mb-4">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                ref={passwordRef}
                type="password"
                required
                minLength={6}
                placeholder="Password (min 6 characters)"
                className="w-full pl-10 pr-4 py-4 rounded-2xl border-2 border-gray-100 font-bold text-sm focus:outline-none focus:border-[#2C3768] text-[#2C3768]"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-[#E92A43] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#E92A43]/20 hover:opacity-95 active:scale-[0.99] transition-all text-base mt-2 disabled:opacity-60 disabled:hover:opacity-60"
            >
              {authLoading ? 'Creating Account…' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center text-xs font-bold text-gray-500 mt-6">
            We'll email you a verification link. You can also sign in with Google.
          </p>

          <p className="text-center text-xs font-bold text-gray-500 mt-4">
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
