import React, { useEffect, useRef, useState } from 'react';
import { 
  Calculator, 
  Atom, 
  Landmark, 
  Feather, 
  Compass, 
  Terminal, 
  Languages, 
  BookOpen, 
  Check, 
  X, 
  Sparkles,
  Edit3
} from 'lucide-react';
import { SubjectKey } from '../types';
import { SUBJECT_METADATA } from '../data/pedagogicalConfig';

interface SubjectPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubject: SubjectKey;
  customSubjectName?: string;
  onSelectSubject: (subject: SubjectKey, customName?: string) => void;
  isDarkMode?: boolean;
}

const SUBJECT_ICONS: Record<SubjectKey, React.ElementType> = {
  matematicas: Calculator,
  ciencias: Atom,
  historia: Landmark,
  lengua: Feather,
  filosofia: Compass,
  programacion: Terminal,
  idiomas: Languages,
  otro: BookOpen,
};

const SUBJECT_ACCENT_STYLES: Record<SubjectKey, { 
  iconBg: string; 
  iconColor: string; 
  activeBadge: string;
  activeBorder: string;
  activeBgLight: string;
  activeBgDark: string;
  titleColorSelected: string;
}> = {
  matematicas: {
    iconBg: 'bg-blue-600 dark:bg-blue-500',
    iconColor: 'text-white',
    activeBadge: 'bg-blue-600 dark:bg-blue-500 text-white',
    activeBorder: 'border-blue-600 dark:border-blue-400',
    activeBgLight: 'bg-blue-50/90',
    activeBgDark: 'dark:bg-blue-950/80 dark:border-blue-500',
    titleColorSelected: 'text-blue-700 dark:text-blue-300',
  },
  ciencias: {
    iconBg: 'bg-emerald-600 dark:bg-emerald-500',
    iconColor: 'text-white',
    activeBadge: 'bg-emerald-600 dark:bg-emerald-500 text-white',
    activeBorder: 'border-emerald-600 dark:border-emerald-400',
    activeBgLight: 'bg-emerald-50/90',
    activeBgDark: 'dark:bg-emerald-950/80 dark:border-emerald-500',
    titleColorSelected: 'text-emerald-700 dark:text-emerald-300',
  },
  historia: {
    iconBg: 'bg-amber-600 dark:bg-amber-500',
    iconColor: 'text-white',
    activeBadge: 'bg-amber-600 dark:bg-amber-500 text-white',
    activeBorder: 'border-amber-600 dark:border-amber-400',
    activeBgLight: 'bg-amber-50/90',
    activeBgDark: 'dark:bg-amber-950/80 dark:border-amber-500',
    titleColorSelected: 'text-amber-700 dark:text-amber-300',
  },
  lengua: {
    iconBg: 'bg-purple-600 dark:bg-purple-500',
    iconColor: 'text-white',
    activeBadge: 'bg-purple-600 dark:bg-purple-500 text-white',
    activeBorder: 'border-purple-600 dark:border-purple-400',
    activeBgLight: 'bg-purple-50/90',
    activeBgDark: 'dark:bg-purple-950/80 dark:border-purple-500',
    titleColorSelected: 'text-purple-700 dark:text-purple-300',
  },
  filosofia: {
    iconBg: 'bg-indigo-600 dark:bg-indigo-500',
    iconColor: 'text-white',
    activeBadge: 'bg-indigo-600 dark:bg-indigo-500 text-white',
    activeBorder: 'border-indigo-600 dark:border-indigo-400',
    activeBgLight: 'bg-indigo-50/90',
    activeBgDark: 'dark:bg-indigo-950/80 dark:border-indigo-500',
    titleColorSelected: 'text-indigo-700 dark:text-indigo-300',
  },
  programacion: {
    iconBg: 'bg-cyan-600 dark:bg-cyan-500',
    iconColor: 'text-white',
    activeBadge: 'bg-cyan-600 dark:bg-cyan-500 text-white',
    activeBorder: 'border-cyan-600 dark:border-cyan-400',
    activeBgLight: 'bg-cyan-50/90',
    activeBgDark: 'dark:bg-cyan-950/80 dark:border-cyan-500',
    titleColorSelected: 'text-cyan-700 dark:text-cyan-300',
  },
  idiomas: {
    iconBg: 'bg-rose-600 dark:bg-rose-500',
    iconColor: 'text-white',
    activeBadge: 'bg-rose-600 dark:bg-rose-500 text-white',
    activeBorder: 'border-rose-600 dark:border-rose-400',
    activeBgLight: 'bg-rose-50/90',
    activeBgDark: 'dark:bg-rose-950/80 dark:border-rose-500',
    titleColorSelected: 'text-rose-700 dark:text-rose-300',
  },
  otro: {
    iconBg: 'bg-slate-700 dark:bg-slate-600',
    iconColor: 'text-white',
    activeBadge: 'bg-slate-700 dark:bg-slate-600 text-white',
    activeBorder: 'border-slate-500 dark:border-slate-400',
    activeBgLight: 'bg-slate-100',
    activeBgDark: 'dark:bg-slate-800 dark:border-slate-600',
    titleColorSelected: 'text-slate-800 dark:text-slate-200',
  },
};

