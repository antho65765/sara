import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Zap, GraduationCap, CheckCircle2 } from 'lucide-react';

interface StartupSplashScreenProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  subjectName?: string;
}

export const StartupSplashScreen: React.FC<StartupSplashScreenProps> = ({
  isOpen,
  onClose,
  studentName,
  subjectName,
}) => {
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('Iniciando entorno inteligente...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setIsFadingOut(false);
      return;
    }

    // Progression timer
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const increment = Math.floor(Math.random() * 8) + 5;
        const next = Math.min(prev + increment, 100);

        if (next < 35) {
          setStageText('Cargando modelos pedagógicos...');
        } else if (next < 70) {
          setStageText('Sincronizando memoria y conceptos...');
        } else if (next < 95) {
          setStageText('Personalizando experiencia de estudio...');
        } else {
          setStageText('¡Todo listo! Bienvenido a S.A.R.A.');
        }

        return next;
      });
    }, 90);

    return () => clearInterval(interval);
  }, [isOpen]);

  // When progress reaches 100%, trigger smooth fade out
  useEffect(() => {
    if (progress >= 100 && !isFadingOut) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [progress, isFadingOut]);

  const handleDismiss = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onClose();
      setIsFadingOut(false);
    }, 450);
  };

  // Keyboard escape or enter to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Pantalla de inicio con animación S.A.R.A"
      aria-modal="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl transition-all duration-500 select-none overflow-hidden ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Dynamic Cosmic Background Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 right-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Skip button top right */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer z-20"
      >
        <span>Saltar</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {/* Main Animated Content Card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm sm:max-w-md px-6 text-center">
        
        {/* Animated Logo Container with Glow Pulse */}
        <div className="relative mb-6 group cursor-pointer" onClick={handleDismiss}>
          {/* Outer glowing pulsing halo */}
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 opacity-60 blur-lg group-hover:opacity-90 animate-pulse transition duration-500" />
          
          {/* Subtle spinning accent border */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-500 opacity-75 blur-[2px]" />

          {/* Logo Frame */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-slate-900 border-2 border-white/30 shadow-2xl flex items-center justify-center p-1.5 backdrop-blur-md transform transition-transform duration-700 ease-out hover:scale-105">
            <img
              src="/logo-studioia.jpg"
              alt="Logo S.A.R.A"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl shadow-inner animate-in fade-in zoom-in-90 duration-700"
              onError={(e) => {
                // Fallback to SARA icon or styled fallback if path error
                (e.currentTarget as HTMLImageElement).src = '/Logo StudioIA.jpg';
              }}
            />

            {/* Sparkle badge floating on top right of logo */}
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-900 flex items-center justify-center shadow-md animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-slate-900" />
            </div>
          </div>
        </div>

        {/* Brand Name Typography */}
        <div className="space-y-1 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Zap className="w-3 h-3 text-amber-300" />
            <span>Tutoría Inteligente & Pedagógica</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
            S.A.R.A
          </h1>

          <p className="text-sm font-medium text-slate-400">
            Sistema de Apoyo y Rendimiento Académico
          </p>

          {studentName && (
            <p className="text-xs text-blue-300/90 font-medium pt-1">
              Hola, <span className="font-bold text-white">{studentName}</span>
              {subjectName ? ` • Materia: ${subjectName}` : ''}
            </p>
          )}
        </div>

        {/* Progress Bar & Status Text */}
        <div className="w-full max-w-xs space-y-2 mt-2">
          {/* Bar track */}
          <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden border border-slate-700/60 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Status text */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="truncate pr-2">{stageText}</span>
            <span className="font-bold text-blue-400 shrink-0">{progress}%</span>
          </div>
        </div>

        {/* Start button that appears or quick tap action */}
        <button
          type="button"
          onClick={handleDismiss}
          className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-white/10"
        >
          {progress >= 100 ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Entrar a S.A.R.A</span>
            </>
          ) : (
            <>
              <span>Iniciar Ahora</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Educational badge */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <GraduationCap className="w-4 h-4 text-slate-400" />
          <span>Adaptado a tu nivel y ritmo de estudio</span>
        </div>
      </div>
    </div>
  );
};
