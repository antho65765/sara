import React, { useState, useEffect } from 'react';
import { 
  Code, 
  Lock, 
  Unlock, 
  X, 
  Terminal, 
  Database, 
  RefreshCw, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  Trash2,
  FileText,
  Cpu,
  Layers,
  Activity,
  Zap,
  ShieldAlert,
  Server,
  Globe,
  Gauge,
  Bug,
  Volume2
} from 'lucide-react';
import { StudentProfile, TopicMemory, StudentMistake } from '../types';

interface DeveloperModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onUpdateProfile: (p: StudentProfile) => void;
  xp: number;
  onUpdateXp: (xp: number) => void;
  streak: number;
  onUpdateStreak: (s: number) => void;
  memories: TopicMemory[];
  mistakes: StudentMistake[];
  onAnnounce: (msg: string) => void;
  onResetData: () => void;
}

export const DeveloperModeModal: React.FC<DeveloperModeModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  xp,
  onUpdateXp,
  streak,
  onUpdateStreak,
  memories,
  mistakes,
  onAnnounce,
  onResetData,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<'diag' | 'network' | 'storage' | 'memories' | 'faults' | 'flags' | 'logs' | 'json'>('diag');

  // LocalStorage keys inspector
  const [storageItems, setStorageItems] = useState<{ key: string; value: string; sizeKb: number }[]>([]);
  const [benchmarkResult, setBenchmarkResult] = useState<{ durationMs: number; opsPerSec: number; score: string } | null>(null);
  
  // Feature Flags state
  const [flags, setFlags] = useState({
    mockApiLatency: true,
    debugOverlay: localStorage.getItem('sara_debug_overlay') === 'true',
    strictMemoryValidation: true,
    autoVoiceSynthesis: false,
    sandboxMode: true,
    verboseLogging: true,
  });

  // Network Tester state
  const [apiEndpoint, setApiEndpoint] = useState('/api/tutor/chat');
  const [apiPayload, setApiPayload] = useState('{\n  "message": "Hola S.A.R.A, test de API",\n  "subject": "matematicas"\n}');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(false);

  // Fault simulation state
  const [simulatedError, setSimulatedError] = useState<string | null>(null);

  // Captured console logs
  const [logs, setLogs] = useState<{ timestamp: string; type: 'info' | 'warn' | 'error'; message: string }[]>([
    { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'S.A.R.A Core Engine initialized successfully.' },
    { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Gemini API proxy route mounted at /api/tutor/chat.' },
    { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Developer Console ready with advanced diagnostic toolkit.' },
  ]);

  useEffect(() => {
    if (isUnlocked) {
      loadStorageItems();
    }
  }, [isUnlocked, activeTab]);

  const loadStorageItems = () => {
    try {
      const items: { key: string; value: string; sizeKb: number }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          const sizeKb = Math.round((key.length + value.length) * 2 / 1024 * 100) / 100;
          items.push({ key, value, sizeKb });
        }
      }
      setStorageItems(items);
    } catch (err) {
      console.error(err);
    }
  };

  const [jsonText, setJsonText] = useState(() => JSON.stringify({
    profile,
    xp,
    streak,
    totalMemories: memories.length,
    totalMistakes: mistakes.length,
    timestamp: new Date().toISOString()
  }, null, 2));

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === '0612') {
      setIsUnlocked(true);
      setPinError(false);
      onAnnounce('Modo Desarrollador desbloqueado.');
      setLogs((prev) => [
        { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Developer Mode successfully unlocked via secure PIN.' },
        ...prev
      ]);
    } else {
      setPinError(true);
      onAnnounce('Clave secreta incorrecta.');
      setLogs((prev) => [
        { timestamp: new Date().toLocaleTimeString(), type: 'error', message: 'Failed Developer Mode PIN attempt.' },
        ...prev
      ]);
    }
  };

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed.profile) onUpdateProfile(parsed.profile);
      if (typeof parsed.xp === 'number') onUpdateXp(parsed.xp);
      if (typeof parsed.streak === 'number') onUpdateStreak(parsed.streak);
      onAnnounce('Estado actualizado correctamente.');
      setLogs((prev) => [
        { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'State updated via JSON raw editor.' },
        ...prev
      ]);
    } catch (err) {
      onAnnounce('Error: JSON inválido.');
    }
  };

  const handleTestApiRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsApiLoading(true);
    setApiResponse('Enviando solicitud de prueba...');
    const startTime = performance.now();

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: apiPayload,
      });
      const data = await res.json();
      const duration = Math.round(performance.now() - startTime);
      setApiResponse(JSON.stringify({ status: res.status, latencyMs: duration, data }, null, 2));
      setLogs((prev) => [
        { timestamp: new Date().toLocaleTimeString(), type: 'info', message: `API test to ${apiEndpoint} completed in ${duration}ms (Status ${res.status})` },
        ...prev
      ]);
    } catch (err: any) {
      setApiResponse(JSON.stringify({ error: err.message || 'Network error' }, null, 2));
      setLogs((prev) => [
        { timestamp: new Date().toLocaleTimeString(), type: 'error', message: `API test to ${apiEndpoint} failed: ${err.message}` },
        ...prev
      ]);
    } finally {
      setIsApiLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl bg-slate-950 border border-cyan-900/60 text-slate-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/80 shadow-inner">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-cyan-300 tracking-wide">
                Consola Avanzada de Desarrollador [S.A.R.A Pro DevTools]
              </h2>
              <p className="text-xs text-slate-400">
                Suite completa de depuración, pruebas de red, inyección de fallas e inspección de estado
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isUnlocked ? (
          /* PIN Verification Form */
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-cyan-900/60 text-cyan-400 flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-base font-bold text-slate-200">
                Acceso Restringido a Desarrolladores
              </h3>
              <p className="text-xs text-slate-400">
                Esta área contiene la suite profesional de depuración. Introduce la clave secreta de acceso.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4 w-full max-w-xs">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                autoFocus
                className={`w-full px-4 py-3 rounded-xl bg-slate-900 border text-center text-2xl tracking-widest text-cyan-300 focus:outline-none focus:ring-2 ${
                  pinError ? 'border-rose-500 focus:ring-rose-500' : 'border-cyan-900/60 focus:ring-cyan-500'
                }`}
              />
              {pinError && (
                <p className="text-xs text-rose-400 font-semibold">
                  Clave secreta incorrecta.
                </p>
              )}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg"
              >
                Autenticar Consola Pro
              </button>
            </form>
          </div>
        ) : (
          /* Unlocked Dev Console */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Subtabs */}
            <div className="flex flex-wrap border-b border-slate-800 bg-slate-900/60 px-6 pt-3 gap-2 sm:gap-3 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('diag')}
                className={`pb-2.5 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'diag'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                📊 Diagnóstico
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('network')}
                className={`pb-2.5 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'network'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                🌐 Probador API (Network)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('storage');
                  loadStorageItems();
                }}
                className={`pb-2.5 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'storage'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                💾 LocalStorage ({storageItems.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('memories')}
                className={`pb-2.5 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'memories'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                🧠 Memoria ({memories.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('faults')}
                className={`pb-2.5 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'faults'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚡ Inyección de Fallas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('flags')}
                className={`pb-2.5 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'flags'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                🎛️ Feature Flags
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={`pb-2.5 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'logs'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                📜 Logs ({logs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('json')}
                className={`pb-2.5 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'json'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                📝 Editor JSON
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {activeTab === 'diag' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">XP / Nivel</div>
                      <div className="text-xl font-black text-cyan-300 mt-1">{xp} (Nv. {Math.floor(xp / 300) + 1})</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Racha Actual</div>
                      <div className="text-xl font-black text-amber-300 mt-1">{streak} días</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Memoria Temas</div>
                      <div className="text-xl font-black text-indigo-300 mt-1">{memories.length} reg.</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Errores Quiz</div>
                      <div className="text-xl font-black text-rose-300 mt-1">{mistakes.length} fallos</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
                    <div className="text-cyan-400 font-bold flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      <span>Entorno y Runtime de S.A.R.A Pro:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>• User Agent: {navigator.userAgent.slice(0, 45)}...</div>
                      <div>• Idioma: {navigator.language}</div>
                      <div>• Memoria Heap JS: {(performance as any).memory ? `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)} MB` : 'No disponible'}</div>
                      <div>• Almacenamiento Local: ~{Math.round(JSON.stringify(localStorage).length / 1024)} KB usados</div>
                      <div>• Estudiante: {profile.name} ({profile.grade})</div>
                      <div>• Estilo pedagógico: {profile.learningStyle}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const ops = 2000000;
                        const start = performance.now();
                        let val = 0;
                        for (let i = 0; i < ops; i++) {
                          val += Math.sqrt(i) * Math.sin(i);
                        }
                        const duration = performance.now() - start;
                        const durationMs = Math.round(duration * 100) / 100;
                        const opsPerSec = Math.round((ops / (durationMs / 1000)));
                        const score = durationMs < 50 ? 'Óptimo (Clase A)' : durationMs < 150 ? 'Estándar (Clase B)' : 'Pesado (Clase C)';
                        
                        setBenchmarkResult({ durationMs, opsPerSec, score });
                        onAnnounce(`Benchmark CPU completado: ${ops.toLocaleString()} ops en ${durationMs}ms.`);
                        setLogs(prev => [{ timestamp: new Date().toLocaleTimeString(), type: 'info', message: `CPU Benchmark: ${ops} ops in ${durationMs}ms (${opsPerSec.toLocaleString()} ops/sec) - ${score}` }, ...prev]);
                      }}
                      className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-cyan-300 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Gauge className="w-4 h-4 text-cyan-400" />
                      <span>Ejecutar Benchmark CPU</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('storage');
                        loadStorageItems();
                        onAnnounce('Cambiado a pestaña de Almacenamiento Local.');
                      }}
                      className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-indigo-300 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Database className="w-4 h-4 text-indigo-400" />
                      <span>Inspeccionar Storage</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if ('speechSynthesis' in window) {
                          const utterance = new SpeechSynthesisUtterance('Diagnóstico de audio S.A.R.A activado con éxito.');
                          utterance.lang = 'es-ES';
                          window.speechSynthesis.speak(utterance);
                          onAnnounce('Audio sintetizado.');
                        } else {
                          onAnnounce('TTS no soportado en este navegador.');
                        }
                      }}
                      className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <span>Probar Síntesis Voz (TTS)</span>
                    </button>
                  </div>

                  {benchmarkResult && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-cyan-900/60 space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                          <Gauge className="w-4 h-4" />
                          <span>Resultado de Benchmark CPU</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold">
                          {benchmarkResult.score}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-1 font-mono text-xs">
                        <div className="p-2 rounded bg-slate-950 border border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase">Tiempo total</div>
                          <div className="text-sm font-bold text-slate-200 mt-0.5">{benchmarkResult.durationMs} ms</div>
                        </div>
                        <div className="p-2 rounded bg-slate-950 border border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase">Velocidad</div>
                          <div className="text-sm font-bold text-emerald-400 mt-0.5">{benchmarkResult.opsPerSec.toLocaleString()} ops/s</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'network' && (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-400">
                    Probador de Endpoints y Proxy de IA:
                  </div>
                  <form onSubmit={handleTestApiRequest} className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={apiEndpoint}
                        onChange={(e) => setApiEndpoint(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="/api/tutor/chat"
                      />
                      <button
                        type="submit"
                        disabled={isApiLoading}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-xs cursor-pointer shadow-sm"
                      >
                        {isApiLoading ? 'Enviando...' : 'Enviar Petición'}
                      </button>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 mb-1 block">Payload JSON:</label>
                      <textarea
                        value={apiPayload}
                        onChange={(e) => setApiPayload(e.target.value)}
                        className="w-full h-28 p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                      />
                    </div>
                  </form>

                  {apiResponse && (
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-slate-400">Respuesta HTTP:</div>
                      <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto max-h-48">
                        {apiResponse}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'storage' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">
                      Claves y valores registrados en localStorage:
                    </span>
                    <button
                      type="button"
                      onClick={loadStorageItems}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Actualizar</span>
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto font-mono text-xs">
                    {storageItems.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 italic bg-slate-900 rounded-xl border border-slate-800">
                        No hay elementos en localStorage.
                      </div>
                    ) : (
                      storageItems.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="font-bold text-cyan-400 truncate">{item.key}</div>
                            <div className="text-[11px] text-slate-400 truncate">{item.value}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">{item.sizeKb} KB</span>
                            <button
                              type="button"
                              onClick={() => {
                                localStorage.removeItem(item.key);
                                loadStorageItems();
                                onAnnounce(`Clave ${item.key} eliminada.`);
                              }}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 cursor-pointer"
                              title="Eliminar clave"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'memories' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">
                      Temas guardados en la memoria de S.A.R.A ({memories.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem('sara_student_memories');
                        onAnnounce('Memoria de temas reiniciada.');
                        window.location.reload();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-xs font-bold text-rose-300 cursor-pointer"
                    >
                      Limpiar Todas las Memorias
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto text-xs">
                    {memories.length === 0 ? (
                      <p className="text-slate-500 italic p-4 text-center">No hay memorias de estudio registradas.</p>
                    ) : (
                      memories.map((m) => (
                        <div key={m.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-300">{m.topicTitle}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 uppercase font-bold">{m.subject}</span>
                          </div>
                          <p className="text-slate-400 text-[11px] line-clamp-2">{m.summary}</p>
                          <div className="text-[10px] text-slate-500">Nivel de dominio: <span className="font-bold text-cyan-400">{m.masteryLevel}</span></div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'faults' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/60 space-y-3">
                    <h4 className="text-xs font-bold text-rose-300 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>Simulador de Inyección de Fallas y Errores (Chaos Engineering)</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Fuerza condiciones de error para verificar la robustez de los fallbacks y mecanismos de reintento de S.A.R.A.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSimulatedError('Error 504: Gateway Timeout simulado en servidor de IA.');
                          onAnnounce('Simulado error 504 en servidor.');
                          setLogs(prev => [{ timestamp: new Date().toLocaleTimeString(), type: 'error', message: 'Simulated 504 Gateway Timeout triggered.' }, ...prev]);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rose-900 text-xs font-semibold text-rose-300 cursor-pointer"
                      >
                        💥 Simular Timeout 504
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSimulatedError('Error 429: Rate Limit Exceeded (Cuota de IA agotada).');
                          onAnnounce('Simulado error 429 cuota agotada.');
                          setLogs(prev => [{ timestamp: new Date().toLocaleTimeString(), type: 'error', message: 'Simulated 429 Rate Limit triggered.' }, ...prev]);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rose-900 text-xs font-semibold text-rose-300 cursor-pointer"
                      >
                        ⚠️ Simular Cuota 429
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSimulatedError(null);
                          onAnnounce('Simulación de errores limpiada.');
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-300 cursor-pointer"
                      >
                        ✅ Limpiar Simulación
                      </button>
                    </div>
                    {simulatedError && (
                      <div className="p-3 rounded-lg bg-rose-900/40 text-rose-200 text-xs font-mono">
                        🔴 Alerta activa: {simulatedError}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'flags' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 mb-2">
                    Interruptores de Características Experimentales (Feature Flags):
                  </div>
                  <div className="space-y-2">
                    {[
                      { key: 'mockApiLatency', label: 'Simular latencia de red en llamadas IA', desc: 'Añade un retraso realista en las respuestas del tutor.' },
                      { key: 'debugOverlay', label: 'Overlay de diagnóstico visual en pantalla', desc: 'Muestra trazas de renderizado y FPS en la esquina superior.' },
                      { key: 'strictMemoryValidation', label: 'Validación estricta de esquemas de memoria', desc: 'Comprueba la integridad de los datos de estudio al cargar.' },
                      { key: 'autoVoiceSynthesis', label: 'Síntesis de voz automática en respuestas', desc: 'Lee en voz alta las explicaciones del tutor pedagógico.' },
                      { key: 'sandboxMode', label: 'Modo Sandbox protegido de desarrollo', desc: 'Aísla los eventos de analítica y almacenamiento.' },
                      { key: 'verboseLogging', label: 'Logging detallado de consola (Verbose)', desc: 'Imprime trazas completas de cada token de IA en consola.' },
                    ].map((flag) => (
                      <div key={flag.key} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-bold text-slate-200">{flag.label}</div>
                          <div className="text-[11px] text-slate-400">{flag.desc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextVal = !(flags as any)[flag.key];
                            setFlags((prev: any) => ({ ...prev, [flag.key]: nextVal }));
                            if (flag.key === 'debugOverlay') {
                              localStorage.setItem('sara_debug_overlay', String(nextVal));
                              window.dispatchEvent(new Event('sara-debug-overlay-change'));
                            }
                            onAnnounce(`Bandera ${flag.key} ${nextVal ? 'activada' : 'desactivada'}.`);
                          }}
                          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            (flags as any)[flag.key] ? 'bg-cyan-600' : 'bg-slate-700'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            (flags as any)[flag.key] ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">
                      Registro de eventos y consola (Runtime Logs):
                    </span>
                    <button
                      type="button"
                      onClick={() => setLogs([])}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-rose-300 cursor-pointer"
                    >
                      Limpiar Logs
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] space-y-1.5 max-h-[300px] overflow-y-auto">
                    {logs.map((log, idx) => (
                      <div key={idx} className={`flex items-start gap-2 ${
                        log.type === 'error' ? 'text-rose-400' : log.type === 'warn' ? 'text-amber-400' : 'text-slate-300'
                      }`}>
                        <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                        <span className="font-bold shrink-0">{log.type.toUpperCase()}:</span>
                        <span className="break-all">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'json' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">
                      Editor directo de Estado y Perfil en JSON:
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveJson}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Cambios</span>
                    </button>
                  </div>
                  <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    className="w-full h-64 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
