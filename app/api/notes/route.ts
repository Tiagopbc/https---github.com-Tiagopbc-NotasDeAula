import { NextResponse } from 'next/server'

import { authenticateRequest, hasAuthenticationFailure } from '@/lib/server/auth'
import { createDatabaseErrorResponse } from '@/lib/server/databaseResponse'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)

  if (hasAuthenticationFailure(auth)) {
    return auth.response
  }

  const { data, error } = await auth.supabase
    .from('notes')
    .select('id, title, content, created_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })

  if (error) {
    return createDatabaseErrorResponse('GET /api/notes', error)
  }

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)

  if (hasAuthenticationFailure(auth)) {
    return auth.response
  }

  const body: unknown = await request.json().catch(() => null)
  const title =
    body && typeof body === 'object' && 'title' in body && typeof body.title === 'string'
      ? body.title.trim()
      : ''
  const content =
    body && typeof body === 'object' && 'content' in body && typeof body.content === 'string'
      ? body.content.trim()
      : ''

  if (!title) {
    return NextResponse.json({ error: 'O título da nota é obrigatório.' }, { status: 400 })
  }

  if (!content) {
    return NextResponse.json({ error: 'O conteúdo da nota é obrigatório.' }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('notes')
    .insert({ title, content, user_id: auth.user.id })
    .select('id, title, content, created_at')
    .single()

  if (error) {
    return createDatabaseErrorResponse('POST /api/notes', error)
  }

  return NextResponse.json(data, { status: 201 })
}
