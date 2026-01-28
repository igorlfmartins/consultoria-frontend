import { useState, useEffect, useCallback } from 'react';
import type { ChatMessage, SessionSummary } from '../api';
import { sendConsultoriaMessage } from '../api';
import { 
  loadSessionsFromStorage, 
  saveSessionsToStorage, 
  loadMessagesFromStorage, 
  saveMessagesToStorage,
  getMessagesKey
} from '../utils/storage';

interface User {
  id: string;
}

interface UseChatSessionProps {
  user: User | null;
  session?: { access_token: string } | null;
  language: string;
  toneLevel: number;
  t: (key: string) => string;
}

export type SessionState = {
  id: string | null;
  title: string;
  messages: ChatMessage[];
};

export function useChatSession({ user, session, language, toneLevel, t }: UseChatSessionProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionState>({
    id: null,
    title: t('chat.session.new'),
    messages: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load sessions on user change
  useEffect(() => {
    if (!user) return;
    setIsLoadingSessions(true);
    const stored = loadSessionsFromStorage(user.id);
    setSessions(stored);
    setIsLoadingSessions(false);
  }, [user]);

  const handleNewSession = useCallback(() => {
    setCurrentSession({
      id: null,
      title: t('chat.session.new'),
      messages: [],
    });
    setError(null);
  }, [t]);

  const handleSelectSession = useCallback((session: SessionSummary) => {
    if (!user) return;
    const messages = loadMessagesFromStorage(user.id, session.id);
    setCurrentSession({
      id: session.id,
      title: session.title,
      messages,
    });
    setError(null);
  }, [user]);

  const handleDeleteSession = useCallback((sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user) return;

    if (!window.confirm(t('chat.sidebar.confirmDelete'))) return;

    const nextSessions = sessions.filter((s) => s.id !== sessionId);
    setSessions(nextSessions);
    saveSessionsToStorage(user.id, nextSessions);
    
    try {
      window.localStorage.removeItem(getMessagesKey(user.id, sessionId));
    } catch {}

    if (currentSession.id === sessionId) {
      handleNewSession();
    }
  }, [user, sessions, currentSession.id, handleNewSession, t]);

  const sendMessage = useCallback(async (text: string, focusToSend?: string | null) => {
    if (!user || !text.trim()) return;

    const now = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text,
      createdAt: now,
    };

    setCurrentSession((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await sendConsultoriaMessage({
        userId: user.id,
        conversationId: currentSession.id,
        message: text,
        history: currentSession.messages,
        focus: focusToSend,
        language: language,
        toneLevel: toneLevel,
        token: session?.access_token,
      });

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: result.reply,
        createdAt: new Date().toISOString(),
      };

      const conversationId = result.conversationId;
      const baseMessages = [...currentSession.messages, userMessage];
      const fullMessages = [...baseMessages, aiMessage];

      setCurrentSession((prev) => ({
        ...prev,
        id: conversationId,
        messages: fullMessages,
      }));

      // Update session list and storage
      let createdAt = now;
      let title = currentSession.title;
      const existing = sessions.find((s) => s.id === conversationId);
      
      if (existing) {
        createdAt = existing.createdAt ?? createdAt;
        title = existing.title || title;
      } else if (!title || title === t('chat.session.new')) {
        title = text.length > 60 ? `${text.slice(0, 57)}...` : text;
      }

      const summary: SessionSummary = {
        id: conversationId,
        title: title || t('chat.session.defaultTitle'),
        createdAt,
      };

      setSessions((prev) => {
        const index = prev.findIndex((s) => s.id === conversationId);
        let next;
        if (index === -1) {
          next = [summary, ...prev];
        } else {
          next = [...prev];
          next[index] = summary;
        }
        saveSessionsToStorage(user.id, next);
        return next;
      });

      saveMessagesToStorage(user.id, conversationId, fullMessages);
    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message || t('chat.body.error');
      if (errorMessage === 'Failed to fetch') {
        errorMessage = t('chat.body.fetchError');
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, session, currentSession, sessions, language, toneLevel, t]);

  return {
    sessions,
    currentSession,
    isLoading,
    isLoadingSessions,
    error,
    handleNewSession,
    handleSelectSession,
    handleDeleteSession,
    sendMessage,
  };
}
