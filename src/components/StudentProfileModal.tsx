import React, { useState, useEffect } from 'react';
import { 
  User, 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  Eye, 
  Wrench, 
  X, 
  Check, 
  Bookmark,
  Heart
} from 'lucide-react';
import { StudentProfile, StudentGrade, LearningStyle, SubjectKey, ModelManagementSettings, SessionTokenStats } from '../types';
import { GRADE_LABELS, LEARNING_STYLE_LABELS, SUBJECT_METADATA } from '../data/pedagogicalConfig';
import { ModelManagementPanel } from './ModelManagementPanel';
import { Cpu } from 'lucide-react';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onSaveProfile: (updatedProfile: StudentProfile) => void;
  onAnnounce: (msg: string) => void;
  modelSettings?: ModelManagementSettings;
  onUpdateModelSettings?: (newSettings: ModelManagementSettings) => void;
  sessionStats?: SessionTokenStats;
  currentActiveModel?: string;
  initialTab?: 'profile' | 'models';
  onResetSessionTokens?: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onAnnounce,
  modelSettings = { autoModelSwitch: true },
  onUpdateModelSettings,
  sessionStats = { promptTokens: 0, candidatesTokens: 0, totalTokens: 0, messagesCount: 0 },
  currentActiveModel = 'gemini-3.8-flash',
  initialTab = 'profile',
  onResetSessionTokens,
}) => {
  const [formData, setFormData] = useState<StudentProfile>({ ...profile });
  const [activeTab, setActiveTab] = useState<'profile' | 'models'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...profile });
      setActiveTab(initialTab);
    }
  }, [isOpen, profile, initialTab]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    onAnnounce(`Perfil pedagógico actualizado para ${formData.name || 'el estudiante'}`);
    onClose();
  };

  return (
    <div 
      id="profile-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div 
        id="profile-modal-dialog"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl transition-colors ${
              activeTab === 'models' 
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' 
                : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
            }`}>
              {activeTab === 'models' ? (
                <Cpu className="w-6 h-6" aria-hidden="true" />
              ) : (
                <GraduationCap className="w-6 h-6" aria-hidden="true" />
              )}
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-xl font-bold">
                {activeTab === 'models' ? 'Gestión de Modelos y Tokens' : 'Configuración del Estudiante'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeTab === 'models' 
                  ? 'Consumo en tiempo real y resiliencia ante saturación de tokens.'
                  : 'S.A.R.A adapta su vocabulario, ritmo, rigor y analogías a tu perfil.'}
              </p>
            </div>
          </div>
          <button
            id="close-profile-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-2 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <button
            type="button"
            id="tab-btn-profile-settings"
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Perfil Pedagógico</span>
          </button>

          <button
            type="button"
            id="tab-btn-model-management"
            onClick={() => setActiveTab('models')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'models'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Gestión de Modelos</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>

        {/* Tab 1: Gestor de Modelos */}
        {activeTab === 'models' ? (
          <div className="py-4 overflow-y-auto pr-1 flex-1">
            <ModelManagementPanel
              settings={modelSettings}
              onUpdateSettings={onUpdateModelSettings || (() => {})}
              sessionStats={sessionStats}
              currentActiveModel={currentActiveModel}
              onAnnounce={onAnnounce}
              onResetSessionTokens={onResetSessionTokens}
            />
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        ) : (
          /* Tab 2: Perfil Pedagógico */
          <form onSubmit={handleSubmit} className="py-4 space-y-6 overflow-y-auto pr-1 flex-1">
          
          {/* Nombre & Intereses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="student-name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Nombre o Apodo del estudiante
              </label>
              <div className="relative">
                <input
                  id="student-name-input"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Alex, Sofía, Mateo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-950 transition-all outline-hidden"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="student-interests-input" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                Intereses / Gustos (para metáforas)
              </label>
              <input
                id="student-interests-input"
                type="text"
                value={formData.interests || ''}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                placeholder="Ej: fútbol, espacio, videojuegos, dibujo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-950 transition-all outline-hidden"
              />
            </div>
          </div>

          {/* Grado Escolar / Nivel */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              Nivel Educativo / Grado Escolar
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {(Object.keys(GRADE_LABELS) as StudentGrade[]).map((gradeKey) => {
                const info = GRADE_LABELS[gradeKey];
                const isSelected = formData.grade === gradeKey;
                return (
                  <button
                    type="button"
                    key={gradeKey}
                    id={`grade-select-${gradeKey}`}
                    onClick={() => setFormData({ ...formData, grade: gradeKey })}
                    className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-xs ring-1 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{info.title}</span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {info.desc}
                      </p>
                    </div>
                    <span className="mt-2 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100/50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md inline-block w-fit">
                      {info.ageRange}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Estilo Pedagógico / De Aprendizaje */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              Estilo Pedagógico Preferido
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(LEARNING_STYLE_LABELS) as LearningStyle[]).map((styleKey) => {
                const style = LEARNING_STYLE_LABELS[styleKey];
                const isSelected = formData.learningStyle === styleKey;
                return (
                  <button
                    type="button"
                    key={styleKey}
                    id={`style-select-${styleKey}`}
                    onClick={() => setFormData({ ...formData, learningStyle: styleKey })}
                    className={`p-3.5 text-left rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-400'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {styleKey === 'socratico' && <HelpCircle className="w-4 h-4" />}
                      {styleKey === 'visual' && <Eye className="w-4 h-4" />}
                      {styleKey === 'practico' && <Wrench className="w-4 h-4" />}
                      {styleKey === 'teorico' && <BookOpen className="w-4 h-4" />}
                      {styleKey === 'feynman' && <Sparkles className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-sm">{style.title}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {style.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Materia Activa */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              Materia de Estudio Actual
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {(Object.keys(SUBJECT_METADATA) as SubjectKey[]).map((subKey) => {
                const sub = SUBJECT_METADATA[subKey];
                const isSelected = formData.currentSubject === subKey;
                return (
                  <button
                    type="button"
                    key={subKey}
                    id={`subject-select-${subKey}`}
                    onClick={() => setFormData({ ...formData, currentSubject: subKey })}
                    className={`p-2.5 text-left rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-600'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span className="truncate">{sub.name.split('/')[0].trim()}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="save-profile-btn"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-xs"
            >
              Guardar y Aplicar al Tutor
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
