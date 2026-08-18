import { useRef, useState } from 'react';
import { useBoundStore } from '../store/useBoundStore';
import { resetPassword, getAuthErrorMessage } from '../firebase/auth';
import { CheckIcon, ArrowLeftIcon } from './icons';

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

export default function SignInView() {
  const setView = useBoundStore((state) => state.setView);
  const signin = useBoundStore((state) => state.signin);
  const signinWithGoogle = useBoundStore((state) => state.signinWithGoogle);
  const authLoading = useBoundStore((state) => state.authLoading);
  const authError = useBoundStore((state) => state.authError);
  const clearAuthError = useBoundStore((state) => state.clearAuthError);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [forgotMode, setForgotMode] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [resetError, setResetError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    clearAuthError();
    signin(emailRef.current.value, passwordRef.current.value);
  };

  const handleGoogle = () => {
    clearAuthError();
    signinWithGoogle();
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    const email = emailRef.current.value.trim();
    if (!email) {
      setResetError('Enter your email address first.');
      return;
    }
    setResetting(true);
    setResetError('');
    setResetMsg('');
    try {
      await resetPassword(email);
      setResetMsg('Password reset email sent — check your inbox.');
    } catch (err) {
      setResetError(getAuthErrorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row-reverse min-h-[85vh] lg:min-h-[75vh]">
      {/* Desktop Brand Panel */}
      <div className="hidden lg:flex lg:w-[380px] xl:w-[420px] bg-[#2C3768] flex-col justify-between p-8 xl:p-10">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#00F090] transform rotate-12" />
            <span className="text-2xl font-black text-white tracking-tight">NaijaCounts</span>
          </div>
          <div className="space-y-6">
            <h3 className="text-white font-black text-2xl tracking-tight leading-tight">
              Welcome Back
            </h3>
            <ul className="space-y-3">
              {[
                'Continue your streak',
                "Check today's macros",
                'Log your next meal',
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
              Welcome Back
            </h2>
            <p className="text-gray-500 font-medium text-sm px-6">
              Jump back into your food log and keep your streak alive.
            </p>
          </div>

          {forgotMode ? (
            <form onSubmit={handleForgot} className="space-y-4">
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

              {resetError && (
                <div className="bg-[#E92A43]/10 border border-[#E92A43]/30 text-[#E92A43] text-xs font-bold px-4 py-3 rounded-xl">
                  {resetError}
                </div>
              )}
              {resetMsg && (
                <div className="bg-[#00F090]/10 border border-[#00F090]/30 text-[#2C3768] text-xs font-bold px-4 py-3 rounded-xl">
                  {resetMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={resetting}
                className="w-full bg-[#2C3768] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#2C3768]/20 hover:opacity-95 active:scale-[0.99] transition-all text-base mt-2 disabled:opacity-60"
              >
                {resetting ? 'Sending…' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="w-full text-xs font-black text-[#2C3768] hover:underline text-center flex items-center justify-center gap-1.5"
              >
                <ArrowLeftIcon className="w-4 h-4" /> Back to Sign In
              </button>
            </form>
          ) : (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={authLoading}
                className="w-full bg-white border-2 border-gray-100 hover:bg-gray-50 text-[#2C3768] font-black py-4 rounded-2xl transition-all text-sm flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <GoogleIcon />
                Continue with Google
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
                    placeholder="•••••••••••••"
                    className="w-full pl-10 pr-4 py-4 rounded-2xl border-2 border-gray-100 font-bold text-sm focus:outline-none focus:border-[#2C3768] text-[#2C3768]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-start p-1">
                    <input id="terms" type="checkbox" required defaultChecked className="mt-1 h-4 w-4 rounded border-gray-300 accent-[#2C3768]" />
                    <label htmlFor="terms" className="ml-2 text-[11px] font-bold text-gray-500 leading-tight">
                      I agree to Terms & Condition and Privacy Policy
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => { clearAuthError(); setForgotMode(true); }}
                    className="text-xs font-black text-[#E92A43] hover:underline flex-shrink-0"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-[#2C3768] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#2C3768]/20 hover:opacity-95 active:scale-[0.99] transition-all text-base mt-2 disabled:opacity-60"
                >
                  {authLoading ? 'Signing In…' : 'Sign In'}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-xs font-bold text-gray-500 mt-8">
            I don't have an account?{' '}
            <button onClick={() => setView('signup')} className="text-[#2C3768] hover:underline font-black">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
