import React, { useState } from 'react';
import { 
  FileCode, 
  Mic, 
  Sparkles, 
  X, 
  FileText, 
  Network, 
  CheckCircle2, 
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import { MindMapData, StudentProfile } from '../types';

interface FormatConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onAnnounce: (msg: string) => void;
  onOpenMindMapFromConversion: (mindMap: MindMapData) => void;
}

export const FormatConverterModal: React.FC<FormatConverterModalProps> = ({
  isOpen,
  onClose,
  profile,
  onAnnounce,
  onOpenMindMapFromConversion,
}) => {
  const [rawInput, setRawInput] = useState('');
  const [conversionType, setConversionType] = useState<'summary' | 'mindmap'>('summary');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<{
    title: string;
    keyTakeaways: string[];
    structuredContent: string;
    actionableTip: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawInput.trim()) {
      onAnnounce('Por favor escribe tus apuntes o simula una transcripción de nota de voz.');
      return;
    }

    setIsProcessing(true);
    setSummaryResult(null);
    onAnnounce(conversionType === 'mindmap' ? 'Transformando apuntes en mapa conceptual visual...' : 'Transformando nota de voz en resumen estructurado...');

    try {
      const res = await fetch('/api/tutor/convert-format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawInput,
          conversionType,
          subject: profile.currentSubject,
          grade: profile.grade,
        }),
      });
      const data = await res.json();
      if (conversionType === 'mindmap' && data.mindMap) {
        onAnnounce('¡Mapa conceptual generado con éxito!');
        onClose();
        onOpenMindMapFromConversion(data.mindMap);
      } else if (data.summaryResult) {
        setSummaryResult(data.summaryResult);
        onAnnounce('¡Resumen estructurado generado con éxito!');
      }
    } catch (err) {
      onAnnounce('Error al convertir el formato.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateVoiceNote = () => {
    setRawInput(
      `Nota de voz transcrita: Bueno, hoy en la clase vimos las células eucariotas y procariotas. Las procariotas no tienen núcleo definido, su ADN está libre en el citoplasma, como las bacterias. En cambio, las eucariotas tienen un núcleo protegido por membrana y organelos como las mitocondrias que producen energía, además del retículo endoplásmico. También mencionaron que las plantas tienen cloroplastos para la fotosíntesis y pared celular.`
    );
    setConversionType('mindmap');
    onAnnounce('Nota de voz simulada cargada. Listo para convertir en mapa conceptual.');
  };

  const handleCopySummary = () => {
    if (!summaryResult) return;
    const textToCopy = `# ${summaryResult.title}\n\nPuntos Clave:\n${summaryResult.keyTakeaways.map(k => `- ${k}`).join('\n')}\n\nDesarrollo:\n${summaryResult.structuredContent}\n\nConsejo:\n${summaryResult.actionableTip}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    onAnnounce('Resumen copiado al portapapeles.');
    setTimeout(() => setCopied(false), 2000);
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
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Conversor de Formatos (Voz ➔ Resumen / Apuntes ➔ Mapa Mental)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transforma notas de voz en resúmenes estructurados o apuntes escritos en mapas visuales
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
          <form onSubmit={handleConvert} className="space-y-4">
            {/* Conversion Mode Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                ¿Qué deseas realizar?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConversionType('summary')}
                  className={`p-3 rounded-xl border-2 text-left transition cursor-pointer flex items-center gap-3 ${
                    conversionType === 'summary'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Resumen Estructurado</div>
                    <div className="text-[10px] opacity-80">Ideal para notas de voz o apuntes largos</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setConversionType('mindmap')}
                  className={`p-3 rounded-xl border-2 text-left transition cursor-pointer flex items-center gap-3 ${
                    conversionType === 'mindmap'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Network className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Mapa Conceptual Visual</div>
                    <div className="text-[10px] opacity-80">Convierte texto en esquema conectado</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Input Text Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Apuntes desordenados o transcripción de nota de voz:
                </label>
                <button
                  type="button"
                  onClick={handleSimulateVoiceNote}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Simular nota de voz</span>
                </button>
              </div>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Pega aquí tus apuntes en borrador o la transcripción de lo que grabaste hablando..."
                className="w-full h-36 p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isProcessing || !rawInput.trim()}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Transformando formato con IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{conversionType === 'mindmap' ? 'Generar Mapa Conceptual' : 'Convertir en Resumen'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Results Section for Summary */}
          {summaryResult && (
            <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-slate-800/80 border border-emerald-200 dark:border-slate-700 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{summaryResult.title}</span>
                </h3>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-100 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Puntos Clave
                </span>
                <ul className="space-y-1">
                  {summaryResult.keyTakeaways.map((item, idx) => (
                    <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-emerald-100 dark:border-slate-700">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Desarrollo Estructurado
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                  {summaryResult.structuredContent}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-700 text-xs text-emerald-900 dark:text-emerald-300 font-medium">
                💡 <strong>Consejo Práctico:</strong> {summaryResult.actionableTip}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
