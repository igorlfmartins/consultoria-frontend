import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, MessageSquareMore, Target, Settings } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import { ChatInput } from '../components/ChatInput'
import { SettingsPanel } from '../components/SettingsPanel'
import { Sidebar } from '../components/Sidebar'
import { LiveMode } from '../components/LiveMode'
import { useAuth } from '../auth'
import type { ChatMessage, SessionSummary } from '../api'
import { sendConsultoriaMessage } from '../api'

const FOCUS_AREAS = (t: (key: string) => string) => [
  { id: 'vendas', label: t('chat.focusAreas.sales'), color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/10' },
  { id: 'marketing', label: t('chat.focusAreas.marketing'), color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10' },
  { id: 'financas', label: t('chat.focusAreas.finance'), color: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10' },
  { id: 'gestao', label: t('chat.focusAreas.management'), color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10' },
  { id: 'tecnologia', label: t('chat.focusAreas.tech'), color: 'text-indigo-400', border: 'border-indigo-500/50', bg: 'bg-indigo-500/10' },
]

const SESSIONS_KEY_PREFIX = 'consultoria_sessions_'
const SESSION_MESSAGES_KEY_PREFIX = 'consultoria_session_messages_'

function getSessionsKey(userId: string) {
  return `${SESSIONS_KEY_PREFIX}${userId}`
}

function getMessagesKey(userId: string, sessionId: string) {
  return `${SESSION_MESSAGES_KEY_PREFIX}${userId}_${sessionId}`
}

function loadSessionsFromStorage(userId: string): SessionSummary[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(getSessionsKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveSessionsToStorage(userId: string, sessions: SessionSummary[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(getSessionsKey(userId), JSON.stringify(sessions))
  } catch {
  }
}

function loadMessagesFromStorage(userId: string, sessionId: string): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(getMessagesKey(userId, sessionId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveMessagesToStorage(userId: string, sessionId: string, messages: ChatMessage[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(getMessagesKey(userId, sessionId), JSON.stringify(messages))
  } catch {
  }
}

type SessionState = {
  id: string | null
  title: string
  messages: ChatMessage[]
}

export function Chat() {
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuth()
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [currentSession, setCurrentSession] = useState<SessionState>({
    id: null,
    title: t('chat.session.new'),
    messages: [],
  })
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [language, setLanguage] = useState(i18n.language)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [toneLevel, setToneLevel] = useState(3)
  const [isLiveMode, setIsLiveMode] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const focusAreas = useMemo(() => FOCUS_AREAS(t), [t])

  // Load settings
  useEffect(() => {
    const savedLang = localStorage.getItem('consultoria_language') || 'en'
    const savedTheme = (localStorage.getItem('consultoria_theme') as 'light' | 'dark') || 'dark'
    const savedTone = parseInt(localStorage.getItem('consultoria_tone') || '1', 10)
    setLanguage(savedLang)
    setTheme(savedTheme)
    setToneLevel(savedTone)
  }, [])

  // Apply theme
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('consultoria_theme', theme)
  }, [theme])

  // Save language
  useEffect(() => {
    localStorage.setItem('consultoria_language', language)
    i18n.changeLanguage(language)
  }, [language, i18n])

  // Save tone
  useEffect(() => {
    localStorage.setItem('consultoria_tone', toneLevel.toString())
  }, [toneLevel])

  useEffect(() => {
    if (!user) return
    setIsLoadingSessions(true)

    const stored = loadSessionsFromStorage(user.id)
    setSessions(stored)
    setIsLoadingSessions(false)
  }, [user])

  useEffect(() => {
    if (!messagesEndRef.current) return
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [currentSession.messages.length])

  function handleNewSession() {
    setCurrentSession({
      id: null,
      title: t('chat.session.new'),
      messages: [],
    })
    setError(null)
  }

  function handleSelectSession(session: SessionSummary) {
    if (!user) return
    const messages = loadMessagesFromStorage(user.id, session.id)
    setCurrentSession({
      id: session.id,
      title: session.title,
      messages,
    })
    setError(null)
  }

  function handleDeleteSession(sessionId: string, event: React.MouseEvent) {
    event.stopPropagation()
    if (!user) return

    if (!window.confirm(t('chat.sidebar.confirmDelete'))) return

    const nextSessions = sessions.filter((s) => s.id !== sessionId)
    setSessions(nextSessions)
    saveSessionsToStorage(user.id, nextSessions)
    
    // Clean up messages from storage
    try {
      window.localStorage.removeItem(getMessagesKey(user.id, sessionId))
    } catch {}

    if (currentSession.id === sessionId) {
      handleNewSession()
    }
  }

  async function sendMessage(text: string, focusOverride?: string) {
    if (!user || !text.trim()) return

    const focusToSend = focusOverride !== undefined ? focusOverride : selectedFocus
    const now = new Date().toISOString()

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text,
      createdAt: now,
    }

    setCurrentSession((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }))
    
    setIsLoading(true)
    setError(null)

    try {
      const result = await sendConsultoriaMessage({
        userId: user.id,
        conversationId: currentSession.id,
        message: text,
        history: currentSession.messages,
        focus: focusToSend,
        language: language,
        toneLevel: toneLevel,
      })

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: result.reply,
        createdAt: new Date().toISOString(),
      }

      const conversationId = result.conversationId
      const baseMessages = [...currentSession.messages, userMessage]
      const fullMessages = [...baseMessages, aiMessage]

      setCurrentSession((prev) => ({
        ...prev,
        id: conversationId,
        messages: fullMessages,
      }))

      if (user) {
        let createdAt = now
        let title = currentSession.title
        const existing = sessions.find((s) => s.id === conversationId)
        if (existing) {
          createdAt = existing.createdAt ?? createdAt
          title = existing.title || title
        } else {
          if (!title || title === t('chat.session.new')) {
            title = text.length > 60 ? `${text.slice(0, 57)}...` : text
          }
        }

        const summary: SessionSummary = {
          id: conversationId,
          title: title || t('chat.session.defaultTitle'),
          createdAt,
        }

        setSessions((prev) => {
          const index = prev.findIndex((s) => s.id === conversationId)
          if (index === -1) {
            const next = [summary, ...prev]
            saveSessionsToStorage(user.id, next)
            return next
          }
          const next = [...prev]
          next[index] = summary
          saveSessionsToStorage(user.id, next)
          return next
        })

        saveMessagesToStorage(user.id, conversationId, fullMessages)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('chat.body.error'))
    } finally {
      setIsLoading(false)
    }
  }

  function handleDeepDive(area: { id: string; label: string }) {
    sendMessage(t('chat.body.aiMessage.deepDive') + ` ${area.label}`, area.label)
  }

  function handleGenerateReport() {
    sendMessage(t('chat.footer.generateReport'))
  }

  const [input, setInput] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const msg = input
    setInput('')
    await sendMessage(msg)
  }

  return (
    <div className="h-screen bg-bio-deep text-bio-deep flex font-sans overflow-hidden">
      <div className="flex-1 flex max-w-[1920px] mx-auto w-full border-x border-bio-deep/10 bg-bio-white">
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSession.id}
          isLoading={isLoadingSessions}
          onNewSession={handleNewSession}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          userId={user?.id || ''}
          onSignOut={signOut}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-bio-white dark:bg-bio-deep relative">
          {/* Header Block */}
          <header className="h-20 bg-bio-teal flex items-center justify-between px-8 border-b-4 border-bio-deep">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-bio-deep flex items-center justify-center">
                <MessageSquareMore className="h-5 w-5 text-bio-teal" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-bio-deep tracking-tight font-mono leading-none uppercase">{t('chat.header.title')}</h1>
                <p className="text-[10px] font-bold text-bio-deep/60 uppercase tracking-widest font-mono">System Active</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-3 bg-bio-deep/10 px-4 py-2 rounded-full border border-bio-deep/10">
                <span className="inline-flex h-2 w-2 bg-bio-lime animate-pulse rounded-full" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-bio-deep font-mono">
                  {t('chat.header.aiStatus')}
                </span>
              </div>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-3 bg-bio-deep text-bio-teal hover:bg-bio-purple hover:text-bio-deep transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </header>

          <section className="flex-1 flex flex-col min-h-0 relative">
            <div className="absolute inset-0 bg-cross-pattern opacity-5 pointer-events-none" />
            
            <div className="flex-1 overflow-y-auto py-8 scroll-smooth">
              <div className="max-w-5xl mx-auto w-full px-6 md:px-8 space-y-8">
                {currentSession.messages.length === 0 && !isLoading && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-8">
                    <div className="md:col-span-8 bg-bio-deep p-8 md:p-12 flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Target className="h-32 w-32 text-bio-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-bio-lime uppercase tracking-widest mb-4 font-mono">{t('chat.body.initialBriefing.title')}</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-bio-white font-mono leading-tight">
                          {t('chat.body.initialBriefing.heading')}
                        </h2>
                      </div>
                      <div className="mt-8 pt-8 border-t border-bio-white/10">
                        <p className="text-bio-white/60 text-sm font-mono">
                          Selecione um módulo operacional ao lado ou inicie uma nova query.
                        </p>
                      </div>
                    </div>

                    <div className="md:col-span-4 grid grid-rows-3 gap-4">
                      <div className="bg-bio-purple p-6 flex flex-col justify-center hover:brightness-110 cursor-pointer transition-all">
                        <p className="text-bio-deep text-sm font-bold font-mono leading-tight">{t('chat.body.initialBriefing.example1')}</p>
                      </div>
                      <div className="bg-bio-teal p-6 flex flex-col justify-center hover:brightness-110 cursor-pointer transition-all">
                        <p className="text-bio-deep text-sm font-bold font-mono leading-tight">{t('chat.body.initialBriefing.example2')}</p>
                      </div>
                      <div className="bg-bio-lime p-6 flex flex-col justify-center hover:brightness-110 cursor-pointer transition-all">
                        <p className="text-bio-deep text-sm font-bold font-mono leading-tight">{t('chat.body.initialBriefing.example3')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {currentSession.messages.map((message) => {
                  const isUser = message.sender === 'user'
                  return (
                    <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-3xl p-6 md:p-8 text-base font-medium relative ${
                          isUser
                            ? 'bg-bio-deep text-bio-white ml-12'
                            : 'bg-bio-white border-2 border-bio-deep text-bio-deep mr-12'
                        }`}
                      >
                        <div className="absolute -top-3 left-6 px-2 bg-inherit">
                          <span className={`text-[10px] font-bold uppercase tracking-widest font-mono ${isUser ? 'text-bio-lime' : 'text-bio-deep'}`}>
                            {isUser ? 'USER_INPUT' : 'SYSTEM_RESPONSE'}
                          </span>
                        </div>
                        
                        <ReactMarkdown className={`prose max-w-none ${isUser ? 'prose-invert' : 'prose-headings:font-mono prose-headings:uppercase'}`}>
                          {message.text}
                        </ReactMarkdown>

                        {!isUser && (
                          <div className="mt-6 pt-4 border-t-2 border-bio-deep/10 flex flex-wrap gap-2">
                            {focusAreas.map((area) => (
                              <button
                                key={area.id}
                                onClick={() => handleDeepDive(area)}
                                className="px-3 py-1 bg-bio-purple/10 hover:bg-bio-purple text-bio-deep text-[10px] font-bold uppercase tracking-widest transition-colors font-mono"
                              >
                                {area.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-bio-lime p-4 flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-bio-deep" />
                      <span className="text-xs font-bold uppercase tracking-widest text-bio-deep font-mono">Processing Data Stream...</span>
                    </div>
                  </div>
                )}
                {error && <p className="text-xs text-red-500 font-mono mt-4">{error}</p>}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="bg-bio-white border-t border-bio-deep/10 dark:bg-bio-deep dark:border-bio-white/10">
              <div className="max-w-5xl mx-auto w-full px-6 md:px-8 py-4">
                <div className="mb-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {focusAreas.map((area) => (
                    <button
                      key={area.id}
                      onClick={() => setSelectedFocus(selectedFocus === area.label ? null : area.label)}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest font-mono border transition-all whitespace-nowrap ${
                        selectedFocus === area.label
                          ? 'bg-bio-teal text-bio-deep border-bio-teal'
                          : 'bg-transparent border-bio-deep/20 text-bio-deep/60 hover:border-bio-deep/50 hover:text-bio-deep dark:text-bio-white/60 dark:border-bio-white/20 dark:hover:border-bio-white/50 dark:hover:text-bio-white'
                      }`}
                    >
                      {area.label}
                    </button>
                  ))}
                </div>

                <ChatInput
                  input={input}
                  setInput={setInput}
                  isLoading={isLoading}
                  onSubmit={handleSubmit}
                  onToggleLive={() => setIsLiveMode(true)}
                  onGenerateReport={handleGenerateReport}
                />
              </div>
            </div>
          </section>

          {isLiveMode && (
            <LiveMode 
              onClose={() => setIsLiveMode(false)}
              systemInstruction={t('chat.header.aiStatus')}
            />
          )}

          <SettingsPanel
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            language={language}
            setLanguage={setLanguage}
            theme={theme}
            setTheme={setTheme}
            toneLevel={toneLevel}
            setToneLevel={setToneLevel}
            onSignOut={signOut}
          />
        </main>
      </div>
    </div>
  )
}
