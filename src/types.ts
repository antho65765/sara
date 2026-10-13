export type StudentGrade = 
  | 'primaria' 
  | 'secundaria' 
  | 'bachillerato' 
  | 'universidad' 
  | 'autodidacta';

export type LearningStyle = 
  | 'visual' 
  | 'practico' 
  | 'teorico' 
  | 'socratico' 
  | 'feynman';

export type SubjectKey = 
  | 'matematicas' 
  | 'ciencias' 
  | 'historia' 
  | 'lengua' 
  | 'filosofia' 
  | 'programacion' 
  | 'idiomas' 
  | 'otro';

export interface StudentProfile {
  id?: string;
  name: string;
  grade: StudentGrade;
  learningStyle: LearningStyle;
  currentSubject: SubjectKey;
  customSubjectName?: string;
  interests?: string; // e.g. "fútbol, videojuegos, música" for contextual metaphors
  avatar?: string;
  createdAt?: string;
}

export interface ChatAttachment {
  type: 'image';
  url: string; // base64 data url for display
  name?: string;
  mimeType?: string;
  size?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  subject: SubjectKey;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface WeeklyQuestProgress {
  queriesCount: number; // Misión 1
  conceptMapsOrSummariesCount: number; // Misión 2
  quizzesCompletedCount: number; // Misión 3
  memoriesArchivedCount: number; // Misión 4
  calculatorCount?: number;
  pomodoroCount?: number;
  flashcardsCount?: number;
  examCount?: number;
  blindSpotsCount?: number;
  readerCount?: number;
  claimedQuests?: string[]; // IDs de misiones reclamadas para no duplicar recompensa
  lastResetWeek?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  email?: string;
  photoURL?: string;
  isGoogleAccount?: boolean;
  googleUid?: string;
  pin?: string;
  profile: StudentProfile;
  memories: TopicMemory[];
  chatSessions?: ChatSession[];
  activeSessionId?: string;
  chatHistory?: ChatMessage[];
  scheduledReviews?: ReviewScheduleItem[];
  xp?: number;
  streak?: number;
  studentMistakes?: StudentMistake[];
  weeklyQuests?: WeeklyQuestProgress;
  unlockedAchievements?: string[];
  lastActive: string;
}

export type MasteryLevel = 'iniciado' | 'en_progreso' | 'dominado';

export interface ReviewScheduleItem {
  id: string;
  topicId: string;
  topicTitle: string;
  subject: SubjectKey;
  subjectDisplayName?: string;
  scheduledDate: string; // YYYY-MM-DD or ISO string
  scheduledTime?: string; // e.g. "16:00"
  notes?: string;
  completed?: boolean;
  reminderEnabled?: boolean; // Send mobile notification
  createdAt: string;
}

export interface TopicMemory {
  id: string;
  subject: SubjectKey;
  subjectDisplayName: string;
  topicTitle: string;
  summary: string;
  keyConcepts: string[];
  masteryLevel: MasteryLevel;
  lastStudied: string; // ISO date
  studyTimeMinutes?: number;
  connections?: string[]; // references to other topics
  notes?: string;
  nextReviewDate?: string; // YYYY-MM-DD next scheduled review
}

export interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  children?: MindMapNode[];
}

export interface MindMapData {
  topic: string;
  centralConcept: string;
  summary?: string;
  nodes: MindMapNode[];
}

export interface VisualIllustrationData {
  title: string;
  imageUrl?: string;
  caption: string;
  diagramType?: 'infographic' | 'mindmap' | 'photo' | 'schema';
  keyLabels?: { label: string; description: string }[];
  steps?: string[];
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: string;
  attachment?: ChatAttachment;
  suggestedQuestions?: string[];
  highlightedConcept?: string;
  mindMap?: MindMapData;
  visualIllustration?: VisualIllustrationData;
  isError?: boolean;
  canRetry?: boolean;
  lastQuery?: {
    text: string;
    attachment?: ChatAttachment;
  };
  memoryUpdate?: {
    topicTitle: string;
    keyConceptsLearned: string[];
    summary: string;
    suggestedMastery?: MasteryLevel;
  };
  usedModel?: string;
  tokenUsage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

export interface ModelManagementSettings {
  autoModelSwitch: boolean;
  preferredModel?: string;
  enableTokenLimit?: boolean;
  maxTokensPerSession?: number; // e.g. 5000, 10000, 25000, 50000, or custom
  tokenLimitResetTime?: string; // ISO string when user or system unlocks
}

export interface SessionTokenStats {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  messagesCount: number;
  estimatedCostUSD?: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  subject: SubjectKey;
  topic: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudentMistake {
  id: string;
  topic: string;
  subject: SubjectKey;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  explanation: string;
  timestamp: string;
}

export interface BlindSpotAnalysis {
  detectedBlindSpots: {
    concept: string;
    description: string;
    suggestedReviewTopic: string;
  }[];
  reviewTitle: string;
  microLesson: string;
  practiceQuestions: QuizQuestion[];
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AccessibilitySettings {
  themeMode?: ThemeMode;
  highContrast: boolean;
  dyslexicFont: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  readingGuide: boolean;
  lineSpacing: 'normal' | 'relaxed' | 'double';
  autoReadResponse: boolean;
  speechRate: number; // 0.8, 1.0, 1.2
  simplifiedView: boolean; // distraction-free focus mode
}
