import React, { useState } from 'react';
import { 
  User, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  KeyRound, 
  Check, 
  ArrowRight, 
  GraduationCap, 
  Trash2, 
  Clock, 
  BookOpen,
  ChevronRight,
  ShieldAlert,
  Smartphone,
  LogOut,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { loginWithGoogle, logoutUser } from '../lib/firebase';
import { UserAccount, StudentGrade, LearningStyle, SubjectKey } from '../types';
import { GRADE_LABELS, SUBJECT_METADATA } from '../data/pedagogicalConfig';

interface AuthProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: UserAccount[];
  currentAccountId: string | null;
  currentUser?: FirebaseUser | null;
  onSelectAccount: (accountId: string, pinInput?: string) => boolean | Promise<boolean>;
  onCreateAccount: (data: {
    username: string;
    pin?: string;
    grade: StudentGrade;
    learningStyle: LearningStyle;
    currentSubject: SubjectKey;
    interests?: string;
    avatar?: string;
  }) => void;
  onDeleteAccount: (accountId: string) => void;
  onGoogleSignInSuccess?: (user: FirebaseUser) => void;
  onGoogleSignOut?: () => void;
  onAnnounce: (msg: string) => void;
  onOpenProfileSettings?: () => void;
}

const AVATAR_OPTIONS = ['🎓', '🧠', '🚀', '🌟', '📚', '💡', '🎨', '🔬', '💻', '⚡'];

