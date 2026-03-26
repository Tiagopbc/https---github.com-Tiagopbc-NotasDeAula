import 'server-only'

import type { SupabaseClient, User } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import { createServerSupabase, getAccessToken } from '@/lib/supabaseServer'

type AuthenticatedRequest = {
  supabase: SupabaseClient
  user: User
}

type AuthenticationFailure = {
  response: NextResponse
}

export type AuthenticatedRequestResult = AuthenticatedRequest | AuthenticationFailure

export function hasAuthenticationFailure(
  result: AuthenticatedRequestResult
): result is AuthenticationFailure {
  return 'response' in result
}

export async function authenticateRequest(request: Request): Promise<AuthenticatedRequestResult> {
  const accessToken = getAccessToken(request)

  if (!accessToken) {
    return {
      response: NextResponse.json({ error: 'Sessao nao encontrada.' }, { status: 401 }),
    }
  }

  const supabase = createServerSupabase(accessToken)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      response: NextResponse.json({ error: 'Sessao invalida.' }, { status: 401 }),
    }
  }

  return { supabase, user }
}
