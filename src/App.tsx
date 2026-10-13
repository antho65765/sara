import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, X } from 'lucide-react';
import { 
  Header 
} from './components/Header';
import { 
  ChatArea 
} from './components/ChatArea';
import { 
  MemoryPanel 
} from './components/MemoryPanel';
import { 
  AccessibilityToolbar 
} from './components/AccessibilityToolbar';
import { 
  StudentProfileModal 
} from './components/StudentProfileModal';
import { 
  QuizModal 
} from './components/QuizModal';
import { 
  FlashcardsModal 
} from './components/FlashcardsModal';
import { 
  TopicConnectorModal 
} from './components/TopicConnectorModal';
import { 
  ExamModeModal 
} from './components/ExamModeModal';
import { 
  ReadingGuide 
} from './components/ReadingGuide';
import { 
  InteractiveTutorialModal 
} from './components/InteractiveTutorialModal';
import { 
  OfflineIndicator 
} from './components/OfflineIndicator';
import { 
  ReviewReminderBanner 
} from './components/ReviewReminderBanner';
import {
  BlindSpotsModal
} from './components/BlindSpotsModal';
import {
  GamificationModal
} from './components/GamificationModal';
import {
  InteractiveReaderModal
} from './components/InteractiveReaderModal';
import {
  FormatConverterModal
} from './components/FormatConverterModal';
import {
  DeveloperModeModal
} from './components/DeveloperModeModal';
import {
  InteractiveCalculatorModal
} from './components/InteractiveCalculatorModal';
import {
  StartupSplashScreen
} from './components/StartupSplashScreen';
import {
  DebugOverlay
} from './components/DebugOverlay';
import {
  checkAndTriggerDueNotifications
} from './utils/notificationService';
import { 
  StudentProfile, 
  TopicMemory, 
  ChatMessage, 
  AccessibilitySettings, 
  QuizQuestion, 
  Flashcard,
  UserAccount,
  ChatSession,
  ChatAttachment,
  ReviewScheduleItem,
  SubjectKey,
  StudentMistake,
  WeeklyQuestProgress,
  ModelManagementSettings,
  SessionTokenStats
} from './types';
import { 
  INITIAL_STUDENT_PROFILE, 
  INITIAL_TOPIC_MEMORIES,
  SUBJECT_METADATA 
} from './data/pedagogicalConfig';
import { AuthProfilesModal } from './components/AuthProfilesModal';
import { 
  loadSavedAccounts, 
  saveAccounts, 
  loadActiveAccountId, 
  saveActiveAccountId,
  createWelcomeMessage,
  createNewSession
} from './utils/accountManager';
import { cleanTutorResponseText, formatTopicTitle } from './utils/textSanitizer';
import { 
  isMindMapRequest, 
  isVisualIllustrationRequest, 
  extractTargetTopic 
} from './utils/intentDetection';
import { AuthModal } from './components/AuthModal';
import { auth, testFirestoreConnection, syncUserProfile } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  // Accounts state (multi-user profiles)
  const [accounts, setAccounts] = useState<UserAccount[]>(() => loadSavedAccounts());
  const [activeAccountId, setActiveAccountId] = useState<string>(() => loadActiveAccountId(accounts));
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isGoogleAuthModalOpen, setIsGoogleAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // Active account resolution
  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0] || {
    id: 'acc-fallback',
    username: 'Invitado',
    profile: INITIAL_STUDENT_PROFILE,
    memories: INITIAL_TOPIC_MEMORIES,
    chatSessions: [],
    activeSessionId: 'session-default',
    chatHistory: [createWelcomeMessage(INITIAL_STUDENT_PROFILE)],
    lastActive: new Date().toISOString(),
  };

  // Ensure active account has valid chat sessions
  const chatSessions: ChatSession[] = (activeAccount.chatSessions && activeAccount.chatSessions.length > 0)
    ? activeAccount.chatSessions
    : [
        {
          id: `session-default-${activeAccount.id}`,
          title: `Conversación de ${SUBJECT_METADATA[activeAccount.profile?.currentSubject || 'ciencias']?.name || 'Estudio'}`,
          subject: activeAccount.profile?.currentSubject || 'ciencias',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: activeAccount.chatHistory && activeAccount.chatHistory.length > 0 
            ? activeAccount.chatHistory 
            : [createWelcomeMessage(activeAccount.profile)],
        }
      ];

  const activeSessionId = activeAccount.activeSessionId && chatSessions.some((s) => s.id === activeAccount.activeSessionId)
    ? activeAccount.activeSessionId
    : chatSessions[0].id;

  const activeSession = chatSessions.find((s) => s.id === activeSessionId) || chatSessions[0];
  const messages = activeSession.messages || [];

  // Model Management & Auto-switch Settings
  const [modelSettings, setModelSettings] = useState<ModelManagementSettings>(() => {
    try {
      const saved = localStorage.getItem('sara_model_settings');
      return saved ? JSON.parse(saved) : { autoModelSwitch: true, preferredModel: 'gemini-3.8-flash' };
    } catch {
      return { autoModelSwitch: true, preferredModel: 'gemini-3.8-flash' };
    }
  });

  const handleUpdateModelSettings = (newSettings: ModelManagementSettings) => {
    setModelSettings(newSettings);
    try {
      localStorage.setItem('sara_model_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Could not save model settings to localStorage:', e);
    }
  };

  // Profile modal active tab control ('profile' | 'models')
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'models'>('profile');

  // Compute live session token consumption based on current active chat messages
  const sessionTokenStats = useMemo<SessionTokenStats>(() => {
    let pTokens = 0;
    let cTokens = 0;
    let total = 0;
    let count = 0;

    const resetTime = modelSettings.tokenLimitResetTime ? new Date(modelSettings.tokenLimitResetTime).getTime() : 0;

    for (const msg of messages) {
      const msgTime = new Date(msg.timestamp).getTime();
      if (resetTime && msgTime < resetTime) {
        // Skip tokens counted prior to explicit token counter reset
        continue;
      }
      if (msg.tokenUsage) {
        pTokens += msg.tokenUsage.promptTokens || 0;
        cTokens += msg.tokenUsage.candidatesTokens || 0;
        total += msg.tokenUsage.totalTokens || 0;
        count++;
      } else if (msg.sender === 'tutor' && msg.text) {
        // Fallback realistic approximation if message pre-dated token tracking
        const approxOut = Math.max(1, Math.round(msg.text.length / 3.8));
        const approxIn = 250;
        pTokens += approxIn;
        cTokens += approxOut;
        total += approxIn + approxOut;
        count++;
      }
    }

    return {
      promptTokens: pTokens,
      candidatesTokens: cTokens,
      totalTokens: total,
      messagesCount: count,
    };
  }, [messages, modelSettings.tokenLimitResetTime]);

  // Check if token limit per session is enabled and exceeded
  const isTokenLimitExceeded = useMemo(() => {
    if (!modelSettings.enableTokenLimit) return false;
    const max = modelSettings.maxTokensPerSession || 10000;
    return sessionTokenStats.totalTokens >= max;
  }, [modelSettings.enableTokenLimit, modelSettings.maxTokensPerSession, sessionTokenStats.totalTokens]);

  const handleResetSessionTokens = () => {
    const updated = {
      ...modelSettings,
      tokenLimitResetTime: new Date().toISOString(),
    };
    handleUpdateModelSettings(updated);
    announce('Contador de tokens de la sesión reiniciado.');
  };

  // Current active AI model extracted from most recent tutor message
  const activeAiModel = useMemo(() => {
    const recentTutorWithModel = [...messages].reverse().find((m) => m.sender === 'tutor' && m.usedModel);
    return recentTutorWithModel?.usedModel || modelSettings.preferredModel || 'gemini-3.8-flash';
  }, [messages, modelSettings.preferredModel]);

  // Accessibility state
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem('tutoria_accessibility');
      return saved ? { themeMode: 'system', ...JSON.parse(saved) } : {
        themeMode: 'system',
        highContrast: false,
        dyslexicFont: false,
        fontSize: 'normal',
        readingGuide: false,
        lineSpacing: 'normal',
        autoReadResponse: false,
        speechRate: 1.0,
        simplifiedView: false,
      };
    } catch {
      return {
        themeMode: 'system',
        highContrast: false,
        dyslexicFont: false,
        fontSize: 'normal',
        readingGuide: false,
        lineSpacing: 'normal',
        autoReadResponse: false,
        speechRate: 1.0,
        simplifiedView: false,
      };
    }
  });

  // Current active account profile and memories
  const profile = activeAccount.profile;
  const memories = activeAccount.memories || [];
  const scheduledReviews = activeAccount.scheduledReviews || [];

  // Updaters for active profile, memories, chat, scheduledReviews
  const setScheduledReviews = (newReviewsOrFn: ReviewScheduleItem[] | ((prev: ReviewScheduleItem[]) => ReviewScheduleItem[])) => {
    setAccounts((prevAccounts) => {
      return prevAccounts.map((acc) => {
        if (acc.id === activeAccount.id) {
          const currentReviews = acc.scheduledReviews || [];
          const updatedReviews = typeof newReviewsOrFn === 'function' ? newReviewsOrFn(currentReviews) : newReviewsOrFn;
          return {
            ...acc,
            scheduledReviews: updatedReviews,
            lastActive: new Date().toISOString(),
          };
        }
        return acc;
      });
    });
  };
  const setProfile = (newProfileOrFn: StudentProfile | ((prev: StudentProfile) => StudentProfile)) => {
    setAccounts((prevAccounts) => {
      return prevAccounts.map((acc) => {
        if (acc.id === activeAccount.id) {
          const updatedProf = typeof newProfileOrFn === 'function' ? newProfileOrFn(acc.profile) : newProfileOrFn;
          return {
            ...acc,
            username: updatedProf.name || acc.username,
            profile: updatedProf,
            lastActive: new Date().toISOString(),
          };
        }
        return acc;
      });
    });
  };

  const setMemories = (newMemoriesOrFn: TopicMemory[] | ((prev: TopicMemory[]) => TopicMemory[])) => {
    setAccounts((prevAccounts) => {
      return prevAccounts.map((acc) => {
        if (acc.id === activeAccount.id) {
          const updatedMems = typeof newMemoriesOrFn === 'function' ? newMemoriesOrFn(acc.memories || []) : newMemoriesOrFn;
          return {
            ...acc,
            memories: updatedMems,
            lastActive: new Date().toISOString(),
          };
        }
        return acc;
      });
    });
  };

  const setMessages = (newMessagesOrFn: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setAccounts((prevAccounts) => {
      return prevAccounts.map((acc) => {
        if (acc.id === activeAccount.id) {
          const currentSessions: ChatSession[] = acc.chatSessions && acc.chatSessions.length > 0
            ? acc.chatSessions
            : [
                {
                  id: `session-default-${acc.id}`,
                  title: `Conversación (${SUBJECT_METADATA[acc.profile?.currentSubject || 'ciencias']?.name || 'Estudio'})`,
                  subject: acc.profile?.currentSubject || 'ciencias',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  messages: acc.chatHistory || [createWelcomeMessage(acc.profile)],
                }
              ];

          const targetSessionId = acc.activeSessionId && currentSessions.some((s) => s.id === acc.activeSessionId)
            ? acc.activeSessionId
            : currentSessions[0].id;

          const updatedSessions = currentSessions.map((session) => {
            if (session.id === targetSessionId) {
              const nextMsgs = typeof newMessagesOrFn === 'function' ? newMessagesOrFn(session.messages || []) : newMessagesOrFn;
              
              // Smart title rename if current title is default and user sent their first query
              let nextTitle = session.title;
              const firstUserMsg = nextMsgs.find((m) => m.sender === 'user');
              if (firstUserMsg && (session.title.startsWith('Consulta') || session.title.startsWith('Conversación'))) {
                const cleanSnippet = firstUserMsg.text.replace(/^[^\wáéíóúÁÉÍÓÚñÑ]+/, '').trim().slice(0, 32);
                if (cleanSnippet) {
                  nextTitle = cleanSnippet.length >= 32 ? `${cleanSnippet}...` : cleanSnippet;
                }
              }

              return {
                ...session,
                title: nextTitle,
                updatedAt: new Date().toISOString(),
                messages: nextMsgs,
              };
            }
            return session;
          });

          const activeTarget = updatedSessions.find((s) => s.id === targetSessionId) || updatedSessions[0];

          return {
            ...acc,
            chatSessions: updatedSessions,
            activeSessionId: targetSessionId,
            chatHistory: activeTarget.messages,
            lastActive: new Date().toISOString(),
          };
        }
        return acc;
      });
    });
  };

  // Multi-chat management handlers
  const handleNewChat = (customTitle?: string) => {
    const newSession = createNewSession(profile, customTitle, profile.currentSubject);
    setAccounts((prevAccounts) => {
      return prevAccounts.map((acc) => {
        if (acc.id === activeAccount.id) {
          const existingSessions = acc.chatSessions && acc.chatSessions.length > 0 ? acc.chatSessions : [
            {
              id: `session-default-${acc.id}`,
              title: `Conversación (${SUBJECT_METADATA[acc.profile?.currentSubject || 'ciencias']?.name || 'Estudio'})`,
              subject: acc.profile?.currentSubject || 'ciencias',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              messages: acc.chatHistory || [createWelcomeMessage(acc.profile)],
            }
          ];
          const updatedSessions = [newSession, ...existingSessions];
          return {
            ...acc,
            chatSessions: updatedSessions,
            activeSessionId: newSession.id,
            chatHistory: newSession.messages,
            lastActive: new Date().toISOString(),
          };
        }
        return acc;
      });
    });
  };

  const handleSwitchChat = (sessionId: string) => {
    setAccounts((prevAccounts) => {
      return prevAccounts.map((acc) => {
        if (acc.id === activeAccount.id) {
          const target = (acc.chatSessions || []).find((s) => s.id === sessionId);
          return {
            ...acc,
            activeSessionId: sessionId,
            chatHistory: target?.messages || acc.chatHistory,
            lastActive: new Date().toISOString(),
          };
        }
        return acc;
      });
    });
  };

  const handleDeleteChat = (sessionId: string) => {
    setAccounts((prevAccounts) => {
      return prevAccounts.map((acc) => {
        if (acc.id === activeAccount.id) {
          const existingSessions = acc.chatSessions || [];
          if (existingSessions.length <= 1) {
            const fresh = createNewSession(acc.profile);
            return {
              ...acc,
              chatSessions: [fresh],
              activeSessionId: fresh.id,
              chatHistory: fresh.messages,
              lastActive: new Date().toISOString(),
            };
          }
          const filtered = existingSessions.filter((s) => s.id !== sessionId);
          const nextActiveId = acc.activeSessionId === sessionId ? filtered[0].id : acc.activeSessionId;
          const activeTarget = filtered.find((s) => s.id === nextActiveId) || filtered[0];
          return {
            ...acc,
            chatSessions: filtered,
            activeSessionId: nextActiveId,
            chatHistory: activeTarget.messages,
            lastActive: new Date().toISOString(),
          };
        }
        return acc;
      });
    });
  };

  const handleRenameChat = (sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setAccounts((prevAccounts) => {
      return prevAccounts.map((acc) => {
        if (acc.id === activeAccount.id) {
          const updated = (acc.chatSessions || []).map((s) => 
            s.id === sessionId ? { ...s, title: newTitle.trim(), updatedAt: new Date().toISOString() } : s
          );
          return {
            ...acc,
            chatSessions: updated,
          };
        }
        return acc;
      });
    });
  };

  // Active UI states
  const [activeTab, setActiveTab] = useState<'chat' | 'memory'>('chat');
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Helper to extract the exact topic being discussed in the active conversation
  const getEffectiveActiveTopic = useCallback((): string => {
    // 1. If explicit state is set and valid
    if (currentTopic && currentTopic.trim() && currentTopic !== 'Fotosíntesis y Respiración Celular') {
      return currentTopic.trim();
    }

    // 2. Check recent tutor message with a highlightedConcept
    const tutorMsgs = messages.filter(
      (m) => m.sender === 'tutor' && m.highlightedConcept && m.highlightedConcept !== 'Bienvenida pedagógica'
    );
    if (tutorMsgs.length > 0) {
      const concept = tutorMsgs[tutorMsgs.length - 1].highlightedConcept;
      if (concept && concept.trim()) return concept.trim();
    }

    // 3. Check memory updates
    const memMsg = [...messages].reverse().find((m) => m.memoryUpdate?.topicTitle);
    if (memMsg?.memoryUpdate?.topicTitle) {
      return memMsg.memoryUpdate.topicTitle.trim();
    }

    // 4. Check the last user message text
    const userMsgs = messages.filter((m) => m.sender === 'user' && m.text);
    if (userMsgs.length > 0) {
      const rawText = userMsgs[userMsgs.length - 1].text.trim();
      const clean = rawText
        .replace(/^(🧠|🖼️|📝|💡|🎯|❓)?\s*(genera|crea|hazme|dibuja|ilustra|explícame|explica|qué es|que es|cómo funciona|como funciona|ayúdame con|un mapa mental interactivo sobre:|un mapa mental sobre:|una ilustración y esquema didáctico sobre:|una ilustración sobre:|una imagen sobre:|sobre:?)\s*/i, '')
        .replace(/[¿?¡!]/g, '')
        .trim();
      if (clean.length >= 3) {
        return clean.slice(0, 60);
      }
    }

    // 5. Check active session title if not generic
    if (activeSession?.title && !activeSession.title.startsWith('Conversación de') && !activeSession.title.startsWith('Consulta sobre')) {
      return activeSession.title;
    }

    // 6. Subject name fallback
    return SUBJECT_METADATA[activeSession?.subject || profile.currentSubject]?.name || 'Tema de estudio';
  }, [currentTopic, messages, activeSession, profile.currentSubject]);

  // Modals
  const [showStartupSplash, setShowStartupSplash] = useState(true);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizTopic, setQuizTopic] = useState('');
  const [isQuizLoading, setIsQuizLoading] = useState(false);

  const studentMistakes = activeAccount.studentMistakes || [];
  const setStudentMistakes = (newMistakesOrFn: StudentMistake[] | ((prev: StudentMistake[]) => StudentMistake[])) => {
    setAccounts((prevAccounts) => {
      return prevAccounts.map((acc) => {
        if (acc.id === activeAccount.id) {
          const currentMistakes = acc.studentMistakes || [];
          const updatedMistakes = typeof newMistakesOrFn === 'function' ? newMistakesOrFn(currentMistakes) : newMistakesOrFn;
          return {
            ...acc,
            studentMistakes: updatedMistakes,
            lastActive: new Date().toISOString(),
          };
        }
        return acc;
      });
    });
  };
  const [isBlindSpotsOpen, setIsBlindSpotsOpen] = useState(false);

  const xp = activeAccount.xp ?? 0;
  const setXp = (newXpOrFn: number | ((prev: number) => number)) => {
    setAccounts((prevAccounts) => {
      return prevAccounts.map((acc) => {
        if (acc.id === activeAccount.id) {
          const currentXp = acc.xp ?? 0;
          const updatedXp = typeof newXpOrFn === 'function' ? newXpOrFn(currentXp) : newXpOrFn;
          return {
            ...acc,
            xp: Math.max(0, updatedXp),
            lastActive: new Date().toISOString(),
          };
        }
        return acc;
      });
    });
  };

  const streak = activeAccount.streak ?? 0;
  const setStreak = (newStreakOrFn: number | ((prev: number) => number)) => {
    setAccounts((prevAccounts) => {
      return prevAccounts.map((acc) => {
        if (acc.id === activeAccount.id) {
          const currentStreak = acc.streak ?? 0;
          const updatedStreak = typeof newStreakOrFn === 'function' ? newStreakOrFn(currentStreak) : newStreakOrFn;
          return {
            ...acc,
            streak: Math.max(0, updatedStreak),
            lastActive: new Date().toISOString(),
          };
        }
        return acc;
      });
    });
  };
  const level = Math.floor(xp / 300) + 1;

  // Screen reader announcer (hoisted for achievements & quests)
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState('');
  const announce = useCallback((msg: string) => {
    setScreenReaderAnnouncement(msg);
  }, []);

  // Celebration notifications state
  interface CelebrationNotification {
    id: string;
    type: 'achievement' | 'quest' | 'milestone';
    title: string;
    subtitle: string;
    badge?: string;
    xp?: number;
  }
  const [celebrationToast, setCelebrationToast] = useState<CelebrationNotification | null>(null);

  const triggerCelebration = useCallback((toast: Omit<CelebrationNotification, 'id'>) => {
    const id = `toast-${Date.now()}`;
    setCelebrationToast({ ...toast, id });
    try {
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.2 }
      });
    } catch {}
    setTimeout(() => {
      setCelebrationToast((curr) => curr?.id === id ? null : curr);
    }, 5500);
  }, []);

  const weeklyQuests: WeeklyQuestProgress = {
    queriesCount: activeAccount.weeklyQuests?.queriesCount ?? 0,
    conceptMapsOrSummariesCount: activeAccount.weeklyQuests?.conceptMapsOrSummariesCount ?? 0,
    quizzesCompletedCount: activeAccount.weeklyQuests?.quizzesCompletedCount ?? 0,
    memoriesArchivedCount: Math.max(activeAccount.weeklyQuests?.memoriesArchivedCount ?? 0, memories.length),
    claimedQuests: activeAccount.weeklyQuests?.claimedQuests ?? [],
  };

  const updateWeeklyQuests = useCallback((
    updater: (prev: WeeklyQuestProgress) => WeeklyQuestProgress,
    notifyContext?: { title: string; halfMilestone: number; fullMilestone: number }
  ) => {
    setAccounts((prevAccounts) => {
      return prevAccounts.map((acc) => {
        if (acc.id === activeAccount.id) {
          const currentProgress: WeeklyQuestProgress = {
            queriesCount: acc.weeklyQuests?.queriesCount ?? 0,
            conceptMapsOrSummariesCount: acc.weeklyQuests?.conceptMapsOrSummariesCount ?? 0,
            quizzesCompletedCount: acc.weeklyQuests?.quizzesCompletedCount ?? 0,
            memoriesArchivedCount: Math.max(acc.weeklyQuests?.memoriesArchivedCount ?? 0, acc.memories?.length ?? 0),
            claimedQuests: acc.weeklyQuests?.claimedQuests ?? [],
          };
          const updated = updater(currentProgress);

          if (notifyContext) {
            let prevVal = 0;
            let nextVal = 0;
            if (notifyContext.title.includes('Constante')) {
              prevVal = currentProgress.queriesCount;
              nextVal = updated.queriesCount;
            } else if (notifyContext.title.includes('Conceptos')) {
              prevVal = currentProgress.conceptMapsOrSummariesCount;
              nextVal = updated.conceptMapsOrSummariesCount;
            } else if (notifyContext.title.includes('Quiz')) {
              prevVal = currentProgress.quizzesCompletedCount;
              nextVal = updated.quizzesCompletedCount;
            } else if (notifyContext.title.includes('Académico')) {
              prevVal = currentProgress.memoriesArchivedCount;
              nextVal = updated.memoriesArchivedCount;
            }

            if (nextVal >= notifyContext.fullMilestone && prevVal < notifyContext.fullMilestone) {
              triggerCelebration({
                type: 'quest',
                title: '¡Misión Semanal Completada! 🎉',
                subtitle: `${notifyContext.title} (${nextVal}/${notifyContext.fullMilestone}). Abre tus logros para reclamar +150 XP.`,
                badge: '¡Misión 100%!',
                xp: 150,
              });
              announce(`¡Misión semanal completada! ${notifyContext.title}. Reclama +150 XP en el panel de logros.`);
            } else if (nextVal >= notifyContext.halfMilestone && prevVal < notifyContext.halfMilestone) {
              triggerCelebration({
                type: 'quest',
                title: '¡Misión al 50% de Progreso! 🎯',
                subtitle: `${notifyContext.title}: llevas ${nextVal} de ${notifyContext.fullMilestone}. ¡Excelente avance!`,
                badge: 'Progreso 50%',
              });
              announce(`Misión semanal a mitad de camino: ${notifyContext.title}. Llevas ${nextVal} de ${notifyContext.fullMilestone}.`);
            }
          }

          return {
            ...acc,
            weeklyQuests: updated,
            lastActive: new Date().toISOString(),
          };
        }
        return acc;
      });
    });
  }, [activeAccount.id, triggerCelebration, announce]);

  const handleClaimQuestReward = (questId: string, rewardXp: number = 150) => {
    updateWeeklyQuests((prev) => {
      const claimed = prev.claimedQuests || [];
      if (claimed.includes(questId)) return prev;
      return {
        ...prev,
        claimedQuests: [...claimed, questId],
      };
    });
    setXp((prev) => prev + rewardXp);
    triggerCelebration({
      type: 'quest',
      title: '¡Recompensa Reclamada! 🎁',
      subtitle: `Has sumado +${rewardXp} XP a tu nivel general.`,
      badge: 'Recompensa',
      xp: rewardXp
    });
    announce(`¡Misión completada con éxito! Has ganado +${rewardXp} XP`);
  };

  const [isGamificationOpen, setIsGamificationOpen] = useState(false);
  const [isInteractiveReaderOpen, setIsInteractiveReaderOpen] = useState(false);
  const [isFormatConverterOpen, setIsFormatConverterOpen] = useState(false);
  const [isDeveloperModeOpen, setIsDeveloperModeOpen] = useState(false);
  const [isDebugOverlayActive, setIsDebugOverlayActive] = useState(() => {
    return localStorage.getItem('sara_debug_overlay') === 'true';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setIsDebugOverlayActive(localStorage.getItem('sara_debug_overlay') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sara-debug-overlay-change', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sara-debug-overlay-change', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('sara_student_xp', xp.toString());
      localStorage.setItem('sara_student_streak', streak.toString());
    } catch {}
  }, [xp, streak]);

  // Unlocked achievements management
  const unlockedAchievementIds = useMemo(() => {
    return activeAccount.unlockedAchievements || [];
  }, [activeAccount.unlockedAchievements]);

  const unlockAchievement = useCallback((achId: string, title?: string) => {
    setAccounts((prevAccounts) => {
      return prevAccounts.map((acc) => {
        if (acc.id === activeAccount.id) {
          const current = acc.unlockedAchievements || [];
          if (current.includes(achId)) return acc;
          return {
            ...acc,
            unlockedAchievements: [...current, achId],
            lastActive: new Date().toISOString(),
          };
        }
        return acc;
      });
    });
    setXp((prev) => prev + 50);
    if (title) {
      triggerCelebration({
        type: 'achievement',
        title: '¡Nuevo Logro Desbloqueado! 🏆',
        subtitle: `${title} (+50 XP)`,
        badge: 'Logro',
        xp: 50
      });
      announce(`¡Felicitaciones! Has desbloqueado el logro: ${title}. Ganaste +50 XP.`);
    }
  }, [activeAccount.id, triggerCelebration, announce]);

  const achievements = useMemo(() => [
    {
      id: 'ach-1',
      title: 'Primeros Pasos Académicos',
      description: 'Registra tu primera sesión o consulta en la memoria.',
      iconName: 'trophy',
      unlocked: unlockedAchievementIds.includes('ach-1') || memories.length > 0 || (activeAccount.chatHistory && activeAccount.chatHistory.some(m => m.sender === 'user')) || xp >= 50,
      progress: { 
        current: Math.min(1, unlockedAchievementIds.includes('ach-1') || memories.length > 0 || (activeAccount.chatHistory && activeAccount.chatHistory.some(m => m.sender === 'user')) || xp >= 50 ? 1 : 0), 
        max: 1 
      }
    },
    {
      id: 'ach-2',
      title: 'Racha de Fuego',
      description: 'Mantén una racha de estudio activa de 3 o más días.',
      iconName: 'flame',
      unlocked: unlockedAchievementIds.includes('ach-2') || streak >= 3,
      progress: { current: Math.min(3, streak), max: 3 }
    },
    {
      id: 'ach-3',
      title: 'Maestro del Quiz',
      description: 'Alcanza o supera 200 puntos XP en total.',
      iconName: 'award',
      unlocked: unlockedAchievementIds.includes('ach-3') || xp >= 200,
      progress: { current: Math.min(200, xp), max: 200 }
    },
    {
      id: 'ach-4',
      title: 'Explorador de Libros',
      description: 'Abre y utiliza el asistente de lectura interactiva.',
      iconName: 'book',
      unlocked: unlockedAchievementIds.includes('ach-4'),
      progress: { current: unlockedAchievementIds.includes('ach-4') ? 1 : 0, max: 1 }
    },
    {
      id: 'ach-5',
      title: 'Transcripción Pro',
      description: 'Utiliza el convertidor de formatos de estudio.',
      iconName: 'file',
      unlocked: unlockedAchievementIds.includes('ach-5'),
      progress: { current: unlockedAchievementIds.includes('ach-5') ? 1 : 0, max: 1 }
    },
    {
      id: 'ach-6',
      title: 'Polímata S.A.R.A',
      description: 'Acumula 500 puntos XP o más.',
      iconName: 'star',
      unlocked: unlockedAchievementIds.includes('ach-6') || xp >= 500,
      progress: { current: Math.min(500, xp), max: 500 }
    },
    {
      id: 'ach-7',
      title: 'Curioso Imparable',
      description: 'Guarda al menos 3 temas diferentes en la memoria de estudio.',
      iconName: 'brain',
      unlocked: unlockedAchievementIds.includes('ach-7') || memories.length >= 3,
      progress: { current: Math.min(3, memories.length), max: 3 }
    },
    {
      id: 'ach-8',
      title: 'Leyenda Académica',
      description: 'Alcanza el Nivel 3 o superior en tu rango de estudio.',
      iconName: 'zap',
      unlocked: unlockedAchievementIds.includes('ach-8') || level >= 3,
      progress: { current: Math.min(3, level), max: 3 }
    },
    {
      id: 'ach-9',
      title: 'Detective de Errores',
      description: 'Registra al menos 2 áreas de mejora o errores analizados.',
      iconName: 'shield',
      unlocked: unlockedAchievementIds.includes('ach-9') || studentMistakes.length >= 2,
      progress: { current: Math.min(2, studentMistakes.length), max: 2 }
    },
    {
      id: 'ach-10',
      title: 'Gran Maestro Sabio',
      description: 'Alcanza 1000 puntos XP y mantén racha de 7 días.',
      iconName: 'crown',
      unlocked: unlockedAchievementIds.includes('ach-10') || (xp >= 1000 && streak >= 7),
      progress: { current: Math.min(1000, xp), max: 1000 }
    }
  ], [unlockedAchievementIds, memories.length, activeAccount.chatHistory, xp, streak, level, studentMistakes.length]);

  // Real-time achievement unlock observer
  useEffect(() => {
    achievements.forEach((ach) => {
      if (ach.unlocked && !unlockedAchievementIds.includes(ach.id)) {
        unlockAchievement(ach.id, ach.title);
      }
    });
  }, [achievements, unlockedAchievementIds, unlockAchievement]);

  useEffect(() => {
    try {
      localStorage.setItem('sara_student_mistakes', JSON.stringify(studentMistakes));
    } catch {}
  }, [studentMistakes]);

  const handleRecordMistake = (mistake: Omit<StudentMistake, 'id' | 'timestamp'>) => {
    const newMistake: StudentMistake = {
      ...mistake,
      id: `mistake-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    setStudentMistakes((prev) => [newMistake, ...prev].slice(0, 50));
  };

  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashcardsTopic, setFlashcardsTopic] = useState('');
  const [isFlashcardsLoading, setIsFlashcardsLoading] = useState(false);

  const [isConnectorOpen, setIsConnectorOpen] = useState(false);
  const [connectorDefaultTopicA, setConnectorDefaultTopicA] = useState<TopicMemory | undefined>();
  const [isExamModeOpen, setIsExamModeOpen] = useState(false);
  const [examModeTopic, setExamModeTopic] = useState<TopicMemory | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(() => {
    try {
      const completed = localStorage.getItem('sara_tutorial_completed');
      return completed !== 'true';
    } catch {
      return false;
    }
  });
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  const handleOpenExamMode = (topic: TopicMemory) => {
    setExamModeTopic(topic);
    setIsExamModeOpen(true);
    announce(`Abriendo Modo Examen para "${topic.topicTitle}"`);
  };

  // Persist accounts whenever accounts state changes
  useEffect(() => {
    saveAccounts(accounts);
  }, [accounts]);

  // Persist active account ID
  useEffect(() => {
    saveActiveAccountId(activeAccountId);
  }, [activeAccountId]);

  // Persist accessibility settings
  useEffect(() => {
    localStorage.setItem('tutoria_accessibility', JSON.stringify(accessibility));
  }, [accessibility]);

  // Periodic background & lifecycle check for mobile/browser notifications
  useEffect(() => {
    // Initial check on mount
    checkAndTriggerDueNotifications(scheduledReviews);

    // Periodic check every 30 seconds
    const interval = setInterval(() => {
      checkAndTriggerDueNotifications(scheduledReviews);
    }, 30000);

    // Check when user returns to app/tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndTriggerDueNotifications(scheduledReviews);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [scheduledReviews]);

  // Firebase Auth and Firestore real-time listener & synchronization
  useEffect(() => {
    testFirestoreConnection();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const googleAccountId = `google-${user.uid}`;
        setAccounts((prev) => {
          const existingIdx = prev.findIndex((a) => a.id === googleAccountId || a.googleUid === user.uid);
          let nextAccounts: UserAccount[];
          if (existingIdx >= 0) {
            nextAccounts = prev.map((acc, idx) => {
              if (idx === existingIdx) {
                return {
                  ...acc,
                  email: user.email || acc.email,
                  photoURL: user.photoURL || acc.photoURL,
                  username: user.displayName || acc.username,
                  isGoogleAccount: true,
                  googleUid: user.uid,
                  profile: {
                    ...acc.profile,
                    name: user.displayName || acc.profile.name,
                    avatar: (acc.profile.avatar && !acc.profile.avatar.startsWith('http')) ? acc.profile.avatar : '🎓',
                  },
                  lastActive: new Date().toISOString(),
                };
              }
              return acc;
            });
          } else {
            const newGoogleAccount: UserAccount = {
              id: googleAccountId,
              username: user.displayName || user.email?.split('@')[0] || 'Estudiante Google',
              email: user.email || '',
              photoURL: user.photoURL || '',
              isGoogleAccount: true,
              googleUid: user.uid,
              profile: {
                ...INITIAL_STUDENT_PROFILE,
                name: user.displayName || user.email?.split('@')[0] || 'Estudiante Google',
                avatar: '🎓',
              },
              memories: INITIAL_TOPIC_MEMORIES,
              chatSessions: [],
              chatHistory: [createWelcomeMessage({
                ...INITIAL_STUDENT_PROFILE,
                name: user.displayName || user.email?.split('@')[0] || 'Estudiante Google',
              })],
              xp: 150,
              streak: 1,
              lastActive: new Date().toISOString(),
            };
            nextAccounts = [newGoogleAccount, ...prev];
          }
          saveAccounts(nextAccounts);
          return nextAccounts;
        });
        setActiveAccountId(googleAccountId);
        saveActiveAccountId(googleAccountId);

        syncUserProfile(user, {
          displayName: user.displayName || '',
          email: user.email || '',
        }).catch((err) => console.warn('Firestore sync warning:', err));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignInSuccess = (user: FirebaseUser) => {
    setCurrentUser(user);
    announce(`Sesión iniciada con Google como ${user.displayName || user.email}`);
  };

  const handleGoogleSignOut = () => {
    setCurrentUser(null);
    announce('Sesión de Google cerrada.');
  };

  // Account management actions
  const handleSelectAccount = (accountId: string, pinInput?: string): boolean => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return false;

    if (target.pin && target.pin.trim() !== '') {
      if (pinInput !== target.pin) {
        return false;
      }
    }

    setActiveAccountId(accountId);
    saveActiveAccountId(accountId);
    announce(`Sesión cambiada al perfil de ${target.username}`);
    return true;
  };

  const handleCreateAccount = (data: {
    username: string;
    pin?: string;
    grade: any;
    learningStyle: any;
    currentSubject: any;
    interests?: string;
    avatar?: string;
  }) => {
    const newProfile: StudentProfile = {
      name: data.username,
      grade: data.grade,
      learningStyle: data.learningStyle,
      currentSubject: data.currentSubject,
      interests: data.interests || '',
      avatar: data.avatar || '🎓',
      createdAt: new Date().toISOString(),
    };

    const welcomeMsg = createWelcomeMessage(newProfile);
    const initialSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: `Conversación de ${SUBJECT_METADATA[newProfile.currentSubject]?.name || 'Ciencias'}`,
      subject: newProfile.currentSubject,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [welcomeMsg],
    };

    const newAccount: UserAccount = {
      id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      username: data.username,
      pin: data.pin || undefined,
      profile: newProfile,
      memories: [],
      chatSessions: [initialSession],
      activeSessionId: initialSession.id,
      chatHistory: [welcomeMsg],
      lastActive: new Date().toISOString(),
    };

    const updated = [newAccount, ...accounts];
    setAccounts(updated);
    setActiveAccountId(newAccount.id);
    saveAccounts(updated);
    saveActiveAccountId(newAccount.id);
  };

  const handleDeleteAccount = (accountId: string) => {
    if (accounts.length <= 1) {
      announce('No puedes eliminar el único perfil.');
      return;
    }

    const updated = accounts.filter((a) => a.id !== accountId);
    setAccounts(updated);
    saveAccounts(updated);

    if (activeAccountId === accountId) {
      const nextId = updated[0].id;
      setActiveAccountId(nextId);
      saveActiveAccountId(nextId);
    }
    announce('Perfil eliminado.');
  };

  const handleSelectSubject = (newSubject: SubjectKey, customName?: string) => {
    setProfile((prev) => ({
      ...prev,
      currentSubject: newSubject,
      customSubjectName: customName !== undefined ? customName : prev.customSubjectName,
    }));

    // Also update active chat session subject if present
    setAccounts((prevAccounts) => {
      return prevAccounts.map((acc) => {
        if (acc.id === activeAccount.id && acc.chatSessions) {
          const updatedSessions = acc.chatSessions.map((s) => {
            if (s.id === (acc.activeSessionId || acc.chatSessions?.[0]?.id)) {
              return {
                ...s,
                subject: newSubject,
                updatedAt: new Date().toISOString(),
              };
            }
            return s;
          });
          return {
            ...acc,
            chatSessions: updatedSessions,
          };
        }
        return acc;
      });
    });

    const displayName = newSubject === 'otro' && customName
      ? customName
      : SUBJECT_METADATA[newSubject]?.name || newSubject;
    announce(`Asignatura cambiada a ${displayName}`);
  };

  // Apply font scale and accessibility classes to document root
  useEffect(() => {
    const scale = 
      accessibility.fontSize === 'large' ? '1.15rem' :
      accessibility.fontSize === 'extra-large' ? '1.30rem' : '1rem';
    
    document.documentElement.style.setProperty('--app-font-scale', scale);

    if (accessibility.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    if (accessibility.dyslexicFont) {
      document.body.classList.add('font-dyslexic');
    } else {
      document.body.classList.remove('font-dyslexic');
    }
  }, [accessibility.fontSize, accessibility.highContrast, accessibility.dyslexicFont]);

  // System dark mode preference tracker
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Compute active theme: dark vs light
  const isDarkMode = accessibility.themeMode === 'dark' || 
    (accessibility.themeMode !== 'light' && systemPrefersDark);

  // Sync dark class on document element and meta theme-color
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDarkMode ? '#020617' : '#2563eb');
    }
  }, [isDarkMode]);

  // Toggle theme action
  const handleToggleTheme = () => {
    const nextMode: 'light' | 'dark' = isDarkMode ? 'light' : 'dark';
    setAccessibility((prev) => ({ ...prev, themeMode: nextMode }));
    announce(nextMode === 'light' ? 'Modo claro activado' : 'Modo oscuro activado');
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAccessibilityOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsAccessibilityOpen(false);
        setIsProfileOpen(false);
        setIsQuizOpen(false);
        setIsFlashcardsOpen(false);
        setIsConnectorOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Chat message sender with multimodal image support
  const handleSendMessage = async (text: string, attachment?: ChatAttachment) => {
    const query = text.trim();
    if (!query && !attachment) return;

    // Security check: Verify session token limit
    if (isTokenLimitExceeded) {
      const limit = modelSettings.maxTokensPerSession || 10000;
      alert(`Has alcanzado el límite máximo configurado de ${new Intl.NumberFormat('es-ES').format(limit)} tokens para esta sesión. Para continuar, amplía o desactiva el límite en el panel de Gestión de Modelos.`);
      announce('Consulta bloqueada por límite de tokens por sesión.');
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query || 'Por favor explica este ejercicio o imagen paso a paso.',
      attachment,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);
    announce('Pregunta enviada. Esperando respuesta de S.A.R.A.');

    // Update weekly quests: Estudiante Constante
    updateWeeklyQuests(
      (prev) => ({
        ...prev,
        queriesCount: (prev.queriesCount || 0) + 1,
      }),
      { title: 'Estudiante Constante', halfMilestone: 2, fullMilestone: 3 }
    );

    try {
      const isProg = profile.currentSubject === 'programacion';
      const cleanHistory = messages.slice(-6).map((m) => ({
        sender: m.sender,
        text: cleanTutorResponseText(m.text, isProg),
      }));

      // Multimodal image payload for backend
      let imagePayload: any = undefined;
      if (attachment && attachment.url) {
        imagePayload = {
          data: attachment.url,
          mimeType: attachment.mimeType || 'image/jpeg',
          name: attachment.name,
        };
      }

      const activeCurrentTopic = getEffectiveActiveTopic();

      // Check if user naturally asked for a Mind Map or a Visual Illustration
      const wantsMindMap = !attachment && isMindMapRequest(query);
      const wantsVisual = !attachment && !wantsMindMap && isVisualIllustrationRequest(query);

      if (wantsMindMap) {
        const targetTopic = extractTargetTopic(query, activeCurrentTopic);
        announce(`Generando mapa mental sobre ${targetTopic}`);

        const recentContext = messages
          .slice(-4)
          .map((m) => `${m.sender === 'user' ? 'Estudiante' : 'Tutor'}: ${m.text.slice(0, 200)}`)
          .join('\n');

        const res = await fetch('/api/tutor/mindmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: targetTopic,
            subject: SUBJECT_METADATA[activeSession?.subject || profile.currentSubject]?.name || profile.currentSubject,
            grade: profile.grade,
            currentContext: recentContext,
            autoModelSwitch: modelSettings.autoModelSwitch,
            preferredModel: modelSettings.preferredModel,
          }),
        });

        if (!res.ok) throw new Error('Error al generar mapa mental');
        const data = await res.json();

        setCurrentTopic(data.mindMap?.topic || targetTopic);

        const tutorMsg: ChatMessage = {
          id: `tutor-${Date.now()}`,
          sender: 'tutor',
          text: `He generado un **mapa mental interactivo** sobre **${data.mindMap?.topic || targetTopic}**. Puedes explorarlo en vista radial, cambiar a esquema o descargarlo.`,
          timestamp: new Date().toISOString(),
          mindMap: data.mindMap,
          highlightedConcept: data.mindMap?.topic || targetTopic,
          suggestedQuestions: [
            `¿Puedes explicarme más sobre las ramas de este mapa?`,
            `¿Cómo se relaciona este tema con mi vida diaria?`,
            `Hazme una pregunta de comprobación`,
          ],
        };

        setMessages((prev) => [...prev, tutorMsg]);
        announce(`Mapa mental sobre ${targetTopic} generado exitosamente.`);
        return;
      }

      if (wantsVisual) {
        const targetPrompt = extractTargetTopic(query, activeCurrentTopic);
        announce(`Generando foto y esquema explicativo sobre ${targetPrompt}`);

        const recentContext = messages
          .slice(-4)
          .map((m) => `${m.sender === 'user' ? 'Estudiante' : 'Tutor'}: ${m.text.slice(0, 200)}`)
          .join('\n');

        const res = await fetch('/api/tutor/generate-visual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: targetPrompt,
            topic: targetPrompt,
            subject: SUBJECT_METADATA[activeSession?.subject || profile.currentSubject]?.name || profile.currentSubject,
            grade: profile.grade,
            currentContext: recentContext,
            autoModelSwitch: modelSettings.autoModelSwitch,
            preferredModel: modelSettings.preferredModel,
          }),
        });

        if (!res.ok) throw new Error('Error al generar ilustración visual');
        const data = await res.json();

        setCurrentTopic(data.visual?.title || targetPrompt);

        const tutorMsg: ChatMessage = {
          id: `tutor-${Date.now()}`,
          sender: 'tutor',
          text: `He preparado una **foto e ilustración didáctica con esquema visual** sobre **${data.visual?.title || targetPrompt}**. He organizado los elementos clave y los pasos para comprenderlo con claridad.`,
          timestamp: new Date().toISOString(),
          visualIllustration: data.visual,
          highlightedConcept: data.visual?.title || targetPrompt,
          suggestedQuestions: [
            'Explícame paso a paso este esquema',
            '¿Qué parte o fórmula es la más importante?',
            'Ponme un ejercicio práctico sobre esto',
          ],
        };

        setMessages((prev) => [...prev, tutorMsg]);
        announce(`Ilustración explicativa lista.`);
        return;
      }

      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query || 'Analiza el contenido o ejercicio de la imagen adjunta.',
          image: imagePayload,
          chatHistory: cleanHistory,
          studentProfile: profile,
          memoryTopics: memories,
          currentTopic: activeCurrentTopic,
          autoModelSwitch: modelSettings.autoModelSwitch,
          preferredModel: modelSettings.preferredModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Código de error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.highlightedConcept && data.highlightedConcept.trim()) {
        setCurrentTopic(data.highlightedConcept.trim());
      } else if (data.memoryUpdate?.topicTitle) {
        setCurrentTopic(data.memoryUpdate.topicTitle.trim());
      }

      const cleanedText = cleanTutorResponseText(data.responseText, isProg);

      const tutorMsg: ChatMessage = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        text: cleanedText,
        timestamp: new Date().toISOString(),
        suggestedQuestions: Array.isArray(data.suggestedQuestions) ? data.suggestedQuestions.slice(0, 3) : [],
        highlightedConcept: data.highlightedConcept,
        mindMap: data.mindMap,
        visualIllustration: data.visualIllustration,
        memoryUpdate: data.memoryUpdate,
        isError: data.isError || false,
        canRetry: data.canRetry || false,
        lastQuery: data.canRetry ? { text: query, attachment } : undefined,
        usedModel: data.usedModel,
        tokenUsage: data.tokenUsage,
      };

      setMessages((prev) => [...prev, tutorMsg]);

      // If tutor returned a memory update, integrate it into student's memory notebook!
      if (data.memoryUpdate && data.memoryUpdate.shouldUpdate && data.memoryUpdate.topicTitle) {
        const title = formatTopicTitle(data.memoryUpdate.topicTitle);
        setMemories((prev) => {
          const existingIndex = prev.findIndex(
            (m) => m.topicTitle.toLowerCase() === title.toLowerCase()
          );

          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              lastStudied: new Date().toISOString(),
              summary: data.memoryUpdate.summary || updated[existingIndex].summary,
              keyConcepts: Array.from(
                new Set([...updated[existingIndex].keyConcepts, ...(data.memoryUpdate.keyConceptsLearned || [])])
              ),
              masteryLevel: data.memoryUpdate.suggestedMastery || updated[existingIndex].masteryLevel,
            };
            return updated;
          } else {
            const newMem: TopicMemory = {
              id: `mem-${Date.now()}`,
              subject: profile.currentSubject,
              subjectDisplayName: SUBJECT_METADATA[profile.currentSubject]?.name || profile.currentSubject,
              topicTitle: title,
              summary: data.memoryUpdate.summary || 'Tema aprendido en la sesión con el tutor.',
              keyConcepts: data.memoryUpdate.keyConceptsLearned || [],
              masteryLevel: data.memoryUpdate.suggestedMastery || 'iniciado',
              lastStudied: new Date().toISOString(),
              connections: [],
              notes: 'Actualizado automáticamente por S.A.R.A tras la sesión de estudio.',
            };
            return [newMem, ...prev];
          }
        });

        announce(`Concepto "${title}" añadido o actualizado en tu memoria.`);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'tutor',
        text: 'Ocurrió una dificultad al conectar con el servicio pedagógico. Puedes pulsar en Reintentar para volver a enviar tu consulta.',
        timestamp: new Date().toISOString(),
        isError: true,
        canRetry: true,
        lastQuery: { text: query, attachment },
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleRetryMessage = (failedMsg: ChatMessage) => {
    if (failedMsg.lastQuery) {
      handleSendMessage(failedMsg.lastQuery.text, failedMsg.lastQuery.attachment);
    } else {
      const lastUser = [...messages].reverse().find((m) => m.sender === 'user');
      if (lastUser) {
        handleSendMessage(lastUser.text, lastUser.attachment);
      }
    }
  };

  // Generate Quiz for topic
  const handleGenerateQuiz = async (topicTitle: string) => {
    setQuizTopic(topicTitle);
    setIsQuizOpen(true);
    setIsQuizLoading(true);
    setQuizQuestions([]);
    announce(`Generando quiz diagnóstico para ${topicTitle}`);

    try {
      const res = await fetch('/api/tutor/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicTitle,
          subject: SUBJECT_METADATA[profile.currentSubject]?.name || profile.currentSubject,
          grade: profile.grade,
          learningStyle: profile.learningStyle,
          autoModelSwitch: modelSettings.autoModelSwitch,
          preferredModel: modelSettings.preferredModel,
        }),
      });

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuizQuestions(data.questions);
        announce(`Quiz listo con ${data.questions.length} preguntas.`);
      } else {
        announce('No se pudieron generar preguntas para este tema.');
      }
    } catch (e) {
      console.error('Quiz error:', e);
      announce('Error al generar el quiz.');
    } finally {
      setIsQuizLoading(false);
    }
  };

  // Quiz completion updates mastery
  const handleQuizCompleted = (topic: string, score: number, total: number) => {
    const isMastered = score >= total * 0.8;
    const isProgress = score >= total * 0.5;

    // Update weekly quests: Maestro del Quiz
    updateWeeklyQuests(
      (prev) => ({
        ...prev,
        quizzesCompletedCount: (prev.quizzesCompletedCount || 0) + 1,
      }),
      { title: 'Maestro del Quiz', halfMilestone: 1, fullMilestone: 2 }
    );

    setMemories((prev) => {
      const existing = prev.find((m) => m.topicTitle.toLowerCase() === topic.toLowerCase());
      if (existing) {
        return prev.map((m) => {
          if (m.id === existing.id) {
            return {
              ...m,
              masteryLevel: isMastered ? 'dominado' : isProgress ? 'en_progreso' : m.masteryLevel,
              lastStudied: new Date().toISOString(),
              notes: `Quiz completado con ${score}/${total}. ${m.notes || ''}`,
            };
          }
          return m;
        });
      }
      return prev;
    });
  };

  // Generate Flashcards
  const handleGenerateFlashcards = async (topicTitle: string) => {
    setFlashcardsTopic(topicTitle);
    setIsFlashcardsOpen(true);
    setIsFlashcardsLoading(true);
    setFlashcards([]);
    announce(`Generando tarjetas de memoria activa para ${topicTitle}`);

    // Update weekly quests: Explorador de Conceptos
    updateWeeklyQuests(
      (prev) => ({
        ...prev,
        conceptMapsOrSummariesCount: (prev.conceptMapsOrSummariesCount || 0) + 1,
      }),
      { title: 'Explorador de Conceptos', halfMilestone: 1, fullMilestone: 2 }
    );

    try {
      const res = await fetch('/api/tutor/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicTitle,
          subject: SUBJECT_METADATA[profile.currentSubject]?.name || profile.currentSubject,
          grade: profile.grade,
          autoModelSwitch: modelSettings.autoModelSwitch,
          preferredModel: modelSettings.preferredModel,
        }),
      });

      const data = await res.json();
      if (data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards);
        announce(`Tarjetas listas. Se generaron ${data.flashcards.length} tarjetas.`);
      }
    } catch (e) {
      console.error('Flashcard error:', e);
    } finally {
      setIsFlashcardsLoading(false);
    }
  };

  // Resume topic from memory in chat
  const handleSelectTopicForChat = (topic: TopicMemory) => {
    setCurrentTopic(topic.topicTitle);
    setActiveTab('chat');
    handleSendMessage(`Tutor, me gustaría retomar y repasar el tema que tengo en mi memoria: "${topic.topicTitle}". ¿Puedes hacerme un resumen de lo principal y una pregunta para recordar?`);
    announce(`Cambiado a tutoría del tema ${topic.topicTitle}`);
  };

  // Add new topic manually
  const handleAddNewTopic = (newTopicData: Omit<TopicMemory, 'id'>) => {
    const cleanTitle = formatTopicTitle(newTopicData.topicTitle);
    const newTopic: TopicMemory = {
      ...newTopicData,
      topicTitle: cleanTitle,
      id: `mem-${Date.now()}`,
    };
    setMemories((prev) => [newTopic, ...prev]);

    // Update weekly quests: Investigador Académico
    updateWeeklyQuests(
      (prev) => ({
        ...prev,
        memoriesArchivedCount: (prev.memoriesArchivedCount || 0) + 1,
      }),
      { title: 'Investigador Académico', halfMilestone: 2, fullMilestone: 4 }
    );
  };

  // Update/rename topic title
  const handleUpdateTopicTitle = (id: string, newTitle: string) => {
    const clean = formatTopicTitle(newTitle);
    if (!clean) return;
    setMemories((prev) => prev.map((m) => (m.id === id ? { ...m, topicTitle: clean } : m)));
    setScheduledReviews((prev) => prev.map((r) => (r.topicId === id ? { ...r, topicTitle: clean } : r)));
    announce(`Tema renombrado a "${clean}".`);
  };

  // Delete topic
  const handleDeleteTopic = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    // Also clean up any scheduled reviews for this topic
    setScheduledReviews((prev) => prev.filter((r) => r.topicId !== id));
    announce('Tema eliminado de la memoria.');
  };

  // Scheduled Reviews Agenda handlers
  const handleScheduleReview = (
    topicId: string, 
    date: string, 
    time?: string, 
    notes?: string, 
    reminderEnabled: boolean = true
  ) => {
    const targetTopic = memories.find((m) => m.id === topicId);
    if (!targetTopic) return;

    // Update topic nextReviewDate
    setMemories((prev) => prev.map((m) => m.id === topicId ? { ...m, nextReviewDate: date } : m));

    // Upsert into scheduledReviews
    setScheduledReviews((prev) => {
      const existingIdx = prev.findIndex((r) => r.topicId === topicId && !r.completed);
      const newReviewItem: ReviewScheduleItem = {
        id: existingIdx >= 0 ? prev[existingIdx].id : `review-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        topicId,
        topicTitle: targetTopic.topicTitle,
        subject: targetTopic.subject,
        subjectDisplayName: targetTopic.subjectDisplayName,
        scheduledDate: date,
        scheduledTime: time,
        reminderEnabled,
        createdAt: new Date().toISOString(),
        completed: false,
        notes,
      };

      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = newReviewItem;
        return next;
      }
      return [newReviewItem, ...prev];
    });
  };

  const handleToggleCompleteReview = (reviewId: string) => {
    setScheduledReviews((prev) => 
      prev.map((r) => r.id === reviewId ? { ...r, completed: !r.completed } : r)
    );
  };

  const handleToggleReminder = (reviewId: string) => {
    setScheduledReviews((prev) => 
      prev.map((r) => r.id === reviewId ? { ...r, reminderEnabled: r.reminderEnabled === false ? true : false } : r)
    );
    const item = scheduledReviews.find((r) => r.id === reviewId);
    const nextState = item?.reminderEnabled === false;
    announce(nextState ? 'Recordatorio móvil activado para este tema' : 'Recordatorio móvil desactivado');
  };

  const handleDeleteScheduledReview = (reviewId: string) => {
    setScheduledReviews((prev) => prev.filter((r) => r.id !== reviewId));
  };

  // Generate Interactive Mind Map
  const handleGenerateMindMap = async (customTopic?: string) => {
    const topicToUse = (customTopic || getEffectiveActiveTopic()).trim();
    setIsChatLoading(true);
    announce(`Generando mapa mental sobre ${topicToUse}`);

    // Update weekly quests: Explorador de Conceptos
    updateWeeklyQuests(
      (prev) => ({
        ...prev,
        conceptMapsOrSummariesCount: (prev.conceptMapsOrSummariesCount || 0) + 1,
      }),
      { title: 'Explorador de Conceptos', halfMilestone: 1, fullMilestone: 2 }
    );

    // Add user prompt to chat
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: `🧠 Genera un mapa mental interactivo sobre: ${topicToUse}`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const recentContext = messages
        .slice(-4)
        .map((m) => `${m.sender === 'user' ? 'Estudiante' : 'Tutor'}: ${m.text.slice(0, 200)}`)
        .join('\n');

      const res = await fetch('/api/tutor/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicToUse,
          subject: SUBJECT_METADATA[activeSession?.subject || profile.currentSubject]?.name || profile.currentSubject,
          grade: profile.grade,
          currentContext: recentContext,
          autoModelSwitch: modelSettings.autoModelSwitch,
          preferredModel: modelSettings.preferredModel,
        }),
      });

      if (!res.ok) throw new Error('Error al generar mapa mental');
      const data = await res.json();

      const tutorMsg: ChatMessage = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        text: `Aquí tienes el **mapa mental interactivo** sobre **${data.mindMap?.topic || topicToUse}**. Puedes explorarlo en vista radial, cambiar a esquema o descargarlo.`,
        timestamp: new Date().toISOString(),
        mindMap: data.mindMap,
        highlightedConcept: data.mindMap?.topic || topicToUse,
        suggestedQuestions: [
          `¿Puedes explicarme más sobre el nodo principal?`,
          `¿Cómo se relaciona este tema con mi vida diaria?`,
          `Hazme una pregunta de comprobación`,
        ],
      };
      setMessages((prev) => [...prev, tutorMsg]);
      announce(`Mapa mental sobre ${topicToUse} generado exitosamente.`);
    } catch (err) {
      console.error('Mind map error:', err);
      const errorMsg: ChatMessage = {
        id: `tutor-err-${Date.now()}`,
        sender: 'tutor',
        text: 'Hubo una dificultad al generar el mapa mental interactivo. Por favor pulsa reintentar.',
        timestamp: new Date().toISOString(),
        isError: true,
        canRetry: true,
        lastQuery: { text: `Genera un mapa mental sobre: ${topicToUse}` },
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Generate Visual Illustration / Explanatory Diagram
  const handleGenerateVisual = async (customPrompt?: string) => {
    const promptToUse = (customPrompt || getEffectiveActiveTopic()).trim();
    setIsChatLoading(true);
    announce(`Generando foto y esquema didáctico sobre ${promptToUse}`);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: `🖼️ Genera una ilustración y esquema didáctico sobre: ${promptToUse}`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const recentContext = messages
        .slice(-4)
        .map((m) => `${m.sender === 'user' ? 'Estudiante' : 'Tutor'}: ${m.text.slice(0, 200)}`)
        .join('\n');

      const res = await fetch('/api/tutor/generate-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          topic: promptToUse,
          subject: SUBJECT_METADATA[activeSession?.subject || profile.currentSubject]?.name || profile.currentSubject,
          grade: profile.grade,
          currentContext: recentContext,
          autoModelSwitch: modelSettings.autoModelSwitch,
          preferredModel: modelSettings.preferredModel,
        }),
      });

      if (!res.ok) throw new Error('Error al generar ilustración visual');
      const data = await res.json();

      const tutorMsg: ChatMessage = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        text: `Aquí tienes la **ilustración y esquema explicativo** sobre **${data.visual?.title || promptToUse}**. He preparado los elementos clave y la secuencia de pasos para que lo comprendas visualmente.`,
        timestamp: new Date().toISOString(),
        visualIllustration: data.visual,
        highlightedConcept: data.visual?.title || promptToUse,
        suggestedQuestions: [
          'Explícame paso a paso este esquema',
          '¿Qué parte es la más importante?',
          'Ponme un ejercicio práctico sobre esto',
        ],
      };
      setMessages((prev) => [...prev, tutorMsg]);
      announce(`Ilustración explicativa lista.`);
    } catch (err) {
      console.error('Visual generator error:', err);
      const errorMsg: ChatMessage = {
        id: `tutor-err-${Date.now()}`,
        sender: 'tutor',
        text: 'Hubo una dificultad al generar el esquema visual. Por favor pulsa reintentar.',
        timestamp: new Date().toISOString(),
        isError: true,
        canRetry: true,
        lastQuery: { text: `Genera una ilustración y esquema didáctico sobre: ${promptToUse}` },
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Open topic connector
  const handleOpenConnector = (topicA?: TopicMemory) => {
    setConnectorDefaultTopicA(topicA);
    setIsConnectorOpen(true);
  };

  return (
    <div 
      id="app-root"
      className={`h-[100dvh] h-screen max-h-[100dvh] w-full max-w-full overflow-hidden flex flex-col ${
        accessibility.highContrast 
          ? 'bg-black text-yellow-300' 
          : 'bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100'
      }`}
    >
      {/* Invisible Screen Reader Announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        className="sr-only"
      >
        {screenReaderAnnouncement}
      </div>

      {/* Reading Guide Ruler if active */}
      <ReadingGuide enabled={accessibility.readingGuide} />

      {/* Real-time Celebration Toast Notification */}
      {celebrationToast && (
        <div 
          onClick={() => {
            setIsGamificationOpen(true);
            setCelebrationToast(null);
          }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[80] max-w-md w-[92vw] bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-500 rounded-2xl p-4 shadow-2xl flex items-center gap-3.5 cursor-pointer animate-in fade-in slide-in-from-top-4 duration-200 hover:scale-[1.02] transition"
          role="status"
          aria-live="polite"
        >
          <div className="p-3 bg-amber-100 dark:bg-amber-950/80 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
            {celebrationToast.type === 'achievement' ? (
              <Trophy className="w-6 h-6 animate-bounce" />
            ) : (
              <Sparkles className="w-6 h-6 animate-spin" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider uppercase text-amber-700 dark:text-amber-300">
                {celebrationToast.badge || '¡Novedad de Progreso!'}
              </span>
              {celebrationToast.xp && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                  +{celebrationToast.xp} XP
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {celebrationToast.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
              {celebrationToast.subtitle}
            </p>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCelebrationToast(null);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg shrink-0 cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentProfile={profile}
        accessibilitySettings={accessibility}
        currentUser={currentUser}
        onOpenGoogleAuth={() => setIsGoogleAuthModalOpen(true)}
        onOpenAccessibility={() => setIsAccessibilityOpen(true)}
        onOpenProfile={() => {
          setProfileModalTab('profile');
          setIsProfileOpen(true);
        }}
        onOpenModelManagement={() => {
          setProfileModalTab('models');
          setIsProfileOpen(true);
          announce('Abriendo panel de Gestión de Modelos y Tokens');
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        accountCount={accounts.length}
        onOpenTutorial={() => {
          setIsTutorialOpen(true);
          announce('Abriendo tutorial interactivo');
        }}
        onOpenCalculator={() => {
          setIsCalculatorOpen(true);
          announce('Abriendo calculadora interactiva');
        }}
        onToggleHighContrast={() => {
          const next = !accessibility.highContrast;
          setAccessibility((prev) => ({ ...prev, highContrast: next }));
          announce(next ? 'Alto contraste activado' : 'Alto contraste desactivado');
        }}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        memoryCount={memories.length}
        dueReviewsCount={scheduledReviews.filter((r) => !r.completed && r.scheduledDate <= new Date().toISOString().split('T')[0]).length}
        onOpenBlindSpots={() => {
          setIsBlindSpotsOpen(true);
          announce('Abriendo detector de puntos ciegos');
        }}
        onOpenGamification={() => {
          setIsGamificationOpen(true);
          announce('Abriendo panel de ludificación, puntos y logros');
        }}
        onOpenInteractiveReader={() => {
          setIsInteractiveReaderOpen(true);
          unlockAchievement('ach-4', 'Explorador de Libros');
          announce('Abriendo asistente de lectura interactiva para libros de texto');
        }}
        onOpenFormatConverter={() => {
          setIsFormatConverterOpen(true);
          unlockAchievement('ach-5', 'Transcripción Pro');
          announce('Abriendo conversor de notas de voz y apuntes');
        }}
        onOpenDeveloperMode={() => {
          setIsDeveloperModeOpen(true);
          announce('Abriendo consola de Modo Desarrollador');
        }}
        onReplayStartup={() => {
          setShowStartupSplash(true);
          announce('Reproduciendo animación de inicio de Studio IA');
        }}
        xp={xp}
        streak={streak}
      />

      {/* Visual Review Reminder Banner in Main Dashboard */}
      <ReviewReminderBanner
        scheduledReviews={scheduledReviews}
        memories={memories}
        onSelectTopicForChat={handleSelectTopicForChat}
        onOpenMemoryAgenda={() => {
          setActiveTab('memory');
          announce('Abriendo agenda de repaso en la memoria');
        }}
        onToggleCompleteReview={handleToggleCompleteReview}
      />

      {/* Main Content Area */}
      <main 
        id="main-content-area" 
        className={`flex-1 w-full mx-auto flex flex-col min-w-0 min-h-0 ${
          activeTab === 'chat' 
            ? 'h-full max-h-full overflow-hidden p-0 sm:p-3 md:p-5 max-w-7xl' 
            : 'h-full max-h-full overflow-y-auto overscroll-y-contain touch-pan-y p-2 sm:p-6 pb-6 max-w-7xl'
        }`}
      >
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col h-full min-h-0 w-full min-w-0">
            <ChatArea
              messages={messages}
              studentProfile={profile}
              currentTopic={getEffectiveActiveTopic()}
              chatSessions={chatSessions}
              activeSessionId={activeSessionId}
              currentUser={currentUser}
              onOpenGoogleAuth={() => setIsGoogleAuthModalOpen(true)}
              onSendMessage={handleSendMessage}
              onNewChat={handleNewChat}
              onSwitchChat={handleSwitchChat}
              onDeleteChat={handleDeleteChat}
              onRenameChat={handleRenameChat}
              onRetryMessage={handleRetryMessage}
              isLoading={isChatLoading}
              accessibilitySettings={accessibility}
              isDarkMode={isDarkMode}
              onOpenProfile={() => {
                setProfileModalTab('profile');
                setIsProfileOpen(true);
              }}
              onOpenModelManagement={() => {
                setProfileModalTab('models');
                setIsProfileOpen(true);
                announce('Abriendo panel de Gestión de Modelos y Tokens');
              }}
              onSelectSubject={handleSelectSubject}
              onOpenMemory={() => setActiveTab('memory')}
              onGenerateQuiz={handleGenerateQuiz}
              onGenerateFlashcards={handleGenerateFlashcards}
              onGenerateMindMap={handleGenerateMindMap}
              onGenerateVisual={handleGenerateVisual}
              onAnnounce={announce}
              onReplayStartup={() => {
                setShowStartupSplash(true);
                announce('Reproduciendo animación de inicio de Studio IA');
              }}
              isTokenLimitExceeded={isTokenLimitExceeded}
              enableTokenLimit={!!modelSettings.enableTokenLimit}
              maxTokensLimit={modelSettings.maxTokensPerSession || 10000}
              sessionTotalTokens={sessionTokenStats.totalTokens}
            />
          </div>
        ) : (
          <MemoryPanel
            memories={memories}
            scheduledReviews={scheduledReviews}
            onScheduleReview={handleScheduleReview}
            onToggleCompleteReview={handleToggleCompleteReview}
            onToggleReminder={handleToggleReminder}
            onDeleteScheduledReview={handleDeleteScheduledReview}
            onSelectTopicForChat={handleSelectTopicForChat}
            onGenerateQuizForTopic={(t) => handleGenerateQuiz(t.topicTitle)}
            onGenerateFlashcardsForTopic={(t) => handleGenerateFlashcards(t.topicTitle)}
            onOpenExamMode={handleOpenExamMode}
            onOpenConnector={handleOpenConnector}
            onAddNewTopic={handleAddNewTopic}
            onUpdateTopicTitle={handleUpdateTopicTitle}
            onDeleteTopic={handleDeleteTopic}
            onAnnounce={announce}
          />
        )}
      </main>

      {/* User Profiles & Multi-Account Switcher Modal */}
      <AuthProfilesModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        accounts={accounts}
        currentAccountId={activeAccountId}
        currentUser={currentUser}
        onGoogleSignInSuccess={handleGoogleSignInSuccess}
        onGoogleSignOut={handleGoogleSignOut}
        onSelectAccount={handleSelectAccount}
        onCreateAccount={handleCreateAccount}
        onDeleteAccount={handleDeleteAccount}
        onAnnounce={announce}
        onOpenProfileSettings={() => setIsProfileOpen(true)}
      />

      {/* Dedicated Google Account Modal */}
      <AuthModal
        isOpen={isGoogleAuthModalOpen}
        onClose={() => setIsGoogleAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleGoogleSignInSuccess}
        onLogoutSuccess={handleGoogleSignOut}
        onAnnounce={announce}
      />

      {/* Accessibility Toolbar Modal */}
      <AccessibilityToolbar
        settings={accessibility}
        onUpdateSettings={(newSettings) => setAccessibility((prev) => ({ ...prev, ...newSettings }))}
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
        onAnnounce={announce}
      />

      {/* Student Profile Settings & Model Management Modal */}
      <StudentProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSaveProfile={(newProf) => {
          setProfile(newProf);
          announce('Perfil pedagógico actualizado con éxito.');
        }}
        onAnnounce={announce}
        modelSettings={modelSettings}
        onUpdateModelSettings={handleUpdateModelSettings}
        sessionStats={sessionTokenStats}
        currentActiveModel={activeAiModel}
        initialTab={profileModalTab}
        onResetSessionTokens={handleResetSessionTokens}
      />

      {/* Quiz Modal */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        topicTitle={quizTopic}
        questions={quizQuestions}
        isLoading={isQuizLoading}
        onQuizCompleted={handleQuizCompleted}
        onAnnounce={announce}
        onRecordMistake={handleRecordMistake}
        subject={profile.currentSubject}
      />

      {/* Blind Spots & Targeted Reviews Modal */}
      <BlindSpotsModal
        isOpen={isBlindSpotsOpen}
        onClose={() => setIsBlindSpotsOpen(false)}
        mistakes={studentMistakes}
        profile={profile}
        onAnnounce={announce}
        onAskTutorWithPrompt={(promptText) => {
          setIsBlindSpotsOpen(false);
          setActiveTab('chat');
          handleSendMessage(promptText);
        }}
      />

      {/* Flashcards Modal */}
      <FlashcardsModal
        isOpen={isFlashcardsOpen}
        onClose={() => setIsFlashcardsOpen(false)}
        topicTitle={flashcardsTopic}
        flashcards={flashcards}
        isLoading={isFlashcardsLoading}
        onAnnounce={announce}
      />

      {/* Exam Mode Modal */}
      <ExamModeModal
        isOpen={isExamModeOpen}
        onClose={() => setIsExamModeOpen(false)}
        topicTitle={examModeTopic?.topicTitle || 'Tema de Estudio'}
        subjectName={examModeTopic?.subjectDisplayName || SUBJECT_METADATA[examModeTopic?.subject || 'ciencias']?.name || 'General'}
        initialMemory={examModeTopic || undefined}
        onAnnounce={announce}
      />

      {/* Topic Connector Modal */}
      <TopicConnectorModal
        isOpen={isConnectorOpen}
        onClose={() => setIsConnectorOpen(false)}
        memories={memories}
        defaultTopicA={connectorDefaultTopicA}
        studentGrade={profile.grade}
        onAnnounce={announce}
      />

      {/* Gamification Modal */}
      <GamificationModal
        isOpen={isGamificationOpen}
        onClose={() => setIsGamificationOpen(false)}
        xp={xp}
        streak={streak}
        level={level}
        achievements={achievements}
        weeklyQuests={weeklyQuests}
        memories={memories}
        chatSessions={chatSessions}
        onClaimQuestReward={handleClaimQuestReward}
        onAnnounce={announce}
      />

      {/* Interactive Textbook Reader Modal */}
      <InteractiveReaderModal
        isOpen={isInteractiveReaderOpen}
        onClose={() => setIsInteractiveReaderOpen(false)}
        onAnnounce={announce}
      />

      {/* Format Converter Modal */}
      <FormatConverterModal
        isOpen={isFormatConverterOpen}
        onClose={() => setIsFormatConverterOpen(false)}
        profile={profile}
        onAnnounce={announce}
        onOpenMindMapFromConversion={(mindMapData) => {
          // Open mind map or inject into chat/memory
          updateWeeklyQuests(
            (prev) => ({
              ...prev,
              conceptMapsOrSummariesCount: (prev.conceptMapsOrSummariesCount || 0) + 1,
            }),
            { title: 'Explorador de Conceptos', halfMilestone: 1, fullMilestone: 2 }
          );
          setActiveTab('chat');
          handleSendMessage(`Aquí está el mapa conceptual generado a partir de mis apuntes: ${mindMapData.topic}`);
        }}
      />

      {/* Developer Mode Modal */}
      <DeveloperModeModal
        isOpen={isDeveloperModeOpen}
        onClose={() => setIsDeveloperModeOpen(false)}
        profile={profile}
        onUpdateProfile={(newProf) => {
          setProfile(newProf);
          announce('Perfil pedagógico actualizado desde Modo Desarrollador');
        }}
        xp={xp}
        onUpdateXp={(newXp) => setXp(newXp)}
        streak={streak}
        onUpdateStreak={(newStreak) => setStreak(newStreak)}
        memories={memories}
        mistakes={studentMistakes}
        onAnnounce={announce}
        onResetData={() => {
          localStorage.clear();
          window.location.reload();
        }}
      />

      {/* Interactive Onboarding Tutorial Modal for New & Returning Users */}
      <InteractiveTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onAnnounce={announce}
      />

      {/* Interactive Calculator Modal */}
      <InteractiveCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* Offline Status Indicator */}
      <OfflineIndicator />

      {/* Realtime FPS & Performance Debug Overlay */}
      {isDebugOverlayActive && (
        <DebugOverlay
          onClose={() => {
            localStorage.setItem('sara_debug_overlay', 'false');
            setIsDebugOverlayActive(false);
          }}
        />
      )}

      {/* Startup Intro Animation Splash Screen */}
      <StartupSplashScreen
        isOpen={showStartupSplash}
        onClose={() => setShowStartupSplash(false)}
        studentName={profile.name}
        subjectName={SUBJECT_METADATA[profile.currentSubject]?.name?.split('/')[0]?.trim()}
      />
    </div>
  );
}
