import { Plus, Trash2, Loader2, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { SessionSummary } from '../api'
import { useState } from 'react'

interface SidebarProps {
  sessions: SessionSummary[]
  currentSessionId: string | null
  isLoading: boolean
  onNewSession: () => void
  onSelectSession: (session: SessionSummary) => void
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void
  userId: string | null
  onSignOut: () => void
  isMobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({
  sessions,
  currentSessionId,
  isLoading,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  userId,
  onSignOut,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { t, i18n } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col border-r-4 border-bio-teal bg-bio-white dark:bg-bio-deep text-bio-deep dark:text-bio-white transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-72 ${isCollapsed ? 'md:w-20' : 'md:w-80'}`}>
      <div className={`bg-bio-white dark:bg-bio-deep relative overflow-hidden group flex flex-col ${isCollapsed ? 'p-4 items-center' : 'p-6 md:p-8'}`}>
        <div className="relative z-10 flex justify-between items-start w-full">
          {!isCollapsed && (
            <div className="text-[10px] font-bold uppercase tracking-widest text-bio-lime mb-2 font-mono flex flex-col items-start gap-1">
              <span>Consultoria</span>
              <span>Empresarial</span>
              <span>Multi-Agente</span>
            </div>
          )}
          <div className={`flex items-center gap-2 ${isCollapsed ? 'mx-auto' : ''}`}>
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden text-bio-lime hover:text-bio-white transition-colors"
              title="Fechar"
            >
              <PanelLeftClose className="h-6 w-6" />
            </button>
            <button 
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:inline-flex text-bio-lime hover:text-bio-white transition-colors"
              title={isCollapsed ? "Expandir" : "Recolher"}
            >
              {isCollapsed ? <PanelLeftOpen className="h-6 w-6" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onNewSession}
          className={`mt-8 bg-bio-lime text-bio-deep font-mono font-bold hover:bg-bio-white transition-colors flex items-center justify-center gap-2 uppercase tracking-wide text-sm ${isCollapsed ? 'w-10 h-10 rounded-full p-0' : 'w-full py-4'}`}
          title={t('chat.sidebar.newSessionButton')}
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && t('chat.sidebar.newSessionButton')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-bio-white dark:bg-bio-deep scrollbar-thin">
        <div className={`flex items-center border-b border-bio-white/10 dark:border-bio-white/10 ${isCollapsed ? 'justify-center py-4 px-0' : 'justify-between px-8 py-4'}`}>
          {!isCollapsed && (
            <span className="text-[10px] font-bold text-bio-deep/60 dark:text-bio-white/50 uppercase tracking-widest font-mono">
              {t('chat.sidebar.history')}
            </span>
          )}
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-bio-lime" />}
        </div>

        <div className="grid grid-cols-1">
          {sessions.length === 0 && !isLoading && !isCollapsed && (
            <div className="p-8 text-center border-b border-bio-white/5 dark:border-bio-white/5">
              <p className="text-xs text-bio-deep/60 dark:text-bio-white/40 italic font-mono">
                {t('chat.sidebar.emptyHistory')}
              </p>
            </div>
          )}

          {sessions.map((session) => {
            const isActive = session.id === currentSessionId
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelectSession(session)}
                className={`w-full text-left border-b border-bio-white/10 dark:border-bio-white/10 transition-all group relative ${
                  isActive 
                    ? 'bg-bio-purple text-bio-deep' 
                    : 'bg-bio-white dark:bg-bio-deep text-bio-deep dark:text-bio-white hover:bg-bio-deep/5 dark:hover:bg-bio-white/5'
                } ${isCollapsed ? 'p-4 flex justify-center' : 'p-6'}`}
                title={isCollapsed ? (session.title || t('chat.session.defaultTitle')) : undefined}
              >
                {!isCollapsed ? (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest font-mono ${isActive ? 'text-bio-deep/70' : 'text-bio-lime'}`}>
                         {session.createdAt ? new Date(session.createdAt).toLocaleDateString(i18n.language) : 'NO DATE'}
                      </span>
                      {isActive && <div className="w-2 h-2 bg-bio-deep rounded-full animate-pulse" />}
                    </div>
                    
                    <h3 className={`font-mono font-bold text-sm leading-tight line-clamp-2 ${isActive ? 'text-bio-deep' : 'text-bio-deep dark:text-bio-white'}`}>
                       {session.title || t('chat.session.defaultTitle')}
                    </h3>

                    <span
                      role="button"
                      onClick={(e) => onDeleteSession(session.id, e)}
                      className={`absolute right-4 bottom-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-bio-deep hover:bg-bio-deep/10' : 'text-bio-deep dark:text-bio-white hover:bg-bio-deep/5 dark:hover:bg-bio-white/10'}`}
                      title={t('chat.sidebar.deleteConversation')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </span>
                  </>
                ) : (
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-bio-deep' : 'bg-bio-lime'}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className={`border-t-4 border-bio-teal bg-bio-white dark:bg-bio-deep ${isCollapsed ? 'p-4 flex justify-center' : 'p-6'}`}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-bold text-bio-deep dark:text-bio-white tracking-tight font-mono truncate max-w-[150px]">{userId}</span>
              <span className="text-[10px] text-bio-lime uppercase tracking-widest font-mono">{t('chat.sidebar.userAccessLevel')}</span>
            </div>
          )}
          <button
            type="button"
            onClick={onSignOut}
            className={`text-bio-deep/60 dark:text-bio-white/50 hover:text-bio-lime hover:bg-bio-deep/5 dark:hover:bg-bio-white/5 transition-all ${isCollapsed ? 'p-2' : 'p-3'}`}
            title={t('chat.sidebar.logout')}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
