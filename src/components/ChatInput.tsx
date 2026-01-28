import { useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react'
import { FileText, Loader2, Send, Mic } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  onSubmit: (e: FormEvent) => void
  onGenerateReport: () => void
  onToggleLive: () => void
  isLoading: boolean
}

export function ChatInput({ input, setInput, onSubmit, onGenerateReport, onToggleLive, isLoading }: ChatInputProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const canSend = input.trim().length > 0 && !isLoading

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

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit(event as unknown as FormEvent)
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-4">
      <div className="flex flex-col md:flex-row items-stretch gap-4">
        <div className="flex-1 bg-bio-deep/5 dark:bg-bio-white/5 border-2 border-bio-deep/10 dark:border-bio-white/20 p-4 relative group focus-within:border-bio-teal dark:focus-within:border-bio-lime transition-colors flex items-center">
          <div className="absolute top-0 left-0 w-1 h-4 bg-bio-teal dark:bg-bio-lime opacity-30" />
          <textarea
            id="chat-input"
            name="message"
            aria-label={t('chat.footer.inputPlaceholder')}
            ref={inputRef}
            rows={1}
            className="w-full resize-none bg-transparent text-sm text-bio-deep dark:text-bio-white placeholder:text-bio-deep/40 dark:placeholder:text-bio-white/40 focus:outline-none py-1 leading-relaxed font-mono"
            placeholder={t('chat.footer.textareaPlaceholder')}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="flex flex-wrap items-stretch gap-3">
          <button
            type="submit"
            disabled={!canSend}
            className="h-full w-full sm:w-auto px-6 bg-bio-deep text-bio-lime dark:bg-bio-white dark:text-bio-deep font-mono font-bold hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="ml-2 uppercase tracking-wide">{t('chat.footer.send')}</span>
          </button>

          <button
            type="button"
            onClick={onToggleLive}
            className="h-full px-4 bg-bio-white border-2 border-bio-deep/10 text-bio-deep dark:bg-bio-white/5 dark:border-bio-white/20 dark:text-bio-white hover:border-bio-lime hover:bg-bio-lime/10 dark:hover:bg-bio-white/10 transition-all relative group flex items-center justify-center"
            title="Live Mode"
          >
            <div className="absolute top-0 right-0 w-2 h-2 bg-bio-lime animate-pulse" />
            <Mic className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={onGenerateReport}
            className="h-full px-4 bg-bio-white border-2 border-bio-deep/10 text-bio-deep/60 dark:bg-bio-white/5 dark:border-bio-white/20 dark:text-bio-white/60 hover:text-bio-purple hover:border-bio-purple hover:bg-bio-purple/10 dark:hover:text-bio-white transition-all flex items-center justify-center"
            title={t('chat.footer.generateReportTooltip')}
          >
            <FileText className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-[1px] flex-1 bg-bio-deep/10 dark:bg-bio-white/10" />
        <p className="text-[9px] uppercase tracking-widest text-bio-deep/40 dark:text-bio-white/40 font-bold whitespace-nowrap font-mono">
          {t('chat.footer.disclaimer')}
        </p>
        <div className="h-[1px] flex-1 bg-bio-deep/10 dark:bg-bio-white/10" />
      </div>
    </form>
  )
}
