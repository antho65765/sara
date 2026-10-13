import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Check, FlipHorizontal, AlertCircle, Sparkles } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, defaultPrompt?: string) => void;
  studentName?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  studentName = 'Estudiante',
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedPromptTag, setSelectedPromptTag] = useState<string>('Analiza y explica paso a paso este ejercicio');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nativeFileInputRef = useRef<HTMLInputElement>(null);

  // Play a subtle camera shutter click using Web Audio API
  const playShutterSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch {
      // Audio not permitted or supported, silent fallback
    }
  };

  // Stop camera tracks cleanly
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start video stream
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setIsInitializing(true);
    setCameraError(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara no está disponible en este navegador o entorno.');
      }

      // Check available devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {
        // enumerateDevices may be restricted, assume false
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setIsInitializing(false);
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Permiso de cámara denegado. Puedes usar la cámara nativa de tu dispositivo abajo.'
          : 'No se pudo iniciar la cámara en directo. Puedes tomar una foto usando la cámara de tu teléfono.'
      );
    }
  }, [stopStream]);

  // When modal opens or camera facing flips
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera(facingMode);
    } else if (!isOpen) {
      stopStream();
      setCapturedImage(null);
      setCameraError(null);
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  // Handle shutter snapshot
  const handleTakeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror image
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    playShutterSound();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(dataUrl);
    stopStream();
  };

  // Flip between front and rear cameras
  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Native camera file input change fallback
  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCapturedImage(result);
        setCameraError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Confirm and send to S.A.R.A
  const handleConfirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage, selectedPromptTag);
      onClose();
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  if (!isOpen) return null;

  return (
    <div 
      id="camera-capture-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92dvh]">
        
        {/* Top Header */}
        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white shrink-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 id="camera-modal-title" className="text-sm font-bold leading-tight">
                Tomar Foto para S.A.R.A
              </h2>
              <p className="text-[11px] text-slate-400">
                Enfoca tu cuaderno, libro, pantalla o ejercicio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar cámara"
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Capture Area */}
        <div className="relative flex-1 bg-black min-h-[320px] sm:min-h-[400px] flex items-center justify-center overflow-hidden">
          
          {/* Live Video Feed */}
          {!capturedImage && !cameraError && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          )}

          {/* Captured Still Preview */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Foto capturada"
              className="w-full h-full object-contain bg-black"
            />
          )}

          {/* Framing Target Overlay (Guides student to center the exercise) */}
          {!capturedImage && !cameraError && !isInitializing && (
            <div className="absolute inset-6 sm:inset-10 border-2 border-dashed border-white/60 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-blue-400" />
              </div>
              <div className="text-center">
                <span className="px-3 py-1 rounded-full bg-black/60 text-[11px] font-medium text-white/90 backdrop-blur-xs">
                  Encuadra el ejercicio o fórmula aquí
                </span>
              </div>
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-blue-400" />
              </div>
            </div>
          )}

          {/* Loading Spinner */}
          {isInitializing && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-2">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-xs font-medium">Iniciando cámara...</span>
            </div>
          )}

          {/* Camera Error / Fallback UI */}
          {cameraError && !capturedImage && (
            <div className="p-6 text-center text-white max-w-sm flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={() => nativeFileInputRef.current?.click()}
                className="mt-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition"
              >
                <Camera className="w-4 h-4" />
                Abrir Cámara del Dispositivo
              </button>
            </div>
          )}

          {/* Hidden Canvas for rasterization */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden Native File Input with capture="environment" for fallback */}
          <input
            ref={nativeFileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleNativeFileChange}
            className="hidden"
          />
        </div>

        {/* Bottom Controls Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 flex flex-col gap-3">
          
          {/* If Photo is Taken: Pedagogical Query Presets & Confirmation */}
          {capturedImage ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  'Analiza y explica paso a paso este ejercicio',
                  '¿Cuál es el planteamiento y la fórmula?',
                  'Dime si esta respuesta está correcta',
                  'Hazme un resumen pedagógico de esta página',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedPromptTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition ${
                      selectedPromptTag === tag
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Repetir Foto
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPhoto}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Preguntar a S.A.R.A
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Controls */
            <div className="flex items-center justify-around py-1">
              
              {/* Native device fallback button */}
              <button
                type="button"
                onClick={() => nativeFileInputRef.current?.click()}
                title="Tomar foto con app del móvil"
                className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Nativo</span>
              </button>

              {/* Main Shutter Button */}
              <button
                type="button"
                onClick={handleTakeSnapshot}
                disabled={isInitializing || Boolean(cameraError)}
                aria-label="Disparar foto"
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-1 bg-white/20 hover:bg-white/30 active:scale-95 transition disabled:opacity-50 shadow-xl"
              >
                <div className="w-full h-full rounded-full bg-white hover:bg-blue-50 transition" />
              </button>

              {/* Camera Switcher (Front/Back) */}
              <button
                type="button"
                onClick={handleFlipCamera}
                disabled={isInitializing || Boolean(cameraError)}
                title="Girar cámara (Frontal / Trasera)"
                aria-label="Girar cámara"
                className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <FlipHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Girar</span>
              </button>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