export const SubjectPickerModal: React.FC<SubjectPickerModalProps> = ({
  isOpen,
  onClose,
  currentSubject,
  customSubjectName = '',
  onSelectSubject,
  isDarkMode,
}) => {
  const [customNameInput, setCustomNameInput] = useState<string>(customSubjectName);
  const [isEditingCustom, setIsEditingCustom] = useState<boolean>(currentSubject === 'otro');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomNameInput(customSubjectName);
      setIsEditingCustom(currentSubject === 'otro');
    }
  }, [isOpen, customSubjectName, currentSubject]);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChooseSubject = (subjectKey: SubjectKey) => {
    if (subjectKey === 'otro') {
      setIsEditingCustom(true);
      return;
    }
    onSelectSubject(subjectKey);
    onClose();
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customNameInput.trim() || 'Materia Personalizada';
    onSelectSubject('otro', finalName);
    onClose();
  };

  return (
    <div 
      id="subject-picker-modal-backdrop"
      className={`${isDarkMode ? 'dark' : ''} fixed inset-0 z-50 bg-black/70 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150 transition-colors`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="subject-picker-title"
    >
      <div 
        ref={modalRef}
        id="subject-picker-dialog-box"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 transition-colors"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shadow-2xs">
              📚
            </div>
            <div>
              <h2 id="subject-picker-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                Cambiar Asignatura de Estudio
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona la materia en la que S.A.R.A adaptará sus explicaciones
              </p>
            </div>
          </div>
          <button
            id="btn-close-subject-picker"
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector de asignaturas"
            className="w-8 h-8 rounded-xl bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: Grid of Subjects */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-white dark:bg-slate-900 transition-colors">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(Object.keys(SUBJECT_METADATA) as SubjectKey[]).map((subKey) => {
              const sub = SUBJECT_METADATA[subKey];
              const IconComponent = SUBJECT_ICONS[subKey] || BookOpen;
              const styles = SUBJECT_ACCENT_STYLES[subKey] || SUBJECT_ACCENT_STYLES.ciencias;
              const isSelected = currentSubject === subKey;

              return (
                <button
                  type="button"
                  key={subKey}
                  id={`subject-option-${subKey}`}
                  onClick={() => handleChooseSubject(subKey)}
                  className={`p-3 sm:p-3.5 text-left rounded-xl border transition-all flex items-start gap-3 cursor-pointer group ${
                    isSelected
                      ? `${styles.activeBorder} ${styles.activeBgLight} ${styles.activeBgDark} shadow-xs ring-2 ring-blue-500/20 dark:ring-blue-400/30`
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/90 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-100/90 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 transition-transform group-hover:scale-105 shadow-2xs ${
                    isSelected
                      ? `${styles.iconBg} ${styles.iconColor}`
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}>
                    <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`font-bold text-xs sm:text-sm truncate ${
                        isSelected ? styles.titleColorSelected : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {subKey === 'otro' && customSubjectName ? customSubjectName : sub.name}
                      </span>
                      {isSelected && (
                        <span className={`shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${styles.activeBadge} text-[10px] font-bold shadow-2xs`}>
                          <Check className="w-3 h-3" />
                          Activa
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {sub.pedagogicalHint}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Subject Name input if "otro" is chosen */}
          {isEditingCustom && (
            <form onSubmit={handleSaveCustom} className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50/70 dark:bg-slate-800 space-y-2 animate-in fade-in duration-100 transition-colors">
              <label htmlFor="custom-subject-input-field" className="block text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Nombre de tu Materia Personalizada:
              </label>
              <div className="flex gap-2">
                <input
                  id="custom-subject-input-field"
                  type="text"
                  value={customNameInput}
                  onChange={(e) => setCustomNameInput(e.target.value)}
                  placeholder="Ej: Economía, Psicología, Robótica, Música..."
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-hidden transition-colors"
                />
                <button
                  type="submit"
                  id="btn-confirm-custom-subject"
                  className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  Establecer
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 transition-colors">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>S.A.R.A adaptará automáticamente su pedagogía</span>
          </span>
          <button
            type="button"
            id="btn-done-subject-picker"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold cursor-pointer transition-colors shadow-2xs"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
