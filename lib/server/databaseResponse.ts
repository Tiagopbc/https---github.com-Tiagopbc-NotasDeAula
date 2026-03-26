import 'server-only'

import { NextResponse } from 'next/server'

import { getFriendlyDatabaseError, type DatabaseErrorLike } from '@/lib/databaseError'

export function createDatabaseErrorResponse(context: string, error: DatabaseErrorLike) {
  console.error(`[${context}]`, {
    code: error.code ?? 'unknown',
    message: error.message,
  })

  const friendlyError = getFriendlyDatabaseError(error)

  return NextResponse.json({ error: friendlyError.message }, { status: friendlyError.status })
}
