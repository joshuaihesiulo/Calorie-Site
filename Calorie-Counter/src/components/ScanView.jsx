import React, { useState } from 'react';
import { useBoundStore } from '../store/useBoundStore';
import { REAL_FOOD_IMAGES } from '../constants/images';

const RECENT_SCANS = [
  { id: 1, image: REAL_FOOD_IMAGES.heroLeft, label: 'Amala' },
  { id: 2, image: REAL_FOOD_IMAGES.heroRight, label: 'Jollof Rice' },
  { id: 3, image: REAL_FOOD_IMAGES.riceBowl, label: 'Fried Rice' },
  { id: 4, image: REAL_FOOD_IMAGES.suyaSmoke, label: 'Suya' },
];

export default function ScanView() {
  const setView = useBoundStore((state) => state.setView);
  const [flashOn, setFlashOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  const handleCapture = () => {
    const imgs = [REAL_FOOD_IMAGES.heroLeft, REAL_FOOD_IMAGES.heroRight, REAL_FOOD_IMAGES.riceBowl, REAL_FOOD_IMAGES.suyaSmoke];
    setCapturedImage(imgs[Math.floor(Math.random() * imgs.length)]);
    setTimeout(() => setView('result'), 800);
  };

  const handleGallery = () => {
    const imgs = [REAL_FOOD_IMAGES.heroLeft, REAL_FOOD_IMAGES.heroRight, REAL_FOOD_IMAGES.riceBowl, REAL_FOOD_IMAGES.suyaSmoke];
    setCapturedImage(imgs[Math.floor(Math.random() * imgs.length)]);
    setTimeout(() => setView('result'), 800);
  };

  return (
    <div className="flex flex-col min-h-[85vh] lg:min-h-[75vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-5 lg:p-7 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setView('dashboard')} className="w-9 h-9 rounded-xl bg-[#FFF4CA] flex items-center justify-center text-sm font-bold hover:opacity-80 transition-opacity">
            ←
          </button>
          <span className="text-lg font-black tracking-tight">Scan Meal</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFlashOn(!flashOn)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${flashOn ? 'bg-[#FFF4CA] text-[#2C3768]' : 'bg-gray-100 text-gray-400'}`}
          >
            {flashOn ? '⚡' : '☀'}
          </button>
          <button onClick={() => setView('dashboard')} className="bg-[#2C3768] text-white text-xs font-bold px-4 py-2 rounded-full shadow-md hover:opacity-90 transition-opacity">
            Close
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1">
        {/* Main Camera Viewport */}
        <div className="flex-1 flex flex-col items-center justify-center p-5 lg:p-8 bg-gray-50/50">
          <div className="relative w-full max-w-lg aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-black shadow-2xl border-4 border-white">
            {capturedImage ? (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full border-4 border-[#00F090]/60 animate-pulse mb-4 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-2 border-white/30" />
                  </div>
                  <p className="text-white/60 text-xs font-bold tracking-wider uppercase">Point at your dish</p>
                </div>
                {/* Scanner guide frame */}
                <div className="absolute inset-8 border-2 border-dashed border-white/20 rounded-[2rem]" />
                <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-[#00F090] rounded-tl-2xl" />
                <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-[#00F090] rounded-tr-2xl" />
                <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-[#00F090] rounded-bl-2xl" />
                <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-[#00F090] rounded-br-2xl" />
                {/* Scanning line animation */}
                <div className="absolute left-0 right-0 h-0.5 bg-[#00F090]/40 animate-pulse" style={{ top: '45%' }} />
              </div>
            )}
          </div>

          {/* Capture Controls */}
          <div className="flex items-center gap-6 mt-6">
            <button
              onClick={handleGallery}
              className="w-14 h-14 rounded-full bg-[#FFF4CA] border-2 border-[#2C3768]/10 flex items-center justify-center text-lg font-bold shadow-md hover:scale-105 transition-transform"
            >
              🖼
            </button>
            <button
              onClick={handleCapture}
              className="w-20 h-20 rounded-full bg-white border-4 border-[#E92A43] flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
            >
              <div className="w-14 h-14 rounded-full bg-[#E92A43]" />
            </button>
            <button className="w-14 h-14 rounded-full bg-[#FFF4CA] border-2 border-[#2C3768]/10 flex items-center justify-center text-lg font-bold shadow-md hover:scale-105 transition-transform">
              🔄
            </button>
          </div>
          <p className="text-[11px] font-bold text-gray-400 mt-3 tracking-wider uppercase">Capture or upload your meal photo</p>
        </div>

        {/* Recent Scans Sidebar - Desktop */}
        <div className="hidden lg:flex lg:w-72 xl:w-80 flex-col p-6 border-l border-gray-100 bg-gray-50/30">
          <h3 className="text-sm font-black tracking-tight mb-4">Recent Scans</h3>
          <div className="space-y-3 flex-1">
            {RECENT_SCANS.map((scan) => (
              <button
                key={scan.id}
                onClick={handleCapture}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-[#FFF4CA]/30 transition-colors text-left group"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-gray-100 group-hover:border-[#00F090]/30 transition-colors flex-shrink-0">
                  <img src={scan.image} alt={scan.label} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-xs font-black block">{scan.label}</span>
                  <span className="text-[10px] font-bold text-gray-400">Tap to re-scan</span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="bg-[#E7F7AD]/40 rounded-2xl p-4 border border-[#E7F7AD]">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Quick Tip</span>
              <p className="text-xs font-bold text-[#2C3768] mt-1 leading-tight">Place your dish on a flat surface with good lighting for best results.</p>
            </div>
          </div>
        </div>

        {/* Recent Scans Row - Mobile */}
        <div className="lg:hidden px-5 pb-5">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Recent</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {RECENT_SCANS.map((scan) => (
              <button
                key={scan.id}
                onClick={handleCapture}
                className="flex-shrink-0 w-20 text-center group"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-100 group-hover:border-[#00F090]/40 transition-colors mb-1.5">
                  <img src={scan.image} alt={scan.label} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] font-bold text-gray-500">{scan.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
