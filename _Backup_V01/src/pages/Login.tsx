import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { useAuth } from '../auth'

export function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!email.trim() || !password.trim()) return
    signIn(email)
    navigate('/chat')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-navy-900 to-slate-900 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur-lg shadow-xl px-8 py-10 space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-500">ConsultoriaNegocios</p>
          <h1 className="text-2xl font-semibold text-slate-50">Portal de Consultoria Estratégica</h1>
          <p className="text-sm text-slate-400">
            Acesse o painel para receber análises e recomendações estratégicas em tempo real.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-slate-200">
                E-mail corporativo
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input-base pl-9"
                  placeholder="nome.sobrenome@empresa.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium text-slate-200">
                Senha
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="input-base pl-9"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">
            Acessar Painel
          </button>
        </form>

        <p className="text-[11px] text-slate-500 text-center leading-relaxed">
          Este é um ambiente de consultoria estratégica alimentado por IA. Não compartilhe informações confidenciais
          sem autorização.
        </p>
      </div>
    </div>
  )
}
