import { frontendEnv } from './config/env.js'

const RAW_API_URL = frontendEnv.VITE_API_URL
const API_BASE_URL = (() => {
  if (!RAW_API_URL) return 'http://localhost:3000/api'
  const trimmed = RAW_API_URL.trim()
  if (!trimmed) return 'http://localhost:3000/api'
  // Remove trailing slash
  const clean = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
  // If it ends with /consultoria, strip it to get base /api
  if (clean.endsWith('/consultoria')) return clean.slice(0, -'/consultoria'.length)
  // If it ends with /api, keep it
  if (clean.endsWith('/api')) return clean
  // Otherwise append /api
  return `${clean}/api`
})()

const CONSULTORIA_URL = `${API_BASE_URL}/consultoria`

const extractErrorMessage = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.message === 'string') return record.message
    // Handle Zod formatted errors
    if (record._errors && Array.isArray(record._errors) && record._errors.length > 0) {
      return record._errors[0] as string
    }
    // Recursive search in values
    for (const key in record) {
      if (key === '_errors') continue
      const childMsg = extractErrorMessage(record[key])
      if (childMsg) return childMsg
    }
  }
  return null
}

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
  role?: 'user' | 'model' // Add compatibility with DB
  content?: string // Add compatibility with DB
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
  token?: string
  files?: File[] | null
}): Promise<ChatResponse> {
  const formattedHistory = (params.history || []).map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const headers: HeadersInit = {};

  if (params.token) {
    headers['Authorization'] = `Bearer ${params.token}`;
  }

  let body: BodyInit;

  if (params.files && params.files.length > 0) {
    const formData = new FormData();
    // Ensure message is never undefined/null
    formData.append('message', params.message || '');
    
    if (params.conversationId && params.conversationId !== 'null' && params.conversationId !== 'undefined') {
      formData.append('conversationId', params.conversationId);
    }
    
    formData.append('history', JSON.stringify(formattedHistory));
    if (params.focus) formData.append('focus', params.focus);
    if (params.language) formData.append('language', params.language);
    if (params.toneLevel) formData.append('toneLevel', params.toneLevel.toString());
    
    params.files.forEach(file => {
      formData.append('files', file);
    });
    
    body = formData;
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({
      message: params.message,
      conversationId: params.conversationId,
      history: formattedHistory,
      focus: params.focus || undefined,
      language: params.language,
      toneLevel: params.toneLevel,
    });
  }

  const response = await fetch(CONSULTORIA_URL, {
    method: 'POST',
    headers,
    body,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('API Error Response:', errorData);
    
    const errorMessage = extractErrorMessage(errorData.error) 
      || extractErrorMessage(errorData)
      || (typeof errorData.reply === 'string' ? errorData.reply : null)
      || 'Falha ao comunicar com o serviço de consultoria';

    throw new Error(errorMessage);
  }

  const data = await response.json()

  return {
    conversationId: data.conversationId,
    reply: data.reply || 'Sem resposta do consultor.',
  }
}

export async function fetchSessions(token: string): Promise<SessionSummary[]> {
  const response = await fetch(`${API_BASE_URL}/chats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) return [];
  const data = await response.json();
  // Map snake_case to camelCase if needed, but DB returns id, title, created_at
  return data.map((d: any) => ({
    id: d.id,
    title: d.title,
    createdAt: d.created_at
  }));
}

export async function fetchMessages(token: string, chatId: string): Promise<ChatMessage[]> {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.map((msg: any) => ({
    id: msg.id,
    sender: msg.role === 'user' ? 'user' : 'ai',
    text: msg.content,
    createdAt: msg.created_at
  }));
}

export async function deleteSession(token: string, chatId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.ok;
}
