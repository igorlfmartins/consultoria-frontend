const MAKE_WEBHOOK_URL = 'https://seu-webhook-do-make-aqui'

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
}): Promise<ChatResponse> {
  const response = await fetch(MAKE_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'consultoria_chat',
      userId: params.userId,
      conversationId: params.conversationId,
      message: params.message,
    }),
  })

  if (!response.ok) {
    throw new Error('Falha ao comunicar com o serviço de consultoria')
  }

  const data = await response.json()

  return {
    conversationId: data.conversationId ?? params.conversationId ?? crypto.randomUUID(),
    reply: data.reply ?? String(data.message ?? ''),
  }
}

export async function fetchSessions(userId: string): Promise<SessionSummary[]> {
  const response = await fetch(MAKE_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'consultoria_list_sessions',
      userId,
    }),
  })

  if (!response.ok) {
    throw new Error('Falha ao carregar sessões')
  }

  const data = await response.json()

  const rawSessions = Array.isArray(data.sessions) ? data.sessions : []

  return rawSessions.map((s, index) => ({
    id: String(s.id ?? index),
    title: String(s.title ?? `Sessão ${index + 1}`),
    createdAt: s.createdAt ? String(s.createdAt) : undefined,
  }))
}

