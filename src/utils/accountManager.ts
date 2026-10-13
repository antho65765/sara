import { UserAccount, StudentProfile, TopicMemory, ChatMessage, ChatSession, SubjectKey, ReviewScheduleItem } from '../types';
import { INITIAL_STUDENT_PROFILE, INITIAL_TOPIC_MEMORIES, SUBJECT_METADATA } from '../data/pedagogicalConfig';
import { cleanTutorResponseText, formatTopicTitle } from './textSanitizer';

const ACCOUNTS_STORAGE_KEY = 'sara_user_accounts_v1';
const ACTIVE_ACCOUNT_KEY = 'sara_active_account_id_v1';

export function createWelcomeMessage(profile: StudentProfile): ChatMessage {
  const subjectName = SUBJECT_METADATA[profile.currentSubject]?.name || 'Ciencias';
  return {
    id: `welcome-${Date.now()}`,
    sender: 'tutor',
    text: `¡Hola ${profile.name}! Soy **S.A.R.A**, tu tutora pedagógica personal.
He adaptado el contenido a tu nivel (**${profile.grade}**) y materia (**${subjectName}**).

¿Qué tema, ejercicio o duda te gustaría que abordemos hoy? También puedes subir una foto o captura con tu pregunta.`,
    timestamp: new Date().toISOString(),
    suggestedQuestions: [
      '¿Cómo se relaciona la respiración celular con la fotosíntesis?',
      'Explícame un ejercicio paso a paso',
      'Hazme un quiz de repaso de mis temas anteriores',
    ],
    highlightedConcept: 'Bienvenida pedagógica',
  };
}

export function createNewSession(profile: StudentProfile, title?: string, subject?: SubjectKey): ChatSession {
  const effectiveSubject = subject || profile.currentSubject || 'ciencias';
  const subjectName = SUBJECT_METADATA[effectiveSubject]?.name || 'Estudio';
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: title || `Consulta sobre ${subjectName}`,
    subject: effectiveSubject,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [createWelcomeMessage(profile)],
  };
}

