import React, { useState } from 'react';
import { 
  Brain, 
  Search, 
  Sparkles, 
  Calendar, 
  Layers, 
  ArrowRight, 
  Plus, 
  Trash2, 
  BookCheck, 
  Clock, 
  Share2, 
  FileQuestion, 
  Zap,
  HelpCircle,
  Tag,
  Award,
  BarChart3,
  CalendarPlus,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TopicMemory, SubjectKey, MasteryLevel, ReviewScheduleItem } from '../types';
import { SUBJECT_METADATA } from '../data/pedagogicalConfig';
import { ReviewSchedule } from './ReviewSchedule';
import { formatTopicTitle } from '../utils/textSanitizer';

interface MemoryPanelProps {
  memories: TopicMemory[];
  scheduledReviews?: ReviewScheduleItem[];
  onScheduleReview?: (
    topicId: string, 
    date: string, 
    time?: string, 
    notes?: string, 
    reminderEnabled?: boolean
  ) => void;
  onToggleCompleteReview?: (reviewId: string) => void;
  onToggleReminder?: (reviewId: string) => void;
  onDeleteScheduledReview?: (reviewId: string) => void;
  onSelectTopicForChat: (topic: TopicMemory) => void;
  onGenerateQuizForTopic: (topic: TopicMemory) => void;
  onGenerateFlashcardsForTopic: (topic: TopicMemory) => void;
  onOpenExamMode: (topic: TopicMemory) => void;
  onOpenConnector: (topicA?: TopicMemory) => void;
  onAddNewTopic: (newTopic: Omit<TopicMemory, 'id'>) => void;
  onUpdateTopicTitle?: (id: string, newTitle: string) => void;
  onDeleteTopic: (id: string) => void;
  onAnnounce: (msg: string) => void;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({
  memories,
  scheduledReviews = [],
  onScheduleReview = () => {},
  onToggleCompleteReview = () => {},
  onToggleReminder = () => {},
  onDeleteScheduledReview = () => {},
  onSelectTopicForChat,
  onGenerateQuizForTopic,
  onGenerateFlashcardsForTopic,
  onOpenExamMode,
  onOpenConnector,
  onAddNewTopic,
  onUpdateTopicTitle,
  onDeleteTopic,
  onAnnounce,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [masteryFilter, setMasteryFilter] = useState<string>('all');
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [confirmDeleteTopicId, setConfirmDeleteTopicId] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicTitle, setEditingTopicTitle] = useState('');

  // New topic state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState<SubjectKey>('ciencias');
  const [newSummary, setNewSummary] = useState('');
  const [newConcepts, setNewConcepts] = useState('');
  const [newMastery, setNewMastery] = useState<MasteryLevel>('iniciado');
  const [newNotes, setNewNotes] = useState('');

  const filteredMemories = memories.filter((m) => {
    const matchesSearch = 
      m.topicTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.keyConcepts.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSubject = subjectFilter === 'all' || m.subject === subjectFilter;
    const matchesMastery = masteryFilter === 'all' || m.masteryLevel === masteryFilter;

    return matchesSearch && matchesSubject && matchesMastery;
  });

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const cleanTitle = formatTopicTitle(newTitle.trim());

    onAddNewTopic({
      subject: newSubject,
      subjectDisplayName: SUBJECT_METADATA[newSubject]?.name || newSubject,
      topicTitle: cleanTitle,
      summary: newSummary.trim() || 'Estudio individual registrado por el estudiante.',
      keyConcepts: newConcepts.split(',').map((c) => c.trim()).filter(Boolean),
      masteryLevel: newMastery,
      lastStudied: new Date().toISOString(),
      notes: newNotes.trim() || 'Agregado manualmente al cuaderno de memoria.',
      connections: [],
    });

    onAnnounce(`Nuevo tema "${cleanTitle}" añadido a la memoria`);
    setIsAddingTopic(false);
    setNewTitle('');
    setNewSummary('');
    setNewConcepts('');
    setNewNotes('');
  };

