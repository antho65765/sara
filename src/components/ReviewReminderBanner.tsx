import React from 'react';
import { 
  Calendar, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  X
} from 'lucide-react';
import { ReviewScheduleItem, TopicMemory } from '../types';
import { formatTopicTitle } from '../utils/textSanitizer';

interface ReviewReminderBannerProps {
  scheduledReviews: ReviewScheduleItem[];
  memories: TopicMemory[];
  onSelectTopicForChat: (topic: TopicMemory) => void;
  onOpenMemoryAgenda: () => void;
  onToggleCompleteReview: (reviewId: string) => void;
}

export const ReviewReminderBanner: React.FC<ReviewReminderBannerProps> = ({
  scheduledReviews,
  memories,
  onSelectTopicForChat,
  onOpenMemoryAgenda,
  onToggleCompleteReview,
}) => {
  const [dismissedIds, setDismissedIds] = React.useState<string[]>([]);
  const todayStr = new Date().toISOString().split('T')[0];

  // Reviews due today or past due that are not yet completed and not dismissed in current view
  const dueReviews = scheduledReviews
    .filter((item) => !item.completed && item.scheduledDate <= todayStr && !dismissedIds.includes(item.id))
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  if (dueReviews.length === 0) {
    return null;
  }

  const primaryItem = dueReviews[0];
  const matchingTopic = memories.find((m) => m.id === primaryItem.topicId);
  const isOverdue = primaryItem.scheduledDate < todayStr;
  const otherCount = dueReviews.length - 1;

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  return (
    <aside 
      id="review-reminder-banner"
      aria-label="Recordatorio de repaso pendiente"
      className="shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 dark:from-amber-950/70 dark:via-orange-950/60 dark:to-amber-900/60 border-b border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-100 flex items-center justify-between gap-2 text-xs animate-in fade-in slide-in-from-top-1 duration-200"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
          isOverdue 
            ? 'bg-rose-500 text-white animate-pulse' 
            : 'bg-amber-500 text-white'
        }`}>
          <Calendar className="w-3.5 h-3.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold uppercase text-[10px] tracking-wider px-1.5 py-0.2 rounded-sm bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
              {isOverdue ? 'Repaso Atrasado' : 'Agenda de Repaso'}
            </span>
            <span className="font-bold line-clamp-1 break-words">
              {formatTopicTitle(primaryItem.topicTitle)}
            </span>
            {otherCount > 0 && (
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">
                (+{otherCount} más)
              </span>
            )}
          </div>
          <p className="text-[11px] text-amber-800/90 dark:text-amber-200/80 truncate">
            {primaryItem.notes ? `"${primaryItem.notes}"` : 'Toca reforzar conceptos clave en tu memoria continua antes de que se olviden.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {matchingTopic && (
          <button
            type="button"
            onClick={() => onSelectTopicForChat(matchingTopic)}
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            title="Iniciar sesión de repaso sobre este tema"
          >
            <span>Repasar</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}

        <button
          type="button"
          onClick={onOpenMemoryAgenda}
          className="hidden sm:inline-flex px-2 py-1 rounded-lg border border-amber-300 dark:border-amber-700 hover:bg-amber-200/50 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-100 font-semibold text-[11px] transition-colors cursor-pointer"
          title="Ver toda la agenda de repaso en el panel de memoria"
        >
          <span>Ver agenda</span>
          <ChevronRight className="w-3 h-3 ml-0.5" />
        </button>

        <button
          type="button"
          onClick={() => handleDismiss(primaryItem.id)}
          className="p-1 rounded-md text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 hover:bg-amber-200/40 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
          title="Ocultar este aviso"
          aria-label="Ocultar recordatorio"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
