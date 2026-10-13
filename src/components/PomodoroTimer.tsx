import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Clock, 
  Coffee, 
  Sparkles, 
  X,
  Flame,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface PomodoroTimerProps {
  currentTopic?: string;
  subjectName?: string;
  onAnnounce?: (message: string) => void;
  onSessionComplete?: (durationMinutes: number, topic?: string) => void;
  onClose?: () => void;
  className?: string;
}

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const MODE_CONFIG: Record<TimerMode, { label: string; duration: number; colorClass: string; bgClass: string; borderClass: string; icon: any }> = {
  work: {
    label: 'Enfoque Pomodoro',
    duration: 25 * 60, // 25 minutes
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-950/60',
    borderClass: 'border-rose-200 dark:border-rose-800/80',
    icon: Flame,
  },
  shortBreak: {
    label: 'Pausa Corta',
    duration: 5 * 60, // 5 minutes
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
    borderClass: 'border-emerald-200 dark:border-emerald-800/80',
    icon: Coffee,
  },
  longBreak: {
    label: 'Pausa Larga',
    duration: 15 * 60, // 15 minutes
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/60',
    borderClass: 'border-indigo-200 dark:border-indigo-800/80',
    icon: Sparkles,
  },
};

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  currentTopic,
  subjectName,
  onAnnounce,
  onSessionComplete,
  onClose,
  className = '',
}) => {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(MODE_CONFIG.work.duration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [completedCycles, setCompletedCycles] = useState<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Play pleasant acoustic notification using Web Audio API
  const playAlarmSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Gentle celebratory chime: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);

        gain.gain.setValueAtTime(0, now + idx * 0.18);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.18 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.6);
      });
    } catch (e) {
      console.warn('Audio playback not permitted yet or failed:', e);
    }
  };

  // Timer interval countdown
  useEffect(() => {
    let timer: any = null;
    if (isRunning) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsRunning(false);

            // Play completion chime
            playAlarmSound();

            if (mode === 'work') {
              const nextCycles = completedCycles + 1;
              setCompletedCycles(nextCycles);
              onAnnounce?.('¡Tiempo completado! Has terminado 25 minutos de estudio enfocado.');
              onSessionComplete?.(25, currentTopic);

              // Auto prepare break
              const nextMode: TimerMode = nextCycles % 4 === 0 ? 'longBreak' : 'shortBreak';
              setMode(nextMode);
              return MODE_CONFIG[nextMode].duration;
            } else {
              onAnnounce?.('La pausa ha terminado. ¿Listo para otra sesión de 25 minutos?');
              setMode('work');
              return MODE_CONFIG.work.duration;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, mode, completedCycles, soundEnabled, currentTopic]);

  // Handle Mode Change
  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODE_CONFIG[newMode].duration);
    onAnnounce?.(`Cambiado a ${MODE_CONFIG[newMode].label}`);
  };

  const toggleStartPause = () => {
    // Prime audio context on user interaction
    if (!audioContextRef.current) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioContextRef.current = new AudioCtx();
      } catch {}
    }

    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    onAnnounce?.(nextRunning ? `Temporizador Pomodoro iniciado: ${formatTime(timeLeft)}` : 'Temporizador pausado');
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODE_CONFIG[mode].duration);
    onAnnounce?.('Temporizador reiniciado');
  };

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress percentage
  const totalDuration = MODE_CONFIG[mode].duration;
  const progressPercent = Math.min(100, Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100));

  const currentCfg = MODE_CONFIG[mode];
  const ModeIcon = currentCfg.icon;

  return (
    <div 
      id="pomodoro-focus-timer-container" 
      className={`border rounded-2xl transition-all duration-200 shadow-2xs overflow-hidden ${currentCfg.borderClass} ${currentCfg.bgClass} ${className}`}
    >
      {/* Main Bar: Info & Controls */}
      <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        
        {/* Left: Mode Badge & Topic Info */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-2 rounded-xl ${mode === 'work' ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'} shrink-0 shadow-2xs`}>
              <ModeIcon className={`w-4 h-4 ${isRunning ? 'animate-pulse' : ''}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-xs font-bold uppercase tracking-wider ${currentCfg.colorClass}`}>
                  {currentCfg.label}
                </span>
                {completedCycles > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.2 rounded-full">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {completedCycles} {completedCycles === 1 ? 'sesión' : 'sesiones'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] xs:max-w-[280px] sm:max-w-[340px] mt-0.5">
                {currentTopic ? `Tema: ${currentTopic}` : `Estudio enfocado de ${subjectName || 'la materia'}`}
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Cerrar temporizador"
              aria-label="Cerrar temporizador"
              className="sm:hidden p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right: Digital Clock Display & Action Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800/60">
          
          {/* Digits Clock Display */}
          <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 px-2.5 py-1 rounded-xl shadow-2xs shrink-0">
            <Clock className={`w-3.5 h-3.5 ${isRunning ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
            <span className={`font-mono text-base sm:text-lg font-black tracking-tight ${isRunning ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Buttons Set */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              id="pomodoro-toggle-btn"
              onClick={toggleStartPause}
              title={isRunning ? 'Pausar sesión de enfoque' : 'Iniciar sesión de 25 minutos'}
              className={`h-8 px-2.5 sm:px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95 cursor-pointer ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{timeLeft === totalDuration ? 'Iniciar' : 'Continuar'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="pomodoro-reset-btn"
              onClick={resetTimer}
              title="Reiniciar temporizador a 25 min"
              className="h-8 w-8 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              title={soundEnabled ? 'Silenciar alarma audible' : 'Activar sonido de campana al finalizar'}
              className="h-8 w-8 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              title={isExpanded ? 'Contraer modos' : 'Cambiar modos de pausa/enfoque'}
              className="h-8 w-8 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="Ocultar barra Pomodoro"
                aria-label="Ocultar barra Pomodoro"
                className="hidden sm:flex h-8 w-8 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors items-center justify-center cursor-pointer ml-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200/80 dark:bg-slate-800/80 h-1 overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${mode === 'work' ? 'bg-rose-500' : 'bg-emerald-500'}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Expanded Modes and Settings Panel */}
      {isExpanded && (
        <div className="p-3 border-t border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 rounded-b-2xl flex flex-wrap items-center justify-between gap-2.5 text-xs animate-in fade-in duration-150">
          
          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => switchMode('work')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                mode === 'work'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Enfoque 25m</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('shortBreak')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                mode === 'shortBreak'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Coffee className="w-3 h-3" />
              <span>Pausa 5m</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('longBreak')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                mode === 'longBreak'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Pausa 15m</span>
            </button>
          </div>

          {/* Cycle Stats & Sound Status */}
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Ciclos completados: <strong className="text-slate-700 dark:text-slate-200">{completedCycles}</strong>
            </span>
            <button
              type="button"
              onClick={playAlarmSound}
              className="text-[11px] underline hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-500 cursor-pointer"
              title="Probar sonido de campana"
            >
              Probar campana
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
