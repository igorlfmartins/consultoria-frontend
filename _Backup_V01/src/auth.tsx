import { createContext, useContext, useEffect, useState } from 'react'

type AuthContextValue = {
  userId: string | null
  signIn: (email: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem('consultoria_user_id')
    if (stored) {
      setUserId(stored)
    }
  }, [])

  function signIn(email: string) {
    const trimmed = email.trim()
    setUserId(trimmed)
    window.localStorage.setItem('consultoria_user_id', trimmed)
  }

  function signOut() {
    setUserId(null)
    window.localStorage.removeItem('consultoria_user_id')
  }

  return <AuthContext.Provider value={{ userId, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return ctx
}

