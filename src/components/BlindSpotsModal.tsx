import React, { useState } from 'react';
import { 
  Brain, 
  AlertTriangle, 
  Sparkles, 
  X, 
  CheckCircle2, 
  BookOpen, 
  Target, 
  RotateCcw,
  Award,
  ArrowRight
} from 'lucide-react';
import { StudentMistake, StudentProfile, BlindSpotAnalysis } from '../types';
import confetti from 'canvas-confetti';

interface BlindSpotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mistakes: StudentMistake[];
  profile: StudentProfile;
  onAnnounce: (msg: string) => void;
  onAskTutorWithPrompt: (prompt: string) => void;
}

export const BlindSpotsModal: React.FC<BlindSpotsModalProps> = ({
  isOpen,
  onClose,
  mistakes,
  profile,
  onAnnounce,
  onAskTutorWithPrompt,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<BlindSpotAnalysis | null>(null);
  
  // Practice quiz state within the modal
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'microlesson' | 'practice'>('diagnosis');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  if (!isOpen) return null;

  const handleAnalyzeMistakes = async () => {
    setIsAnalyzing(true);
    onAnnounce('S.A.R.A está analizando tu historial de errores para detectar puntos ciegos...');
    try {
      const res = await fetch('/api/tutor/blind-spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mistakes,
          grade: profile.grade,
          subject: profile.currentSubject,
        }),
      });
      const data = await res.json();
      if (data && data.detectedBlindSpots) {
        setAnalysis(data);
        setActiveTab('diagnosis');
        onAnnounce('¡Análisis completado! Se han detectado tus puntos ciegos de aprendizaje.');
      }
    } catch (e) {
      onAnnounce('Error al analizar los puntos ciegos.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectQuizOption = (index: number) => {
    if (isAnswered || !analysis) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const currentQ = analysis.practiceQuestions[currentQuizIndex];
    if (index === currentQ.correctIndex) {
      setQuizScore((prev) => prev + 1);
      onAnnounce('¡Correcto! Has superado este punto ciego.');
    } else {
      onAnnounce('Incorrecto. Revisa la explicación para reforzar el concepto.');
    }
  };

  const handleNextQuizQuestion = () => {
    if (!analysis) return;
    if (currentQuizIndex + 1 < analysis.practiceQuestions.length) {
      setCurrentQuizIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsQuizFinished(true);
      onAnnounce('¡Práctica dirigida completada con éxito!');
      try {
        confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
      } catch (e) {
        // fallback
      }
    }
  };

  const resetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setQuizScore(0);
    setIsQuizFinished(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Detector de Puntos Ciegos & Repasos IA
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Análisis inteligente de errores recurrentes y micro-repasos personalizados
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!analysis ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                <Target className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  ¿Listo para descubrir y corregir tus puntos ciegos?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  S.A.R.A analizará tus quizzes previos, preguntas falladas y dudas recurrentes para identificar exactamente en qué conceptos estás tropezando y generará un plan de estudio milimétricamente enfocado en superarlos.
                </p>
                <div className="pt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Historial registrado: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{mistakes.length}</span> errores o áreas de práctica previa.
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleAnalyzeMistakes}
                  disabled={isAnalyzing}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md flex items-center gap-2 mx-auto cursor-pointer disabled:opacity-50 transition"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analizando rendimiento con IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Analizar mis puntos ciegos ahora</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('diagnosis')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'diagnosis'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>1. Diagnóstico de Puntos Ciegos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('microlesson')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'microlesson'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>2. Micro-Lección de Refuerzo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('practice')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'practice'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>3. Práctica Dirigida</span>
                </button>
              </div>

              {/* Tab 1: Diagnosis */}
              {activeTab === 'diagnosis' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        {analysis.reviewTitle}
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        S.A.R.A ha detectado las siguientes áreas donde tu razonamiento suele presentar dudas o confusiones frecuentes.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {analysis.detectedBlindSpots.map((spot, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            Punto Ciego #{idx + 1}: {spot.concept}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {spot.suggestedReviewTopic}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {spot.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('microlesson')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                    >
                      <span>Continuar a Micro-Lección</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Micro-Lesson */}
              {activeTab === 'microlesson' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-5 rounded-2xl bg-indigo-50/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <BookOpen className="w-5 h-5" />
                      <h4 className="text-sm font-bold">Lección Exclusiva para Superar tus Dificultades</h4>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed space-y-3 whitespace-pre-line">
                      {analysis.microLesson}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onAskTutorWithPrompt(`Explícame con ejemplos detallados y sencillos cómo superar mis puntos ciegos en: ${analysis.detectedBlindSpots.map(b => b.concept).join(', ')}`);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Preguntar dudas al Tutor IA</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('practice')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                    >
                      <span>Ir a Práctica Dirigida</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Practice Quiz */}
              {activeTab === 'practice' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {!isQuizFinished ? (
                    <div className="space-y-4">
                      {(() => {
                        const q = analysis.practiceQuestions[currentQuizIndex];
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                              <span>Pregunta {currentQuizIndex + 1} de {analysis.practiceQuestions.length}</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold">Práctica Anticonfusión</span>
                            </div>

                            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                              {q.question}
                            </h4>

                            <div className="space-y-2.5">
                              {q.options.map((option, oIdx) => {
                                let btnStyle = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400";
                                if (isAnswered) {
                                  if (oIdx === q.correctIndex) {
                                    btnStyle = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold";
                                  } else if (oIdx === selectedOption) {
                                    btnStyle = "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200";
                                  } else {
                                    btnStyle = "opacity-50 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500";
                                  }
                                }

                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() => handleSelectQuizOption(oIdx)}
                                    disabled={isAnswered}
                                    className={`w-full text-left p-3.5 rounded-xl border-2 transition text-xs sm:text-sm font-medium flex items-center justify-between cursor-pointer ${btnStyle}`}
                                  >
                                    <span>{option}</span>
                                    {isAnswered && oIdx === q.correctIndex && (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {isAnswered && (
                              <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 space-y-2 animate-in fade-in duration-150">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                  Explicación Pedagógica
                                </span>
                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {q.explanation}
                                </p>
                                <div className="flex justify-end pt-2">
                                  <button
                                    type="button"
                                    onClick={handleNextQuizQuestion}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                                  >
                                    <span>{currentQuizIndex + 1 < analysis.practiceQuestions.length ? 'Siguiente Pregunta' : 'Ver Resultados'}</span>
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-6 space-y-4 animate-in fade-in">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                        <Award className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                          ¡Repaso Dirigido Completado!
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          Aciertos en práctica dirigida: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{quizScore}</strong> de {analysis.practiceQuestions.length}
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                        Has reforzado los puntos ciegos detectados. Tu comprensión sobre estos conceptos ha quedado consolidada.
                      </p>

                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={resetQuiz}
                          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Repetir Práctica</span>
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-sm"
                        >
                          Finalizar Repaso
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
