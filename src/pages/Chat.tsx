import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ChatInput } from '../components/ChatInput'
import { SettingsPanel } from '../components/SettingsPanel'
import { Sidebar } from '../components/Sidebar'
import { ChatHeader } from '../components/Chat/ChatHeader'
import { MessageList } from '../components/Chat/MessageList'
import { EmptyState } from '../components/Chat/EmptyState'

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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [input, setInput] = useState('')

  const focusAreas = useMemo(() => FOCUS_AREAS(t), [t])

  async function handleSubmit(e: React.FormEvent, files?: File[] | null) {
    e.preventDefault()
    if ((!input.trim() && (!files || files.length === 0)) || isLoading) return
    const msg = input
    setInput('')
    await sendMessage(msg, selectedFocus, files)
  }

  function handleDeepDive(area: { id: string; label: string }) {
    sendMessage(t('chat.body.aiMessage.deepDive') + ` ${area.label}`, area.label)
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
          <ChatHeader 
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          <section className="flex-1 flex flex-col min-h-0 relative">
            <div className="absolute inset-0 bg-cross-pattern opacity-5 pointer-events-none" />
            
            <div className="flex-1 overflow-y-auto py-8 scroll-smooth">
              <div className="max-w-5xl mx-auto w-full px-6 md:px-8 space-y-8">
                {currentSession.messages.length === 0 && !isLoading && (
                  <EmptyState />
                )}

                <MessageList 
                  messages={currentSession.messages}
                  isLoading={isLoading}
                  error={error}
                  focusAreas={focusAreas}
                  onDeepDive={handleDeepDive}
                />
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
                />
              </div>
            </div>
          </section>

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
