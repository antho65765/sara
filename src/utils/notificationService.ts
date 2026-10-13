import { ReviewScheduleItem } from '../types';

/**
 * Service for native Web & Mobile notifications in S.A.R.A
 * Supports:
 * - Desktop browsers (Chrome, Edge, Firefox, Safari)
 * - Mobile Android (Chrome, Edge, PWA installed / home screen)
 * - iOS Safari (iOS 16.4+ standalone PWA notifications)
 * - Web Audio reminder chime
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/**
 * Requests native system notification permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Plays a pleasant educational reminder chime using Web Audio API
 */
export function playReminderChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic pleasant chord (C5 -> E5 -> G5)
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.7);
    });
  } catch (e) {
    // AudioContext may be restricted before user gesture
  }
}

export interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number | number[];
  renotify?: boolean;
  tag?: string;
  badge?: string;
  image?: string;
  data?: any;
}

/**
 * Dispatches a native notification to the phone / browser
 */
export async function sendNativeNotification(title: string, options?: ExtendedNotificationOptions): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const defaultOptions: ExtendedNotificationOptions = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200, 100, 250],
    tag: 'sara-study-reminder',
    renotify: true,
    requireInteraction: false,
    ...options,
  };

  playReminderChime();

  // 1. Try Service Worker Notification (Best for Android & PWA Mobile background)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration) {
        await (registration as any).showNotification(title, defaultOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('Service worker notification fallback to window.Notification', swErr);
    }
  }

  // 2. Fallback to standard Window Notification
  try {
    const notification = new Notification(title, defaultOptions as NotificationOptions);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return true;
  } catch (e) {
    console.error('Failed to create native notification:', e);
    return false;
  }
}

/**
 * Sends a study topic reminder notification
 */
export async function sendScheduledTopicNotification(
  topicTitle: string,
  scheduledDate: string,
  scheduledTime?: string,
  notes?: string
): Promise<boolean> {
  const timeSnippet = scheduledTime ? ` a las ${scheduledTime}` : '';
  const bodyText = notes 
    ? `Tema: "${topicTitle}". Objetivo: ${notes}`
    : `Es momento de afianzar "${topicTitle}" antes de que decaiga la retención. ¡Entra y haz un repaso de 5 minutos!`;

  return sendNativeNotification(`📚 Recordatorio de Repaso en S.A.R.A${timeSnippet}`, {
    body: bodyText,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: `sara-topic-${topicTitle.toLowerCase().replace(/\s+/g, '-')}`,
    data: {
      topicTitle,
      scheduledDate,
      scheduledTime,
      url: window.location.href,
    },
  });
}

/**
 * Sends an immediate test notification to verify mobile notifications work
 */
export async function sendTestNotification(): Promise<boolean> {
  return sendNativeNotification('🔔 Notificaciones de S.A.R.A activadas con éxito', {
    body: '¡Excelente! Tu celular te avisará puntualmente el día y hora que programes tus temas de estudio.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'sara-test-notification',
  });
}

const NOTIFIED_CACHE_KEY = 'sara_notified_reviews_log';

function getNotifiedLogs(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function recordNotificationSent(reviewId: string, timestampKey: string) {
  try {
    const logs = getNotifiedLogs();
    logs[`${reviewId}_${timestampKey}`] = new Date().toISOString();
    // Keep max 50 entries
    const keys = Object.keys(logs);
    if (keys.length > 50) {
      delete logs[keys[0]];
    }
    localStorage.setItem(NOTIFIED_CACHE_KEY, JSON.stringify(logs));
  } catch {
    // Ignore storage issues
  }
}

function wasNotificationSent(reviewId: string, timestampKey: string): boolean {
  const logs = getNotifiedLogs();
  return !!logs[`${reviewId}_${timestampKey}`];
}

/**
 * Periodically checks scheduled reviews and sends mobile notifications when due
 */
export function checkAndTriggerDueNotifications(
  scheduledReviews: ReviewScheduleItem[],
  onNotificationSent?: (item: ReviewScheduleItem) => void
): number {
  if (getNotificationPermission() !== 'granted') {
    return 0;
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMins = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMins}`;

  let triggeredCount = 0;

  scheduledReviews.forEach((item) => {
    if (item.completed) return;
    if (item.reminderEnabled === false) return;

    // Check if scheduled for today or past due
    const isToday = item.scheduledDate === todayStr;
    const isPastDue = item.scheduledDate < todayStr;

    if (isToday) {
      // If specific time is set (e.g. 16:30), check if current time >= scheduledTime
      const isTimeDue = item.scheduledTime ? currentTimeStr >= item.scheduledTime : true;
      const notificationKey = `today_${todayStr}_${item.scheduledTime || 'morning'}`;

      if (isTimeDue && !wasNotificationSent(item.id, notificationKey)) {
        sendScheduledTopicNotification(
          item.topicTitle,
          item.scheduledDate,
          item.scheduledTime,
          item.notes
        );
        recordNotificationSent(item.id, notificationKey);
        triggeredCount++;
        if (onNotificationSent) onNotificationSent(item);
      }
    } else if (isPastDue) {
      const overdueKey = `overdue_${todayStr}`;
      if (!wasNotificationSent(item.id, overdueKey)) {
        sendScheduledTopicNotification(
          item.topicTitle,
          item.scheduledDate,
          item.scheduledTime,
          `Tienes pendiente este repaso programado para el ${item.scheduledDate}. ¡Refuérzalo hoy!`
        );
        recordNotificationSent(item.id, overdueKey);
        triggeredCount++;
        if (onNotificationSent) onNotificationSent(item);
      }
    }
  });

  return triggeredCount;
}