export function loadSavedAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed: UserAccount[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((acc) => {
          const isProg = acc.profile?.currentSubject === 'programacion';
          
          // Ensure chatSessions exists and has migrated messages
          let sessions: ChatSession[] = Array.isArray(acc.chatSessions) ? acc.chatSessions : [];
          
          if (sessions.length === 0) {
            // Migrate legacy chatHistory into a default session
            const legacyMessages = (acc.chatHistory || []).map((msg) => ({
              ...msg,
              text: msg.sender === 'tutor' ? cleanTutorResponseText(msg.text, isProg) : msg.text,
            }));

            const defaultSession: ChatSession = {
              id: `session-migrated-${acc.id}`,
              title: `Conversación Principal (${SUBJECT_METADATA[acc.profile?.currentSubject || 'ciencias']?.name || 'General'})`,
              subject: acc.profile?.currentSubject || 'ciencias',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              messages: legacyMessages.length > 0 ? legacyMessages : [createWelcomeMessage(acc.profile)],
            };
            sessions = [defaultSession];
          } else {
            // Sanitize messages in all sessions
            sessions = sessions.map((s) => ({
              ...s,
              messages: (s.messages || []).map((msg) => ({
                ...msg,
                text: msg.sender === 'tutor' ? cleanTutorResponseText(msg.text, isProg) : msg.text,
              })),
            }));
          }

          const activeSessionId = acc.activeSessionId && sessions.some((s) => s.id === acc.activeSessionId)
            ? acc.activeSessionId
            : sessions[0].id;

          const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

          // Migrate legacy default name 'Alex' to 'Invitado'
          const profile = acc.profile || INITIAL_STUDENT_PROFILE;
          const isLegacyAlex = profile.name === 'Alex' && (acc.username === 'Alex' || acc.id.startsWith('acc-default'));
          let cleanProfile = isLegacyAlex ? { ...profile, name: 'Invitado' } : { ...profile };
          const cleanUsername = isLegacyAlex ? 'Invitado' : (acc.username || cleanProfile.name || 'Invitado');

          // Ensure avatar is not a raw URL string (if so, save to photoURL and reset avatar to clean emoji)
          let photoURL = acc.photoURL;
          if (cleanProfile.avatar && cleanProfile.avatar.startsWith('http')) {
            photoURL = photoURL || cleanProfile.avatar;
            cleanProfile.avatar = '🎓';
          }

          const todayStr = new Date().toISOString().split('T')[0];
          
          // Sanitize and format all topic memories to ensure concise, non-truncated titles
          const cleanMemories: TopicMemory[] = Array.isArray(acc.memories)
            ? acc.memories.map((m) => ({
                ...m,
                topicTitle: formatTopicTitle(m.topicTitle),
              }))
            : [];

          let userReviews: ReviewScheduleItem[] = Array.isArray(acc.scheduledReviews)
            ? acc.scheduledReviews.map((r) => ({
                ...r,
                topicTitle: formatTopicTitle(r.topicTitle),
              }))
            : [];

          if (userReviews.length === 0 && cleanMemories.length > 1) {
            userReviews = [
              {
                id: `review-seed-${acc.id}`,
                topicId: cleanMemories[1].id,
                topicTitle: cleanMemories[1].topicTitle,
                subject: cleanMemories[1].subject,
                subjectDisplayName: cleanMemories[1].subjectDisplayName,
                scheduledDate: todayStr,
                createdAt: new Date().toISOString(),
                completed: false,
                notes: 'Revisar conceptos clave y realizar ejercicio de fijación',
              }
            ];
          }

          return {
            ...acc,
            photoURL,
            username: cleanUsername,
            profile: cleanProfile,
            memories: cleanMemories,
            chatSessions: sessions,
            activeSessionId,
            chatHistory: currentSession.messages,
            scheduledReviews: userReviews,
          };
        });
      }
    }
  } catch (e) {
    console.warn('Error reading accounts from localStorage:', e);
  }

  // Fallback: migrate any old single-profile data from earlier version
  let initialProfile = INITIAL_STUDENT_PROFILE;
  try {
    const oldProf = localStorage.getItem('tutoria_profile');
    if (oldProf) {
      initialProfile = JSON.parse(oldProf);
      if (initialProfile.name === 'Alex') {
        initialProfile.name = 'Invitado';
      }
    }
  } catch {}

  let initialMemories = INITIAL_TOPIC_MEMORIES;
  try {
    const oldMem = localStorage.getItem('tutoria_memories');
    if (oldMem) initialMemories = JSON.parse(oldMem);
  } catch {}

  const initialWelcomeMsg = createWelcomeMessage(initialProfile);
  const initialSession: ChatSession = {
    id: `session-init-1`,
    title: `Conversación de ${SUBJECT_METADATA[initialProfile.currentSubject]?.name || 'Ciencias'}`,
    subject: initialProfile.currentSubject,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [initialWelcomeMsg],
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultAccount: UserAccount = {
    id: 'acc-default-1',
    username: initialProfile.name || 'Invitado',
    profile: {
      ...initialProfile,
      name: initialProfile.name || 'Invitado',
      avatar: '🎓',
    },
    memories: initialMemories,
    chatSessions: [initialSession],
    activeSessionId: initialSession.id,
    chatHistory: [initialWelcomeMsg],
    scheduledReviews: [
      {
        id: 'review-init-1',
        topicId: 'mem-2',
        topicTitle: 'Ecuaciones de Primer Grado',
        subject: 'matematicas',
        subjectDisplayName: 'Matemáticas',
        scheduledDate: todayStr,
        createdAt: new Date().toISOString(),
        completed: false,
        notes: 'Reforzar cambio de signo al transponer términos y regla de la balanza',
      },
    ],
    lastActive: new Date().toISOString(),
  };

  saveAccounts([defaultAccount]);
  saveActiveAccountId(defaultAccount.id);
  return [defaultAccount];
}

export function saveAccounts(accounts: UserAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Error saving accounts to localStorage:', e);
  }
}

export function loadActiveAccountId(accounts: UserAccount[]): string {
  try {
    const active = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
    if (active && accounts.some((a) => a.id === active)) {
      return active;
    }
  } catch {}
  return accounts[0]?.id || '';
}

export function saveActiveAccountId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, id);
  } catch {}
}
