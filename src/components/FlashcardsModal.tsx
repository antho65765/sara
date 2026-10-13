import React, { useState } from 'react';
import { 
  Zap, 
  RotateCw, 
  HelpCircle, 
  Check, 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles,
  Lightbulb
} from 'lucide-react';
import { Flashcard } from '../types';

interface FlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  flashcards: Flashcard[];
  isLoading: boolean;
  onAnnounce: (msg: string) => void;
}

export const FlashcardsModal: React.FC<FlashcardsModalProps> = ({
  isOpen,
  onClose,
  topicTitle,
  flashcards,
  isLoading,
  onAnnounce,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const currentCard = flashcards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    onAnnounce(!isFlipped ? 'Tarjeta volteada: mostrando reverso' : 'Tarjeta volteada: mostrando anverso');
  };

  const handleNext = () => {
    if (currentIndex + 1 < flashcards.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const markMastered = () => {
    if (currentCard) {
      const next = new Set(masteredIds);
      next.add(currentCard.id || String(currentIndex));
      setMasteredIds(next);
      onAnnounce('Marcada como dominada');
      handleNext();
    }
  };

  return (
    <div 
      id="flashcards-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="flashcards-title"
    >
      <div 
        id="flashcards-dialog"
        className="w-full max-w-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 id="flashcards-title" className="text-base font-bold">
                Tarjetas de Memoria Activa: {topicTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Repaso espaciado para fijar conceptos en tu memoria a largo plazo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar tarjetas"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-6 flex-1 flex flex-col justify-center">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Extrayendo conceptos clave para tus tarjetas de memoria...
              </p>
            </div>
          ) : currentCard ? (
            <div className="space-y-4">
              {/* Counter */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Tarjeta {currentIndex + 1} de {flashcards.length}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {masteredIds.size} dominadas
                </span>
              </div>

              {/* Card surface */}
              <div
                onClick={handleFlip}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') handleFlip();
                }}
                className={`min-h-[220px] rounded-2xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between select-none shadow-md ${
                  isFlipped
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  <span>{isFlipped ? 'Respuesta / Concepto' : 'Pregunta o Término'}</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <RotateCw className="w-3 h-3" /> Clic para voltear
                  </span>
                </div>

                <div className="py-6 text-center">
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                    {isFlipped ? currentCard.back : currentCard.front}
                  </p>
                </div>

                {/* Hint */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                  {currentCard.hint && (
                    <div>
                      {showHint ? (
                        <p className="text-xs text-amber-700 dark:text-amber-300 italic flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                          Pista: {currentCard.hint}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowHint(true);
                          }}
                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <HelpCircle className="w-3 h-3" /> Ver pista mnemotécnica
                        </button>
                      )}
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 ml-auto">
                    {isFlipped ? 'Dorso' : 'Frente'}
                  </span>
                </div>
              </div>

              {/* Actions below card */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Tarjeta anterior"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === flashcards.length - 1}
                    className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Tarjeta siguiente"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={markMastered}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Check className="w-4 h-4" />
                  ¡Me lo sé!
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-slate-500">No hay tarjetas disponibles.</p>
          )}
        </div>
      </div>
    </div>
  );
};
