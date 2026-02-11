import { useRef, useEffect, useState, type FormEvent, type KeyboardEvent, type ChangeEvent } from 'react'
import { Loader2, Send, Paperclip, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  onSubmit: (e: FormEvent, files?: File[] | null) => void
  isLoading: boolean
}

export function ChatInput({ input, setInput, onSubmit, isLoading }: ChatInputProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const canSend = (input.trim().length > 0 || selectedFiles.length > 0) && !isLoading

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
      handleSubmit(event as unknown as FormEvent)
    }
  }

  function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files)
      setSelectedFiles(prev => [...prev, ...newFiles])
    }
    // Reset input to allow selecting the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleRemoveFile(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSend) return
    onSubmit(e, selectedFiles)
    setSelectedFiles([])
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 bg-bio-deep/5 dark:bg-bio-white/10 p-2 border-l-2 border-bio-teal dark:border-bio-lime">
          {selectedFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center gap-2 bg-bio-deep/10 dark:bg-bio-white/20 px-2 py-1 rounded">
              <Paperclip className="h-3 w-3 text-bio-deep/60 dark:text-bio-white/60" />
              <span className="text-xs font-mono text-bio-deep dark:text-bio-white truncate max-w-[150px]">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="text-bio-deep/40 hover:text-red-500 dark:text-bio-white/40 dark:hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col md:flex-row items-stretch gap-4">
        <div className="flex-1 bg-white dark:bg-bio-white/5 border-2 border-bio-deep/10 dark:border-bio-white/20 p-4 relative group focus-within:border-bio-teal dark:focus-within:border-bio-lime transition-colors flex items-center">
          <div className="absolute top-0 left-0 w-1 h-4 bg-bio-teal dark:bg-bio-lime opacity-30" />
          
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".txt,.md,.csv,.json,.pdf,.docx"
          />

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
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-full w-10 sm:w-10 bg-bio-deep/10 dark:bg-bio-white/10 text-bio-deep dark:text-bio-white border border-bio-deep/20 dark:border-bio-white/20 hover:bg-bio-deep/20 dark:hover:bg-bio-white/20 transition-colors flex items-center justify-center"
            title="Anexar arquivo de texto"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            type="submit"
            disabled={!canSend}
            className="h-full w-full sm:w-auto px-6 bg-bio-deep text-bio-lime dark:bg-bio-white dark:text-bio-deep font-mono font-bold hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="ml-2 uppercase tracking-wide">{t('chat.footer.send')}</span>
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