export const AuthProfilesModal: React.FC<AuthProfilesModalProps> = ({
  isOpen,
  onClose,
  accounts,
  currentAccountId,
  currentUser,
  onSelectAccount,
  onCreateAccount,
  onDeleteAccount,
  onGoogleSignInSuccess,
  onGoogleSignOut,
  onAnnounce,
  onOpenProfileSettings,
}) => {
  const [mode, setMode] = useState<'list' | 'create' | 'loginPin'>('list');
  const [selectedForPin, setSelectedForPin] = useState<UserAccount | null>(null);
  const [pinAttempt, setPinAttempt] = useState('');
  const [pinError, setPinError] = useState('');
  const [confirmDeleteAccountId, setConfirmDeleteAccountId] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regGrade, setRegGrade] = useState<StudentGrade>('secundaria');
  const [regLearningStyle, setRegLearningStyle] = useState<LearningStyle>('visual');
  const [regSubject, setRegSubject] = useState<SubjectKey>('ciencias');
  const [regInterests, setRegInterests] = useState('');
  const [regAvatar, setRegAvatar] = useState('🎓');
  const [regError, setRegError] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGoogleError('');
    try {
      const user = await loginWithGoogle();
      onAnnounce(`Sesión iniciada con Google como ${user.displayName || user.email}`);
      if (onGoogleSignInSuccess) {
        onGoogleSignInSuccess(user);
      }
      onClose();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      const msg = err?.message || 'Error al conectar con Google.';
      setGoogleError(msg);
      onAnnounce('Error al iniciar sesión con Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    setIsGoogleLoading(true);
    setGoogleError('');
    try {
      await logoutUser();
      onAnnounce('Sesión de Google cerrada.');
      if (onGoogleSignOut) {
        onGoogleSignOut();
      }
    } catch (err: any) {
      console.error('Logout error:', err);
      setGoogleError('Error al cerrar sesión de Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleStartLogin = (acc: UserAccount) => {
    if (acc.pin && acc.pin.trim() !== '') {
      setSelectedForPin(acc);
      setPinAttempt('');
      setPinError('');
      setMode('loginPin');
    } else {
      const ok = onSelectAccount(acc.id);
      if (ok) {
        onAnnounce(`Sesión iniciada con el perfil de ${acc.username}`);
        onClose();
      }
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForPin) return;

    const ok = await onSelectAccount(selectedForPin.id, pinAttempt);
    if (ok) {
      onAnnounce(`Bienvenido de nuevo, ${selectedForPin.username}`);
      setPinError('');
      onClose();
    } else {
      setPinError('PIN incorrecto. Inténtalo de nuevo.');
      onAnnounce('PIN de acceso incorrecto.');
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = regUsername.trim();
    if (!cleanName) {
      setRegError('Por favor ingresa un nombre para el perfil.');
      return;
    }

    if (accounts.some((a) => a.username.toLowerCase() === cleanName.toLowerCase())) {
      setRegError('Ya existe un perfil con ese nombre. Elige otro.');
      return;
    }

    onCreateAccount({
      username: cleanName,
      pin: regPin.trim(),
      grade: regGrade,
      learningStyle: regLearningStyle,
      currentSubject: regSubject,
      interests: regInterests.trim(),
      avatar: regAvatar,
    });

    onAnnounce(`Perfil ${cleanName} creado e iniciado con éxito.`);
    // Reset form
    setRegUsername('');
    setRegPin('');
    setRegInterests('');
    setRegError('');
    onClose();
  };

  return (
    <div 
      id="auth-profiles-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div 
        id="auth-profiles-modal-dialog"
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                {mode === 'list' && 'Perfiles de Estudiantes'}
                {mode === 'create' && 'Crear Nuevo Perfil'}
                {mode === 'loginPin' && `Ingresar a ${selectedForPin?.username}`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'list' && 'Selecciona un perfil existente o regístrate'}
                {mode === 'create' && 'Guarda tu historial, notas y memorias'}
                {mode === 'loginPin' && 'Este perfil está protegido con PIN'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Cerrar modal de perfiles"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* MODE: LIST OF PROFILES */}
          {mode === 'list' && (
            <div className="space-y-4">
              {/* Google Account Sign-In / Linked Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/50 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-center p-1.5 border border-slate-200 dark:border-slate-700 shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {currentUser ? 'Cuenta de Google Conectada' : 'Acceso con Google (Correo)'}
                        </span>
                        {currentUser && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {currentUser ? (currentUser.email || currentUser.displayName) : 'Inicia sesión o regístrate en 1 clic'}
                      </p>
                    </div>
                  </div>

                  {currentUser ? (
                    <button
                      type="button"
                      onClick={handleGoogleLogout}
                      disabled={isGoogleLoading}
                      className="px-2.5 py-1 text-xs font-bold text-red-600 dark:text-red-400 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/60 transition cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {isGoogleLoading ? 'Cerrando...' : 'Cerrar'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95 shrink-0 disabled:opacity-50"
                    >
                      <span>{isGoogleLoading ? 'Conectando...' : 'Entrar con Google'}</span>
                    </button>
                  )}
                </div>

                {googleError && (
                  <div className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 rounded-lg border border-red-200 dark:border-red-900/50">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{googleError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Perfiles en este dispositivo ({accounts.length})
                </span>
                <button
                  id="btn-switch-to-create"
                  onClick={() => {
                    setMode('create');
                    setRegError('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Nuevo Perfil</span>
                </button>
              </div>

              {accounts.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No hay perfiles creados aún
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 max-w-xs mx-auto">
                    Crea tu primer perfil para que S.A.R.A recuerde tus temas, progreso y nivel educativo.
                  </p>
                  <button
                    onClick={() => setMode('create')}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-2 hover:bg-blue-700 transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    Registrarme ahora
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {accounts.map((acc) => {
                    const isCurrent = acc.id === currentAccountId;
                    const gradeInfo = GRADE_LABELS[acc.profile.grade]?.title || acc.profile.grade;

                    return (
                      <div
                        key={acc.id}
                        className={`group relative p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                      >
                        <button
                          onClick={() => handleStartLogin(acc)}
                          className="flex items-center gap-3 text-left flex-1 min-w-0"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl shadow-xs shrink-0 overflow-hidden">
                            {acc.photoURL || (acc.profile.avatar && acc.profile.avatar.startsWith('http')) ? (
                              <img
                                src={acc.photoURL || acc.profile.avatar}
                                alt={acc.username}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover rounded-2xl"
                              />
                            ) : (
                              <span>{acc.profile.avatar || '🎓'}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {acc.username}
                              </span>
                              {acc.isGoogleAccount && (
                                <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[9px] font-bold">
                                  Google
                                </span>
                              )}
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                                  Activo
                                </span>
                              )}
                              {acc.pin && (
                                <span title="Protegido con PIN" className="text-slate-400">
                                  <KeyRound className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="truncate">{gradeInfo.split('(')[0]}</span>
                              <span>•</span>
                              <span>{acc.memories?.length || 0} temas</span>
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleStartLogin(acc)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                              isCurrent
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600'
                            }`}
                          >
                            <span>{isCurrent ? 'En uso' : 'Entrar'}</span>
                            {!isCurrent && <ChevronRight className="w-3.5 h-3.5" />}
                          </button>

                          {accounts.length > 1 && (
                            confirmDeleteAccountId === acc.id ? (
                              <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/90 px-2 py-1 rounded-xl border border-rose-300 dark:border-rose-700 shadow-xs">
                                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">¿Borrar?</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteAccount(acc.id);
                                    setConfirmDeleteAccountId(null);
                                    onAnnounce('Perfil eliminado.');
                                  }}
                                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shadow-2xs transition-colors"
                                >
                                  Sí
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteAccountId(null)}
                                  className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-medium transition-colors"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteAccountId(acc.id)}
                                title="Eliminar perfil"
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Useful Shortcuts */}
              {onOpenProfileSettings && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenProfileSettings();
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Ajustar Pedagogía</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE: PIN LOGIN PROMPT */}
          {mode === 'loginPin' && selectedForPin && (
            <form onSubmit={handleVerifyPin} className="space-y-4 py-2">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center text-3xl mx-auto shadow-inner overflow-hidden">
                  {selectedForPin.photoURL || (selectedForPin.profile.avatar && selectedForPin.profile.avatar.startsWith('http')) ? (
                    <img
                      src={selectedForPin.photoURL || selectedForPin.profile.avatar}
                      alt={selectedForPin.username}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-3xl"
                    />
                  ) : (
                    <span>{selectedForPin.profile.avatar || '🎓'}</span>
                  )}
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Ingresa tu PIN para {selectedForPin.username}
                </h3>
                <p className="text-xs text-slate-500">
                  Introduce el PIN de 4 dígitos configurado para este perfil.
                </p>
              </div>

              {pinError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  placeholder="••••"
                  value={pinAttempt}
                  onChange={(e) => setPinAttempt(e.target.value)}
                  className="w-full text-center text-2xl tracking-[0.4em] font-mono py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('list');
                    setPinError('');
                  }}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition"
                >
                  Volver a perfiles
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Desbloquear</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE: CREATE / REGISTER ACCOUNT */}
          {mode === 'create' && (
            <div className="space-y-4">
              {/* Google Fast Sign-Up Button */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/70 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-center p-1.5 border border-slate-200 dark:border-slate-700 shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      ¿Prefieres registrarte con Google?
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Guarda tus datos en la nube al instante
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 shrink-0 disabled:opacity-50"
                >
                  {isGoogleLoading ? 'Conectando...' : 'Usar Google'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">O crea un perfil local</span>
                <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" />
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
              {regError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {regError}
                </div>
              )}

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Elige tu avatar
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setRegAvatar(av)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center shrink-0 border transition ${
                        regAvatar === av
                          ? 'bg-blue-600 border-blue-600 shadow-sm scale-110'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre de usuario / Estudiante *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Anthony, Camila, Mateo..."
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {/* PIN Optional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>PIN de acceso (Opcional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Para proteger tus notas</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Ej: 1234 (opcional)"
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {/* Grade Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nivel Académico
                </label>
                <select
                  value={regGrade}
                  onChange={(e) => setRegGrade(e.target.value as StudentGrade)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                >
                  <option value="primaria">Primaria (6 - 12 años)</option>
                  <option value="secundaria">Secundaria (12 - 15 años)</option>
                  <option value="bachillerato">Bachillerato / Preparatoria</option>
                  <option value="universidad">Universidad / Superior</option>
                  <option value="autodidacta">Autodidacta / Curioso</option>
                </select>
              </div>

              {/* Learning Style */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Estilo de Aprendizaje Preferido
                </label>
                <select
                  value={regLearningStyle}
                  onChange={(e) => setRegLearningStyle(e.target.value as LearningStyle)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                >
                  <option value="visual">Visual (Analogías, mapas conceptuales)</option>
                  <option value="practico">Práctico (Ejercicios y paso a paso)</option>
                  <option value="socratico">Socrático (Guiado por preguntas)</option>
                  <option value="feynman">Técnica Feynman (Conceptos sencillos)</option>
                  <option value="teorico">Teórico Riguroso (Profundo y formal)</option>
                </select>
              </div>

              {/* Initial Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Materia inicial
                </label>
                <select
                  value={regSubject}
                  onChange={(e) => setRegSubject(e.target.value as SubjectKey)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                >
                  <option value="ciencias">Ciencias Naturales / Biología</option>
                  <option value="matematicas">Matemáticas / Álgebra</option>
                  <option value="historia">Historia y Ciencias Sociales</option>
                  <option value="lengua">Lengua y Literatura</option>
                  <option value="programacion">Programación y Tecnología</option>
                  <option value="idiomas">Idiomas (Inglés, etc.)</option>
                  <option value="filosofia">Filosofía</option>
                  <option value="otro">Otra materia</option>
                </select>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Intereses o hobbies (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: fútbol, anime, Minecraft, música..."
                  value={regInterests}
                  onChange={(e) => setRegInterests(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  S.A.R.A usará tus gustos para inventar ejemplos divertidos y fáciles de entender.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode('list');
                    setRegError('');
                  }}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Crear Perfil</span>
                </button>
              </div>
            </form>
          </div>
          )}

        </div>
      </div>
    </div>
  );
};
