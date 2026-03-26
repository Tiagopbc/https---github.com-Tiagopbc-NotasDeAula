import { NextResponse } from 'next/server'

import { authenticateRequest, hasAuthenticationFailure } from '@/lib/server/auth'
import { createDatabaseErrorResponse } from '@/lib/server/databaseResponse'

export const dynamic = 'force-dynamic'

function getNoteId(value: string) {
  const noteId = Number(value)
  return Number.isInteger(noteId) && noteId > 0 ? noteId : null
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request)

  if (hasAuthenticationFailure(auth)) {
    return auth.response
  }

  const { id } = await context.params
  const noteId = getNoteId(id)

  if (!noteId) {
    return NextResponse.json({ error: 'Id da nota invalido.' }, { status: 400 })
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
    return NextResponse.json({ error: 'O titulo da nota e obrigatorio.' }, { status: 400 })
  }

  if (!content) {
    return NextResponse.json({ error: 'O conteudo da nota e obrigatorio.' }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('notes')
    .update({ title, content })
    .eq('id', noteId)
    .eq('user_id', auth.user.id)
    .select('id, title, content, created_at')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Nota nao encontrada.' }, { status: 404 })
    }

    return createDatabaseErrorResponse('PATCH /api/notes/[id]', error)
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request)

  if (hasAuthenticationFailure(auth)) {
    return auth.response
  }

  const { id } = await context.params
  const noteId = getNoteId(id)

  if (!noteId) {
    return NextResponse.json({ error: 'Id da nota invalido.' }, { status: 400 })
  }

  const { error, count } = await auth.supabase
    .from('notes')
    .delete({ count: 'exact' })
    .eq('id', noteId)
    .eq('user_id', auth.user.id)

  if (error) {
    return createDatabaseErrorResponse('DELETE /api/notes/[id]', error)
  }

  if (!count) {
    return NextResponse.json({ error: 'Nota nao encontrada.' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
