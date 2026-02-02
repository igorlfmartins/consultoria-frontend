import { useTranslation } from 'react-i18next'
import { Settings, PanelLeftOpen } from 'lucide-react'

type ChatHeaderProps = {
  onOpenMobileSidebar: () => void
  onOpenSettings: () => void
}

export function ChatHeader({ onOpenMobileSidebar, onOpenSettings }: ChatHeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="h-16 sm:h-20 bg-bio-teal flex items-center justify-between px-4 sm:px-6 md:px-8 border-b-4 border-bio-deep dark:border-bio-white/10">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 bg-bio-deep text-bio-teal hover:bg-bio-purple hover:text-bio-deep transition-colors"
          aria-label="Abrir menu"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-bio-deep tracking-tight font-mono leading-none uppercase">
            {t('chat.header.title')}
          </h1>
          <p className="text-[10px] font-bold text-bio-deep/60 uppercase tracking-widest font-mono">
            {t('chat.header.systemActive')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">


        <button
          onClick={onOpenSettings}
          className="p-3 bg-bio-deep text-bio-teal hover:bg-bio-purple hover:text-bio-deep transition-colors"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
