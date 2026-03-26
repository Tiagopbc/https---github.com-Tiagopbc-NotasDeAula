# Notas de Aula com Supabase

Projeto em Next.js App Router, montado a partir da mesma arquitetura do `todo-app`, para gerenciar notas de aula com autenticacao e CRUD completo.

## Funcionalidades

- Criar nota com `title` e `content`
- Listar notas ordenadas por data de criacao
- Editar nota inline
- Excluir nota com confirmacao
- Isolamento por usuario autenticado com Supabase Auth

## Banco no Supabase

Use [supabase/setup.sql](/Users/tiagoc/NotasDeAula/supabase/setup.sql) como source of truth.

1. Abra o SQL Editor do Supabase.
2. Execute o conteudo de `supabase/setup.sql`.
3. Se voce for reutilizar o mesmo projeto Supabase do `todo-app`, mantenha as mesmas variaveis de ambiente.

## Variaveis de ambiente

Crie `.env.local` a partir de `.env.local.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=URL_DO_PROJETO
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=CHAVE_PUBLICAVEL
```

## Desenvolvimento

```bash
npm run dev
npm run typecheck
```
