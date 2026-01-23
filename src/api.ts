const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/consultoria'
const CLIENT_API_KEY = import.meta.env.VITE_CLIENT_API_KEY || ''

export type SessionSummary = {
  id: string
  title: string
  createdAt?: string
}

export type ChatMessage = {
  id: string
  sender: 'user' | 'ai'
  text: string
  createdAt: string
}

export type ChatResponse = {
  conversationId: string
  reply: string
}

export async function sendConsultoriaMessage(params: {
  userId: string
  conversationId: string | null
  message: string
  history?: ChatMessage[]
  focus?: string | null
  language?: string
  toneLevel?: number
}): Promise<ChatResponse> {
  // Converte histórico para o formato do Gemini (se necessário pelo backend)
  // O backend espera { message, history: [{ role: 'user'|'model', parts: [{ text: '...' }] }] }
  const formattedHistory = (params.history || []).map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLIENT_API_KEY,
    },
    body: JSON.stringify({
      message: params.message,
      history: formattedHistory,
      focus: params.focus,
      language: params.language,
      toneLevel: params.toneLevel,
    }),
  })

  if (!response.ok) {
    throw new Error('Falha ao comunicar com o serviço de consultoria')
  }

  const data = await response.json()

  return {
    conversationId: params.conversationId ?? crypto.randomUUID(),
    reply: data.reply || 'Sem resposta do consultor.',
  }
}

export async function fetchSessions(_userId: string): Promise<SessionSummary[]> {
  // Como removemos o banco de dados do Make, por enquanto retornamos vazio
  // Futuramente, isso pode ser conectado a um Supabase/Postgres
  return []
}
