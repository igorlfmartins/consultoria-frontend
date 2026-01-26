import { Plus, Trash2, Loader2, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { SessionSummary } from '../api'

interface SidebarProps {
  sessions: SessionSummary[]
  currentSessionId: string | null
  isLoading: boolean
  onNewSession: () => void
  onSelectSession: (session: SessionSummary) => void
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void
  userId: string | null
  onSignOut: () => void
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
}: SidebarProps) {
  const { t, i18n } = useTranslation()

  return (
    <aside className="hidden md:flex md:w-80 flex-col border-r-4 border-bio-deep bg-bio-deep text-bio-white">
      <div className="p-8 bg-bio-deep relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <div className="w-16 h-16 border-4 border-bio-lime rounded-full" />
        </div>
        
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-bio-lime mb-2 font-mono">{t('chat.sidebar.header')}</p>
        </div>

        <button
          type="button"
          onClick={onNewSession}
          className="mt-8 w-full bg-bio-lime text-bio-deep font-mono font-bold py-4 hover:bg-bio-white transition-colors flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
        >
          <Plus className="h-4 w-4" />
          {t('chat.sidebar.newSessionButton')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-bio-deep">
        <div className="px-8 py-4 flex items-center justify-between border-b border-bio-white/10">
          <span className="text-[10px] font-bold text-bio-white/50 uppercase tracking-widest font-mono">
            {t('chat.sidebar.history')}
          </span>
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-bio-lime" />}
        </div>

        <div className="grid grid-cols-1">
          {sessions.length === 0 && !isLoading && (
            <div className="p-8 text-center border-b border-bio-white/5">
              <p className="text-xs text-bio-white/40 italic font-mono">
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
                className={`w-full text-left p-6 border-b border-bio-white/10 transition-all group relative ${
                  isActive 
                    ? 'bg-bio-purple text-bio-deep' 
                    : 'bg-bio-deep text-bio-white hover:bg-bio-white/5'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest font-mono ${isActive ? 'text-bio-deep/70' : 'text-bio-lime'}`}>
                     {session.createdAt ? new Date(session.createdAt).toLocaleDateString(i18n.language) : 'NO DATE'}
                  </span>
                  {isActive && <div className="w-2 h-2 bg-bio-deep rounded-full animate-pulse" />}
                </div>
                
                <h3 className={`font-mono font-bold text-sm leading-tight line-clamp-2 ${isActive ? 'text-bio-deep' : 'text-bio-white'}`}>
                   {session.title || t('chat.session.defaultTitle')}
                </h3>

                <span
                  role="button"
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className={`absolute right-4 bottom-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-bio-deep hover:bg-bio-deep/10' : 'text-bio-white hover:bg-bio-white/10'}`}
                  title={t('chat.sidebar.deleteConversation')}
                >
                  <Trash2 className="h-4 w-4" />
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-6 border-t-4 border-bio-lime bg-bio-deep">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-bio-white tracking-tight font-mono truncate max-w-[150px]">{userId}</span>
            <span className="text-[10px] text-bio-lime uppercase tracking-widest font-mono">{t('chat.sidebar.userAccessLevel')}</span>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="p-3 text-bio-white/50 hover:text-bio-lime hover:bg-bio-white/5 transition-all"
            title={t('chat.sidebar.logout')}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
