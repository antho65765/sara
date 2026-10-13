import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  RotateCcw, 
  Sparkles, 
  CheckSquare, 
  Square,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion, TopicMemory } from '../types';

interface ExamModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  subjectName: string;
  initialMemory?: TopicMemory;
  onAnnounce: (msg: string) => void;
}

export const ExamModeModal: React.FC<ExamModeModalProps> = ({
  isOpen,
  onClose,
  topicTitle,
  subjectName,
  initialMemory,
  onAnnounce,
}) => {
  const [step, setStep] = useState<'study' | 'exam' | 'results'>('study');
  
  // Study phase state
  const [reviewedConcepts, setReviewedConcepts] = useState<Record<number, boolean>>({});
  
  // Exam questions state (generated or default robust questions based on topic)
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer

  if (!isOpen) return null;

  // Initialize questions if empty
  const ensureQuestions = () => {
    if (questions.length > 0) return;
    
    // Generate intelligent practice exam questions based on topicTitle
    const generated: QuizQuestion[] = [
      {
        id: 'q1',
        question: `¿Cuál es el principio fundamental o definición central al estudiar "${topicTitle}"?`,
        options: [
          `Establecer la relación directa entre los componentes teóricos y su aplicación práctica.`,
          `Ignorar las excepciones para simplificar el cálculo matemático.`,
          `Memorizar únicamente fechas y nombres sin analizar su contexto.`,
          `Asumir que todos los sistemas operan bajo condiciones ideales constantes.`
        ],
        correctIndex: 0,
        explanation: `En "${topicTitle}", comprender la relación entre la teoría y la práctica es clave para resolver cualquier problema de examen con éxito.`
      },
      {
        id: 'q2',
        question: `¿Cuál de los siguientes errores comunes se debe EVITAR al resolver problemas relacionados con "${topicTitle}"?`,
        options: [
          `Verificar las unidades de medida y las condiciones iniciales del planteamiento.`,
          `Aplicar una fórmula general sin comprobar si se cumplen las restricciones del teorema.`,
          `Realizar un esquema visual previo antes de iniciar los cálculos.`,
          `Consultar los conceptos clave y revisar paso a paso la lógica.`
        ],
        correctIndex: 1,
        explanation: `Uno de los errores más frecuentes en los exámenes es aplicar fórmulas de manera mecánica sin verificar que las hipótesis del teorema se cumplan.`
      },
      {
        id: 'q3',
        question: `Al analizar un caso práctico sobre "${topicTitle}", ¿cuál es el primer paso recomendado?`,
        options: [
          `Comenzar a escribir números al azar hasta que coincida con una opción.`,
          `Identificar con claridad los datos conocidos, las incógnitas y el objetivo principal.`,
          `Dejar el ejercicio para el final del examen sin importar su puntaje.`,
          `Suponer que el resultado siempre será un número entero.`
        ],
        correctIndex: 1,
        explanation: `Identificar con precisión los datos y lo que se pide (incógnitas) evita confusiones y garantiza un razonamiento estructurado.`
      },
      {
        id: 'q4',
        question: `¿Cómo se comprueba si el resultado obtenido en "${topicTitle}" es correcto y coherente?`,
        options: [
          `Verificando si tiene sentido físico/lógico y probando el resultado con un caso límite sencillo.`,
          `Dando por sentado que si el cálculo fue largo, el resultado es correcto.`,
          `Comparando exclusivamente el número de cifras decimales.`,
          `Cambiando los datos del problema hasta obtener cero.`
        ],
        correctIndex: 0,
        explanation: `La comprobación mediante casos límite y coherencia lógica es la mejor herramienta de autoevaluación durante un examen.`
      },
      {
        id: 'q5',
        question: `¿Qué actitud mental recomienda S.A.R.A para afrontar con éxito la evaluación final de "${topicTitle}"?`,
        options: [
          `Ansiedad y prisa por terminar antes que los demás.`,
          `Confianza basada en el repaso activo, lectura de esquemas y comprensión profunda.`,
          `Confianza ciega sin leer detenidamente los incisos.`,
          `Adivinar todas las respuestas en los últimos 30 segundos.`
        ],
        correctIndex: 1,
        explanation: `El estudio activo y la comprensión de los conceptos clave aseguran el máximo rendimiento y tranquilidad mental en la prueba.`
      }
    ];

    setQuestions(generated);
  };

  const handleStartExam = () => {
    ensureQuestions();
    setStep('exam');
    onAnnounce('Modo Examen iniciado. Lee cada pregunta con atención y responde con confianza.');
  };

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (isExamSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmitExam = () => {
    let calculatedScore = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        calculatedScore += 1;
      }
    });

    setScore(calculatedScore);
    setIsExamSubmitted(true);
    setStep('results');

    const passed = calculatedScore >= Math.ceil(questions.length * 0.6);
    if (passed) {
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
      onAnnounce(`¡Felicitaciones! Has aprobado el simulacro de examen con ${calculatedScore} de ${questions.length}. Estás listo para el éxito.`);
    } else {
      onAnnounce(`Simulacro completado. Obtuviste ${calculatedScore} de ${questions.length}. Te recomendamos repasar las explicaciones.`);
    }
  };

  const restartExam = () => {
    setSelectedAnswers({});
    setIsExamSubmitted(false);
    setScore(0);
    setStep('study');
    onAnnounce('Reiniciando sesión de estudio y simulacro de examen.');
  };

  // Key concepts for study
  const keyConcepts = initialMemory?.keyConcepts || [
    `Definición fundamental y principios teóricos de ${topicTitle}`,
    `Metodología de resolución paso a paso`,
    `Casos prácticos de aplicación real`,
    `Errores frecuentes en exámenes y cómo evitarlos`,
    `Fórmulas, relaciones y conexiones con otros temas`
  ];

  return (
    <div 
      id="exam-mode-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-mode-title"
    >
      <div 
        id="exam-mode-dialog"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Modo Examen Oficial
                </span>
                <span className="text-xs text-slate-500 font-medium">({subjectName})</span>
              </div>
              <h2 id="exam-mode-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {topicTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar modo examen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="py-3 flex items-center justify-center gap-4 text-xs font-bold border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${step === 'study' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}>
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. Estudio Guiado</span>
          </div>
          <div className="w-6 h-0.5 bg-slate-200 dark:bg-slate-700" />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${step === 'exam' || step === 'results' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>2. Examen de Simulación</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          {step === 'study' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Introduction Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/40 border border-blue-100 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-200 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    Prepárate antes del examen oficial
                  </p>
                  <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                    Repasa los siguientes conceptos clave de <strong>{topicTitle}</strong>. Marca cada uno cuando lo domines y, cuando estés listo, inicia el examen de simulación para comprobar si estás preparado para obtener la máxima nota.
                  </p>
                </div>
              </div>

              {/* Concept Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                  Checklist de Estudio (Conceptos Clave):
                </h3>
                <div className="space-y-2">
                  {keyConcepts.map((concept, idx) => {
                    const isChecked = reviewedConcepts[idx] || false;
                    return (
                      <div
                        key={idx}
                        onClick={() => setReviewedConcepts((prev) => ({ ...prev, [idx]: !isChecked }))}
                        className={`p-3.5 rounded-2xl border text-xs sm:text-sm cursor-pointer transition flex items-center justify-between gap-3 ${
                          isChecked
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-semibold'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400 shrink-0" />
                          )}
                          <span className={isChecked ? 'line-through opacity-90' : ''}>{concept}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {isChecked ? 'Repasado' : 'Pendiente'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Study Summary Notes */}
              {initialMemory?.summary && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Resumen y Notas de Memoria:</h4>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {initialMemory.summary}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'exam' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Exam Header bar */}
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Pregunta {currentQuestionIndex + 1} de {questions.length}
                </span>
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <Clock className="w-4 h-4" />
                  Simulacro cronometrado
                </span>
              </div>

              {/* Current Question */}
              {questions[currentQuestionIndex] && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-slate-900 dark:text-slate-100">
                    <h3 className="text-sm sm:text-base font-bold leading-relaxed">
                      {questions[currentQuestionIndex].question}
                    </h3>
                  </div>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {questions[currentQuestionIndex].options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(currentQuestionIndex, optIdx)}
                          className={`w-full text-left p-3.5 rounded-2xl border text-xs sm:text-sm transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-100 font-bold ring-2 ring-indigo-500/30'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation between questions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((p) => Math.max(0, p - 1))}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Anterior
                </button>

                <div className="flex gap-1.5">
                  {questions.map((_, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => setCurrentQuestionIndex(qIdx)}
                      className={`w-7 h-7 rounded-xl text-xs font-bold transition ${
                        currentQuestionIndex === qIdx
                          ? 'bg-indigo-600 text-white'
                          : selectedAnswers[qIdx] !== undefined
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {qIdx + 1}
                    </button>
                  ))}
                </div>

                {currentQuestionIndex + 1 < questions.length ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex((p) => p + 1)}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitExam}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                  >
                    <span>Finalizar Examen</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="text-center py-4 space-y-5 animate-in fade-in duration-300">
              <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xl">
                <Trophy className="w-10 h-10 animate-bounce" style={{ animationDuration: '2.5s' }} />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  ¡Resultado del Simulacro!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Has obtenido <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold text-base">{score}</strong> de {questions.length} respuestas correctas.
                </p>
              </div>

              {/* Verdict Card */}
              <div className={`p-4 rounded-2xl border max-w-md mx-auto text-xs sm:text-sm font-medium ${
                score >= 4
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                  : score >= 3
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
                  : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
              }`}>
                {score >= 4 ? (
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-700 dark:text-emerald-300 text-base">
                      🎉 ¡Estás 100% Listo para el Examen Oficial!
                    </p>
                    <p className="text-xs">
                      Tu dominio de <strong>{topicTitle}</strong> es excelente. Has demostrado un razonamiento sólido y preciso.
                    </p>
                  </div>
                ) : score >= 3 ? (
                  <div className="space-y-1">
                    <p className="font-bold text-blue-700 dark:text-blue-300 text-base">
                      👍 ¡Buen nivel de preparación!
                    </p>
                    <p className="text-xs">
                      Vas por muy buen camino. Te sugerimos revisar las explicaciones de las preguntas que fallaste para asegurar la nota máxima.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-bold text-amber-700 dark:text-amber-300 text-base">
                      ⚠️ Se recomienda repasar más
                    </p>
                    <p className="text-xs">
                      Te sugerimos regresar al estudio guiado y consultar con el tutor de S.A.R.A las dudas puntuales antes de tu examen.
                    </p>
                  </div>
                )}
              </div>

              {/* Review Answers Breakdown */}
              <div className="text-left space-y-3 pt-2 max-w-lg mx-auto">
                <h4 className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  Revisión detallada de respuestas:
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {questions.map((q, qIdx) => {
                    const userOpt = selectedAnswers[qIdx];
                    const isCorrect = userOpt === q.correctIndex;
                    return (
                      <div 
                        key={q.id}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          isCorrect 
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900' 
                            : 'bg-red-50/50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                          {isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                          <span>P{qIdx + 1}: {q.question}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 pl-5">
                          <strong>Tu respuesta:</strong> {userOpt !== undefined ? q.options[userOpt] : 'Sin responder'}
                          {!isCorrect && (
                            <span className="block text-emerald-700 dark:text-emerald-400 mt-0.5">
                              <strong>Correcta:</strong> {q.options[q.correctIndex]}
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5 italic pt-0.5">
                          💡 {q.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={restartExam}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  Repasar y Reintentar
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition"
                >
                  Finalizar y Volver al Estudio
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions for Study Step */}
        {step === 'study' && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-500 font-medium">
              Revisa los puntos y pon a prueba tu preparación
            </span>
            <button
              type="button"
              onClick={handleStartExam}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs sm:text-sm font-bold shadow-lg transition flex items-center gap-2"
            >
              <span>¡Iniciar Examen de Simulación! 🚀</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
