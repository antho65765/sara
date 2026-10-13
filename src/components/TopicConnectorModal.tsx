import React, { useState } from 'react';
import { Share2, Sparkles, X, ArrowRight, Brain, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TopicMemory, StudentGrade } from '../types';
import { formatTopicTitle } from '../utils/textSanitizer';

interface TopicConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: TopicMemory[];
  defaultTopicA?: TopicMemory;
  studentGrade: StudentGrade;
  onAnnounce: (msg: string) => void;
}

export const TopicConnectorModal: React.FC<TopicConnectorModalProps> = ({
  isOpen,
  onClose,
  memories,
  defaultTopicA,
  studentGrade,
  onAnnounce,
}) => {
  const [topicAId, setTopicAId] = useState<string>(
    defaultTopicA?.id || (memories.length > 0 ? memories[0].id : '')
  );
  const [topicBId, setTopicBId] = useState<string>(
    memories.length > 1 ? memories[1].id : ''
  );
  const [connectionResult, setConnectionResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const topicA = memories.find((m) => m.id === topicAId);
  const topicB = memories.find((m) => m.id === topicBId);

  const handleGenerateConnection = async () => {
    if (!topicA || !topicB || topicA.id === topicB.id) return;

    setIsLoading(true);
    setConnectionResult(null);
    onAnnounce('Generando conexión interdisciplinaria entre ambos temas...');

    try {
      const res = await fetch('/api/tutor/connect-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicA: topicA.topicTitle,
          topicB: topicB.topicTitle,
          subjectA: topicA.subjectDisplayName || topicA.subject,
          subjectB: topicB.subjectDisplayName || topicB.subject,
          grade: studentGrade,
        }),
      });

      const data = await res.json();
      if (data.connectionText) {
        setConnectionResult(data.connectionText);
        onAnnounce('Conexión completada. Puedes leer la explicación.');
      } else {
        setConnectionResult('No se pudo generar la conexión. Intenta de nuevo.');
      }
    } catch (e: any) {
      console.error(e);
      setConnectionResult('Ocurrió un error al consultar al tutor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="connector-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="connector-title"
    >
      <div
        id="connector-dialog"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="connector-title" className="text-base font-bold">
                Puente Interdisciplinario de Memoria
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Descubre cómo se conectan dos temas aprendidos en tu memoria escolar.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar conector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="py-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Topic A */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Primer Tema
              </label>
              <select
                value={topicAId}
                onChange={(e) => setTopicAId(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-hidden font-medium"
              >
                {memories.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.subjectDisplayName || m.subject}] {formatTopicTitle(m.topicTitle)}
                  </option>
                ))}
              </select>
              {topicA && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2">
                  {topicA.summary}
                </p>
              )}
            </div>

            {/* Topic B */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Segundo Tema
              </label>
              <select
                value={topicBId}
                onChange={(e) => setTopicBId(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-hidden font-medium"
              >
                {memories.map((m) => (
                  <option key={m.id} value={m.id} disabled={m.id === topicAId}>
                    [{m.subjectDisplayName || m.subject}] {formatTopicTitle(m.topicTitle)}
                  </option>
                ))}
              </select>
              {topicB && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2">
                  {topicB.summary}
                </p>
              )}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleGenerateConnection}
              disabled={isLoading || !topicA || !topicB || topicA.id === topicB.id}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold shadow-md transition-all inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isLoading ? 'Conectando conceptos...' : 'Descubrir Conexión Pedagógica'}
            </button>
          </div>

          {/* Results Output */}
          {connectionResult && (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-slate-800 dark:text-slate-200 space-y-2 animate-in fade-in duration-200">
              <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-400">
                <Brain className="w-4 h-4" />
                Puente Interdisciplinario:
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                <ReactMarkdown>{connectionResult}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
