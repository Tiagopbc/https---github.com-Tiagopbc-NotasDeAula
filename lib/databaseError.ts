export type DatabaseErrorLike = {
  message: string
  code?: string
}

export type FriendlyDatabaseError = {
  message: string
  status: number
}

function includesMissingColumn(message: string, columnName: string) {
  return message.includes(`column notes.${columnName} does not exist`)
}

export function getFriendlyDatabaseError(error: DatabaseErrorLike): FriendlyDatabaseError {
  const message = error.message.toLowerCase()

  if (
    includesMissingColumn(message, 'content') ||
    includesMissingColumn(message, 'created_at') ||
    includesMissingColumn(message, 'user_id') ||
    message.includes('schema cache') ||
    message.includes("could not find the 'content' column of 'notes'") ||
    message.includes("could not find the 'created_at' column of 'notes'") ||
    message.includes("could not find the 'user_id' column of 'notes'")
  ) {
    return {
      status: 500,
      message:
        'O schema do Supabase ainda nao refletiu esta versao do app. Execute o SQL do projeto e recarregue o schema do PostgREST com NOTIFY pgrst, \'reload schema\'.',
    }
  }

  if (
    message.includes('relation "public.notes" does not exist') ||
    message.includes('relation "notes" does not exist')
  ) {
    return {
      status: 500,
      message:
        'A tabela notes ainda nao existe no banco. Crie a tabela com o SQL de configuracao do projeto no Supabase.',
    }
  }

  if (message.includes('row-level security')) {
    return {
      status: 403,
      message:
        'A politica de acesso da tabela notes ainda nao foi configurada corretamente no Supabase.',
    }
  }

  return {
    status: 500,
    message: 'Nao foi possivel concluir a operacao agora. Tente novamente em instantes.',
  }
}