  const masteryConfig: Record<MasteryLevel, { label: string; badgeClass: string; dotClass: string }> = {
    dominado: {
      label: 'Dominado',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      dotClass: 'bg-emerald-500',
    },
    en_progreso: {
      label: 'En Progreso',
      badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      dotClass: 'bg-amber-500',
    },
    iniciado: {
      label: 'Recién Iniciado',
      badgeClass: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      dotClass: 'bg-blue-500',
    },
  };

  const dominatedCount = memories.filter((m) => m.masteryLevel === 'dominado').length;
  const inProgressCount = memories.filter((m) => m.masteryLevel === 'en_progreso').length;

  const getWeekDaysData = () => {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    memories.forEach((m) => {
      if (!m.lastStudied) return;
      const studiedDate = new Date(m.lastStudied);
      if (isNaN(studiedDate.getTime())) return;

      const diffTime = studiedDate.getTime() - monday.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays < 7) {
        counts[diffDays] += 1;
      }
    });

    return daysOfWeek.map((dayName, idx) => ({
      dia: dayName,
      temas: counts[idx],
    }));
  };

  return (
    <div id="memory-panel-root" className="space-y-6 w-full max-w-full pb-28 sm:pb-16">
      
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-xs text-indigo-200">
              <Brain className="w-3.5 h-3.5 text-indigo-300" />
              Memoria Continua de S.A.R.A
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Cuaderno de Temas Anteriores y Progreso
            </h2>
            <p className="text-xs text-indigo-200 max-w-xl leading-relaxed">
              S.A.R.A consulta esta memoria en cada conversación para tender puentes entre lo que ya aprendiste y los nuevos conceptos académicos.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap shrink-0">
            <button
              id="open-connector-btn"
              onClick={() => onOpenConnector()}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/15 flex items-center gap-2"
            >
              <Share2 className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Conectar 2 Temas</span>
            </button>
            <button
              id="btn-add-memory-topic"
              onClick={() => setIsAddingTopic(true)}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Añadir Tema</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <span className="text-xl font-extrabold text-white">{memories.length}</span>
            <p className="text-[11px] text-indigo-200">Temas en Memoria</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <span className="text-xl font-extrabold text-emerald-400">{dominatedCount}</span>
            <p className="text-[11px] text-indigo-200">Temas Dominados</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <span className="text-xl font-extrabold text-amber-400">{inProgressCount}</span>
            <p className="text-[11px] text-indigo-200">En Progreso / Refuerzo</p>
          </div>
        </div>
      </div>

      {/* Learning Statistics Panel with Recharts Bar Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Estadísticas de Aprendizaje (Semana Actual)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Temas estudiados o repasados por día de la semana actual
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {memories.length} Actividades
          </span>
        </div>

        <div className="w-full h-56 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getWeekDaysData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
              <XAxis 
                dataKey="dia" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12} 
                allowDecimals={false} 
                tickLine={false} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155', 
                  borderRadius: '12px', 
                  color: '#fff', 
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                }} 
                formatter={(value: any) => [`${value} temas`, 'Estudiados']}
              />
              <Bar 
                dataKey="temas" 
                fill="#6366f1" 
                radius={[8, 8, 0, 0]} 
                maxBarSize={45}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Componente de Agenda de Repaso (Espaciado Pedagógico) */}
      <ReviewSchedule
        memories={memories}
        scheduledReviews={scheduledReviews}
        onScheduleReview={onScheduleReview}
        onToggleCompleteReview={onToggleCompleteReview}
        onToggleReminder={onToggleReminder}
        onDeleteScheduledReview={onDeleteScheduledReview}
        onSelectTopicForChat={onSelectTopicForChat}
        onAnnounce={onAnnounce}
      />

      {/* Add Topic Modal / Drawer Form */}
      {isAddingTopic && (
        <form 
          onSubmit={handleCreateTopic}
          className="p-5 bg-white dark:bg-slate-900 border-2 border-indigo-500/40 rounded-2xl shadow-lg space-y-4 animate-in fade-in slide-in-from-top duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Plus className="w-4 h-4 text-indigo-600" />
              Registrar nuevo tema en el historial del estudiante
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingTopic(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Título del Tema *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej: Teorema de Pitágoras, Ecosistemas, Revolución Francesa"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Materia
              </label>
              <select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value as SubjectKey)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-hidden focus:border-indigo-500"
              >
                {(Object.keys(SUBJECT_METADATA) as SubjectKey[]).map((key) => (
                  <option key={key} value={key}>
                    {SUBJECT_METADATA[key].name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Resumen o Explicación Clave
            </label>
            <textarea
              rows={2}
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              placeholder="¿Qué es lo principal que aprendió el estudiante sobre este tema?"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Conceptos clave (separados por comas)
              </label>
              <input
                type="text"
                value={newConcepts}
                onChange={(e) => setNewConcepts(e.target.value)}
                placeholder="Ej: Cateto, Hipotenusa, Triángulo rectángulo"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nivel de dominio inicial
              </label>
              <div className="flex gap-2">
                {(['iniciado', 'en_progreso', 'dominado'] as MasteryLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setNewMastery(lvl)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                      newMastery === lvl
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {masteryConfig[lvl].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingTopic(false)}
              className="px-3 py-1.5 text-xs text-slate-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Guardar en Memoria
            </button>
          </div>
        </form>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
        {/* Row 1: Dedicated Full-Width Search Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-memory-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por tema, concepto clave o resumen..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              title="Borrar búsqueda"
              aria-label="Borrar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Row 2: Responsive Filters Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Controls Group */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Subject Selector */}
            <div className="w-full sm:w-auto min-w-[160px] flex-1 sm:flex-initial">
              <label htmlFor="filter-subject-select" className="sr-only">Filtrar por Materia</label>
              <select
                id="filter-subject-select"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-hidden focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">📚 Todas las materias</option>
                {(Object.keys(SUBJECT_METADATA) as SubjectKey[]).map((key) => (
                  <option key={key} value={key}>
                    {SUBJECT_METADATA[key].name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mastery Quick Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setMasteryFilter('all')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  masteryFilter === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Todos ({memories.length})
              </button>
              <button
                type="button"
                onClick={() => setMasteryFilter('dominado')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  masteryFilter === 'dominado'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                }`}
              >
                Dominados ({dominatedCount})
              </button>
              <button
                type="button"
                onClick={() => setMasteryFilter('en_progreso')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  masteryFilter === 'en_progreso'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                }`}
              >
                En Progreso ({inProgressCount})
              </button>
              <button
                type="button"
                onClick={() => setMasteryFilter('iniciado')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  masteryFilter === 'iniciado'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                }`}
              >
                Recién Iniciado ({memories.filter(m => m.masteryLevel === 'iniciado').length})
              </button>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || subjectFilter !== 'all' || masteryFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSubjectFilter('all');
                  setMasteryFilter('all');
                }}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shrink-0"
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>

          {/* Results Summary */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium shrink-0 self-start lg:self-center">
            Mostrando <strong>{filteredMemories.length}</strong> de <strong>{memories.length}</strong> temas
          </div>
        </div>
      </div>

      {/* Memory Topics Cards List */}
      <div className="space-y-4">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-500">
            <Brain className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-sm">No se encontraron temas con esos filtros.</p>
            <p className="text-xs text-slate-400 mt-1">
              Prueba con otra búsqueda o pide al tutor en el chat repasar un nuevo concepto.
            </p>
          </div>
        ) : (
          filteredMemories.map((topic) => {
            const mastery = masteryConfig[topic.masteryLevel];
            return (
              <div
                key={topic.id}
                id={`memory-item-${topic.id}`}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3.5"
              >
                {/* Header of card */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {topic.subjectDisplayName || topic.subject}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${mastery.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${mastery.dotClass}`} />
                        {mastery.label}
                      </span>
                      {topic.lastStudied && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(topic.lastStudied).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {editingTopicId === topic.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const clean = formatTopicTitle(editingTopicTitle.trim());
                          if (clean && onUpdateTopicTitle) {
                            onUpdateTopicTitle(topic.id, clean);
                          }
                          setEditingTopicId(null);
                        }}
                        className="flex items-center gap-1.5 pt-1 max-w-md"
                      >
                        <input
                          type="text"
                          value={editingTopicTitle}
                          onChange={(e) => setEditingTopicTitle(e.target.value)}
                          maxLength={50}
                          autoFocus
                          placeholder="Nombre conciso del tema"
                          className="text-sm font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-indigo-400 dark:border-indigo-500 rounded-lg px-2.5 py-1 outline-hidden focus:ring-2 focus:ring-indigo-500/30 flex-1 min-w-0"
                        />
                        <button
                          type="submit"
                          className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shrink-0"
                          title="Guardar nombre"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTopicId(null)}
                          className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-start sm:items-center gap-1.5 group pt-0.5 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug break-words">
                          {formatTopicTitle(topic.topicTitle)}
                        </h3>
                        {onUpdateTopicTitle && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTopicId(topic.id);
                              setEditingTopicTitle(topic.topicTitle);
                            }}
                            title="Editar o renombrar título de este tema"
                            aria-label={`Editar tema ${topic.topicTitle}`}
                            className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-opacity cursor-pointer shrink-0"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Primary actions on topic - Responsive wrap layout */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 w-full md:w-auto pt-1 md:pt-0">
                    <button
                      onClick={() => {
                        const tom = new Date();
                        tom.setDate(tom.getDate() + 2);
                        const tomStr = tom.toISOString().split('T')[0];
                        onScheduleReview(topic.id, tomStr, `Refuerzo de conceptos clave de ${topic.topicTitle}`);
                        onAnnounce(`Repaso programado para ${topic.topicTitle}`);
                      }}
                      title="Agendar fecha de repaso para este tema"
                      className="px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Agendar</span>
                    </button>
                    <button
                      onClick={() => onOpenExamMode(topic)}
                      title="Abrir Modo Examen: Estudio guiado y simulacro de examen oficial"
                      className="px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0"
                    >
                      <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Modo Examen</span>
                    </button>
                    <button
                      onClick={() => onGenerateQuizForTopic(topic)}
                      title="Generar Quiz de 3 preguntas de este tema"
                      className="px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors shrink-0"
                    >
                      <FileQuestion className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Quiz</span>
                    </button>
                    <button
                      onClick={() => onGenerateFlashcardsForTopic(topic)}
                      title="Generar tarjetas de memoria activa (Flashcards)"
                      className="px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors shrink-0"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Tarjetas</span>
                    </button>
                    <button
                      onClick={() => onSelectTopicForChat(topic)}
                      title="Repasar este tema en el chat con S.A.R.A"
                      className="px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0"
                    >
                      <span>Repasar</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    {confirmDeleteTopicId === topic.id ? (
                      <div 
                        className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/90 px-2.5 py-1 rounded-xl border border-rose-300 dark:border-rose-700 shadow-2xs shrink-0"
                      >
                        <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 whitespace-nowrap">¿Eliminar?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteTopic(topic.id);
                            setConfirmDeleteTopicId(null);
                            onAnnounce(`Tema "${topic.topicTitle}" eliminado de la memoria.`);
                          }}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0"
                        >
                          Sí, borrar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteTopicId(null)}
                          className="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors shrink-0"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteTopicId(topic.id)}
                        title="Eliminar tema de la memoria"
                        aria-label={`Eliminar ${topic.topicTitle}`}
                        className="p-2 sm:p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-400 transition-colors flex items-center justify-center gap-1 text-xs shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="sm:hidden text-[11px] font-medium">Eliminar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {topic.summary}
                </p>

                {/* Key Concepts Chips */}
                {topic.keyConcepts && topic.keyConcepts.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
                      <Tag className="w-3 h-3" /> Conceptos clave:
                    </span>
                    {topic.keyConcepts.map((concept, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-100 dark:border-indigo-900/60"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                )}

                {/* Tutor Notes & Connections */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="italic">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 not-italic">Nota del Tutor: </span>
                    {topic.notes || 'Ninguna observación especial registrada.'}
                  </div>

                  {topic.connections && topic.connections.length > 0 && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-semibold">Conecta con:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {topic.connections.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
