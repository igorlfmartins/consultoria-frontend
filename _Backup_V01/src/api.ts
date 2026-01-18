const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/qpzrnwy6kl6f6xh15wd9kbnfya9dsxuh'

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

  const contentType = response.headers.get('content-type') ?? ''
  let data: any = null
  let textFallback: string | null = null

  if (contentType.includes('application/json')) {
    try {
      data = await response.json()
    } catch {
      textFallback = await response.text()
    }
  } else {
    textFallback = await response.text()
  }

  if (!data) {
    const replyText =
      (textFallback ?? '').trim() || 'O consultor recebeu sua mensagem e está processando a resposta.'

    return {
      conversationId: params.conversationId ?? crypto.randomUUID(),
      reply: replyText,
    }
  }

  return {
    conversationId: data.conversationId ?? params.conversationId ?? crypto.randomUUID(),
    reply: data.reply ?? String(data.message ?? textFallback ?? ''),
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

  const rawSessions = Array.isArray(data.sessions) ? (data.sessions as Array<{ id?: unknown; title?: unknown; createdAt?: unknown }>) : []

  return rawSessions.map((session, index) => ({
    id: String(session.id ?? index),
    title: String(session.title ?? `Sessão ${index + 1}`),
    createdAt: session.createdAt ? String(session.createdAt) : undefined,
  }))
}
