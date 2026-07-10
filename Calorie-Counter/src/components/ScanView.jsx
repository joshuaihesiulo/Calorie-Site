import React, { useState, useRef, useEffect } from 'react';
import { useBoundStore } from '../store/useBoundStore';

export default function ScanView() {
  const setView = useBoundStore((state) => state.setView);
  const analyzeFoodImage = useBoundStore((state) => state.analyzeFoodImage);
  const scanLoading = useBoundStore((state) => state.scanLoading);
  const scanError = useBoundStore((state) => state.scanError);
  const geminiToken = useBoundStore((state) => state.geminiToken);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [streamActive, setStreamActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(null);

  useEffect(() => {
    let activeStream = null;

    async function startCamera() {
      try {
        setCameraPermissionError(null);
        const constraints = {
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          activeStream = stream;
          setStreamActive(true);
        }
      } catch (err) {
        console.error("Camera connection failed:", err);
        setCameraPermissionError("Camera access denied or unavailable. Please click below to select or capture a real plate photo from your camera roll.");
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Data = canvas.toDataURL('image/jpeg', 0.9);
    analyzeFoodImage(base64Data);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        analyzeFoodImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col min-h-[85vh] lg:min-h-[75vh] bg-[#05050A] text-[#E2E2E9] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#6B5E96]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#3E3759]/15 blur-[80px] pointer-events-none" />

      <div className="flex items-center justify-between p-5 lg:p-7 border-b border-white/5 z-10 backdrop-blur-md bg-black/40">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setView('dashboard')} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm font-bold border border-white/10 transition-all text-white">
            ←
          </button>
          <span className="text-lg font-black tracking-tight">Scan Plate Visuals</span>
        </div>
        <button onClick={() => setView('dashboard')} className="bg-[#6B5E96] text-white text-xs font-bold px-4 py-2 rounded-full border border-white/10 hover:bg-[#6B5E96]/95">
          Close
        </button>
      </div>

      {!geminiToken && (
        <div className="bg-amber-950/40 border-b border-amber-800/30 text-amber-300 px-6 py-3 text-xs font-bold flex items-center justify-between z-10">
          <span>⚠️ Gemini API key required. Input your key into the top header to enable live inference.</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-1 z-10">
        <div className="flex-1 flex flex-col items-center justify-center p-6">

          {scanLoading ? (
            <div className="w-full max-w-lg aspect-[4/3] rounded-[2.5rem] bg-[#12121A] flex flex-col items-center justify-center text-center p-8 border border-white/5">
              <div className="w-16 h-16 rounded-full border-4 border-[#6B5E96] border-t-transparent animate-spin mb-4" />
              <p className="text-white font-black text-lg tracking-tight">Sourcing Real Plate from WAFCT...</p>
              <p className="text-[#8A8A9E] text-xs mt-1">Gemini identifying dish &amp; mapping FAO nutrient data dynamically.</p>
            </div>
          ) : (
            <div className="relative w-full max-w-lg aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-black shadow-2xl border-4 border-white/10">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />

              {cameraPermissionError && (
                <div className="absolute inset-0 bg-[#12121A]/95 flex flex-col items-center justify-center p-8 text-center text-white">
                  <span className="text-4xl mb-4">📷</span>
                  <p className="font-bold text-sm leading-relaxed mb-6 max-w-sm text-[#8A8A9E]">
                    {cameraPermissionError}
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#6B5E96] text-white font-black text-xs px-6 py-3 rounded-xl hover:opacity-90 transition-all shadow-md"
                  >
                    Select Photo File
                  </button>
                </div>
              )}

              {streamActive && !cameraPermissionError && (
                <>
                  <div className="absolute inset-8 border-2 border-dashed border-white/25 rounded-[2rem] pointer-events-none" />
                  <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-[#6B5E96] rounded-tl-2xl pointer-events-none" />
                  <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-[#6B5E96] rounded-tr-2xl pointer-events-none" />
                  <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-[#6B5E96] rounded-bl-2xl pointer-events-none" />
                  <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-[#6B5E96] rounded-br-2xl pointer-events-none" />
                </>
              )}
            </div>
          )}

          {scanError && (
            <div className="w-full max-w-lg mt-4 bg-red-950/40 border border-red-800/30 text-red-300 p-4 rounded-2xl text-xs font-bold leading-tight">
              ⚠️ Vision pipeline error: {scanError}
            </div>
          )}

          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

          {!scanLoading && (
            <div className="flex items-center gap-6 mt-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg shadow-md hover:scale-105 transition-transform"
                title="Upload Photo File"
              >
                🖼️
              </button>
              <button
                disabled={!streamActive}
                onClick={captureFrame}
                className="w-20 h-20 rounded-full bg-white border-4 border-white/20 flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
              >
                <div className="w-14 h-14 rounded-full bg-[#E92A43]" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg shadow-md hover:scale-105 transition-transform"
              >
                🔄
              </button>
            </div>
          )}
          <p className="text-[11px] font-bold text-gray-500 mt-4 tracking-wider uppercase">
            No Mock Data: Sourced dynamically using Google Gemini + Real FAO/WAFCT Data
          </p>
        </div>
      </div>
    </div>
  );
}