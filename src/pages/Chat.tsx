import type { FormEvent, KeyboardEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Hash, Loader2, LogOut, MessageSquareMore, Plus, Send, Trash2, Target, ArrowRight, FileText, Settings, X, CreditCard, Moon, Sun, Globe, Zap } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '../auth'
import type { ChatMessage, SessionSummary } from '../api'
import { sendConsultoriaMessage } from '../api'

const FOCUS_AREAS = [
  { id: 'vendas', label: 'Vendas', color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/10' },
  { id: 'marketing', label: 'Marketing e Branding', color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10' },
  { id: 'financas', label: 'Finanças e Jurídico', color: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10' },
  { id: 'gestao', label: 'Gestão e Estratégia', color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10' },
  { id: 'tecnologia', label: 'Tecnologia e Inovação', color: 'text-indigo-400', border: 'border-indigo-500/50', bg: 'bg-indigo-500/10' },
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
  const { userId, signOut } = useAuth()
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [currentSession, setCurrentSession] = useState<SessionState>({
    id: null,
    title: 'Nova sessão de consultoria',
    messages: [],
  })
  const [input, setInput] = useState('')
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [language, setLanguage] = useState('en')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [toneLevel, setToneLevel] = useState(3)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  // Load settings
  useEffect(() => {
    const savedLang = localStorage.getItem('consultoria_language') || 'en'
    const savedTheme = (localStorage.getItem('consultoria_theme') as 'light' | 'dark') || 'dark'
    const savedTone = parseInt(localStorage.getItem('consultoria_tone') || '3', 10)
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
  }, [language])

  // Save tone
  useEffect(() => {
    localStorage.setItem('consultoria_tone', toneLevel.toString())
  }, [toneLevel])

  useEffect(() => {
    if (!userId) return
    setIsLoadingSessions(true)

    const stored = loadSessionsFromStorage(userId)
    setSessions(stored)
    setIsLoadingSessions(false)
  }, [userId])

  useEffect(() => {
    if (!messagesEndRef.current) return
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [currentSession.messages.length])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    const lineHeight = 20
    const maxHeight = lineHeight * 5
    const next = Math.min(el.scrollHeight, maxHeight)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [input])

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading])

  function handleNewSession() {
    setCurrentSession({
      id: null,
      title: 'Nova sessão de consultoria',
      messages: [],
    })
    setError(null)
  }

  function handleSelectSession(session: SessionSummary) {
    if (!userId) return
    const messages = loadMessagesFromStorage(userId, session.id)
    setCurrentSession({
      id: session.id,
      title: session.title,
      messages,
    })
    setError(null)
  }

  function handleDeleteSession(sessionId: string, event: React.MouseEvent) {
    event.stopPropagation()
    if (!userId) return

    if (!window.confirm('Tem certeza que deseja excluir esta conversa?')) return

    const nextSessions = sessions.filter((s) => s.id !== sessionId)
    setSessions(nextSessions)
    saveSessionsToStorage(userId, nextSessions)
    
    // Clean up messages from storage
    try {
      window.localStorage.removeItem(getMessagesKey(userId, sessionId))
    } catch {}

    if (currentSession.id === sessionId) {
      handleNewSession()
    }
  }

  async function sendMessage(textOverride?: string, focusOverride?: string) {
    if (!userId || (!canSend && !textOverride)) return

    const text = textOverride || input.trim()
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
    if (!textOverride) setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const result = await sendConsultoriaMessage({
        userId,
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

      if (userId) {
        let createdAt = now
        let title = currentSession.title
        const existing = sessions.find((s) => s.id === conversationId)
        if (existing) {
          createdAt = existing.createdAt ?? createdAt
          title = existing.title || title
        } else {
          if (!title || title === 'Nova sessão de consultoria') {
            title = text.length > 60 ? `${text.slice(0, 57)}...` : text
          }
        }

        const summary: SessionSummary = {
          id: conversationId,
          title: title || 'Sessão de consultoria',
          createdAt,
        }

        setSessions((prev) => {
          const index = prev.findIndex((s) => s.id === conversationId)
          if (index === -1) {
            const next = [summary, ...prev]
            saveSessionsToStorage(userId, next)
            return next
          }
          const next = [...prev]
          next[index] = summary
          saveSessionsToStorage(userId, next)
          return next
        })

        saveMessagesToStorage(userId, conversationId, fullMessages)
      }
    } catch (err) {
      setError('Não foi possível obter a resposta do consultor. Tente novamente em instantes.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await sendMessage()
  }

  function handleDeepDive(area: typeof FOCUS_AREAS[0]) {
    sendMessage(`Gostaria de um aprofundamento específico na área de ${area.label}, complementando a resposta anterior.`, area.label)
  }

  function handleGenerateReport() {
    sendMessage("Com base na nossa conversa, gere agora o Relatório Estratégico Completo (Diagnóstico + Plano 30/60/90 + Riscos + Primeiro Passo).")
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      <aside className="hidden md:flex md:w-72 lg:w-80 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 to-navy-900/80">
        <div className="px-5 pt-5 pb-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-500">Consultoria</p>
              <p className="text-sm text-slate-400">Painel Estratégico</p>
            </div>
            <div className="h-9 w-9 rounded-full border border-sky-500/50 flex items-center justify-center text-xs font-semibold text-sky-300 bg-slate-950/80">
              CN
            </div>
          </div>

          <button
            type="button"
            onClick={handleNewSession}
            className="btn-primary w-full justify-between text-xs"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Sessão de Consultoria
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 text-xs">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.2em]">
              Histórico de sessões
            </span>
            {isLoadingSessions && <Loader2 className="h-3 w-3 animate-spin text-slate-500" />}
          </div>

          {sessions.length === 0 && !isLoadingSessions && (
            <p className="text-[11px] text-slate-500 px-2">
              As sessões anteriores aparecerão aqui conforme você utilizar o painel.
            </p>
          )}

          {sessions.map((session) => {
            const isActive = session.id === currentSession.id
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => handleSelectSession(session)}
                className={`w-full flex items-start gap-2 rounded-md px-3 py-2 text-left transition group ${
                  isActive ? 'bg-slate-900 border border-sky-700/70' : 'border border-transparent hover:bg-slate-900/60'
                }`}
              >
                <span className="mt-0.5 text-slate-500">
                  <Hash className="h-3 w-3" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[11px] font-medium text-slate-200 truncate">
                    {session.title || 'Sessão de consultoria'}
                  </span>
                  {session.createdAt && (
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      {new Date(session.createdAt).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  )}
                </span>
                <span
                  role="button"
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-600 transition-opacity"
                  title="Excluir conversa"
                >
                  <Trash2 className="h-3 w-3" />
                </span>
              </button>
            )
          })}
        </div>

        <div className="px-4 py-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-medium text-slate-300">{userId}</span>
            <span className="text-[10px] text-slate-500">Acesso corporativo</span>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-900"
          >
            <LogOut className="h-3 w-3" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur flex items-center justify-between px-4 md:px-6 py-3 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-sky-600/90 flex items-center justify-center text-white">
              <MessageSquareMore className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-50">Consultoria Estratégica</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Mentoria de negócios em tempo real, orientada por dados e benchmarks de mercado.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex flex-col text-right">
                <span>Consultor IA Ativo</span>
                <span className="text-sky-600 dark:text-sky-400 font-medium">Linha Estratégica</span>
              </span>
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.2)]" />
            </div>
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              title="Configurações"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        <section className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
            {currentSession.messages.length === 0 && !isLoading && (
              <div className="max-w-2xl mx-auto rounded-xl border border-dashed border-slate-800 bg-slate-950/60 px-6 py-6 md:px-8 md:py-8">
                <p className="text-xs uppercase tracking-[0.25em] text-sky-500 mb-3">Briefing inicial</p>
                <h2 className="text-lg font-semibold text-slate-50 mb-3">
                  Estruture sua sessão de consultoria de negócios
                </h2>
                <p className="text-sm text-slate-400 mb-4">
                  Descreva brevemente o contexto da sua empresa, objetivo da consultoria e horizonte de tempo. A IA
                  irá estruturar uma análise com foco em priorização, riscos e oportunidades.
                </p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• Ex: &quot;Sou CEO de uma SaaS B2B em estágio inicial no Brasil&quot;</li>
                  <li>• Ex: &quot;Quero aumentar receita recorrente em 12 meses&quot;</li>
                  <li>• Ex: &quot;Quero avaliar expansão para novos segmentos ou países&quot;</li>
                </ul>
              </div>
            )}

            {currentSession.messages.map((message) => {
              const isUser = message.sender === 'user'
              return (
                <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-2xl rounded-lg px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-sky-600/90 text-slate-50 shadow-md'
                        : 'bg-slate-900/90 text-slate-50 border border-slate-800'
                    }`}
                  >
                    {!isUser && (
                      <div className="text-[11px] font-medium text-sky-400 mb-1.5">Consultor Estratégico</div>
                    )}
                    {isUser ? (
                      <p>{message.text}</p>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                        
                        <div className="mt-6 pt-4 border-t border-slate-800/50">
                          <p className="text-[10px] text-slate-500 mb-3 uppercase tracking-wider font-medium flex items-center gap-2">
                            <Target className="h-3 w-3" />
                            Aprofundar análise em:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {FOCUS_AREAS.map((area) => (
                              <button
                                key={area.id}
                                onClick={() => handleDeepDive(area)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${area.border} ${area.bg} ${area.color} hover:bg-opacity-20 hover:scale-[1.02] active:scale-[0.98]`}
                              >
                                {area.label}
                                <ArrowRight className="h-3 w-3 opacity-50" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Analisando contexto, cenários e implicações estratégicas...</span>
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-800 bg-slate-950/95 backdrop-blur px-4 md:px-8 py-4">
            <div className="max-w-3xl mx-auto mb-3 overflow-x-auto no-scrollbar">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFocus(null)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
                    selectedFocus === null
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/50 shadow-[0_0_10px_-3px_rgba(14,165,233,0.3)]'
                      : 'bg-slate-900/50 text-slate-500 border border-slate-800 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <Target className="h-3 w-3" />
                  Visão Integrada
                </button>
                {FOCUS_AREAS.map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setSelectedFocus(selectedFocus === area.label ? null : area.label)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
                      selectedFocus === area.label
                        ? `${area.bg} ${area.color} ${area.border} border shadow-sm`
                        : 'bg-slate-900/50 text-slate-500 border border-slate-800 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {area.label}
                  </button>
                ))}
                
                <div className="w-px h-5 bg-slate-800 mx-1 self-center" />
                
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap bg-slate-800 text-sky-400 border border-slate-700 hover:bg-slate-700 hover:text-sky-300 hover:border-sky-500/30"
                  title="Gerar relatório completo da conversa"
                >
                  <FileText className="h-3 w-3" />
                  Gerar Relatório
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-2">
              <div className="flex items-end gap-3">
                <div className="flex-1 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2">
                  <textarea
                    ref={inputRef}
                    rows={2}
                    className="w-full resize-none bg-transparent text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none"
                    placeholder="Formule sua pergunta de negócio de forma objetiva. Ex: 'Quais alavancas posso usar para aumentar margens em 20% nos próximos 12 meses?'"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!canSend}
                  className="btn-primary h-10 w-10 md:w-auto md:px-4 md:gap-2 flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden md:inline text-xs">Enviar</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                As respostas são geradas por modelos de IA e devem ser usadas como insumo para discussão, não como
                recomendação definitiva. Não compartilhe informações confidenciais sem autorização.
              </p>
            </form>
          </div>
        </section>

        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-sky-500" />
                  Configurações
                </h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Language */}
                <div className="space-y-3">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Idioma do Consultor
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { code: 'en', label: 'English' },
                      { code: 'pt', label: 'Português' },
                      { code: 'es', label: 'Español' }
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                          language === lang.code
                            ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/50 text-sky-700 dark:text-sky-400'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone Level */}
                <div className="space-y-3">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Nível de Franqueza
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { level: 1, label: 'Honesto Compassivo', desc: 'Coaching e feedback construtivo.' },
                      { level: 2, label: 'Socrático Cooperativo', desc: 'Investigação conjunta e lógica.' },
                      { level: 3, label: 'Honesto Brutal', desc: 'Verdade crua e corte de autoengano.' }
                    ].map((tone) => (
                      <button
                        key={tone.level}
                        onClick={() => setToneLevel(tone.level)}
                        className={`flex flex-col items-start px-3 py-2 rounded-lg text-sm border transition-all ${
                          toneLevel === tone.level
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-400'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <span className="font-medium">{tone.label}</span>
                        <span className="text-[10px] opacity-80 text-left">{tone.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme */}
                <div className="space-y-3">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    Aparência
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                        theme === 'light'
                           ? 'bg-sky-50 border-sky-200 text-sky-700'
                           : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Sun className="h-4 w-4" />
                      Light Mode
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                        theme === 'dark'
                           ? 'bg-slate-800 border-slate-600 text-sky-400'
                           : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <Moon className="h-4 w-4" />
                      Dark Mode
                    </button>
                  </div>
                </div>

                {/* Subscription */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Plano Pro</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Acesso ilimitado ao consultor</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">
                      <CreditCard className="h-3 w-3" />
                      Manage Subscription
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 text-center text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-800">
                Consultoria de Negócios AI v1.2.0
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
