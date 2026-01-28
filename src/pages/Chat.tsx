import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, MessageSquareMore, Settings, PanelLeftOpen } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'

import { ChatInput } from '../components/ChatInput'
import { SettingsPanel } from '../components/SettingsPanel'
import { Sidebar } from '../components/Sidebar'
import { LiveMode } from '../components/LiveMode'

import { useAuth } from '../auth'
import { useSettings } from '../hooks/useSettings'
import { useChatSession } from '../hooks/useChatSession'
import { FOCUS_AREAS } from '../utils/constants'

export function Chat() {
  const { t } = useTranslation()
  const { user, session, signOut } = useAuth()
  
  const {
    language, setLanguage,
    theme, setTheme,
    toneLevel, setToneLevel
  } = useSettings()

  const {
    sessions,
    currentSession,
    isLoading,
    isLoadingSessions,
    error,
    handleNewSession,
    handleSelectSession,
    handleDeleteSession,
    sendMessage,
  } = useChatSession({ user, session, language, toneLevel, t })

  const [selectedFocus, setSelectedFocus] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [input, setInput] = useState('')

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const focusAreas = useMemo(() => FOCUS_AREAS(t), [t])

  // Auto-scroll to bottom
  useEffect(() => {
    if (!messagesEndRef.current) return
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [currentSession.messages.length])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const msg = input
    setInput('')
    await sendMessage(msg, selectedFocus)
  }

  function handleDeepDive(area: { id: string; label: string }) {
    sendMessage(t('chat.body.aiMessage.deepDive') + ` ${area.label}`, area.label)
  }

  function handleGenerateReport() {
    sendMessage(t('chat.footer.generateReport'))
  }

  return (
    <div className="h-screen bg-bio-deep/5 text-bio-deep dark:bg-bio-deep dark:text-bio-white flex font-sans overflow-hidden">
      <div className="flex-1 flex max-w-[1920px] mx-auto w-full border-x border-bio-deep/10 dark:border-bio-white/10 bg-bio-deep/5 dark:bg-bio-deep relative">
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSession.id}
          isLoading={isLoadingSessions}
          onNewSession={handleNewSession}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          userId={user?.id || ''}
          userEmail={user?.email}
          userName={user?.user_metadata?.full_name || user?.user_metadata?.name}
          onSignOut={signOut}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
        {isMobileSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-bio-deep/40 dark:bg-bio-white/10 md:hidden"
            aria-label="Fechar menu"
          />
        )}

        <main className="flex-1 flex flex-col min-w-0 bg-bio-deep/5 dark:bg-bio-deep relative">
          <header className="h-16 sm:h-20 bg-bio-teal flex items-center justify-between px-4 sm:px-6 md:px-8 border-b-4 border-bio-deep dark:border-bio-white/10">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden p-2 bg-bio-deep text-bio-teal hover:bg-bio-purple hover:text-bio-deep transition-colors"
                aria-label="Abrir menu"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
              <div className="w-10 h-10 bg-bio-deep flex items-center justify-center">
                <MessageSquareMore className="h-5 w-5 text-bio-teal" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-bio-deep tracking-tight font-mono leading-none uppercase">{t('chat.header.title')}</h1>
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
                    <div className="md:col-span-12 bg-white dark:bg-bio-deep p-8 md:p-12 flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
                      <div>
                        <p className="text-xs font-bold text-bio-lime uppercase tracking-widest mb-4 font-mono">{t('chat.body.initialBriefing.title')}</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-bio-deep dark:text-bio-white font-mono leading-tight">
                          {t('chat.body.initialBriefing.heading')}
                        </h2>
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
                            ? 'bg-bio-deep text-bio-white dark:bg-bio-white dark:text-bio-deep ml-4 sm:ml-12'
                            : 'bg-white dark:bg-bio-deep/80 border border-bio-deep/10 dark:border-bio-white/10 text-bio-deep dark:text-bio-white mr-4 sm:mr-12'
                        }`}
                      >
                        <div className="absolute -top-3 left-6 px-2 bg-inherit">
                          <span className={`text-[10px] font-bold uppercase tracking-widest font-mono ${isUser ? 'text-bio-lime' : 'text-bio-deep dark:text-bio-white'}`}>
                            {isUser ? 'USER_INPUT' : 'SYSTEM_RESPONSE'}


                          </span>
                        </div>
                        
                        <ReactMarkdown className={`prose max-w-none ${isUser ? 'prose-invert' : 'dark:prose-invert prose-headings:font-mono prose-headings:uppercase'}`}>
                          {message.text}
                        </ReactMarkdown>

                        {!isUser && (
                          <div className="mt-6 pt-4 border-t-2 border-bio-deep/10 dark:border-bio-white/10 flex flex-wrap gap-2">
                            {focusAreas.map((area) => (
                              <button
                                key={area.id}
                                onClick={() => handleDeepDive(area)}
                                className="px-3 py-1 bg-bio-purple/10 hover:bg-bio-purple text-bio-deep dark:text-bio-white text-[10px] font-bold uppercase tracking-widest transition-colors font-mono"
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

            <div className="bg-bio-deep/5 border-t border-bio-deep/10 dark:bg-bio-deep dark:border-bio-white/10">
              <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 md:px-8 py-4">
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
              token={session?.access_token}
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
