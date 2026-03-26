import { supabase } from '@/lib/supabaseClient'
import type { Note } from '@/lib/notes'

function getErrorMessage(body: unknown, fallback: string) {
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
    return body.error
  }

  return fallback
}

async function getAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Sessao nao encontrada.')
  }

  return session.access_token
}

async function requestWithSession(input: RequestInfo | URL, init?: RequestInit) {
  const accessToken = await getAccessToken()
  const headers = new Headers(init?.headers)

  headers.set('Authorization', `Bearer ${accessToken}`)

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(input, {
    ...init,
    cache: init?.cache ?? 'no-store',
    headers,
  })
}

export async function getNotes(): Promise<Note[]> {
  const response = await requestWithSession('/api/notes')
  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(getErrorMessage(body, 'Nao foi possivel carregar as notas.'))
  }

  return Array.isArray(body) ? (body as Note[]) : []
}

export async function createNote(title: string, content: string) {
  const response = await requestWithSession('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ title, content }),
  })
  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(getErrorMessage(body, 'Nao foi possivel salvar a nota.'))
  }
}

export async function updateNote(noteId: number, title: string, content: string) {
  const response = await requestWithSession(`/api/notes/${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title, content }),
  })
  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(getErrorMessage(body, 'Nao foi possivel atualizar a nota.'))
  }
}

export async function deleteNote(noteId: number) {
  const response = await requestWithSession(`/api/notes/${noteId}`, {
    method: 'DELETE',
  })
  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(getErrorMessage(body, 'Nao foi possivel excluir a nota.'))
  }
}
