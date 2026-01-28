import type { FormEvent } from 'react'
import { useState } from 'react'
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth'

export function Login() {
  const { t } = useTranslation()
  const { signInWithEmail, signInWithPassword, signUp } = useAuth()
  const [mode, setMode] = useState<'password' | 'magic_link' | 'signup'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function submitLogin() {
    if (!email.trim()) return
    if ((mode === 'password' || mode === 'signup') && !password) return

    setLoading(true)
    setMessage(null)

    try {
      if (mode === 'password') {
        const { error } = await signInWithPassword(email, password)
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setMessage({ type: 'error', text: 'E-mail não confirmado.' })
          } else {
            setMessage({ type: 'error', text: 'Email ou senha incorretos.' })
          }
        }
      } else if (mode === 'signup') {
        const { error, data } = await signUp(email, password)
        if (error) {
          console.error('Signup error:', error)
          setMessage({ type: 'error', text: error.message || 'Erro ao criar conta.' })
        } else {
           if (data?.user && !data.session) {
              setMessage({ type: 'success', text: 'Conta criada! Verifique seu e-mail para confirmar.' })
           } else {
              // Auto logged in
           }
        }
      } else {
        const { error } = await signInWithEmail(email)
        if (error) {
          console.error('Auth error:', error)
          setMessage({ type: 'error', text: error.message || 'Erro ao enviar link. Verifique o e-mail.' })
        } else {
          setMessage({ type: 'success', text: 'Link de acesso enviado! Verifique sua caixa de entrada.' })
        }
      }
    } catch (err: any) {
      console.error('Unexpected error:', err)
      setMessage({ type: 'error', text: err?.message || 'Erro inesperado. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await submitLogin()
  }

  return (
    <div className="min-h-screen bg-bio-deep p-4 font-sans flex items-stretch">
      <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        
        {/* Left Block: Hero / Branding */}
        <div className="bg-bio-purple relative flex flex-col justify-between p-8 lg:p-16 overflow-hidden group">
           <div className="z-10">
             <div className="flex items-center gap-3 mb-8">
               <div className="w-4 h-4 bg-bio-lime" />
               <span className="font-mono text-xs font-bold uppercase tracking-widest text-bio-deep">Consultoria.AI</span>
             </div>
             <h1 className="font-mono text-5xl lg:text-7xl font-bold text-bio-deep leading-tight tracking-tight">
               ADVANCING<br/>
               BUSINESS<br/>
               INTELLIGENCE
             </h1>
           </div>

           <div className="z-10 space-y-4">
             <div className="w-24 h-2 bg-bio-lime" />
             <p className="font-sans text-xl lg:text-2xl text-bio-deep font-medium max-w-md">
               {t('login.subtitle')}
             </p>
           </div>
        </div>

        {/* Right Block: Login Form */}
        <div className="flex flex-col gap-4">
          <div className="bg-bio-teal flex-1 flex flex-col justify-center p-8 lg:p-16 relative overflow-hidden">
             <div className="absolute inset-0 bg-cross-pattern opacity-10" />
             
             <div className="relative z-10 max-w-md mx-auto w-full space-y-8">
                <div>
                  <h2 className="font-mono text-3xl font-bold text-bio-deep mb-2">
                    {mode === 'signup' ? 'CRIAR CONTA' : (mode === 'password' ? 'ENTRAR' : 'ACESSO')}
                  </h2>
                  <p className="text-bio-deep/70 font-mono text-xs uppercase tracking-wider">
                    {mode === 'signup' ? 'Preencha seus dados' : 'Credenciais de acesso'}
                  </p>
                </div>

                {message && (
                  <div className={`p-4 font-mono text-xs font-bold border-l-4 ${
                    message.type === 'success' ? 'bg-bio-lime/20 border-bio-lime text-bio-deep' : 'bg-bio-deep/10 border-bio-deep text-bio-deep'
                  }`}>
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-mono text-xs font-bold text-bio-deep uppercase block">Email</label>
                    <input
                      type="email"
                      className="w-full bg-bio-deep/5 border-2 border-bio-deep/10 p-4 font-mono text-sm text-bio-deep placeholder:text-bio-deep/40 focus:outline-none focus:border-bio-deep focus:bg-bio-deep/10 transition-all"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  {(mode === 'password' || mode === 'signup') && (
                    <div className="space-y-2">
                      <label className="font-mono text-xs font-bold text-bio-deep uppercase block">Senha</label>
                      <input
                        type="password"
                        className="w-full bg-bio-deep/5 border-2 border-bio-deep/10 p-4 font-mono text-sm text-bio-deep placeholder:text-bio-deep/40 focus:outline-none focus:border-bio-deep focus:bg-bio-deep/10 transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-bio-deep text-bio-lime font-mono font-bold text-lg py-5 hover:bg-opacity-95 transition-colors flex items-center justify-center gap-3"
                  >
                    {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                    {mode === 'signup' ? 'REGISTRAR' : (mode === 'magic_link' && message?.type === 'success' ? 'ENVIADO' : 'INICIAR SESSÃO')}
                    {!loading && <ArrowRight className="h-5 w-5" />}
                  </button>
                </form>

                <div className="flex gap-4 pt-4 border-t border-bio-deep/10">
                   {mode === 'password' && (
                     <>
                       <button onClick={() => setMode('magic_link')} className="text-[10px] font-mono font-bold uppercase text-bio-deep/60 hover:text-bio-deep">Sem senha</button>
                       <button onClick={() => setMode('signup')} className="text-[10px] font-mono font-bold uppercase text-bio-deep/60 hover:text-bio-deep ml-auto">Criar conta</button>
                     </>
                   )}
                   {mode !== 'password' && (
                     <button onClick={() => setMode('password')} className="text-[10px] font-mono font-bold uppercase text-bio-deep/60 hover:text-bio-deep flex items-center gap-1">
                       <ArrowLeft className="h-3 w-3" /> Voltar
                     </button>
                   )}
                </div>
             </div>
          </div>

          <div className="h-24 bg-bio-lime p-6 flex items-center justify-between">
             <div className="flex gap-2">
               <div className="w-2 h-2 bg-bio-deep rounded-full" />
               <div className="w-2 h-2 bg-bio-deep rounded-full opacity-50" />
               <div className="w-2 h-2 bg-bio-deep rounded-full opacity-25" />
             </div>
             <p className="font-mono text-[10px] font-bold text-bio-deep uppercase">Secure Environment v2.0</p>
          </div>
        </div>

      </div>
    </div>
  )
}
