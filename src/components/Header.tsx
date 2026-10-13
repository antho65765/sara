import React, { useState, useRef, useEffect } from 'react';
import { 
  Brain, 
  MessageSquare, 
  GraduationCap, 
  Sliders, 
  Sun, 
  Moon, 
  Sparkles,
  Users,
  HelpCircle,
  MoreVertical,
  Trophy,
  Flame,
  BookOpen,
  FileCode,
  Code,
  Cpu,
  Calculator
} from 'lucide-react';
import { StudentProfile, AccessibilitySettings } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  activeTab: 'chat' | 'memory';
  setActiveTab: (tab: 'chat' | 'memory') => void;
  studentProfile: StudentProfile;
  accessibilitySettings: AccessibilitySettings;
  onOpenAccessibility: () => void;
  onOpenProfile: () => void;
  onOpenModelManagement?: () => void;
  onOpenAuth: () => void;
  onOpenGoogleAuth?: () => void;
  currentUser?: FirebaseUser | null;
  onToggleHighContrast: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  memoryCount: number;
  dueReviewsCount?: number;
  accountCount?: number;
  onOpenTutorial?: () => void;
  onOpenBlindSpots?: () => void;
  onOpenGamification?: () => void;
  onOpenInteractiveReader?: () => void;
  onOpenFormatConverter?: () => void;
  onOpenDeveloperMode?: () => void;
  onOpenCalculator?: () => void;
  onReplayStartup?: () => void;
  xp?: number;
  streak?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  studentProfile,
  accessibilitySettings,
  onOpenAccessibility,
  onOpenProfile,
  onOpenModelManagement,
  onOpenAuth,
  onOpenGoogleAuth,
  currentUser,
  onToggleHighContrast,
  isDarkMode,
  onToggleTheme,
  memoryCount,
  dueReviewsCount = 0,
  accountCount = 1,
  onOpenTutorial,
  onOpenBlindSpots,
  onOpenGamification,
  onOpenInteractiveReader,
  onOpenFormatConverter,
  onOpenDeveloperMode,
  onOpenCalculator,
  onReplayStartup,
  xp = 0,
  streak = 0,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMenuOpen]);

  return (
    <header 
      id="main-app-header"
      className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors w-full overflow-visible"
    >
      {/* Skip link for keyboard / screen-reader accessibility */}
      <a 
        href="#main-content-area"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-blue-600 focus:text-white focus:font-bold focus:top-2 focus:left-2 focus:rounded-xl shadow-lg"
      >
        Saltar al contenido principal
      </a>

      <div className="w-full max-w-7xl mx-auto px-1.5 sm:px-3 md:px-4 h-12 sm:h-14 flex items-center justify-between gap-1 sm:gap-2">
        
        {/* Left: Brand Logo (Ultra-compact for mobile, zero overlap) - Triple click to open Developer Mode */}
        <div 
          className="flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer group"
          title="S.A.R.A (Haz clic para ver intro, triple clic para Modo Desarrollador)"
          onClick={() => {
            if ((window as any).__sara_logo_clicks === undefined) {
              (window as any).__sara_logo_clicks = 0;
              (window as any).__sara_logo_timer = null;
            }
            (window as any).__sara_logo_clicks++;
            if ((window as any).__sara_logo_timer) clearTimeout((window as any).__sara_logo_timer);
            
            if ((window as any).__sara_logo_clicks >= 3) {
              (window as any).__sara_logo_clicks = 0;
              if (onOpenDeveloperMode) onOpenDeveloperMode();
            } else {
              (window as any).__sara_logo_timer = setTimeout(() => {
                if ((window as any).__sara_logo_clicks === 1 && onReplayStartup) {
                  onReplayStartup();
                }
                (window as any).__sara_logo_clicks = 0;
              }, 400);
            }
          }}
        >
          <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden shadow-2xs shrink-0 group-hover:scale-105 transition border border-slate-200/90 dark:border-slate-700 bg-slate-900 flex items-center justify-center">
            <img
              src="/logo-studioia.jpg"
              alt="Logo S.A.R.A"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/Logo StudioIA.jpg';
              }}
            />
          </div>
          <div className="flex flex-col text-left select-none">
            <span className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-tight">
              S.A.R.A
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 dark:text-blue-400 leading-none">
              Tutora IA
            </span>
          </div>
        </div>

        {/* Center: Navigation Tabs (Tutoría / Memoria) - Compact & Symmetrical */}
        <nav 
          className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shrink-0 mx-0.5" 
          aria-label="Navegación principal"
        >
          <button
            id="tab-btn-chat"
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-1.5 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
            aria-selected={activeTab === 'chat'}
            role="tab"
          >
            <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>Tutoría</span>
          </button>
          <button
            id="tab-btn-memory"
            type="button"
            onClick={() => setActiveTab('memory')}
            className={`px-1.5 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
              activeTab === 'memory'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
            aria-selected={activeTab === 'memory'}
            role="tab"
          >
            <Brain className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>Memoria</span>
            <span className="text-[9px] sm:text-[10px] px-1 py-0.1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold shrink-0">
              {memoryCount}
            </span>
            {dueReviewsCount > 0 && (
              <span 
                title={`${dueReviewsCount} repasos para hoy`}
                className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 animate-pulse shrink-0" 
              />
            )}
          </button>
        </nav>

        {/* Right: Actions Group - Perfectly sized for phone screens (Never overflows) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          
          {/* Gamification / Streak & XP Badge Button */}
          {onOpenGamification && (
            <button
              type="button"
              onClick={onOpenGamification}
              title={`Racha: ${streak} días | ${xp} XP`}
              aria-label="Ver logros y ludificación"
              className="hidden sm:flex px-2 py-1 sm:py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-[11px] sm:text-xs font-bold transition items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0 animate-bounce" />
              <span>{streak}d</span>
              <span className="opacity-40">|</span>
              <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden lg:inline">{xp} XP</span>
            </button>
          )}

          {/* Blind Spots AI Button (visible on lg+ or as compact icon) */}
          <button
            type="button"
            onClick={onOpenBlindSpots}
            title="Detector de Puntos Ciegos e IA"
            aria-label="Detector de Puntos Ciegos e IA"
            className="hidden md:flex px-2 py-1 sm:py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-[11px] sm:text-xs font-bold transition items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
          >
            <Brain className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="hidden lg:inline">Puntos Ciegos</span>
          </button>

          {/* Theme Toggle Button (visible on sm+ to keep phone screen spacious; available in menu for mobile) */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            aria-label={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            className="hidden sm:flex h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors items-center justify-center shrink-0 cursor-pointer shadow-2xs"
          >
            {isDarkMode ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
            )}
          </button>

          {/* Accessibility Settings (visible on lg+) */}
          <button
            id="open-accessibility-menu-btn"
            type="button"
            onClick={onOpenAccessibility}
            title="Abrir panel de accesibilidad (Alt+A)"
            aria-label="Abrir panel de accesibilidad avanzada"
            className="hidden lg:flex h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden xl:inline">Accesibilidad</span>
          </button>

          {/* Tutorial / Help Button (visible on lg+) */}
          {onOpenTutorial && (
            <button
              id="open-tutorial-btn"
              type="button"
              onClick={onOpenTutorial}
              title="Ver tutorial y guía de funciones de S.A.R.A"
              aria-label="Ver tutorial interactivo de S.A.R.A"
              className="hidden lg:flex h-8 px-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 text-xs font-semibold items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-2xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden xl:inline">Tutorial</span>
            </button>
          )}

          {/* Calculator Button */}
          {onOpenCalculator && (
            <button
              id="open-calculator-btn"
              type="button"
              onClick={onOpenCalculator}
              title="Abrir calculadora interactiva"
              aria-label="Abrir calculadora interactiva"
              className="hidden lg:flex h-8 px-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 text-xs font-semibold items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-2xs"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden xl:inline">Calculadora</span>
            </button>
          )}



          {/* Google Sign In Direct Button (visible if not logged in with Google) */}
          {!currentUser && (
            <button
              id="btn-header-google-signin"
              type="button"
              onClick={onOpenGoogleAuth || onOpenAuth}
              title="Iniciar sesión o registrarse con tu cuenta de Google"
              aria-label="Acceder con cuenta de Google"
              className="h-7.5 sm:h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs active:scale-95"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="hidden sm:inline">Google</span>
            </button>
          )}

          {/* 1. Profile Switcher Button ("Mi Perfil / Cambio de Perfil") */}
          <button
            id="btn-open-profiles-manager"
            type="button"
            onClick={onOpenAuth}
            title={currentUser ? `Conectado con Google: ${currentUser.email}. Clic para cambiar de perfil.` : `Perfil: ${studentProfile.name}. Clic para cambiar de perfil.`}
            aria-label={`Perfil actual: ${studentProfile.name}. Clic para cambiar de perfil o gestionar cuentas.`}
            className={`h-7.5 sm:h-8 px-1.5 sm:px-2 rounded-lg border transition-all flex items-center gap-1 sm:gap-1.5 text-left shrink-0 cursor-pointer shadow-2xs ${
              currentUser 
                ? 'border-blue-400 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500/20' 
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50 dark:bg-slate-800'
            }`}
          >
            {currentUser && currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'Google'}
                referrerPolicy="no-referrer"
                className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full object-cover border border-blue-500 shrink-0"
              />
            ) : (
              <div className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs shrink-0 font-bold overflow-hidden">
                {studentProfile.avatar && studentProfile.avatar.startsWith('http') ? (
                  <img src={studentProfile.avatar} alt="Avatar" className="w-full h-full object-cover rounded-md" />
                ) : (
                  studentProfile.avatar || <Users className="w-3 h-3" />
                )}
              </div>
            )}
            <div className="leading-tight min-w-0 max-w-[42px] xs:max-w-[65px] sm:max-w-[90px] hidden xs:block">
              <span className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {studentProfile.name}
              </span>
            </div>
          </button>

          {/* 2. Pedagogical Settings Button (To the right of profile - 100% visible on phone screen) */}
          <button
            id="student-profile-capsule-btn"
            type="button"
            onClick={onOpenProfile}
            title="Configurar estilo pedagógico, materias y nivel escolar"
            aria-label="Ajustes pedagógicos de S.A.R.A"
            className="h-7.5 sm:h-8 px-1.5 sm:px-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
          >
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="hidden sm:inline text-xs font-bold">
              Pedagogía
            </span>
          </button>

          {/* 3. More Options & Quick Settings Dropdown (To the right of Pedagogical button - 100% visible on phone screen) */}
          <div className="relative" ref={menuRef}>
            <button
              id="btn-header-more-options"
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              title="Más opciones y herramientas (Tema, Tutorial, Accesibilidad, PWA)"
              aria-label="Más opciones"
              className="h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 cursor-pointer shadow-2xs transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {isMenuOpen && (
              <div 
                id="header-dropdown-menu"
                className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1 text-xs"
              >
                {/* Google Account Quick Action */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (!currentUser && onOpenGoogleAuth) {
                      onOpenGoogleAuth();
                    } else {
                      onOpenAuth();
                    }
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold cursor-pointer transition"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span className="truncate">
                    {currentUser ? `Google: ${currentUser.email?.split('@')[0]}` : 'Iniciar con Google (Correo)'}
                  </span>
                </button>
                {/* Mobile Quick Dark/Light Theme Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onToggleTheme();
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="font-semibold">Cambiar a Modo Claro</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="font-semibold">Cambiar a Modo Oscuro</span>
                    </>
                  )}
                </button>

                {onOpenGamification && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenGamification();
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Ludificación y Logros ({streak}d, {xp} XP)</span>
                  </button>
                )}

                {onOpenBlindSpots && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenBlindSpots();
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold cursor-pointer"
                  >
                    <Brain className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Detector de Puntos Ciegos e IA</span>
                  </button>
                )}

                {onOpenInteractiveReader && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenInteractiveReader();
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Asistente de Lectura (Chat con Libros)</span>
                  </button>
                )}

                {onOpenFormatConverter && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenFormatConverter();
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Conversor de Voz y Apuntes</span>
                  </button>
                )}

                {onOpenTutorial && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenTutorial();
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-semibold">Tutorial Interactivo</span>
                  </button>
                )}

                {onReplayStartup && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onReplayStartup();
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2 text-indigo-700 dark:text-indigo-300 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-semibold">Animación de Inicio (Studio IA)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAccessibility();
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-semibold">Accesibilidad y Lectura</span>
                </button>

                <button
                  type="button"
                  id="header-menu-model-management-btn"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onOpenModelManagement) {
                      onOpenModelManagement();
                    } else {
                      onOpenProfile();
                    }
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center justify-between text-blue-700 dark:text-blue-300 cursor-pointer font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Gestión de Modelos y Tokens</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-semibold">Estilo Pedagógico / Materias</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Cambiar de Perfil / Cuenta</span>
                </button>

                {onOpenCalculator && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenCalculator();
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 cursor-pointer"
                  >
                    <Calculator className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">Calculadora Interactiva</span>
                  </button>
                )}


              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
