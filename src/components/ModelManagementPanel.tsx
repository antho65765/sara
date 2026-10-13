import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  ToggleLeft, 
  ToggleRight, 
  BarChart3, 
  Check, 
  ShieldCheck, 
  Coins, 
  RefreshCw,
  AlertTriangle,
  Lock,
  Unlock,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { ModelManagementSettings, SessionTokenStats } from '../types';

interface ModelManagementPanelProps {
  settings: ModelManagementSettings;
  onUpdateSettings: (newSettings: ModelManagementSettings) => void;
  sessionStats: SessionTokenStats;
  currentActiveModel?: string;
  onAnnounce: (msg: string) => void;
  onResetSessionTokens?: () => void;
}

const PRESET_LIMITS = [5000, 10000, 25000, 50000];

export const ModelManagementPanel: React.FC<ModelManagementPanelProps> = ({
  settings,
  onUpdateSettings,
  sessionStats,
  currentActiveModel = 'gemini-3.8-flash',
  onAnnounce,
  onResetSessionTokens,
}) => {
  const [modelInfo, setModelInfo] = useState<{
    activeModel: string;
    candidateModels: string[];
    isFallbackActive: boolean;
  }>({
    activeModel: currentActiveModel,
    candidateModels: [
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.5-flash-lite',
    ],
    isFallbackActive: false,
  });

  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latency?: number; message?: string; error?: string }>>({});
  const [customLimitInput, setCustomLimitInput] = useState<string>(
    String(settings.maxTokensPerSession || 10000)
  );

  const fetchModelStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/model-status');
      if (res.ok) {
        const data = await res.json();
        setModelInfo({
          activeModel: data.activeModel || currentActiveModel,
          candidateModels: data.candidateModels || [],
          isFallbackActive: !!data.isFallbackActive,
        });
      }
    } catch (e) {
      console.warn('Could not fetch model status:', e);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchModelStatus();
  }, []);

  const toggleAutoSwitch = () => {
    const nextState = !settings.autoModelSwitch;
    onUpdateSettings({
      ...settings,
      autoModelSwitch: nextState,
    });
    onAnnounce(
      nextState 
        ? 'Cambio automático de modelo activado. S.A.R.A rotará de modelo si se agotan los tokens.' 
        : 'Cambio automático de modelo desactivado. S.A.R.A usará únicamente el modelo seleccionado.'
    );
  };

  const toggleTokenLimit = () => {
    const nextEnabled = !settings.enableTokenLimit;
    const limit = settings.maxTokensPerSession || 10000;
    onUpdateSettings({
      ...settings,
      enableTokenLimit: nextEnabled,
      maxTokensPerSession: limit,
    });
    onAnnounce(
      nextEnabled 
        ? `Límite de tokens activado: máximo ${new Intl.NumberFormat('es-ES').format(limit)} tokens por sesión.` 
        : 'Límite de tokens desactivado. Puedes realizar consultas sin restricción de tope.'
    );
  };

  const handleSetLimitValue = (newLimit: number) => {
    const safeLimit = Math.max(500, Math.min(500000, newLimit));
    setCustomLimitInput(String(safeLimit));
    onUpdateSettings({
      ...settings,
      enableTokenLimit: true,
      maxTokensPerSession: safeLimit,
    });
    onAnnounce(`Límite fijado en ${new Intl.NumberFormat('es-ES').format(safeLimit)} tokens`);
  };

  const handleCustomLimitBlur = () => {
    const parsed = parseInt(customLimitInput, 10);
    if (!isNaN(parsed) && parsed >= 500) {
      handleSetLimitValue(parsed);
    } else {
      setCustomLimitInput(String(settings.maxTokensPerSession || 10000));
    }
  };

  const handleSelectPreferredModel = async (model: string) => {
    onUpdateSettings({
      ...settings,
      preferredModel: model,
    });
    setModelInfo((prev) => ({ ...prev, activeModel: model }));
    try {
      await fetch('/api/model-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredModel: model }),
      });
    } catch (e) {
      console.warn('Could not update model status on server:', e);
    }
    onAnnounce(`Modelo de IA preferido cambiado a ${model}`);
  };

  const handleTestModel = async (e: React.MouseEvent, model: string) => {
    e.stopPropagation();
    setTestingModel(model);
    try {
      const res = await fetch('/api/test-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [model]: {
          success: Boolean(data.success),
          latency: data.responseTimeMs,
          message: data.message,
          error: data.error,
        },
      }));
      if (data.success) {
        onAnnounce(`Prueba exitosa en ${model}. Latencia: ${data.responseTimeMs}ms`);
      } else {
        onAnnounce(`Prueba en ${model}: ${data.error || 'No disponible temporalmente'}`);
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [model]: {
          success: false,
          error: 'Error de red al probar modelo',
        },
      }));
    } finally {
      setTestingModel(null);
    }
  };

  // Formatter for tokens number
  const formatTokens = (val: number) => {
    return new Intl.NumberFormat('es-ES').format(val || 0);
  };

  // Check if limit is reached
  const isLimitActive = Boolean(settings.enableTokenLimit && (settings.maxTokensPerSession || 0) > 0);
  const maxTokens = settings.maxTokensPerSession || 10000;
  const isLimitExceeded = isLimitActive && sessionStats.totalTokens >= maxTokens;
  const tokenPercentage = isLimitActive 
    ? Math.min(100, Math.round((sessionStats.totalTokens / maxTokens) * 100))
    : 0;

  // Estimated token cost approximation (Gemini Flash is free/low cost, but gives real insights)
  const estimatedCost = sessionStats.totalTokens > 0
    ? ((sessionStats.promptTokens * 0.075 + sessionStats.candidatesTokens * 0.3) / 1_000_000).toFixed(4)
    : '0.0000';

  return (
    <div id="model-management-panel" className="space-y-5 animate-in fade-in duration-150">
      
      {/* Introduction Card */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
          <Cpu className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-100">
            Control de Inteligencia Artificial y Tokens
          </h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Monitorea el consumo exacto de tokens de tu sesión de estudio, define topes de seguridad para evitar gastos excesivos y gestiona la resiliencia de S.A.R.A ante límites de cuota.
          </p>
        </div>
      </div>

      {/* TOKEN LIMIT CONTROL SECTION (FEATURE REQUEST) */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isLimitExceeded 
          ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/60 dark:bg-rose-950/30' 
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
      } shadow-2xs space-y-4`}>
        
        {/* Toggle Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Límite Máximo de Tokens por Sesión
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isLimitExceeded
                  ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 animate-pulse'
                  : isLimitActive
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {isLimitExceeded ? 'BLOQUEO ACTIVO' : isLimitActive ? 'Límite Activado' : 'Sin Límite'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
              Al alcanzar este tope durante la sesión activa, S.A.R.A bloqueará temporalmente el envío de nuevas consultas para proteger tu consumo de cuota o presupuesto.
            </p>
          </div>

          <button
            type="button"
            id="toggle-token-limit-btn"
            onClick={toggleTokenLimit}
            aria-label="Activar o desactivar límite máximo de tokens"
            className="shrink-0 p-1 text-slate-700 dark:text-slate-200 hover:opacity-90 transition-transform active:scale-95 cursor-pointer"
          >
            {isLimitActive ? (
              <ToggleRight className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-slate-400 dark:text-slate-600" />
            )}
          </button>
        </div>

        {/* Limit Exceeded Alert Banner */}
        {isLimitExceeded && (
          <div className="p-3 rounded-xl bg-rose-100/90 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 flex items-start gap-3 text-xs text-rose-900 dark:text-rose-200 animate-in fade-in duration-200">
            <Lock className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <h5 className="font-bold text-sm text-rose-950 dark:text-rose-100">
                Tope de tokens alcanzado ({formatTokens(sessionStats.totalTokens)} / {formatTokens(maxTokens)} tokens)
              </h5>
              <p className="text-rose-800 dark:text-rose-300 leading-relaxed">
                Las consultas están bloqueadas temporalmente según tu configuración de seguridad para evitar consumos adicionales. Puedes ampliar el límite o restablecer la sesión a continuación.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSetLimitValue(maxTokens + 10000)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs transition"
                >
                  + Ampliar +10.000 tokens
                </button>
                {onResetSessionTokens && (
                  <button
                    type="button"
                    onClick={onResetSessionTokens}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 hover:bg-rose-50 text-rose-700 dark:text-rose-300 rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Reiniciar contador de sesión
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Limit Presets and Custom Input */}
        {isLimitActive && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Selecciona o ingresa el tope máximo (tokens):
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="500"
                  max="500000"
                  step="500"
                  value={customLimitInput}
                  onChange={(e) => setCustomLimitInput(e.target.value)}
                  onBlur={handleCustomLimitBlur}
                  className="w-28 px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-right focus:ring-1 focus:ring-indigo-500 outline-hidden"
                />
                <span className="text-xs text-slate-500">tokens</span>
              </div>
            </div>

            {/* Presets Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_LIMITS.map((limit) => {
                const isSelected = (settings.maxTokensPerSession || 10000) === limit;
                return (
                  <button
                    type="button"
                    key={limit}
                    onClick={() => handleSetLimitValue(limit)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {formatTokens(limit)} tokens
                  </button>
                );
              })}
            </div>

            {/* Progress gauge towards session limit */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Consumo del tope asignado:
                </span>
                <span className={`font-bold font-mono ${
                  tokenPercentage >= 100 
                    ? 'text-rose-600 dark:text-rose-400' 
                    : tokenPercentage >= 80 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : 'text-indigo-600 dark:text-indigo-400'
                }`}>
                  {formatTokens(sessionStats.totalTokens)} / {formatTokens(maxTokens)} ({tokenPercentage}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    tokenPercentage >= 100 
                      ? 'bg-rose-500' 
                      : tokenPercentage >= 80 
                      ? 'bg-amber-500' 
                      : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(3, tokenPercentage))}%` }}
                />
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Auto Model Switch Toggle */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Cambio automático de modelo (Auto-Failover)
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                settings.autoModelSwitch
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {settings.autoModelSwitch ? 'Activado' : 'Desactivado'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
              Si un modelo agota temporalmente su cuota de tokens por minuto (código 429), S.A.R.A conmuta instantáneamente al siguiente modelo de respaldo (Flash Lite, 2.5 Flash, 2.5 Pro) para que nunca se interrumpa tu estudio.
            </p>
          </div>

          <button
            type="button"
            id="toggle-auto-model-switch-btn"
            onClick={toggleAutoSwitch}
            aria-label="Activar o desactivar cambio automático de modelo"
            className="shrink-0 p-1 text-slate-700 dark:text-slate-200 hover:opacity-90 transition-transform active:scale-95 cursor-pointer"
          >
            {settings.autoModelSwitch ? (
              <ToggleRight className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-slate-400 dark:text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {/* Session Tokens Consumption Dashboard */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-sm">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Consumo de Tokens de la Sesión Actual</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            {sessionStats.messagesCount} {sessionStats.messagesCount === 1 ? 'mensaje' : 'mensajes'} analizados
          </span>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          
          {/* Card 1: Total Tokens */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Tokens Totales
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl font-extrabold ${isLimitExceeded ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {formatTokens(sessionStats.totalTokens)}
              </span>
              <span className="text-[10px] text-slate-400">tokens</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-500" />
              <span>Est. ~${estimatedCost} USD</span>
            </div>
          </div>

          {/* Card 2: Prompt Tokens (Input) */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Entrada (Prompt)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {formatTokens(sessionStats.promptTokens)}
              </span>
              <span className="text-[10px] text-slate-400">tokens</span>
            </div>
            <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
              Tus consultas, fotos y memoria
            </p>
          </div>

          {/* Card 3: Candidates Tokens (Output) */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Salida (Respuestas)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatTokens(sessionStats.candidatesTokens)}
              </span>
              <span className="text-[10px] text-slate-400">tokens</span>
            </div>
            <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
              Límite máx. 1,200 tok/respuesta
            </p>
          </div>

        </div>

        {/* Progress Bar of Token Efficiency */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>Proporción Entrada / Salida</span>
            <span>
              {sessionStats.totalTokens > 0 
                ? `${Math.round((sessionStats.candidatesTokens / sessionStats.totalTokens) * 100)}% de tokens en respuestas pedagógicas`
                : 'Sin actividad en esta sesión todavía'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
            {sessionStats.totalTokens > 0 ? (
              <>
                <div 
                  className="bg-indigo-500 h-full" 
                  style={{ width: `${Math.max(5, (sessionStats.promptTokens / sessionStats.totalTokens) * 100)}%` }} 
                  title={`Entrada: ${sessionStats.promptTokens} tokens`}
                />
                <div 
                  className="bg-emerald-500 h-full" 
                  style={{ width: `${Math.max(5, (sessionStats.candidatesTokens / sessionStats.totalTokens) * 100)}%` }} 
                  title={`Salida: ${sessionStats.candidatesTokens} tokens`}
                />
              </>
            ) : (
              <div className="bg-slate-300 dark:bg-slate-700 w-full h-full" />
            )}
          </div>
        </div>
      </div>

      {/* Available Models & Selection */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Modelos de IA Disponibles en S.A.R.A
            </span>
          </div>
          <button
            type="button"
            onClick={fetchModelStatus}
            disabled={isLoadingStatus}
            className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingStatus ? 'animate-spin' : ''}`} />
            <span>Actualizar estado</span>
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Selecciona el modelo con el que prefieres iniciar tus consultas. Si el cambio automático está encendido, el sistema alternará hacia los otros si se saturan los tokens.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {modelInfo.candidateModels.map((model) => {
            const isSelected = (settings.preferredModel || modelInfo.activeModel) === model;
            const isCurrentlyActive = modelInfo.activeModel === model;
            const test = testResults[model];
            const isTesting = testingModel === model;

            return (
              <div
                key={model}
                onClick={() => handleSelectPreferredModel(model)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 ring-1 ring-blue-500 text-blue-950 dark:text-blue-100'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs truncate">
                        {model}
                      </span>
                      {isCurrentlyActive && (
                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold">
                          En uso
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {model === 'gemini-3.8-flash' && 'Modelo insignia predeterminado de máxima velocidad y precisión'}
                    {model === 'gemini-3.5-flash' && 'Alta disponibilidad y rendimiento balanceado para tutoría'}
                    {model === 'gemini-3.1-flash-lite' && 'Ultra ligero, ideal para conexiones lentas y cuota ligera'}
                    {model === 'gemini-flash-latest' && 'Alias dinámico de última generación Flash'}
                    {model === 'gemini-3.5-flash-lite' && 'Respaldo ultra rápido con consumo mínimo de tokens'}
                  </p>
                </div>

                {/* Test Model Status & Action */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  {test ? (
                    test.success ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> Conectado ({test.latency}ms)
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 text-[10px]" title={test.error}>
                        <AlertTriangle className="w-3 h-3 shrink-0" /> {test.error?.slice(0, 30)}
                      </span>
                    )
                  ) : (
                    <span className="text-slate-400 text-[10px]">Listo para usar</span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleTestModel(e, model)}
                    disabled={isTesting}
                    className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-200 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        <span>Probando...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-2.5 h-2.5 text-amber-500" />
                        <span>Probar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
