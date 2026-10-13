import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  Lightbulb, 
  BookOpen, 
  HelpCircle, 
  Brain, 
  StopCircle,
  ImagePlus,
  Camera,
  Network,
  Layers,
  X,
  Plus,
  MessageSquare,
  ChevronDown,
  Trash2,
  Edit2,
  Check,
  ZoomIn,
  AlertCircle,
  RotateCcw,
  Timer,
  Lock,
  AlertTriangle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { 
  ChatMessage, 
  StudentProfile, 
  AccessibilitySettings, 
  ChatSession, 
  ChatAttachment,
  SubjectKey
} from '../types';
import { GRADE_LABELS, LEARNING_STYLE_LABELS, SUBJECT_METADATA } from '../data/pedagogicalConfig';
import { cleanTutorResponseText } from '../utils/textSanitizer';
import { CameraCaptureModal } from './CameraCaptureModal';
import { MindMapViewer } from './MindMapViewer';
import { VisualIllustrationViewer } from './VisualIllustrationViewer';
import { PomodoroTimer } from './PomodoroTimer';
import { SubjectPickerModal } from './SubjectPickerModal';
import { StartScreenHero } from './StartScreenHero';
import { User as FirebaseUser } from 'firebase/auth';

interface ChatAreaProps {
  messages: ChatMessage[];
  studentProfile: StudentProfile;
  currentTopic: string;
  chatSessions: ChatSession[];
  activeSessionId: string;
  onSendMessage: (text: string, attachment?: ChatAttachment) => Promise<void>;
  onNewChat: () => void;
  onSwitchChat: (sessionId: string) => void;
  onDeleteChat: (sessionId: string) => void;
  onRenameChat: (sessionId: string, newTitle: string) => void;
  onRetryMessage?: (message: ChatMessage) => void;
  isLoading: boolean;
  accessibilitySettings: AccessibilitySettings;
  isDarkMode?: boolean;
  onOpenProfile: () => void;
  onSelectSubject?: (subject: SubjectKey, customName?: string) => void;
  onOpenMemory: () => void;
  onGenerateQuiz: (topicTitle: string) => void;
  onGenerateFlashcards: (topicTitle: string) => void;
  onGenerateMindMap?: (topic?: string) => Promise<void>;
  onGenerateVisual?: (topic?: string) => Promise<void>;
  onAnnounce: (msg: string) => void;
  onReplayStartup?: () => void;
  currentUser?: FirebaseUser | null;
  onOpenGoogleAuth?: () => void;
  onOpenModelManagement?: () => void;
  isTokenLimitExceeded?: boolean;
  enableTokenLimit?: boolean;
  maxTokensLimit?: number;
  sessionTotalTokens?: number;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  studentProfile,
  currentTopic,
  chatSessions,
  activeSessionId,
  onSendMessage,
  onNewChat,
  onSwitchChat,
  onDeleteChat,
  onRenameChat,
  onRetryMessage,
  isLoading,
  accessibilitySettings,
  isDarkMode,
  onOpenProfile,
  onSelectSubject,
  onOpenMemory,
  onGenerateQuiz,
  onGenerateFlashcards,
  onGenerateMindMap,
  onGenerateVisual,
  onAnnounce,
  onReplayStartup,
  currentUser,
  onOpenGoogleAuth,
  onOpenModelManagement,
  isTokenLimitExceeded = false,
  enableTokenLimit = false,
  maxTokensLimit = 10000,
  sessionTotalTokens = 0,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [isSubjectPickerOpen, setIsSubjectPickerOpen] = useState(false);
  
