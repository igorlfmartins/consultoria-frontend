import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithEmail: (email: string) => Promise<{ error: any }>
  signInWithPassword: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any, data: any }>
  resendSignUp: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!active) return
        if (error) throw error
        setSession(data.session)
        setUser(data.session?.user ?? null)
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          console.error('Auth getSession error:', e)
        }
      } finally {
        if (active) setLoading(false)
      }
    })()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function signInWithEmail(email: string) {
    const redirectTo = window.location.origin // Redireciona para a home após clicar no link
    return supabase.auth.signInWithOtp({ 
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
      }
    })
  }

  async function signInWithPassword(email: string, password: string) {
    return supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    })
  }

  async function signUp(email: string, password: string) {
    const redirectTo = window.location.origin
    return supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        emailRedirectTo: redirectTo,
      }
    })
  }

  async function resendSignUp(email: string) {
    const redirectTo = window.location.origin
    return supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
      }
    })
  }

  async function updatePassword(password: string) {
    return supabase.auth.updateUser({ password })
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithEmail, signInWithPassword, signUp, resendSignUp, updatePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return ctx
}
