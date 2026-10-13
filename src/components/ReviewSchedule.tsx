import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  CalendarPlus, 
  Sparkles, 
  Trash2, 
  ArrowRight, 
  AlertCircle,
  BookOpen,
  Filter,
  Check,
  Bell,
  BellOff,
  BellRing,
  Smartphone,
  Info
} from 'lucide-react';
import { TopicMemory, ReviewScheduleItem, SubjectKey } from '../types';
import { SUBJECT_METADATA } from '../data/pedagogicalConfig';
import { formatTopicTitle } from '../utils/textSanitizer';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  sendScheduledTopicNotification
} from '../utils/notificationService';

interface ReviewScheduleProps {
  memories: TopicMemory[];
  scheduledReviews: ReviewScheduleItem[];
  onScheduleReview: (
    topicId: string, 
    date: string, 
    time?: string, 
    notes?: string, 
    reminderEnabled?: boolean
  ) => void;
  onToggleCompleteReview: (reviewId: string) => void;
  onToggleReminder?: (reviewId: string) => void;
  onDeleteScheduledReview: (reviewId: string) => void;
  onSelectTopicForChat: (topic: TopicMemory) => void;
  onAnnounce: (msg: string) => void;
}

export const ReviewSchedule: React.FC<ReviewScheduleProps> = ({
  memories,
  scheduledReviews,
  onScheduleReview,
  onToggleCompleteReview,
  onToggleReminder,
  onDeleteScheduledReview,
  onSelectTopicForChat,
  onAnnounce,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(memories[0]?.id || '');
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    // Default to tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState<string>('16:00');
  const [enableMobileReminder, setEnableMobileReminder] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('pending');
  const [isFormExpanded, setIsFormExpanded] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [isTestingNotification, setIsTestingNotification] = useState<boolean>(false);
  const [showMobileInstructions, setShowMobileInstructions] = useState<boolean>(false);

  // Sync notification permission status
  useEffect(() => {
    setPermissionStatus(getNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    onAnnounce('Solicitando permiso para notificaciones móviles...');
    const granted = await requestNotificationPermission();
    setPermissionStatus(getNotificationPermission());
    if (granted) {
      onAnnounce('¡Notificaciones móviles activadas correctamente en tu dispositivo!');
      await sendTestNotification();
    } else {
      onAnnounce('Permiso de notificaciones no concedido o denegado.');
    }
  };

  const handleTestNotification = async () => {
    setIsTestingNotification(true);
    try {
      if (permissionStatus !== 'granted') {
        const granted = await requestNotificationPermission();
        setPermissionStatus(getNotificationPermission());
        if (!granted) {
          onAnnounce('Debes conceder permisos de notificación en tu navegador o celular.');
          return;
        }
      }
      await sendTestNotification();
      onAnnounce('Notificación de prueba enviada al celular.');
    } finally {
      setTimeout(() => setIsTestingNotification(false), 800);
    }
  };

  // Quick preset dates
  const handleSetPreset = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setScheduledDate(d.toISOString().split('T')[0]);
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId || !scheduledDate) return;

    const targetTopic = memories.find((m) => m.id === selectedTopicId);
    onScheduleReview(
      selectedTopicId, 
      scheduledDate, 
      scheduledTime || undefined, 
      notes.trim() || undefined,
      enableMobileReminder
    );
    
    const timeText = scheduledTime ? ` a las ${scheduledTime}` : '';
    onAnnounce(`Repaso programado para ${targetTopic?.topicTitle || 'el tema'} el día ${scheduledDate}${timeText} con recordatorio.`);
    setNotes('');
    setIsFormExpanded(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to categorize dates
  const getDateStatus = (dateStr: string) => {
    if (dateStr < todayStr) return { label: 'Vencido', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800' };
    if (dateStr === todayStr) return { label: '¡Toca hoy!', color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 animate-pulse' };
    
    // Check if tomorrow
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const tomStr = tom.toISOString().split('T')[0];
    if (dateStr === tomStr) return { label: 'Mañana', color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800' };

    return { label: dateStr, color: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
  };

  // Filtered reviews
  const filteredReviews = scheduledReviews.filter((item) => {
    if (filterStatus === 'pending') return !item.completed;
    if (filterStatus === 'completed') return item.completed;
    return true;
  }).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  const pendingCount = scheduledReviews.filter((r) => !r.completed).length;
  const dueTodayCount = scheduledReviews.filter((r) => !r.completed && r.scheduledDate <= todayStr).length;

  return (
    <section 
      id="agenda-repaso-section"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Agenda de Repaso y Recordatorios en el Celular
              </h3>
              {dueTodayCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-bounce">
                  {dueTodayCount} para hoy
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Programa fechas y horarios específicos para que tu celular te recuerde repasar y afianzar conceptos clave
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap self-start sm:self-auto">
          <button
            type="button"
            onClick={handleTestNotification}
            disabled={isTestingNotification}
            title="Probar notificación en tu celular o navegador"
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BellRing className={`w-3.5 h-3.5 ${isTestingNotification ? 'animate-bounce text-indigo-500' : 'text-amber-500'}`} />
            <span>{isTestingNotification ? 'Enviando...' : 'Probar Aviso'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFormExpanded((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>{isFormExpanded ? 'Ocultar Formulario' : 'Programar Recordatorio'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Notification Status Banner */}
      <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
        permissionStatus === 'granted'
          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
          : permissionStatus === 'denied'
          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
          : 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            permissionStatus === 'granted'
              ? 'bg-emerald-500 text-white'
              : permissionStatus === 'denied'
              ? 'bg-rose-500 text-white'
              : 'bg-indigo-600 text-white'
          }`}>
            {permissionStatus === 'granted' ? (
              <Bell className="w-3.5 h-3.5" />
            ) : permissionStatus === 'denied' ? (
              <BellOff className="w-3.5 h-3.5" />
            ) : (
              <Smartphone className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold flex items-center gap-1.5">
              <span>
                {permissionStatus === 'granted'
                  ? 'Notificaciones en el Celular: Activadas'
                  : permissionStatus === 'denied'
                  ? 'Notificaciones Bloqueadas en tu Navegador'
                  : 'Activa las Notificaciones en tu Celular'}
              </span>
            </div>
            <p className="text-[11px] opacity-90 truncate">
              {permissionStatus === 'granted'
                ? 'Recibirás avisos automáticos en tu teléfono el día y hora que programes tus temas.'
                : permissionStatus === 'denied'
                ? 'Habilita los permisos de notificaciones en los ajustes del navegador de tu móvil para recibir alertas.'
                : 'Permite que S.A.R.A te envíe recordatorios push en tu teléfono móvil para repasar antes de exámenes.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {permissionStatus !== 'granted' && (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3 h-3" />
              <span>Activar Notificaciones</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowMobileInstructions((prev) => !prev)}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Ver guía para celular"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile Installation & Notification Guide */}
      {showMobileInstructions && (
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in duration-150">
          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-500" />
            <span>Cómo recibir notificaciones en tu celular:</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
            <li>
              <strong>En Android (Chrome / Edge):</strong> Pulsa en "Activar Notificaciones" arriba y acepta el permiso del navegador. También puedes pulsar el menú de 3 puntos y elegir <em>"Instalar aplicación"</em> o <em>"Añadir a pantalla de inicio"</em> para recibir recordatorios como app nativa.
            </li>
            <li>
              <strong>En iPhone / iPad (iOS Safari):</strong> Pulsa el botón <em>Compartir</em> en Safari y selecciona <em>"Añadir a pantalla de inicio"</em>. Abre la app desde la pantalla de inicio y activa los recordatorios.
            </li>
            <li>
              <strong>Sonido y Vibración:</strong> Los recordatorios emiten un tono armónico didáctico y vibran en tu teléfono.
            </li>
          </ul>
        </div>
      )}

      {/* Form to Schedule a Review */}
      {isFormExpanded && (
        <form 
          onSubmit={handleCreateSchedule}
          className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Programar tema para un día específico con aviso al celular
            </span>
            <span className="text-[11px] text-slate-400">Curva del olvido</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Topic Select */}
            <div className="sm:col-span-1">
              <label htmlFor="schedule-topic-select" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tema a repasar *
              </label>
              <select
                id="schedule-topic-select"
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden focus:border-indigo-500 cursor-pointer"
              >
                {memories.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.subjectDisplayName || m.subject}] {m.topicTitle} ({m.masteryLevel})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Select & Presets */}
            <div>
              <label htmlFor="schedule-date-input" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Día programado *
              </label>
              <input
                id="schedule-date-input"
                type="date"
                min={todayStr}
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden focus:border-indigo-500 cursor-pointer"
              />

              {/* Quick Presets */}
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-medium">Sugerencia:</span>
                <button
                  type="button"
                  onClick={() => handleSetPreset(1)}
                  className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Mañana (+1d)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPreset(3)}
                  className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  En 3d
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPreset(7)}
                  className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  En 1 sem
                </button>
              </div>
            </div>

            {/* Time Select */}
            <div>
              <label htmlFor="schedule-time-input" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hora de recordatorio (celular)
              </label>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="schedule-time-input"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden focus:border-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Time Presets */}
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setScheduledTime('09:00')}
                  className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                >
                  09:00 AM
                </button>
                <button
                  type="button"
                  onClick={() => setScheduledTime('16:00')}
                  className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                >
                  04:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => setScheduledTime('20:00')}
                  className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                >
                  08:00 PM
                </button>
              </div>
            </div>
          </div>

          {/* Optional notes & Reminder toggle */}
          <div className="space-y-2">
            <div>
              <label htmlFor="schedule-notes-input" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Objetivo o notas de repaso (opcional)
              </label>
              <input
                id="schedule-notes-input"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Repasar fórmulas, resolver 2 ejercicios o hacer un quiz rápido"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-hidden focus:border-indigo-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={enableMobileReminder}
                onChange={(e) => setEnableMobileReminder(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                <Bell className="w-3.5 h-3.5 text-indigo-500" />
                Enviar notificación push / aviso al celular ese día
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsFormExpanded(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Guardar en Agenda y Activar Alerta</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs and Counter */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('completed')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterStatus === 'completed'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Completados ({scheduledReviews.length - pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Todos ({scheduledReviews.length})
          </button>
        </div>

        <span className="text-[11px] text-slate-400">
          Total programados: <strong className="font-semibold text-slate-700 dark:text-slate-300">{scheduledReviews.length}</strong>
        </span>
      </div>

      {/* List of Scheduled Reviews */}
      {filteredReviews.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {filterStatus === 'completed'
              ? 'Aún no has marcado repasos completados.'
              : 'No tienes temas programados con recordatorio pendiente.'}
          </p>
          <button
            type="button"
            onClick={() => setIsFormExpanded(true)}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Programar un tema para un día específico
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filteredReviews.map((item) => {
            const dateStatus = getDateStatus(item.scheduledDate);
            const matchingTopic = memories.find((m) => m.id === item.topicId);
            const isReminderOn = item.reminderEnabled !== false;

            return (
              <div
                key={item.id}
                id={`scheduled-review-${item.id}`}
                className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  item.completed
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-70'
                    : item.scheduledDate <= todayStr
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Left: Checkbox & Info */}
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      onToggleCompleteReview(item.id);
                      onAnnounce(
                        item.completed 
                          ? `Repaso de "${item.topicTitle}" marcado como pendiente` 
                          : `¡Excelente! Repaso de "${item.topicTitle}" completado`
                      );
                    }}
                    title={item.completed ? 'Marcar como pendiente' : 'Marcar como completado'}
                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                      item.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-white dark:bg-slate-900 text-transparent hover:text-slate-300'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${dateStatus.color}`}>
                        {dateStatus.label}
                      </span>
                      {item.scheduledTime && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-indigo-500" />
                          {item.scheduledTime}
                        </span>
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {item.subjectDisplayName || item.subject}
                      </span>
                      {isReminderOn && (
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                          <Bell className="w-2.5 h-2.5" />
                          Aviso celular
                        </span>
                      )}
                    </div>

                    <h4 className={`text-xs sm:text-sm font-bold mt-1 break-words line-clamp-2 leading-snug ${item.completed ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`} title={item.topicTitle}>
                      {formatTopicTitle(item.topicTitle)}
                    </h4>

                    {item.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions (Repasar, Toggle Reminder, Delete) */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {onToggleReminder && (
                    <button
                      type="button"
                      onClick={() => onToggleReminder(item.id)}
                      title={isReminderOn ? 'Desactivar recordatorio móvil' : 'Activar recordatorio móvil'}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isReminderOn
                          ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {isReminderOn ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {matchingTopic && (
                    <button
                      type="button"
                      onClick={() => onSelectTopicForChat(matchingTopic)}
                      title="Abrir este tema en el chat para repasar con S.A.R.A"
                      className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors shrink-0 cursor-pointer"
                    >
                      <span>Repasar ahora</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onDeleteScheduledReview(item.id);
                      onAnnounce(`Recordatorio de repaso eliminado.`);
                    }}
                    title="Eliminar este recordatorio"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
