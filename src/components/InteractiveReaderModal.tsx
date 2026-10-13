import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  X, 
  Send, 
  MessageSquare, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  BookMarked
} from 'lucide-react';

interface InteractiveReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnnounce: (msg: string) => void;
}

export const InteractiveReaderModal: React.FC<InteractiveReaderModalProps> = ({
  isOpen,
  onClose,
  onAnnounce,
}) => {
  const [textbookText, setTextbookText] = useState('');
  const [chapterTitle, setChapterTitle] = useState('Capítulo 1: Introducción al Estudio');
  const [question, setQuestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'assistant'; text: string; followUps?: string[] }[]>([]);
  const [mobileTab, setMobileTab] = useState<'text' | 'chat'>('text');

  if (!isOpen) return null;

  const handleAskQuestion = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const query = customQ || question;
    if (!query.trim()) return;

    if (!textbookText.trim()) {
      onAnnounce('Por favor pega el texto o fragmento del libro de texto primero.');
      return;
    }

    const userMsg = query;
    if (!customQ) setQuestion('');
    setChatLog((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setIsAnalyzing(true);
    onAnnounce('Analizando el texto y redactando respuesta pedagógica...');

    try {
      const res = await fetch('/api/tutor/textbook-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textbookText,
          question: userMsg,
          chapter: chapterTitle,
        }),
      });
      const data = await res.json();
      if (data && data.answer) {
        setChatLog((prev) => [
          ...prev,
          { 
            sender: 'assistant', 
            text: data.answer, 
            followUps: data.suggestedFollowUps || [] 
          }
        ]);
        onAnnounce('Respuesta lista.');
      }
    } catch (err) {
      onAnnounce('Error al consultar el asistente de lectura.');
      setChatLog((prev) => [
        ...prev,
        { sender: 'assistant', text: 'Lo siento, ocurrió un error procesando el texto. Inténtalo de nuevo.' }
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadSampleText = () => {
    setTextbookText(
      `Capítulo 3: Las Leyes de la Termodinámica y la Conservación de la Energía.
      La termodinámica es la rama de la física que describe los estados de equilibrio termodinámico a nivel macroscópico. 
      Primera Ley (Conservación de la Energía): La energía total de un sistema aislado se mantiene constante; la energía no se crea ni se destruye, solo se transforma. Matemáticamente se expresa como ΔU = Q - W, donde U es la energía interna, Q es el calor añadido al sistema y W es el trabajo realizado por el sistema sobre su entorno.
      Segunda Ley: La entropía de cualquier sistema aislado tiende a incrementarse con el tiempo, lo que establece la dirección natural de los procesos físicos (procesos irreversibles). Por ejemplo, el calor siempre fluye espontáneamente de los cuerpos calientes a los más fríos y nunca a la inversa sin un trabajo externo.`
    );
    setChapterTitle('Física - Termodinámica y Energía');
    onAnnounce('Texto de muestra cargado exitosamente.');
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Asistente de Lectura Interactiva (Chat con Libros de Texto)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Haz preguntas sobre capítulos extensos sin necesidad de leerlos completos
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

        {/* Mobile Tab Switcher */}
        <div className="md:hidden flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 p-1 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('text')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'text'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Texto del Libro</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('chat')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'chat'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>2. Chat Asistente ({chatLog.length})</span>
          </button>
        </div>

        {/* Content Body (Split view on desktop, Tab view on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Column: Textbook Input */}
          <div className={`md:col-span-5 p-4 sm:p-5 border-r border-slate-200 dark:border-slate-800 flex-col gap-3 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/30 ${
            mobileTab === 'text' ? 'flex' : 'hidden md:flex'
          }`}>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Título del Capítulo o Libro</span>
                <button
                  type="button"
                  onClick={handleLoadSampleText}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  Cargar texto de muestra
                </button>
              </label>
              <input
                type="text"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="Ej: Capítulo 4 - Fotosíntesis"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Contenido del Libro / Capítulo
                </label>
                {/* Quick button for mobile to jump to chat once text is added */}
                <button
                  type="button"
                  onClick={() => setMobileTab('chat')}
                  className="md:hidden text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Ir al Chat ➔</span>
                </button>
              </div>
              <textarea
                value={textbookText}
                onChange={(e) => setTextbookText(e.target.value)}
                placeholder="Pega aquí el texto completo del capítulo, artículo científico o fragmento de libro que deseas consultar..."
                className="w-full flex-1 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[160px] md:min-h-[220px]"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Puedes pegar hasta 15,000 caracteres de texto por consulta.
              </p>
            </div>
          </div>

          {/* Right Column: Chat Assistant */}
          <div className={`md:col-span-7 flex-col h-full bg-white dark:bg-slate-900 overflow-hidden ${
            mobileTab === 'chat' ? 'flex flex-1' : 'hidden md:flex'
          }`}>
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
              {chatLog.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-inner">
                    <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div className="max-w-sm space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Pregúntale al Asistente de Lectura
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Pega tu texto en la pestaña anterior y escribe cualquier duda o pídele un resumen de los puntos clave.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleLoadSampleText();
                        setMobileTab('chat');
                        setTimeout(() => {
                          handleAskQuestion(undefined, '¿Cuál es la primera ley de la termodinámica?');
                        }, 100);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer transition"
                    >
                      💡 "¿Qué dice la primera ley?"
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleLoadSampleText();
                        setMobileTab('chat');
                        setTimeout(() => {
                          handleAskQuestion(undefined, 'Hazme un resumen de 3 puntos clave.');
                        }, 100);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer transition"
                    >
                      📝 "Resumen de 3 puntos"
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatLog.map((msg, idx) => (
                    <div 
                      key={idx}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[90%] sm:max-w-[85%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs space-y-3'
                      }`}>
                        <div className="whitespace-pre-line">{msg.text}</div>

                        {msg.followUps && msg.followUps.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                              Preguntas sugeridas:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.followUps.map((fu, fIdx) => (
                                <button
                                  key={fIdx}
                                  type="button"
                                  onClick={() => handleAskQuestion(undefined, fu)}
                                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 text-purple-700 dark:text-purple-300 text-[11px] font-semibold hover:bg-purple-50 transition cursor-pointer"
                                >
                                  {fu}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isAnalyzing && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 w-fit animate-pulse">
                      <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      <span>El asistente está leyendo y analizando el capítulo...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form 
              onSubmit={handleAskQuestion}
              className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Pregúntale algo específico..."
                disabled={isAnalyzing}
                className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={isAnalyzing || !question.trim()}
                className="px-3 sm:px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm transition"
              >
                <span>Preguntar</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
