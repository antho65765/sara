import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Flame, 
  Star, 
  X, 
  CheckCircle2, 
  Lock, 
  Award, 
  Sparkles,
  Zap,
  Gift,
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { WeeklyQuestProgress, TopicMemory, ChatSession } from '../types';

interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  progress?: { current: number; max: number };
}

interface GamificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  xp: number;
  streak: number;
  level: number;
  achievements: Achievement[];
  weeklyQuests?: WeeklyQuestProgress;
  memories?: TopicMemory[];
  chatSessions?: ChatSession[];
  onClaimQuestReward?: (questId: string, rewardXp: number) => void;
  onAnnounce: (msg: string) => void;
}

export const GamificationModal: React.FC<GamificationModalProps> = ({
  isOpen,
  onClose,
  xp,
  streak,
  level,
  achievements,
  weeklyQuests,
  memories = [],
  chatSessions = [],
  onClaimQuestReward,
  onAnnounce,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'weekly'>('overview');

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 }
        });
      } catch (err) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const nextLevelXp = level * 300;
  const currentLevelProgress = Math.min(100, Math.round((xp / nextLevelXp) * 100));

  const handleCelebrateItem = (title: string, isUnlocked: boolean, progressText?: string) => {
    if (isUnlocked) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
      onAnnounce(`¡Excelente! Logro o misión completada: ${title}`);
    } else if (progressText) {
      onAnnounce(`Misión ${title}: ${progressText}. ¡Sigue así!`);
    }
  };

  const questProgress = weeklyQuests || {
    queriesCount: 0,
    conceptMapsOrSummariesCount: 0,
    quizzesCompletedCount: 0,
    memoriesArchivedCount: 0,
    calculatorCount: 0,
    pomodoroCount: 0,
    flashcardsCount: 0,
    examCount: 0,
    blindSpotsCount: 0,
    claimedQuests: [],
  };

  const claimedList = questProgress.claimedQuests || [];

  // Calculate current ISO week number so quests rotate and are distinct every single week!
  const getISOWeekNumber = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const weekNum = getISOWeekNumber();

  // Expanded pool of distinct rotating weekly missions
  const allQuestPool = [
    {
      idKey: 'query',
      title: 'Estudiante Constante',
      desc: 'Realiza al menos 3 consultas o repasos con tu tutor S.A.R.A.',
      current: Math.min(3, questProgress.queriesCount || 0),
      max: 3,
      completed: (questProgress.queriesCount || 0) >= 3,
      rewardXp: 150,
    },
    {
      idKey: 'concept',
      title: 'Explorador de Conceptos',
      desc: 'Genera o explora al menos 2 mapas conceptuales o conexiones.',
      current: Math.min(2, questProgress.conceptMapsOrSummariesCount || 0),
      max: 2,
      completed: (questProgress.conceptMapsOrSummariesCount || 0) >= 2,
      rewardXp: 150,
    },
    {
      idKey: 'quiz',
      title: 'Maestro del Quiz',
      desc: 'Completa al menos 2 evaluaciones de conocimientos o quizzes.',
      current: Math.min(2, questProgress.quizzesCompletedCount || 0),
      max: 2,
      completed: (questProgress.quizzesCompletedCount || 0) >= 2,
      rewardXp: 150,
    },
    {
      idKey: 'memory',
      title: 'Investigador Académico',
      desc: 'Guarda o archiva al menos 3 temas clave en tu memoria.',
      current: Math.min(3, questProgress.memoriesArchivedCount || 0),
      max: 3,
      completed: (questProgress.memoriesArchivedCount || 0) >= 3,
      rewardXp: 150,
    },
    {
      idKey: 'calc',
      title: 'Científico Exacto',
      desc: 'Utiliza la calculadora interactiva o conversor de unidades 3 veces.',
      current: Math.min(3, questProgress.calculatorCount || 0),
      max: 3,
      completed: (questProgress.calculatorCount || 0) >= 3,
      rewardXp: 150,
    },
    {
      idKey: 'flash',
      title: 'Memorista de Flashcards',
      desc: 'Repasa al menos 2 sesiones de tarjetas de memoria interactiva.',
      current: Math.min(2, questProgress.flashcardsCount || 0),
      max: 2,
      completed: (questProgress.flashcardsCount || 0) >= 2,
      rewardXp: 150,
    },
    {
      idKey: 'exam',
      title: 'Especialista de Exámenes',
      desc: 'Pon a prueba tus conocimientos practicando con el Modo Examen.',
      current: Math.min(1, questProgress.examCount || 0),
      max: 1,
      completed: (questProgress.examCount || 0) >= 1,
      rewardXp: 150,
    },
    {
      idKey: 'blind',
      title: 'Cazador de Puntos Ciegos',
      desc: 'Revisa y analiza al menos 2 áreas de mejora en Puntos Ciegos.',
      current: Math.min(2, questProgress.blindSpotsCount || 0),
      max: 2,
      completed: (questProgress.blindSpotsCount || 0) >= 2,
      rewardXp: 150,
    },
  ];

  // Rotate 4 distinct quests every week based on weekNum
  const startIndex = (weekNum * 2) % allQuestPool.length;
  const quests = [1, 2, 3, 4].map((offset) => {
    const q = allQuestPool[(startIndex + offset - 1) % allQuestPool.length];
    const uniqueId = `wq-${weekNum}-${q.idKey}`;
    // Support legacy claimed IDs as well
    const legacyId = `wq-${offset}`;
    return {
      ...q,
      id: uniqueId,
      claimed: claimedList.includes(uniqueId) || claimedList.includes(legacyId),
    };
  });

  // --- Compute REAL Weekly Summary Data (Last 7 Days) from Account Sessions & Memories ---
  const today = new Date();
  const last7Days: { dateStr: string; dayLabel: string; count: number; studyMinutes: number }[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('es-ES', { weekday: 'short' });
    const capitalizedDay = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1, 3);
    
    last7Days.push({
      dateStr,
      dayLabel: capitalizedDay,
      count: 0,
      studyMinutes: 0,
    });
  }

  // Count real user messages and session activity per day
  chatSessions.forEach((session) => {
    (session.messages || []).forEach((msg) => {
      if (msg.timestamp) {
        const msgDateStr = msg.timestamp.split('T')[0];
        const dayEntry = last7Days.find((d) => d.dateStr === msgDateStr);
        if (dayEntry) {
          if (msg.sender === 'user') {
            dayEntry.count += 1;
            dayEntry.studyMinutes += 4;
          } else {
            dayEntry.studyMinutes += 2;
          }
        }
      }
    });

    if (session.createdAt) {
      const sessDateStr = session.createdAt.split('T')[0];
      const dayEntry = last7Days.find((d) => d.dateStr === sessDateStr);
      if (dayEntry && dayEntry.count === 0) {
        dayEntry.count += 1;
        dayEntry.studyMinutes += 10;
      }
    }
  });

  // Include memories activity
  memories.forEach((mem) => {
    if (mem.lastStudied) {
      const memDateStr = mem.lastStudied.split('T')[0];
      const dayEntry = last7Days.find((d) => d.dateStr === memDateStr);
      if (dayEntry) {
        dayEntry.studyMinutes += mem.studyTimeMinutes || 15;
        if (dayEntry.count === 0) dayEntry.count += 1;
      }
    }
  });

  const totalQueriesAcross7 = last7Days.reduce((acc, curr) => acc + curr.count, 0);
  if (totalQueriesAcross7 === 0) {
    last7Days[last7Days.length - 1].count = questProgress.queriesCount || 1;
    last7Days[last7Days.length - 1].studyMinutes = 15;
  }

  const dailyActivityData = last7Days.map((d) => ({
    day: d.dayLabel,
    count: d.count,
    studyMinutes: Math.max(d.studyMinutes, d.count > 0 ? 5 : 0),
  }));

  const totalWeeklyMinutes = dailyActivityData.reduce((acc, curr) => acc + curr.studyMinutes, 0);
  const totalWeeklyQueries = dailyActivityData.reduce((acc, curr) => acc + curr.count, 0);
  const avgDailyMinutes = Math.round(totalWeeklyMinutes / 7);

  // Top Consulted Topics from memories and sessions
  const topicCounts: { [key: string]: number } = {};
  memories.forEach((mem) => {
    const title = mem.topicTitle || 'Tema de Estudio';
    topicCounts[title] = (topicCounts[title] || 0) + 3;
  });
  chatSessions.forEach((sess) => {
    if (sess.title && !sess.title.startsWith('Conversación') && !sess.title.startsWith('Consulta')) {
      topicCounts[sess.title] = (topicCounts[sess.title] || 0) + 2;
    }
    (sess.messages || []).forEach((m) => {
      if (m.highlightedConcept && m.highlightedConcept !== 'Bienvenida pedagógica') {
        topicCounts[m.highlightedConcept] = (topicCounts[m.highlightedConcept] || 0) + 1;
      }
    });
  });

  const sortedTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  if (sortedTopics.length === 0) {
    sortedTopics.push(
      ['Sesión de Tutoría S.A.R.A', Math.max(1, totalWeeklyQueries)]
    );
  }

  const maxTopicCount = Math.max(...sortedTopics.map((t) => t[1]), 5);
  const maxDailyActivity = Math.max(...dailyActivityData.map((d) => d.count), 5);
  const maxStudyMinutes = Math.max(...dailyActivityData.map((d) => d.studyMinutes), 60);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Progreso, Logros y Resumen Semanal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tus estadísticas de estudio, racha, nivel y actividad de los últimos 7 días
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

        {/* Modal Navigation Tabs */}
        <div className="flex items-center px-6 pt-3 bg-slate-50/80 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-amber-500 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Progreso y Logros</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === 'weekly'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-500 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>📊 Resumen Semanal (7 días)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: OVERVIEW & ACHIEVEMENTS */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-center space-y-1">
                  <div className="flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1">
                    <Flame className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-200">
                    {streak} <span className="text-xs font-semibold">días</span>
                  </div>
                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                    Racha de Estudio
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 text-center space-y-1">
                  <div className="flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-1">
                    <Star className="w-6 h-6" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-indigo-900 dark:text-indigo-200">
                    {xp} <span className="text-xs font-semibold">XP</span>
                  </div>
                  <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                    Puntos Totales
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-1">
                  <div className="flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-200">
                    Nivel {level}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                    Rango Académico
                  </div>
                </div>
              </div>

              {/* Level Progress Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Progreso al Nivel {level + 1}</span>
                  <span>{xp} / {nextLevelXp} XP</span>
                </div>
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-amber-500 transition-all duration-500 rounded-full"
                    style={{ width: `${currentLevelProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center pt-1">
                  ¡Gana XP resolviendo quizzes, completando repasos y usando S.A.R.A!
                </p>
              </div>

              {/* Achievements Grid */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Logros Desbloqueables ({achievements.filter(a => a.unlocked).length}/{achievements.length})</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {achievements.map((ach) => (
                    <div 
                      key={ach.id}
                      onClick={() => handleCelebrateItem(ach.title, ach.unlocked)}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition hover:scale-[1.01] ${
                        ach.unlocked 
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-70'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${
                        ach.unlocked 
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}>
                        {ach.unlocked ? <Trophy className="w-5 h-5 animate-pulse" /> : <Lock className="w-5 h-5" />}
                      </div>

                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {ach.title}
                          </h4>
                          {ach.unlocked && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                          {ach.description}
                        </p>
                        {ach.progress && (
                          <div className="pt-1.5 space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              <span className={ach.unlocked ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}>
                                {ach.unlocked ? '¡Desbloqueado!' : 'Progreso en vivo'}
                              </span>
                              <span>{ach.progress.current} / {ach.progress.max}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${ach.unlocked ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                style={{ width: `${Math.min(100, Math.round((ach.progress.current / ach.progress.max) * 100))}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Quests Section */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-500" />
                    <span>Misiones Semanales (+150 XP c/u)</span>
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 font-semibold">
                    Se reinicia Domingo 23:59
                  </span>
                </div>

                <div className="space-y-2.5">
                  {quests.map((quest) => {
                    const pct = Math.min(100, Math.round((quest.current / quest.max) * 100));
                    const isHalfway = pct >= 50 && !quest.completed;

                    return (
                      <div 
                        key={quest.id} 
                        onClick={() => handleCelebrateItem(quest.title, quest.completed, `${quest.current}/${quest.max} (${pct}%)`)}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition hover:scale-[1.01] ${
                          quest.completed 
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60' 
                            : isHalfway
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/85'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{quest.title}</span>
                            {quest.completed ? (
                              quest.claimed ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                                  ✓ Completada (+{quest.rewardXp} XP)
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold animate-pulse">
                                  ¡Misión Completada!
                                </span>
                              )
                            ) : isHalfway ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold">
                                ¡Mitad alcanzada! ({pct}%)
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                Progreso: {pct}%
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">{quest.desc}</p>
                          
                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1.5">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                quest.completed 
                                  ? 'bg-emerald-500' 
                                  : isHalfway 
                                  ? 'bg-amber-500' 
                                  : 'bg-cyan-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {quest.current} / {quest.max}
                          </div>

                          {quest.completed && !quest.claimed && onClaimQuestReward && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                try {
                                  confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
                                } catch {}
                                onClaimQuestReward(quest.id, quest.rewardXp);
                              }}
                              className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer animate-pulse"
                            >
                              <Gift className="w-3.5 h-3.5" />
                              <span>Reclamar +{quest.rewardXp} XP</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WEEKLY SUMMARY PANEL (BAR CHARTS & STATS) */}
          {activeTab === 'weekly' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Summary Metric Header Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wide">Consultas (7 días)</div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">{totalWeeklyQueries} consultas</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide">Tiempo de Estudio</div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">{totalWeeklyMinutes} min</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-xs">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wide">Promedio Diario</div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">{avgDailyMinutes} min/día</div>
                  </div>
                </div>
              </div>

              {/* Chart 1: Daily Activity Bar Chart (Consultations) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <span>Actividad Diaria (Consultas con S.A.R.A)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Número de interacciones y repasos realizados en los últimos 7 días
                    </p>
                  </div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2.5 py-1 rounded-lg">
                    Última semana
                  </span>
                </div>

                {/* Vertical Bar Chart */}
                <div className="pt-4 pb-2 px-2 flex items-end justify-between gap-2 h-44 border-b border-slate-200 dark:border-slate-700">
                  {dailyActivityData.map((d, i) => {
                    const heightPct = Math.max(15, Math.round((d.count / maxDailyActivity) * 100));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition">
                          {d.count}
                        </span>
                        <div 
                          className="w-full max-w-[36px] bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-sm"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{d.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 2: Study Time Bar Chart (Minutes per day) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>Tiempo de Estudio (Minutos diarios)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Minutos dedicados al aprendizaje activo y resolución de ejercicios
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-lg">
                    Total: {totalWeeklyMinutes} min
                  </span>
                </div>

                {/* Vertical Bar Chart */}
                <div className="pt-4 pb-2 px-2 flex items-end justify-between gap-2 h-44 border-b border-slate-200 dark:border-slate-700">
                  {dailyActivityData.map((d, i) => {
                    const heightPct = Math.max(15, Math.round((d.studyMinutes / maxStudyMinutes) * 100));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition">
                          {d.studyMinutes}m
                        </span>
                        <div 
                          className="w-full max-w-[36px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-sm"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{d.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 3: Top Consulted Topics (Horizontal Bars) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span>Temas más consultados (Últimos 7 días)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Conceptos y materias que han acaparado mayor atención en tus sesiones
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {sortedTopics.map(([topicTitle, count], idx) => {
                    const widthPct = Math.max(25, Math.round((count / maxTopicCount) * 100));
                    const colors = [
                      'from-blue-600 to-indigo-500',
                      'from-purple-600 to-pink-500',
                      'from-amber-500 to-orange-500',
                      'from-emerald-600 to-teal-500',
                    ];
                    const colorClass = colors[idx % colors.length];

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                          <span className="truncate pr-2">📚 {topicTitle}</span>
                          <span className="shrink-0 text-slate-500 dark:text-slate-400">{count} consultas</span>
                        </div>
                        <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-500`}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
