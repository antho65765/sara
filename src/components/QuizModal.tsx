import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Trophy, 
  ArrowRight, 
  RotateCcw, 
  X, 
  Sparkles,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion, TopicMemory } from '../types';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  questions: QuizQuestion[];
  isLoading: boolean;
  onQuizCompleted: (topicTitle: string, score: number, total: number) => void;
  onAnnounce: (msg: string) => void;
  onRecordMistake?: (mistake: { topic: string; subject: any; question: string; selectedAnswer: string; correctAnswer: string; explanation: string }) => void;
  subject?: any;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  topicTitle,
  questions,
  isLoading,
  onQuizCompleted,
  onAnnounce,
  onRecordMistake,
  subject = 'ciencias',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQ.correctIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      onAnnounce('¡Respuesta correcta! Excelente razonamiento.');
    } else {
      onAnnounce('Respuesta incorrecta. Lee la explicación para aprender el por qué.');
      if (onRecordMistake) {
        onRecordMistake({
          topic: topicTitle,
          subject,
          question: currentQ.question,
          selectedAnswer: currentQ.options[index] || '',
          correctAnswer: currentQ.options[currentQ.correctIndex] || '',
          explanation: currentQ.explanation,
        });
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      const finalScore = score + (selectedOption === currentQ.correctIndex ? 0 : 0);
      onQuizCompleted(topicTitle, score, questions.length);

      if (score >= questions.length * 0.6) {
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // fallback
        }
      }
    }
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div 
      id="quiz-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
    >
      <div 
        id="quiz-modal-dialog"
        className="w-full max-w-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 id="quiz-modal-title" className="text-base font-bold">
                Quiz Diagnóstico: {topicTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pondrá a prueba tu comprensión y actualizará tu memoria de estudio.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar quiz"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                S.A.R.A está formulando preguntas personalizadas para ti...
              </p>
            </div>
          ) : isFinished ? (
            /* Results Screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  ¡Quiz Completado!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Puntuación obtenida: <strong className="text-blue-600 dark:text-blue-400 font-bold">{score}</strong> de {questions.length} correctas.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                {score === questions.length ? (
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ¡Impresionante! Has demostrado dominio total de este tema. Tu memoria se ha actualizado a "Dominado".
                  </p>
                ) : score >= questions.length * 0.5 ? (
                  <p className="font-semibold text-blue-600 dark:text-blue-400">
                    ¡Buen trabajo! Vas por muy buen camino. Te recomendamos repasar los conceptos clave con el tutor para dominarlo al 100%.
                  </p>
                ) : (
                  <p className="font-semibold text-amber-600 dark:text-amber-400">
                    Sigue practicando. El error es el primer paso del aprendizaje. Puedes pedirle al tutor que te lo explique de forma más simple.
                  </p>
                )}
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={restartQuiz}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Intentar de nuevo
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                >
                  Continuar estudiando
                </button>
              </div>
            </div>
          ) : currentQ ? (
            /* Active Question Screen */
            <div className="space-y-5">
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Pregunta {currentIndex + 1} de {questions.length}</span>
                  <span>Aciertos: {score}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question text */}
              <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {currentQ.question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, optIdx) => {
                  let btnStyle = 'border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-slate-800';

                  if (isAnswered) {
                    if (optIdx === currentQ.correctIndex) {
                      btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 font-bold ring-2 ring-emerald-500';
                    } else if (optIdx === selectedOption) {
                      btnStyle = 'border-red-500 bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-100 ring-2 ring-red-500';
                    } else {
                      btnStyle = 'opacity-50 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      disabled={isAnswered}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>

                      {isAnswered && optIdx === currentQ.correctIndex && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
                      )}
                      {isAnswered && optIdx === selectedOption && optIdx !== currentQ.correctIndex && (
                        <XCircle className="w-5 h-5 text-red-500 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback explanation */}
              {isAnswered && (
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-slate-800 dark:text-slate-200 space-y-1 animate-in fade-in duration-200">
                  <div className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                    <Sparkles className="w-4 h-4" />
                    Explicación Pedagógica:
                  </div>
                  <p className="leading-relaxed">{currentQ.explanation}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-xs text-slate-500">No hay preguntas disponibles.</p>
          )}
        </div>

        {/* Footer */}
        {isAnswered && !isFinished && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
            <button
              onClick={handleNextQuestion}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2"
            >
              <span>{currentIndex + 1 === questions.length ? 'Ver Resultados' : 'Siguiente Pregunta'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
