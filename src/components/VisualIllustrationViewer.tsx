import React, { useState } from 'react';
import { VisualIllustrationData } from '../types';
import { 
  Sparkles, 
  Download, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Info, 
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  X
} from 'lucide-react';

interface VisualIllustrationViewerProps {
  data: VisualIllustrationData;
  onAnnounce?: (msg: string) => void;
  isDark?: boolean;
}

export const VisualIllustrationViewer: React.FC<VisualIllustrationViewerProps> = ({ 
  data, 
  onAnnounce 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedLabelIndex, setSelectedLabelIndex] = useState<number | null>(null);

  const handleDownload = () => {
    if (!data.imageUrl) return;
    const isSvg = data.imageUrl.startsWith('data:image/svg');
    const ext = isSvg ? 'svg' : 'png';
    const link = document.createElement('a');
    link.href = data.imageUrl;
    link.download = `explicacion-visual-${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onAnnounce) onAnnounce(`Imagen explicativa descargada como .${ext}`);
  };

  return (
    <>
      <div 
        className={`my-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-all ${
          isFullscreen ? 'fixed inset-2 sm:inset-6 z-50 shadow-2xl flex flex-col overflow-y-auto max-h-[96vh]' : ''
        }`}
      >
        {/* Header */}
        <div className="px-3 sm:px-4 py-2.5 bg-blue-50/80 dark:bg-slate-900 border-b border-blue-100/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 whitespace-nowrap shrink-0">
                  Esquema Explicativo
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate" title={data.title}>
                  {data.title}
                </h4>
              </div>
            </div>
          </div>

          {/* Action buttons - responsive wrap layout so never cut off */}
          <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-blue-100/50 dark:border-slate-800">
            {data.imageUrl && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel(1);
                    setIsLightboxOpen(true);
                  }}
                  title="Ampliar imagen a pantalla completa sin cortes"
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-2xs flex items-center gap-1 text-xs font-semibold shrink-0 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Ampliar</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  title="Descargar imagen explicativa"
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-2xs flex items-center gap-1 text-xs font-semibold shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="hidden xs:inline">Descargar</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              title={isFullscreen ? 'Reducir tamaño' : 'Expandir contenedor'}
              className="p-1.5 sm:px-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-2xs shrink-0 cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Main Image / Diagram Canvas */}
        <div 
          className={`relative bg-slate-950 flex flex-col items-center justify-center cursor-zoom-in ${
            isFullscreen ? 'h-[360px] sm:h-[450px] shrink-0' : 'max-h-[440px] min-h-[260px]'
          }`}
          onClick={() => {
            if (data.imageUrl) {
              setZoomLevel(1);
              setIsLightboxOpen(true);
            }
          }}
        >
          {data.imageUrl ? (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={data.imageUrl}
                alt={data.title}
                referrerPolicy="no-referrer"
                className="w-auto h-auto max-w-full max-h-[340px] sm:max-h-[420px] object-contain transition-transform duration-200 hover:scale-[1.02]"
              />
              <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/20 shadow-lg pointer-events-none">
                <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
                <span>Clic para ver en alta resolución</span>
              </div>
            </div>
          ) : (
            <div className="w-full p-8 text-white text-center flex flex-col items-center justify-center">
              <Layers className="w-12 h-12 text-blue-400 mb-2" />
              <h5 className="font-bold text-sm text-slate-100">{data.title}</h5>
              <p className="text-xs text-slate-300 max-w-md mt-1">{data.caption}</p>
            </div>
          )}
        </div>

        {/* Caption & Explanatory Breakdown */}
        <div className="p-3 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-3">
          {data.caption && (
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {data.caption}
            </p>
          )}

          {/* Key Labels / Parts breakdown */}
          {data.keyLabels && data.keyLabels.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 tracking-wider">
                <Info className="w-3 h-3 text-blue-500" />
                Elementos y partes clave del diagrama:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.keyLabels.map((item, idx) => {
                  const isSelected = selectedLabelIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedLabelIndex(isSelected ? null : idx)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/70 ring-2 ring-blue-400/20 dark:ring-blue-500/30'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                        <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] flex items-center justify-center font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 pl-6 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sequence / Steps */}
          {data.steps && data.steps.length > 0 && (
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                Secuencia / Pasos:
              </span>
              <ul className="mt-2 space-y-1.5">
                {data.steps.map((step, sIdx) => (
                  <li key={sIdx} className="text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3.5 py-2 bg-slate-50/80 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
          <span className="flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Generado pedagógicamente por S.A.R.A
          </span>
          {data.imageUrl && (
            <button
              type="button"
              onClick={handleDownload}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Guardar Foto
            </button>
          )}
        </div>
      </div>

      {/* Lightbox / High Resolution Zoom Modal with Full Scroll */}
      {isLightboxOpen && data.imageUrl && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/92 backdrop-blur-md flex flex-col overflow-y-auto p-3 sm:p-6"
          role="dialog"
          aria-label="Visor de imagen a alta resolución"
        >
          {/* Top Sticky Bar */}
          <div className="sticky top-0 z-20 w-full max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 py-2.5 rounded-2xl border border-slate-800 text-white shadow-xl mb-4">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold truncate" title={data.title}>{data.title}</h3>
                <p className="text-[11px] text-slate-400">Vista ampliada y desglose explicativo</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
              {/* Zoom Controls */}
              <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                  title="Reducir zoom"
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold px-2 tabular-nums text-blue-400">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                  title="Aumentar zoom"
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                title="Descargar imagen"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition flex items-center gap-1.5 text-xs font-semibold px-3 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Descargar</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                title="Cerrar visor"
                className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition shadow-lg shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Container for Lightbox Image + All Explanatory Texts */}
          <div className="w-full max-w-5xl mx-auto flex flex-col items-center pb-12 space-y-6">
            {/* Image Canvas */}
            <div className="w-full bg-slate-950 rounded-2xl border border-slate-800 p-6 flex items-center justify-center overflow-auto min-h-[360px] sm:min-h-[500px] shadow-2xl">
              <div 
                className="transition-transform duration-200 ease-out flex items-center justify-center"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={data.imageUrl}
                  alt={data.title}
                  referrerPolicy="no-referrer"
                  className="max-w-[85vw] max-h-[70vh] object-contain rounded-xl shadow-2xl bg-slate-900"
                />
              </div>
            </div>

            {/* Explanation / Breakdown inside Lightbox so user can scroll down and read everything */}
            <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 text-slate-100 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Info className="w-5 h-5 text-blue-400" />
                <h4 className="font-bold text-sm sm:text-base">Explicación y Elementos del Diagrama</h4>
              </div>

              {data.caption && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  {data.caption}
                </p>
              )}

              {data.keyLabels && data.keyLabels.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                    Partes Clave:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.keyLabels.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-1">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        {item.description && (
                          <p className="text-slate-300 text-[11px] pl-7 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.steps && data.steps.length > 0 && (
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                    Secuencia Explicativa:
                  </span>
                  <ul className="space-y-2">
                    {data.steps.map((st, sIdx) => (
                      <li key={sIdx} className="text-xs text-slate-300 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

