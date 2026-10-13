import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Timer, 
  Plus, 
  MessageSquare, 
  Camera, 
  Brain, 
  Sliders, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  X,
  Lightbulb,
  HelpCircle,
  Volume2
} from 'lucide-react';

interface InteractiveTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSubject?: (subjectKey: string) => void;
  onAnnounce?: (msg: string) => void;
}

interface TutorialStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  highlightCategory: string;
  interactiveContent: React.ReactNode;
}

export const InteractiveTutorialModal: React.FC<InteractiveTutorialModalProps> = ({
  isOpen,
  onClose,
  onAnnounce
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [interactiveDemoState, setInteractiveDemoState] = useState<string>('math');

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinish();
      } else if (e.key === 'ArrowRight' && currentStep < 4) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const steps: TutorialStep[] = [
    {
      id: 'welcome',
      badge: 'Bienvenida a S.A.R.A',
      title: '¡Aprende a tu propio ritmo con S.A.R.A!',
      subtitle: 'Sistema de Apoyo y Rendimiento Académico',
      description: 'S.A.R.A es tu tutora pedagógica inteligente diseñada con el método socrático. En lugar de darte respuestas directas, te formula preguntas guiadas para que descubras la solución y comprendas a fondo.',
      icon: Sparkles,
      accentColor: 'from-blue-600 to-indigo-600',
      highlightCategory: 'Introducción',
      interactiveContent: (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950/40 p-4 rounded-2xl border border-blue-100 dark:border-indigo-900/40 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
              SARA
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Tutora Inteligente Adaptativa</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">Adaptada a primaria, secundaria, bachillerato y universidad</p>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/90 p-3 rounded-xl border border-blue-100/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 shadow-2xs">
            <span className="text-base">💡</span>
            <span>«¡Hola! Estoy aquí para ayudarte a razonar, resolver ejercicios paso a paso y prepararte para tus exámenes sin estrés.»</span>
          </div>
        </div>
      )
    },
    {
      id: 'subjects',
      badge: 'Paso 1: Área de Estudio',
      title: 'Cambia de asignatura en cualquier momento',
      subtitle: 'Matemáticas, Ciencias, Historia, Lenguaje y más',
      description: 'En la parte superior, justo al lado del logo de SARA, verás la materia actual. Puedes hacer clic sobre ella para cambiar rápidamente a la asignatura que estés estudiando.',
      icon: BookOpen,
      accentColor: 'from-indigo-600 to-purple-600',
      highlightCategory: 'Asignaturas',
      interactiveContent: (
        <div className="flex flex-col gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Haz clic para probar cómo cambia tu materia activa:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'math', label: '📚 Matemáticas', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-700' },
              { id: 'sciences', label: '🔬 Ciencias Naturales', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700' },
              { id: 'history', label: '📜 Historia', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700' },
              { id: 'language', label: '📖 Lenguaje', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700' },
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setInteractiveDemoState(sub.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  interactiveDemoState === sub.id
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-xs scale-105 ' + sub.color
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
          <div className="mt-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 shadow-2xs">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">Materia activa:</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {interactiveDemoState === 'math' && 'Matemáticas (Álgebra, Geometría, Cálculo)'}
              {interactiveDemoState === 'sciences' && 'Ciencias Naturales (Biología, Física, Química)'}
              {interactiveDemoState === 'history' && 'Historia y Ciencias Sociales'}
              {interactiveDemoState === 'language' && 'Lengua Castellana y Literatura'}
            </span>
          </div>
        </div>
      )
    },
    {
      id: 'top-bar-tools',
      badge: 'Paso 2: Barra Superior',
      title: 'Las 3 herramientas esenciales de estudio',
      subtitle: 'Enfoque, organización y tus conversaciones',
      description: 'la barra superior tiene tres opciones principales que te facilitarán tus necesidades',
      icon: Timer,
      accentColor: 'from-rose-500 to-amber-500',
      highlightCategory: 'Herramientas',
      interactiveContent: (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-slate-950 border border-rose-200/80 dark:border-rose-900/40 flex flex-col gap-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-xs">
              <Timer className="w-4 h-4 shrink-0" />
              <span>Pomodoro 25m</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Temporizador para sesiones de concentración de 25 minutos con descansos y sonido de campana.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 dark:bg-slate-950 border border-blue-200/80 dark:border-blue-900/40 flex flex-col gap-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold text-xs">
              <Plus className="w-4 h-4 shrink-0" />
              <span>Nuevo Chat</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Inicia una consulta o tema fresco cuando cambies de lección o tarea.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-xs">
              <MessageSquare className="w-4 h-4 shrink-0 text-blue-500" />
              <span>Chats Creados</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Historial con todas tus conversaciones previas para reanudar el estudio cuando quieras.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'pedagogical-shortcuts',
      badge: 'Paso 3: Atajos y Consultas con Fotos',
      title: 'Toma fotos de tus tareas y usa atajos didácticos',
      subtitle: 'Feynman, ejemplos cotidianos y autoevaluación',
      description: 'S.A.R.A cuenta con visión artificial para leer ejercicios desde fotos de tu cuaderno o libro, y atajos rápidos para que aprendas más fácil.',
      icon: Camera,
      accentColor: 'from-emerald-600 to-teal-600',
      highlightCategory: 'Pedagogía',
      interactiveContent: (
        <div className="flex flex-col gap-2.5 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>📷 Botón de Cámara: Toma fotos de operaciones, fórmulas o textos.</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <div className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1 shadow-2xs">
              <Lightbulb className="w-3 h-3" /> Técnica Feynman (Explicación simple)
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 text-[11px] font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-1 shadow-2xs">
              <HelpCircle className="w-3 h-3" /> Ponme a Prueba (Preguntas socráticas)
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[11px] font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1 shadow-2xs">
              <Volume2 className="w-3 h-3" /> Lectura en voz alta interactiva
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'memory-and-access',
      badge: 'Paso 4: Memoria y Accesibilidad',
      title: 'Repasos espaciados y máxima accesibilidad',
      subtitle: 'Consolida tu aprendizaje a largo plazo',
      description: 'En la pestaña "Memoria" verás los temas que has dominado y recordatorios de repaso. Además, la barra de accesibilidad permite lectura guiada, modo dislexia y alto contraste.',
      icon: Brain,
      accentColor: 'from-indigo-600 to-blue-600',
      highlightCategory: 'Consolidación',
      interactiveContent: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-slate-950 border border-indigo-200 dark:border-indigo-900/50 flex flex-col gap-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-700 dark:text-indigo-300">
              <Brain className="w-4 h-4" />
              <span>Pestaña Memoria</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Guarda tus temas aprendidos y te avisa cuándo repasar con la curva del olvido.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
              <Sliders className="w-4 h-4 text-blue-500" />
              <span>Panel Accesibilidad</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Tipografía para dislexia, guía de lectura, contraste y control de velocidad de voz.
            </p>
          </div>
        </div>
      )
    }
  ];

  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      onAnnounce?.(`Paso ${currentStep + 2} de ${steps.length}: ${steps[currentStep + 1].title}`);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      onAnnounce?.(`Paso ${currentStep} de ${steps.length}: ${steps[currentStep - 1].title}`);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('sara_tutorial_completed', 'true');
    onAnnounce?.('Tutorial finalizado. ¡Bienvenido a SARA!');
    onClose();
  };

  return (
    <div 
      id="interactive-tutorial-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-step-title"
    >
      <div 
        id="interactive-tutorial-modal-content"
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Modal Top Header with Steps Indicator */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${step.accentColor} text-white flex items-center justify-center shadow-xs shrink-0`}>
              <StepIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {step.badge}
              </span>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Paso {currentStep + 1} de {steps.length}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            title="Cerrar y saltar tutorial"
            aria-label="Cerrar tutorial"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div>
            <h3 
              id="tutorial-step-title" 
              className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight"
            >
              {step.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Interactive Feature Preview / Sandbox Box */}
          <div className="pt-1">
            {step.interactiveContent}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between gap-2 sm:gap-3">
          
          <button
            type="button"
            onClick={handleFinish}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Saltar tutorial
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <span>{currentStep === steps.length - 1 ? '¡Comenzar a Aprender!' : 'Siguiente'}</span>
              {currentStep === steps.length - 1 ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
