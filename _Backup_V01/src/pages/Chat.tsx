import type { FormEvent, KeyboardEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Hash, Loader2, LogOut, MessageSquareMore, Plus, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '../auth'
import type { ChatMessage, SessionSummary } from '../api'
import { fetchSessions, sendConsultoriaMessage } from '../api'

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
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!userId) return
    setIsLoadingSessions(true)

    fetchSessions(userId)
      .then((list) => setSessions(list))
      .catch(() => setSessions([]))
      .finally(() => setIsLoadingSessions(false))
  }, [userId])

  useEffect(() => {
    if (!messagesEndRef.current) return
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [currentSession.messages.length])

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
    setCurrentSession({
      id: session.id,
      title: session.title,
      messages: [],
    })
    setError(null)
  }

  async function sendMessage() {
    if (!userId || !canSend) return

    const text = input.trim()
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
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const result = await sendConsultoriaMessage({
        userId,
        conversationId: currentSession.id,
        message: text,
      })

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: result.reply,
        createdAt: new Date().toISOString(),
      }

      setCurrentSession((prev) => ({
        ...prev,
        id: result.conversationId,
        messages: [...prev.messages, aiMessage],
      }))
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

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 text-xs">
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
                className={`w-full flex items-start gap-2 rounded-md px-3 py-2 text-left transition ${
                  isActive ? 'bg-slate-900 border border-sky-700/70' : 'border border-transparent hover:bg-slate-900/60'
                }`}
              >
                <span className="mt-0.5 text-slate-500">
                  <Hash className="h-3 w-3" />
                </span>
                <span className="flex-1">
                  <span className="block text-[11px] font-medium text-slate-200">
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

      <main className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur flex items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-sky-600/90 flex items-center justify-center text-slate-50">
              <MessageSquareMore className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-semibold text-slate-50">Consultoria Estratégica</h1>
              <p className="text-[11px] text-slate-400">
                Mentoria de negócios em tempo real, orientada por dados e benchmarks de mercado.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="hidden sm:inline-flex flex-col text-right">
              <span>Consultor IA Ativo</span>
              <span className="text-sky-400">Linha Estratégica</span>
            </span>
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.3)]" />
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
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-2">
              <div className="flex items-end gap-3">
                <div className="flex-1 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2">
                  <textarea
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
                recomendação definitiva.
              </p>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}
