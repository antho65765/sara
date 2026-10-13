import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Brain, GraduationCap, Compass, BookOpen, ArrowRight } from 'lucide-react';

interface AppSplashScreenProps {
  onComplete: () => void;
  studentName?: string;
}

const PHASES = [
  { progress: 25, label: 'Iniciando arquitectura pedagógica inteligente...' },
  { progress: 60, label: 'Sincronizando memoria continua y estilos de estudio...' },
  { progress: 88, label: 'Calibrando mapas conceptuales y herramientas visuales...' },
  { progress: 100, label: '¡Todo listo! Bienvenido a S.A.R.A' },
];

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({ onComplete, studentName }) => {
  const [progress, setProgress] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Step-by-step loading animation
    const timer1 = setTimeout(() => {
      setProgress(30);
      setPhaseIndex(0);
    }, 200);

    const timer2 = setTimeout(() => {
      setProgress(65);
      setPhaseIndex(1);
    }, 700);

    const timer3 = setTimeout(() => {
      setProgress(90);
      setPhaseIndex(2);
    }, 1300);

    const timer4 = setTimeout(() => {
      setProgress(100);
      setPhaseIndex(3);
    }, 1800);

    const finishTimer = setTimeout(() => {
      handleFinish();
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(finishTimer);
    };
  }, []);

  const handleFinish = () => {
    setIsClosing(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  return (
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          id="app-splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-slate-950 text-white overflow-hidden select-none cursor-pointer"
          onClick={handleFinish}
          role="dialog"
          aria-label="Cargando S.A.R.A"
        >
          {/* Animated Background Mesh & Radial Flares */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Ambient gradients */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
            <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />

            {/* Glowing orbital grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

            {/* Floating ambient particles */}
            <motion.div
              animate={{ y: [-15, 15, -15], rotate: [0, 180, 360] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              className="absolute top-1/4 left-1/5 w-2 h-2 rounded-full bg-blue-400/50 blur-[1px]"
            />
            <motion.div
              animate={{ y: [15, -15, 15], rotate: [360, 180, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className="absolute bottom-1/3 right-1/4 w-3 h-3 rounded-full bg-indigo-400/40 blur-[1px]"
            />
            <motion.div
              animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/3 right-1/5 w-2.5 h-2.5 rounded-full bg-cyan-400/50 blur-[1px]"
            />
          </div>

          {/* Top Badge: S.A.R.A Ecosystem */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="pt-10 z-10 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-lg"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
              Sistema Pedagógico Inteligente
            </span>
          </motion.div>

          {/* Centerpiece: S.A.R.A Emblem & Dynamic Reveal */}
          <div className="flex-1 flex flex-col items-center justify-center z-10 px-6 max-w-md text-center">
            {/* Glowing Logo Core with Orbital Rings */}
            <div className="relative mb-6 flex items-center justify-center">
              {/* Outer Pulsing Glow */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.7, 0.35] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 blur-2xl opacity-50"
              />

              {/* Rotating Dashed Orbital Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute w-36 h-36 rounded-full border border-dashed border-blue-400/30"
              />

              {/* Counter-rotating Inner Ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute w-32 h-32 rounded-full border border-dotted border-cyan-400/30"
              />

              {/* Main Badge Container */}
              <motion.div
                initial={{ scale: 0.6, opacity: 0, rotateY: -30 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
                className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-0.5 shadow-[0_0_50px_rgba(37,99,235,0.45)] flex items-center justify-center"
              >
                {/* Inner Bevel */}
                <div className="w-full h-full rounded-[22px] bg-gradient-to-b from-blue-600/90 to-indigo-950 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/15 rounded-t-[22px] transform -skew-y-6" />
                  
                  {/* Graduation Cap Icon */}
                  <GraduationCap className="w-12 h-12 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] z-10 animate-bounce" style={{ animationDuration: '3s' }} />

                  {/* Sparkle Accent */}
                  <motion.div
                    animate={{ rotate: [0, 90, 180, 270, 360], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute top-2 right-2 text-yellow-300 z-10"
                  >
                    <Sparkles className="w-4 h-4 fill-yellow-300" />
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Typography: S.A.R.A */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="space-y-1.5"
            >
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent drop-shadow-sm">
                S.A.R.A
              </h1>
              <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-blue-400/90">
                Sistema de Apoyo y Rendimiento Académico
              </p>
              {studentName && (
                <p className="text-xs text-slate-400 pt-1">
                  Hola de nuevo, <span className="text-blue-300 font-semibold">{studentName}</span> 👋
                </p>
              )}
            </motion.div>

            {/* Quick Feature Badges */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-2 mt-6"
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-medium text-slate-300">
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mapas & Esquemas</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-medium text-slate-300">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tutoría Adaptativa</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-medium text-slate-300">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Memoria Continua</span>
              </div>
            </motion.div>
          </div>

          {/* Bottom Controls: Loading Progress Bar & Skip hint */}
          <div className="w-full max-w-md px-8 pb-10 z-10 flex flex-col items-center gap-3">
            {/* Status Label */}
            <div className="w-full flex items-center justify-between text-xs text-slate-400 font-medium h-5">
              <motion.span
                key={phaseIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="truncate pr-2 text-slate-300"
              >
                {PHASES[phaseIndex]?.label}
              </motion.span>
              <span className="text-blue-400 font-bold tabular-nums">{progress}%</span>
            </div>

            {/* Futuristic Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800/80 overflow-hidden p-0.5 relative">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 relative overflow-hidden"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                {/* Shimmer inside progress bar */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </motion.div>
            </div>

            {/* Touch to start hint */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFinish();
              }}
              className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-900/60 active:scale-95"
            >
              <span>Toca para continuar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
