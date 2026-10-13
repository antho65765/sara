import React from 'react';
import { 
  Eye, 
  Type, 
  Volume2, 
  Sliders, 
  Sun, 
  Moon,
  Monitor,
  AlignJustify, 
  Check, 
  X, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { AccessibilitySettings, ThemeMode } from '../types';

interface AccessibilityToolbarProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  isOpen: boolean;
  onClose: () => void;
  onAnnounce: (msg: string) => void;
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({
  settings,
  onUpdateSettings,
  isOpen,
  onClose,
  onAnnounce,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="accessibility-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-title"
    >
      <div 
        id="accessibility-dialog"
        className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl transition-all border ${
          settings.highContrast 
            ? 'bg-black text-white border-yellow-400' 
            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              <Sliders className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 id="accessibility-title" className="text-xl font-bold">
                Opciones de Accesibilidad
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personaliza la interfaz para tu mayor comodidad y legibilidad
              </p>
            </div>
          </div>
          <button
            id="close-accessibility-btn"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-blue-500"
            aria-label="Cerrar panel de accesibilidad"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="py-5 space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          
          {/* Tema Visual: Modo Claro / Modo Oscuro */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" />
              Tema Visual (Modo Claro / Modo Oscuro)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'light' as const, label: 'Modo Claro', icon: Sun },
                { key: 'dark' as const, label: 'Modo Oscuro', icon: Moon },
                { key: 'system' as const, label: 'Automático', icon: Monitor },
              ].map(({ key, label, icon: Icon }) => {
                const currentMode = settings.themeMode || 'system';
                const isSelected = currentMode === key;
                return (
                  <button
                    key={key}
                    id={`btn-theme-mode-${key}`}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ themeMode: key });
                      onAnnounce(`Tema cambiado a ${label}`);
                    }}
                    className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Tamaño del Texto */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Type className="w-4 h-4 text-blue-600" aria-hidden="true" />
              Tamaño del Texto
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'large', 'extra-large'] as const).map((size) => {
                const isSelected = settings.fontSize === size;
                const labels = {
                  normal: 'Normal (100%)',
                  large: 'Grande (115%)',
                  'extra-large': 'Muy Grande (130%)',
                };
                return (
                  <button
                    key={size}
                    id={`btn-font-size-${size}`}
                    onClick={() => {
                      onUpdateSettings({ fontSize: size });
                      onAnnounce(`Tamaño de letra cambiado a ${labels[size]}`);
                    }}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    {labels[size]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tipografía para Dislexia */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <div className="pr-4">
              <div className="text-sm font-semibold flex items-center gap-2">
                <span>Fuente amigable para Dislexia</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mayor espaciado entre caracteres y formas asimétricas para facilitar el seguimiento visual.
              </p>
            </div>
            <button
              id="toggle-dyslexic-font-btn"
              role="switch"
              aria-checked={settings.dyslexicFont}
              onClick={() => {
                const next = !settings.dyslexicFont;
                onUpdateSettings({ dyslexicFont: next });
                onAnnounce(next ? 'Fuente de dislexia activada' : 'Fuente estándar activada');
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                settings.dyslexicFont ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.dyslexicFont ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Modo Alto Contraste */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <div className="pr-4">
              <div className="text-sm font-semibold flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" />
                <span>Modo Alto Contraste</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bordes muy definidos, texto negro/blanco puro y máxima distinción para baja visión.
              </p>
            </div>
            <button
              id="toggle-high-contrast-btn"
              role="switch"
              aria-checked={settings.highContrast}
              onClick={() => {
                const next = !settings.highContrast;
                onUpdateSettings({ highContrast: next });
                onAnnounce(next ? 'Alto contraste activado' : 'Alto contraste desactivado');
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                settings.highContrast ? 'bg-yellow-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.highContrast ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Guía de lectura (Regla de lectura) */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <div className="pr-4">
              <div className="text-sm font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Guía / Regla de Lectura</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Resalta la línea por donde pasa el ratón para evitar perder el renglón al leer (ideal TDAH).
              </p>
            </div>
            <button
              id="toggle-reading-guide-btn"
              role="switch"
              aria-checked={settings.readingGuide}
              onClick={() => {
                const next = !settings.readingGuide;
                onUpdateSettings({ readingGuide: next });
                onAnnounce(next ? 'Regla de lectura activada' : 'Regla de lectura desactivada');
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                settings.readingGuide ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.readingGuide ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Interlineado */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <AlignJustify className="w-4 h-4 text-purple-600" aria-hidden="true" />
              Espaciado entre Líneas
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'relaxed', 'double'] as const).map((space) => {
                const isSelected = settings.lineSpacing === space;
                const labels = {
                  normal: 'Estándar',
                  relaxed: 'Cómodo',
                  double: 'Amplio',
                };
                return (
                  <button
                    key={space}
                    id={`btn-spacing-${space}`}
                    onClick={() => {
                      onUpdateSettings({ lineSpacing: space });
                      onAnnounce(`Espaciado cambiado a ${labels[space]}`);
                    }}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    {labels[space]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text-to-Speech & Velocidad */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-blue-600" aria-hidden="true" />
                  <span>Lectura en voz alta automática</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  El tutor leerá automáticamente sus respuestas al recibirlas.
                </p>
              </div>
              <button
                id="toggle-autoread-btn"
                role="switch"
                aria-checked={settings.autoReadResponse}
                onClick={() => {
                  const next = !settings.autoReadResponse;
                  onUpdateSettings({ autoReadResponse: next });
                  onAnnounce(next ? 'Lectura automática habilitada' : 'Lectura automática deshabilitada');
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.autoReadResponse ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.autoReadResponse ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Velocidad de lectura:
              </span>
              <div className="flex gap-1.5">
                {[
                  { rate: 0.8, label: '0.8x (Pausada)' },
                  { rate: 1.0, label: '1.0x (Normal)' },
                  { rate: 1.2, label: '1.2x (Ágil)' },
                ].map(({ rate, label }) => (
                  <button
                    key={rate}
                    onClick={() => onUpdateSettings({ speechRate: rate })}
                    className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                      settings.speechRate === rate
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Atajos de teclado útiles */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Atajos útiles de teclado:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-300">
              <li><kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border text-[11px] font-mono">Alt + A</kbd>: Abrir / Cerrar este panel de accesibilidad</li>
              <li><kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border text-[11px] font-mono">Alt + M</kbd>: Activar dictado de voz para preguntar al tutor</li>
              <li><kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border text-[11px] font-mono">Escape</kbd>: Cerrar cualquier ventana emergente</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            id="done-accessibility-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-xs"
          >
            Listo, guardar preferencias
          </button>
        </div>
      </div>
    </div>
  );
};