  // Image attachment state (supports file upload & camera photo)
  const [attachedImage, setAttachedImage] = useState<{
    file?: File;
    previewUrl: string;
    name?: string;
  } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);

  // Chat sessions menu dropdown state
  const [isSessionsMenuOpen, setIsSessionsMenuOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');
  const [confirmDeleteSessionId, setConfirmDeleteSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const sessionMenuRef = useRef<HTMLDivElement>(null);
  const [dismissedTokenWarning, setDismissedTokenWarning] = useState<number | null>(null);

  // Clean reset of input, modals and attachments when active session changes or new chat is created
  useEffect(() => {
    setInputText('');
    setAttachedImage(null);
    setIsListening(false);
    setIsSessionsMenuOpen(false);
    setEditingSessionId(null);
    setConfirmDeleteSessionId(null);
    setZoomedImageUrl(null);
    setIsCameraOpen(false);
    setDismissedTokenWarning(null);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingId(null);
  }, [activeSessionId]);

  // Scroll to bottom on new message or image load without moving the entire window
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading, attachedImage]);

  // Close sessions menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sessionMenuRef.current && !sessionMenuRef.current.contains(e.target as Node)) {
        setIsSessionsMenuOpen(false);
        setEditingSessionId(null);
      }
    };
    if (isSessionsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSessionsMenuOpen]);

  // Handle Speech Recognition (Dictation)
  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'es-ES';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
        onAnnounce(`Voz reconocida: "${transcript}"`);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onAnnounce]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Tu navegador no soporta reconocimiento de voz nativo. Puedes escribir tu duda en el campo de texto.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        onAnnounce('Micrófono activado. Habla ahora tu pregunta para S.A.R.A.');
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  };

  // Image Selection Handler (via file input or drag-drop)
  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen (PNG, JPG, WEBP, etc.) con tu ejercicio o pregunta.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('La imagen seleccionada supera el límite máximo recomendado de 15 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setAttachedImage({
        file,
        previewUrl: dataUrl,
      });
      onAnnounce(`Imagen "${file.name}" adjuntada y lista para enviar a S.A.R.A.`);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
    // reset input value so re-selecting same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  // Text-To-Speech (Lectura en voz alta)
  const speakText = (text: string, messageId: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Tu navegador no soporta síntesis de voz.');
      return;
    }

    if (currentlySpeakingId === messageId) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Sanitize and remove markdown symbols and code fences for clean and pleasant TTS
    const isProg = studentProfile.currentSubject === 'programacion';
    const textToSpeak = cleanTutorResponseText(text, isProg);
    const cleanText = textToSpeak
      .replace(/[#*`_\[\]()]/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = accessibilitySettings.speechRate || 1.0;

    utterance.onend = () => {
      setCurrentlySpeakingId(null);
    };

    utterance.onerror = () => {
      setCurrentlySpeakingId(null);
    };

    setCurrentlySpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
    onAnnounce('Leyendo respuesta del tutor en voz alta.');
  };

  // Auto-read response if enabled
  useEffect(() => {
    if (accessibilitySettings.autoReadResponse && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'tutor') {
        speakText(lastMsg.text, lastMsg.id);
      }
    }
  }, [messages.length, accessibilitySettings.autoReadResponse]);

  const handleCameraCapture = (dataUrl: string, defaultPrompt?: string) => {
    setAttachedImage({
      previewUrl: dataUrl,
      name: `Foto_Camara_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.jpg`,
    });
    if (defaultPrompt) {
      setInputText(defaultPrompt);
    }
    setIsCameraOpen(false);
    onAnnounce('Foto tomada con la cámara y lista para enviar a S.A.R.A.');
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isTokenLimitExceeded) {
      onAnnounce(`Consultas bloqueadas temporalmente: has alcanzado el límite de ${new Intl.NumberFormat('es-ES').format(maxTokensLimit)} tokens por sesión.`);
      return;
    }
    const query = inputText.trim();
    if ((!query && !attachedImage) || isLoading) return;

    let attachmentToSend: ChatAttachment | undefined = undefined;
    if (attachedImage) {
      attachmentToSend = {
        type: 'image',
        url: attachedImage.previewUrl,
        name: attachedImage.name || attachedImage.file?.name || 'Foto tomada con la cámara',
        mimeType: attachedImage.file?.type || 'image/jpeg',
        size: attachedImage.file?.size || Math.round((attachedImage.previewUrl.length * 3) / 4),
      };
    }

    setInputText('');
    setAttachedImage(null);
    await onSendMessage(query, attachmentToSend);
  };

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitleText(session.title);
  };

  const handleSaveRename = (sessionId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingTitleText.trim()) {
      onRenameChat(sessionId, editingTitleText.trim());
      onAnnounce(`Título cambiado a "${editingTitleText.trim()}".`);
    }
    setEditingSessionId(null);
  };

  const currentSubjectInfo = SUBJECT_METADATA[studentProfile.currentSubject] || {
    name: 'General',
  };
  const currentGradeInfo = GRADE_LABELS[studentProfile.grade] || {
    title: studentProfile.grade,
  };
  const currentStyleInfo = LEARNING_STYLE_LABELS[studentProfile.learningStyle] || {
    title: studentProfile.learningStyle,
  };

  const currentActiveSession = chatSessions.find((s) => s.id === activeSessionId) || chatSessions[0] || {
    id: 'default',
    title: 'Conversación de Estudio',
  };

  const lineSpacingClass = {
    normal: 'leading-relaxed',
    relaxed: 'leading-loose',
    double: 'leading-loose space-y-4',
  }[accessibilitySettings.lineSpacing || 'normal'];

  return (
    <div 
      id="chat-area-container" 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col h-full flex-1 min-h-0 w-full max-w-full bg-white dark:bg-slate-900 rounded-2xl border ${
        isDraggingOver 
          ? 'border-blue-500 ring-4 ring-blue-500/20' 
          : 'border-slate-200 dark:border-slate-800'
      } shadow-xs overflow-hidden transition-all`}
    >
      {/* Visual Drag and Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-blue-600/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white pointer-events-none">
          <ImagePlus className="w-16 h-16 animate-bounce mb-3" />
          <h3 className="text-xl font-bold">Suelta tu imagen aquí</h3>
          <p className="text-sm opacity-90 mt-1">S.A.R.A la adjuntará a tu consulta para analizarla</p>
        </div>
      )}

      {/* Top Pedagogical & Session Navigation Banner */}
      <div 
        id="chat-top-navigation-banner"
        className="px-2 sm:px-4 py-2 border-b border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex items-center justify-between gap-1.5 sm:gap-2.5 shrink-0 z-20 w-full"
      >
        {/* Left Side: Studio IA Logo & Subject Title */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
          <button
            type="button"
            onClick={onReplayStartup}
            title="Ver animación de inicio Studio IA"
            className="w-8 h-8 rounded-lg overflow-hidden shadow-2xs border border-slate-200 dark:border-slate-700 bg-slate-900 shrink-0 hover:scale-105 transition-transform cursor-pointer"
          >
            <img
              src="/logo-studioia.jpg"
              alt="Logo Studio IA"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/Logo StudioIA.jpg';
              }}
            />
          </button>

          {/* Only Subject Title Badge - Opens dedicated subject changer box */}
          <button
            type="button"
            id="active-subject-badge-btn"
            onClick={() => setIsSubjectPickerOpen(true)}
            title="Hacer clic para cambiar de asignatura"
            className="h-8.5 px-1.5 sm:px-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1 text-xs sm:text-sm shadow-2xs shrink min-w-0 cursor-pointer"
          >
            <span className="shrink-0 text-xs sm:text-sm">📚</span>
            <span className="font-bold tracking-tight truncate max-w-[65px] xs:max-w-[100px] sm:max-w-[180px] md:max-w-[240px]">
              {studentProfile.currentSubject === 'otro' && studentProfile.customSubjectName 
                ? studentProfile.customSubjectName 
                : currentSubjectInfo.name.split('/')[0].trim()}
            </span>
          </button>
        </div>

        {/* Right Side: Exactly the 3 requested options: Temporizador, Nuevo Chat, and Chats creados */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          
          {/* Option 1: Temporizador Pomodoro 25m */}
          <button
            id="toggle-pomodoro-timer-btn"
            type="button"
            onClick={() => {
              const next = !isPomodoroOpen;
              setIsPomodoroOpen(next);
              onAnnounce(next ? 'Temporizador Pomodoro abierto' : 'Temporizador Pomodoro ocultado');
            }}
            title="Temporizador Pomodoro de 25 minutos"
            className={`h-8.5 px-1.5 sm:px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
              isPomodoroOpen
                ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 shadow-2xs'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Timer className={`w-3.5 h-3.5 shrink-0 ${isPomodoroOpen ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="hidden md:inline">Pomodoro</span>
            <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 shrink-0">25m</span>
          </button>

          {/* Option 2: Nuevo Chat */}
          <button
            id="new-chat-btn"
            type="button"
            onClick={() => {
              setIsSessionsMenuOpen(false);
              onNewChat();
              onAnnounce('Nuevo chat creado para iniciar otro tema.');
            }}
            title="Iniciar un nuevo chat para hablar de otro tema"
            className="h-8.5 px-2 sm:px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span className="hidden sm:inline">Nuevo Chat</span>
            <span className="sm:hidden">Nuevo</span>
          </button>

          {/* Option 3: Chats Creados Dropdown */}
          <div className="relative z-30 shrink-0" ref={sessionMenuRef}>
            <button
              id="chat-sessions-dropdown-btn"
              type="button"
              onClick={() => setIsSessionsMenuOpen((prev) => !prev)}
              title="Ver y cambiar entre tus conversaciones guardadas"
              className="h-8.5 px-2 sm:px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-medium text-xs">Chats</span>
              <span className="text-[10px] bg-slate-200/80 dark:bg-slate-700 px-1 py-0.2 rounded-full font-bold text-slate-600 dark:text-slate-300 shrink-0">
                {chatSessions.length}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${isSessionsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu of Sessions */}
            {isSessionsMenuOpen && (
              <div 
                id="chat-sessions-menu"
                className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      Tus Conversaciones ({chatSessions.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onNewChat();
                      setIsSessionsMenuOpen(false);
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Crear
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto py-1 space-y-1">
                  {chatSessions.map((session) => {
                    const isActive = session.id === activeSessionId;
                    const msgCount = session.messages?.length || 0;
                    const isEditing = editingSessionId === session.id;

                    return (
                      <div
                        key={session.id}
                        className={`group rounded-xl p-2.5 transition-all flex items-center justify-between gap-2 ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-900 dark:text-blue-100'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isEditing ? (
                          <form 
                            onSubmit={(e) => handleSaveRename(session.id, e)} 
                            className="flex items-center gap-1 w-full"
                          >
                            <input
                              type="text"
                              value={editingTitleText}
                              onChange={(e) => setEditingTitleText(e.target.value)}
                              autoFocus
                              className="w-full px-2 py-1 text-xs rounded-lg border border-blue-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-hidden"
                            />
                            <button
                              type="submit"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Guardar nombre"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSessionId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                onSwitchChat(session.id);
                                setIsSessionsMenuOpen(false);
                              }}
                              className="flex-1 text-left min-w-0"
                            >
                              <div className="flex items-center gap-1.5">
                                {isActive && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                                <p className="font-semibold truncate text-xs">
                                  {session.title || 'Conversación sin título'}
                                </p>
                              </div>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                {msgCount} {msgCount === 1 ? 'mensaje' : 'mensajes'} • {new Date(session.updatedAt || session.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </p>
                            </button>

                            {confirmDeleteSessionId === session.id ? (
                              <div 
                                className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/90 px-2 py-1 rounded-xl border border-rose-300 dark:border-rose-700 shadow-xs shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">¿Borrar?</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteChat(session.id);
                                    setConfirmDeleteSessionId(null);
                                    onAnnounce('Conversación eliminada.');
                                  }}
                                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-[10px] font-bold shadow-2xs transition-colors"
                                >
                                  Sí
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteSessionId(null);
                                  }}
                                  className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-medium transition-colors"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => handleStartRename(session, e)}
                                  title="Renombrar tema"
                                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteSessionId(session.id);
                                  }}
                                  title="Eliminar esta conversación"
                                  className="p-1.5 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 rounded-lg hover:bg-rose-100/60 dark:hover:bg-rose-950/60 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      onNewChat();
                      setIsSessionsMenuOpen(false);
                    }}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Iniciar otro tema en un nuevo chat</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Integrated Pomodoro Focus Timer Bar */}
      {isPomodoroOpen && (
        <div 
          id="pomodoro-bar-wrapper"
          className="px-3 sm:px-4 py-3 border-b border-slate-200/90 dark:border-slate-800/90 bg-slate-50/90 dark:bg-slate-900/90 shrink-0 relative z-10 animate-in fade-in slide-in-from-top-1 duration-150 shadow-2xs"
        >
          <PomodoroTimer
            currentTopic={currentTopic}
            subjectName={currentSubjectInfo.name.split('/')[0].trim()}
            onAnnounce={onAnnounce}
            onClose={() => setIsPomodoroOpen(false)}
            onSessionComplete={(durationMinutes, topic) => {
              onAnnounce(`¡Gran trabajo! Has completado ${durationMinutes} minutos de estudio enfocado.`);
            }}
          />
        </div>
      )}

      {/* Messages Scroll Area */}
      <div 
        id="chat-messages-scroll"
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6"
        role="log"
        aria-live="polite"
      >
        {/* Pantalla de Inicio / Home Screen Hero with Logo & Startup Animation Trigger */}
        <StartScreenHero
          studentProfile={studentProfile}
          currentUser={currentUser}
          onOpenGoogleAuth={onOpenGoogleAuth}
          onReplayStartup={onReplayStartup}
          onSelectSubject={() => setIsSubjectPickerOpen(true)}
          onQuickPrompt={(prompt) => {
            setInputText(prompt);
          }}
        />

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isSpeaking = currentlySpeakingId === msg.id;

          return (
            <div
              key={msg.id}
              id={`chat-msg-${msg.id}`}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              {/* Sender & Timestamp */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {isUser ? studentProfile.name : 'S.A.R.A'}
                </span>
                <span>•</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                {!isUser && msg.usedModel && (
                  <button
                    type="button"
                    onClick={onOpenModelManagement}
                    title={`Generado con ${msg.usedModel}.${msg.tokenUsage ? ` (${msg.tokenUsage.totalTokens} tokens consumidos).` : ''} Clic para abrir el panel de Gestión de Modelos.`}
                    className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 cursor-pointer transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{msg.usedModel.replace('gemini-', '')}</span>
                    {msg.tokenUsage && (
                      <span className="text-[8px] text-slate-400 font-mono">
                        ({msg.tokenUsage.totalTokens} tok)
                      </span>
                    )}
                  </button>
                )}

                {!isUser && (
                  <button
                    type="button"
                    onClick={() => speakText(msg.text, msg.id)}
                    className={`p-1 rounded-md transition-colors ${
                      isSpeaking
                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-950 font-semibold'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                    title={isSpeaking ? 'Detener lectura en voz alta' : 'Escuchar respuesta en voz alta'}
                    aria-label={isSpeaking ? 'Detener lectura en voz alta' : 'Escuchar respuesta en voz alta'}
                  >
                    {isSpeaking ? (
                      <span className="flex items-center gap-1 text-blue-600">
                        <StopCircle className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                        <span className="text-[10px]">Detener</span>
                      </span>
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`${
                  !isUser && (msg.mindMap || msg.visualIllustration)
                    ? 'w-full max-w-[98%] sm:max-w-[95%] md:max-w-[92%]'
                    : 'max-w-[92%] sm:max-w-[82%]'
                } rounded-2xl p-4 sm:p-5 shadow-xs transition-all ${lineSpacingClass} ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200/90 dark:border-slate-800'
                }`}
              >
                {/* Image attachment rendering */}
                {msg.attachment && msg.attachment.type === 'image' && (
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={() => setZoomedImageUrl(msg.attachment!.url)}
                      className="group relative block max-w-xs sm:max-w-sm rounded-xl overflow-hidden border border-white/20 shadow-xs hover:opacity-95 transition-opacity"
                      title="Haz clic para ampliar la imagen"
                    >
                      <img
                        src={msg.attachment.url}
                        alt={msg.attachment.name || 'Foto del ejercicio o pregunta'}
                        className="w-full max-h-56 sm:max-h-64 object-contain bg-slate-950/20 rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/65 text-white text-[10px] font-medium flex items-center gap-1">
                        <ZoomIn className="w-3 h-3" /> Ampliar
                      </span>
                    </button>
                    {msg.attachment.name && (
                      <p className="text-[10px] opacity-80 mt-1 truncate">
                        📎 {msg.attachment.name}
                      </p>
                    )}
                  </div>
                )}

                {/* Concept Banner if highlighted */}
                {!isUser && msg.highlightedConcept && (
                  <div className="mb-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 text-[11px] font-bold">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    {msg.highlightedConcept}
                  </div>
                )}

                {/* Markdown text body */}
                <div className={`prose prose-sm max-w-none break-words leading-relaxed ${
                  isUser ? 'prose-invert text-white' : 'text-slate-900 dark:text-slate-100 dark:prose-invert'
                }`}>
                  <ReactMarkdown
                    components={{
                      code({ inline, className, children, ...props }: any) {
                        const isProg = studentProfile.currentSubject === 'programacion';
                        if (isProg) {
                          return inline ? (
                            <code className={`px-1 py-0.5 rounded text-xs font-mono ${
                              isUser ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'
                            }`} {...props}>
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl overflow-x-auto text-xs my-2 font-mono" {...props}>
                              <code>{children}</code>
                            </pre>
                          );
                        }
                        return inline ? (
                          <span className={`font-semibold px-1 py-0.5 rounded text-xs ${
                            isUser 
                              ? 'bg-white/20 text-white' 
                              : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60'
                          }`}>
                            {children}
                          </span>
                        ) : (
                          <div className={`p-3 rounded-xl my-2 text-xs font-medium ${
                            isUser 
                              ? 'bg-white/10 text-white' 
                              : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200'
                          }`}>
                            {children}
                          </div>
                        );
                      }
                    }}
                  >
                    {isUser ? msg.text : cleanTutorResponseText(msg.text, studentProfile.currentSubject === 'programacion')}
                  </ReactMarkdown>
                </div>

                {/* AI-Generated Visual Illustration or Diagram */}
                {!isUser && msg.visualIllustration && (
                  <div className="mt-3.5">
                    <VisualIllustrationViewer
                      data={msg.visualIllustration}
                      onAnnounce={onAnnounce}
                      isDark={isDarkMode}
                    />
                  </div>
                )}

                {/* AI-Generated Interactive Mind Map */}
                {!isUser && msg.mindMap && (
                  <div className="mt-3.5">
                    <MindMapViewer
                      data={msg.mindMap}
                      onAnnounce={onAnnounce}
                      onAskFollowUp={(q) => onSendMessage(q)}
                      isDark={isDarkMode}
                    />
                  </div>
                )}

                {/* Error Banner with Retry button if response had difficulty */}
                {msg.isError && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="truncate">Interrupción de respuesta al procesar la duda.</span>
                    </div>
                    {onRetryMessage && (
                      <button
                        type="button"
                        onClick={() => onRetryMessage(msg)}
                        disabled={isLoading}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1 transition-colors shrink-0"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reintentar
                      </button>
                    )}
                  </div>
                )}

                {/* Memory update notification pill */}
                {!isUser && msg.memoryUpdate && msg.memoryUpdate.topicTitle && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-xl">
                    <div className="flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Concepto memorizado: <strong>{msg.memoryUpdate.topicTitle}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenMemory}
                      className="text-emerald-800 dark:text-emerald-300 font-bold hover:underline shrink-0"
                    >
                      Ver en Memoria →
                    </button>
                  </div>
                )}
              </div>

              {/* Suggested Questions */}
              {!isUser && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1.5 max-w-full sm:max-w-[85%]">
                  {msg.suggestedQuestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onSendMessage(sug)}
                      disabled={isLoading}
                      className="text-left text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                    >
                      💡 {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-y-1.5">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>S.A.R.A está analizando tu consulta y adaptando la explicación...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pedagogical Shortcuts Bar */}
      <div className="flex px-2.5 sm:px-4 py-2 bg-slate-50/95 dark:bg-slate-800/95 border-t border-slate-200 dark:border-slate-800 items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 no-scrollbar">
        <span className="font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1 text-[10px] sm:text-xs">Herramientas:</span>
        
        {/* Interactive Mind Map Button */}
        {onGenerateMindMap && (
          <button
            type="button"
            onClick={() => onGenerateMindMap(currentTopic || currentSubjectInfo.name)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0 flex items-center gap-1 font-semibold transition-colors shadow-2xs"
            title="Generar mapa mental interactivo con ramas y conceptos"
          >
            <Network className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>🧠 Mapa Mental</span>
          </button>
        )}

        {/* Visual Diagram / Photo Illustration Button */}
        {onGenerateVisual && (
          <button
            type="button"
            onClick={() => onGenerateVisual(currentTopic || currentSubjectInfo.name)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0 flex items-center gap-1 font-semibold transition-colors shadow-2xs"
            title="Generar foto explicativa y esquema visual didáctico"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>🖼️ Foto Explicativa</span>
          </button>
        )}

        {/* Camera Snap Shortcut Button */}
        <button
          type="button"
          onClick={() => setIsCameraOpen(true)}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0 flex items-center gap-1 font-semibold transition-colors shadow-2xs"
          title="Tomar foto con la cámara para que S.A.R.A responda"
        >
          <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>📷 Tomar Foto</span>
        </button>

        {/* Pomodoro Focus Session Shortcut Button */}
        <button
          type="button"
          onClick={() => {
            setIsPomodoroOpen(true);
            onAnnounce('Temporizador Pomodoro activado en la parte superior');
          }}
          className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 shrink-0 flex items-center gap-1 font-semibold transition-colors shadow-2xs cursor-pointer"
          title="Iniciar sesión de enfoque de 25 minutos (Técnica Pomodoro)"
        >
          <Timer className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>⏱️ Pomodoro 25m</span>
        </button>

        <button
          type="button"
          onClick={() => onSendMessage('Explícamelo como a un niño de 10 años (Técnica Feynman)')}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1 transition-colors"
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          Más Simple (Feynman)
        </button>
        <button
          type="button"
          onClick={() => onSendMessage('Dame un ejemplo real y práctico de la vida cotidiana sobre esto')}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1 transition-colors"
        >
          <Lightbulb className="w-3 h-3 text-blue-500" />
          Ejemplo Práctico
        </button>
        <button
          type="button"
          onClick={() => onSendMessage('Hazme una pregunta desafiante para poner a prueba si de verdad lo entendí')}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1 transition-colors"
        >
          <HelpCircle className="w-3 h-3 text-purple-500" />
          Ponme a Prueba
        </button>
        <button
          type="button"
          onClick={() => onSendMessage('¿Cómo se conecta este tema con lo que aprendí en temas anteriores?')}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1 transition-colors"
        >
          <Brain className="w-3 h-3 text-emerald-500" />
          Conectar Memoria
        </button>
        <button
          type="button"
          onClick={() => onGenerateQuiz(currentTopic || currentSubjectInfo.name)}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold shrink-0 flex items-center gap-1"
        >
          <BookOpen className="w-3 h-3" />
          Quiz Rápido
        </button>
      </div>

      {/* Attached Image Preview Bar (appears above input when student selects a photo or captures with camera) */}
      {attachedImage && (
        <div className="px-3 sm:px-4 py-2 bg-blue-50/90 dark:bg-blue-950/50 border-t border-blue-200/70 dark:border-blue-800/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-blue-300 dark:border-blue-700 bg-slate-200 dark:bg-slate-700 shrink-0">
              <img
                src={attachedImage.previewUrl}
                alt="Vista previa"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 truncate">
                📷 {attachedImage.name || attachedImage.file?.name || 'Foto tomada con la cámara'}
              </p>
              <p className="text-[10px] text-blue-700 dark:text-blue-300 flex items-center gap-1">
                {attachedImage.file?.size && <span>{(attachedImage.file.size / 1024).toFixed(0)} KB • </span>}
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Lista para que S.A.R.A analice y responda</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAttachedImage(null)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Quitar imagen"
            aria-label="Quitar imagen adjunta"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Form Bar */}
      <form 
        onSubmit={handleSend}
        className="p-2 sm:p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0"
      >
        {/* Hidden file input for image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          id="chat-image-file-input"
        />

        {/* Blocked by Token Limit Banner */}
        {isTokenLimitExceeded && (
          <div className="mb-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900/80 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-medium min-w-0">
              <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="truncate">
                <strong>Consultas bloqueadas:</strong> Alcanzaste el límite de {new Intl.NumberFormat('es-ES').format(maxTokensLimit)} tokens de sesión ({new Intl.NumberFormat('es-ES').format(sessionTotalTokens)} consumidos).
              </span>
            </div>
            {onOpenModelManagement && (
              <button
                type="button"
                onClick={onOpenModelManagement}
                className="shrink-0 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition cursor-pointer shadow-2xs"
              >
                Gestionar Límite
              </button>
            )}
          </div>
        )}

        {/* Soft Warning Notification Banner at 80% and 95% */}
        {enableTokenLimit && !isTokenLimitExceeded && (() => {
          const ratio = sessionTotalTokens / Math.max(1, maxTokensLimit);
          if (ratio >= 0.95 && dismissedTokenWarning !== 95) {
            return (
              <div className="mb-2 p-2 sm:p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-medium min-w-0">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span className="truncate">
                    <strong>¡Aviso crítico (95%)!</strong> Te quedan menos de {new Intl.NumberFormat('es-ES').format(Math.max(0, maxTokensLimit - sessionTotalTokens))} tokens antes de alcanzar el tope.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {onOpenModelManagement && (
                    <button
                      type="button"
                      onClick={onOpenModelManagement}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition cursor-pointer shadow-2xs"
                    >
                      Ampliar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDismissedTokenWarning(95)}
                    className="p-1 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition cursor-pointer"
                    title="Cerrar aviso"
                    aria-label="Cerrar aviso"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          } else if (ratio >= 0.80 && dismissedTokenWarning !== 80 && dismissedTokenWarning !== 95) {
            return (
              <div className="mb-2 p-2 sm:p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-medium min-w-0">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="truncate">
                    <strong>Aviso de consumo (80%):</strong> Has utilizado el 80% de tus tokens ({new Intl.NumberFormat('es-ES').format(sessionTotalTokens)} / {new Intl.NumberFormat('es-ES').format(maxTokensLimit)}).
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {onOpenModelManagement && (
                    <button
                      type="button"
                      onClick={onOpenModelManagement}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition cursor-pointer shadow-2xs"
                    >
                      Gestionar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDismissedTokenWarning(80)}
                    className="p-1 text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition cursor-pointer"
                    title="Cerrar aviso"
                    aria-label="Cerrar aviso"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Visual Token Limit Progress Bar */}
        {enableTokenLimit && !isTokenLimitExceeded && (
          <div className="mb-2 px-1.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-1 text-[11px]">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  (sessionTotalTokens / maxTokensLimit) >= 0.95
                    ? 'bg-rose-500 animate-pulse'
                    : (sessionTotalTokens / maxTokensLimit) >= 0.8
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}></span>
                Uso de tokens de sesión:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {new Intl.NumberFormat('es-ES').format(sessionTotalTokens)} / {new Intl.NumberFormat('es-ES').format(maxTokensLimit)} tokens
                </span>
                <span className={`font-bold text-[10px] px-1.5 py-0.2 rounded-full ${
                  (sessionTotalTokens / maxTokensLimit) >= 0.95
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 ring-1 ring-rose-300 dark:ring-rose-800'
                    : (sessionTotalTokens / maxTokensLimit) >= 0.80 
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {Math.min(100, Math.round((sessionTotalTokens / Math.max(1, maxTokensLimit)) * 100))}%
                </span>
                {onOpenModelManagement && (
                  <button
                    type="button"
                    onClick={onOpenModelManagement}
                    className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline ml-1 cursor-pointer"
                  >
                    Ajustar
                  </button>
                )}
              </div>
            </div>
            {/* Progress Track */}
            <div className="w-full bg-slate-200 dark:bg-slate-700/80 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  (sessionTotalTokens / maxTokensLimit) >= 0.95
                    ? 'bg-rose-600 dark:bg-rose-500'
                    : (sessionTotalTokens / maxTokensLimit) >= 0.8
                    ? 'bg-amber-500'
                    : 'bg-blue-600 dark:bg-blue-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(2, (sessionTotalTokens / Math.max(1, maxTokensLimit)) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* Button: Take Photo with Camera */}
          <button
            type="button"
            id="camera-capture-btn"
            disabled={isTokenLimitExceeded}
            onClick={() => setIsCameraOpen(true)}
            title={isTokenLimitExceeded ? 'Bloqueado por límite de tokens' : 'Tomar foto con la cámara para que la IA responda'}
            aria-label="Tomar foto con la cámara"
            className="p-2 sm:p-2.5 md:p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 active:scale-95"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
          </button>

          {/* Button: Upload Image */}
          <button
            type="button"
            id="attach-image-btn"
            disabled={isTokenLimitExceeded}
            onClick={() => fileInputRef.current?.click()}
            title={isTokenLimitExceeded ? 'Bloqueado por límite de tokens' : 'Subir imagen desde archivos'}
            aria-label="Subir foto de tarea o ejercicio"
            className={`p-2 sm:p-2.5 md:p-3 rounded-xl border transition-all shrink-0 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              attachedImage
                ? 'bg-blue-50 border-blue-400 text-blue-600 dark:bg-blue-950/60 dark:border-blue-600'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <ImagePlus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Voice Dictation Button */}
          <button
            type="button"
            id="voice-dictation-btn"
            disabled={isTokenLimitExceeded}
            onClick={toggleVoiceInput}
            title={isTokenLimitExceeded ? 'Bloqueado por límite de tokens' : isListening ? 'Detener dictado' : 'Hablar por micrófono'}
            aria-label={isListening ? 'Detener dictado' : 'Hablar por micrófono'}
            className={`p-2 sm:p-2.5 md:p-3 rounded-xl border transition-all shrink-0 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              isListening
                ? 'bg-red-500 text-white border-red-600 animate-pulse ring-2 ring-red-300'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Text Input */}
          <div className="relative flex-1 min-w-0">
            <input
              id="chat-input-field"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isTokenLimitExceeded
                  ? '🔒 Consultas bloqueadas por límite de tokens (Modifícalo en Gestión de Modelos)'
                  : isListening
                  ? 'Escuchando tu voz... Habla ahora'
                  : attachedImage
                  ? 'Escribe tu pregunta sobre la foto...'
                  : 'Pregunta a S.A.R.A, escribe o toma una foto...'
              }
              disabled={isLoading || isTokenLimitExceeded}
              className={`w-full px-3 py-2 sm:py-2.5 md:py-3 rounded-xl border text-sm transition-all outline-hidden pr-8 sm:pr-9 ${
                isTokenLimitExceeded
                  ? 'bg-slate-100 dark:bg-slate-800/50 border-rose-300 dark:border-rose-900/60 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950'
              }`}
            />
            {inputText && !isTokenLimitExceeded && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="absolute right-2.5 sm:right-3 top-2.5 sm:top-3 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Send Button */}
          <button
            type="submit"
            id="chat-send-btn"
            disabled={(!inputText.trim() && !attachedImage) || isLoading || isTokenLimitExceeded}
            className="p-2 sm:p-2.5 md:p-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-xs shrink-0 flex items-center justify-center focus:ring-2 focus:ring-blue-400 cursor-pointer"
            aria-label={isTokenLimitExceeded ? 'Consultas bloqueadas por límite de tokens' : 'Enviar mensaje al tutor'}
          >
            {isTokenLimitExceeded ? <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>

        {isListening && (
          <p className="text-[11px] text-red-600 font-semibold mt-1.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            Dictado activo: habla con claridad hacia tu micrófono
          </p>
        )}
      </form>

      {/* Fullscreen Image Lightbox Modal */}
      {zoomedImageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setZoomedImageUrl(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2 border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomedImageUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomedImageUrl}
              alt="Imagen ampliada"
              className="max-w-full max-h-[82vh] object-contain mx-auto rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        studentName={studentProfile.name}
      />

      {/* Dedicated Subject Changer Box (Only appears when clicking subject name) */}
      <SubjectPickerModal
        isOpen={isSubjectPickerOpen}
        onClose={() => setIsSubjectPickerOpen(false)}
        currentSubject={studentProfile.currentSubject}
        customSubjectName={studentProfile.customSubjectName}
        isDarkMode={isDarkMode}
        onSelectSubject={(subjectKey, customName) => {
          if (onSelectSubject) {
            onSelectSubject(subjectKey, customName);
          }
        }}
      />

    </div>
  );
};
