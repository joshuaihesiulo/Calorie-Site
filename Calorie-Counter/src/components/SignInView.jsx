import React from 'react';
import { useBoundStore } from '../store/useBoundStore';

export default function SignInView() {
  const setView = useBoundStore((state) => state.setView);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-[2.5rem] border border-gray-100 p-8 my-8 shadow-xl text-[#2C3768]">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black tracking-tight leading-none mb-3">
          Hi Jason,<br />Welcome Back
        </h2>
        <p className="text-gray-500 font-medium text-sm px-6">
          Jump back into your food log and keep your streak alive.
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setView('dashboard'); }} className="space-y-4">
        <div className="relative flex items-center">
          <span className="absolute left-4 text-[#E92A43] font-black text-sm">@</span>
          <input 
            type="email" 
            required
            defaultValue="Jason.Ground@gmail.com"
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

        <div className="flex items-start p-1">
          <input id="terms" type="checkbox" required defaultChecked className="mt-1 h-4 w-4 rounded border-gray-300 accent-[#2C3768]" />
          <label htmlFor="terms" className="ml-2 text-[11px] font-bold text-gray-500 leading-tight">
            I agree to Terms & Condition and Privacy Policy
          </label>
        </div>

        <button 
          type="submit" 
          className="w-full bg-[#2C3768] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#2C3768]/20 hover:opacity-95 active:scale-[0.99] transition-all text-base mt-2"
        >
          Sign In
        </button>
      </form>

      <div className="relative flex py-5 items-center justify-center my-4">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink mx-4 text-[10px] font-black text-[#2C3768]/60 uppercase tracking-wider">Or Continue With</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="flex items-center justify-center gap-2 bg-[#FFF4CA] py-3.5 rounded-2xl font-bold text-xs border border-[#FFF4CA] shadow-sm text-[#2C3768] hover:opacity-90">
          <span className="text-blue-600 font-bold">G</span> Google ID
        </button>
        <button className="flex items-center justify-center gap-2 bg-[#FFF4CA] py-3.5 rounded-2xl font-bold text-xs border border-[#FFF4CA] shadow-sm text-[#2C3768] hover:opacity-90">
          <span className="text-black font-bold"></span> Apple ID
        </button>
      </div>

      <p className="text-center text-xs font-bold text-gray-500 mt-8">
        I don't have an account?{' '}
        <button onClick={() => setView('signup')} className="text-[#2C3768] hover:underline font-black">
          Sign Up
        </button>
      </p>
    </div>
  );
}