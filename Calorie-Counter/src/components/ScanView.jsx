import { useState, useRef, useEffect } from 'react';
import { useBoundStore } from '../store/useBoundStore';
import { compressImageToJpeg } from '../utils/imageCompression';
import { ArrowLeftIcon, CameraIcon, AlertIcon, ImageIcon, RefreshIcon } from './icons';

export default function ScanView() {
  const setView = useBoundStore((state) => state.setView);
  const analyzeFoodImage = useBoundStore((state) => state.analyzeFoodImage);
  const retryScan = useBoundStore((state) => state.retryScan);
  const capturedImageSrc = useBoundStore((state) => state.capturedImageSrc);
  const scanLoading = useBoundStore((state) => state.scanLoading);
  const scanError = useBoundStore((state) => state.scanError);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [streamActive, setStreamActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);

  const checkBackend = () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    fetch('/api/health', { signal: controller.signal })
      .then((res) => setBackendOnline(res.ok))
      .catch(() => setBackendOnline(false))
      .finally(() => clearTimeout(timer));
  };

  useEffect(() => {
    checkBackend();
  }, []);

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

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) return;
    const base64Data = await compressImageToJpeg(blob);
    analyzeFoodImage(base64Data);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      const base64Data = await compressImageToJpeg(file);
      analyzeFoodImage(base64Data);
    } catch (err) {
      console.error('Image compression failed:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-[85vh] lg:min-h-[75vh] bg-[#05050A] text-[#E2E2E9] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#6B5E96]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#3E3759]/15 blur-[80px] pointer-events-none" />

      <div className="flex items-center justify-between p-5 lg:p-7 border-b border-white/5 z-10 backdrop-blur-md bg-black/40">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setView('dashboard')} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-all text-white" aria-label="Back to dashboard">
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <span className="text-lg font-black tracking-tight">Scan Plate Visuals</span>
        </div>
        <button onClick={() => setView('dashboard')} className="bg-[#6B5E96] text-white text-xs font-bold px-4 py-2 rounded-full border border-white/10 hover:bg-[#6B5E96]/95">
          Close
        </button>
      </div>

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
                  <CameraIcon className="w-12 h-12 mb-4 text-[#8A8A9E]" />
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
              <p className="flex items-start gap-2"><AlertIcon className="w-4 h-4 flex-shrink-0 mt-0.5" /> Vision pipeline error: {scanError}</p>
              {capturedImageSrc && (
                <button
                  onClick={retryScan}
                  className="mt-3 bg-red-800/60 hover:bg-red-700/60 text-red-100 font-black text-xs px-4 py-2 rounded-lg transition-all"
                >
                  Retry scan
                </button>
              )}
            </div>
          )}

          {backendOnline === false && !scanLoading && (
            <div className="w-full max-w-lg mt-4 bg-amber-950/40 border border-amber-800/30 text-amber-300 p-4 rounded-2xl text-xs font-bold leading-tight flex items-center justify-between gap-3">
              <span className="flex items-start gap-2">
                <AlertIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Backend offline — start it with <span className="font-mono">backend\start-server.cmd</span> or run <span className="font-mono">npm run dev:all</span>
              </span>
              <button
                onClick={checkBackend}
                className="shrink-0 bg-amber-800/60 hover:bg-amber-700/60 text-amber-100 font-black text-xs px-4 py-2 rounded-lg transition-all"
              >
                Retry
              </button>
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
                <ImageIcon className="w-6 h-6" />
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
                <RefreshIcon className="w-6 h-6" />
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