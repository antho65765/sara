import React from 'react';
import { Sparkles, Play, BookOpen, Brain, Zap, HelpCircle } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { StudentProfile } from '../types';
import { GRADE_LABELS, SUBJECT_METADATA } from '../data/pedagogicalConfig';

import saraAvatarGorro from '../assets/images/sara_app_icon_1789439889577.jpg';

interface StartScreenHeroProps {
  studentProfile: StudentProfile;
  currentUser?: FirebaseUser | null;
  onOpenGoogleAuth?: () => void;
  onOpenTutorial?: () => void;
  onReplayStartup?: () => void;
  onQuickPrompt?: (promptText: string) => void;
  onSelectSubject?: () => void;
}

export const StartScreenHero: React.FC<StartScreenHeroProps> = ({
  studentProfile,
  currentUser,
  onOpenGoogleAuth,
  onOpenTutorial,
  onReplayStartup,
  onQuickPrompt,
  onSelectSubject,
}) => {
  const currentSubjectInfo = SUBJECT_METADATA[studentProfile.currentSubject] || {
    name: 'General',
  };
  const currentGradeInfo = GRADE_LABELS[studentProfile.grade] || {
    title: studentProfile.grade,
  };

  const starterChips = [
    { label: 'Explicar concepto paso a paso', icon: '💡' },
    { label: 'Hacer mapa conceptual de mi tema', icon: '🧠' },
    { label: 'Generar quiz rápido de repaso', icon: '📝' },
    { label: 'Resolver una duda con foto o apunte', icon: '📷' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto my-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-blue-50/80 via-white to-indigo-50/40 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-800/50 border border-blue-200/80 dark:border-blue-900/40 shadow-xs relative overflow-hidden transition-all">
      {/* Background soft ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/10 dark:bg-purple-400/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
        
        {/* Logo Container with Interactive Animation Trigger */}
        <div className="relative shrink-0 flex flex-col items-center group">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1 bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 shadow-md group-hover:scale-105 transition-transform duration-300">
            <img
              src={saraAvatarGorro}
              alt="S.A.R.A - Tutora con gorro"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl bg-slate-900"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/sara-gorro.jpg';
              }}
            />
            {/* Sparkle badge */}
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {onReplayStartup && (
            <button
              type="button"
              onClick={onReplayStartup}
              className="mt-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
              title="Volver a ver la animación de inicio"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>Ver intro</span>
            </button>
          )}
        </div>

        {/* Content & Details */}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[11px] font-bold inline-flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              S.A.R.A
            </span>

            <button
              type="button"
              onClick={onSelectSubject}
              className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
              title="Cambiar materia de estudio"
            >
              📚 {currentSubjectInfo.name.split('/')[0].trim()}
            </button>

            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
              🎓 {currentGradeInfo.title}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            ¡Hola, {studentProfile.name}! Te damos la bienvenida a S.A.R.A
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            Tu tutora inteligente <strong className="font-semibold text-blue-600 dark:text-blue-400">S.A.R.A</strong> está lista para guiarte paso a paso. Recuerda tus temas de estudio anteriores y adapta el método a tus necesidades.
          </p>

          {/* Quick Google Sign In Prompt if not signed in */}
          {!currentUser && onOpenGoogleAuth && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-blue-100/70 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px] sm:text-xs">
                  Sincroniza tus repasos con Google
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenGoogleAuth}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition shadow-2xs cursor-pointer shrink-0"
              >
                Conectar
              </button>
            </div>
          )}

          {/* Quick starter chips */}
          {onQuickPrompt && (
            <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap gap-1.5 justify-center sm:justify-start">
              {starterChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onQuickPrompt(chip.label)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 shadow-2xs hover:border-blue-300 dark:hover:border-blue-600 transition-all flex items-center gap-1.5 cursor-pointer text-left active:scale-95"
                >
                  <span>{chip.icon}</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
