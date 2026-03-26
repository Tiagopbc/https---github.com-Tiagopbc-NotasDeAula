'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import AuthPanel from '@/components/AuthPanel'
import NoteList from '@/components/NoteList'
import { createNote, deleteNote, getNotes, updateNote } from '@/lib/noteApiClient'
import type { Note } from '@/lib/notes'
import { supabase } from '@/lib/supabaseClient'

const tableFields = ['id', 'title', 'content', 'created_at'] as const

const requestedFeatures = [
  {
    index: '01',
    title: 'Criar nota',
    description: 'Formulario com titulo e conteudo para registrar rapidamente o resumo da aula.',
  },
  {
    index: '02',
    title: 'Listar notas',
    description: 'Cards organizados pela data de criacao, com a nota mais recente aparecendo primeiro.',
  },
  {
    index: '03',
    title: 'Editar nota',
    description: 'Edicao inline para ajustar titulo e conteudo sem sair da tela principal.',
  },
  {
    index: '04',
    title: 'Excluir nota',
    description: 'Confirmacao antes da exclusao permanente para evitar perda acidental.',
  },
] as const

const setupChecklist = [
  'Execute o SQL de setup no Supabase para criar a tabela notes e as policies.',
  'Entre com email e senha para isolar as notas por usuario.',
  'Use a mesma logica do todo-app: cliente web, rotas API e validacao no servidor.',
] as const

function formatLatestDate(value: string | null) {
  if (!value) {
    return 'Nenhuma nota ainda'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Data indisponivel'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function Home() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMutatingNote, setIsMutatingNote] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadSession() {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()

        if (!ignore) {
          setSession(currentSession)
        }
      } catch (currentError) {
        if (!ignore) {
          setError(currentError instanceof Error ? currentError.message : 'Erro inesperado.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!ignore) {
        setSession(currentSession)
      }
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [])

  async function refreshNotes() {
    const loadedNotes = await getNotes()
    setNotes(loadedNotes)
  }

  useEffect(() => {
    let ignore = false

    async function loadAuthenticatedData() {
      if (!session) {
        setNotes([])
        setEditingNoteId(null)
        setEditTitle('')
        setEditContent('')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const loadedNotes = await getNotes()

        if (!ignore) {
          setNotes(loadedNotes)
        }
      } catch (currentError) {
        if (!ignore) {
          setError(currentError instanceof Error ? currentError.message : 'Erro inesperado.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void loadAuthenticatedData()

    return () => {
      ignore = true
    }
  }, [session])

  async function handleAddNote() {
    const nextTitle = title.trim()
    const nextContent = content.trim()

    if (!nextTitle || !nextContent) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await createNote(nextTitle, nextContent)
      await refreshNotes()
      setTitle('')
      setContent('')
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Erro inesperado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleStartEdit(note: Note) {
    setEditingNoteId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
    setError(null)
  }

  function handleCancelEdit() {
    setEditingNoteId(null)
    setEditTitle('')
    setEditContent('')
  }

  async function handleSaveEdit(note: Note) {
    const nextTitle = editTitle.trim()
    const nextContent = editContent.trim()

    if (!nextTitle || !nextContent) {
      setError('Titulo e conteudo sao obrigatorios para editar a nota.')
      return
    }

    setIsMutatingNote(true)
    setError(null)

    try {
      await updateNote(note.id, nextTitle, nextContent)
      await refreshNotes()
      handleCancelEdit()
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Erro inesperado.')
    } finally {
      setIsMutatingNote(false)
    }
  }

  async function handleDeleteNote(note: Note) {
    const confirmed = window.confirm(
      `Deseja excluir permanentemente a nota "${note.title}"?`
    )

    if (!confirmed) {
      return
    }

    setIsMutatingNote(true)
    setError(null)

    try {
      await deleteNote(note.id)
      await refreshNotes()

      if (editingNoteId === note.id) {
        handleCancelEdit()
      }
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Erro inesperado.')
    } finally {
      setIsMutatingNote(false)
    }
  }

  async function handleSignOut() {
    setError(null)
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      setError(signOutError.message)
    }
  }

  if (isLoading) {
    return (
      <main className="page-shell">
        <section className="hero">
          <p className="eyebrow">Preparando o caderno</p>
          <h1>Carregando suas notas...</h1>
          <p className="hero-lead">
            Estamos verificando sua sessao e alinhando o ambiente com a mesma estrutura do
            todo-app.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      {!session ? (
        <section className="hero-layout">
          <section className="hero hero-primary">
            <p className="eyebrow">Projeto espelhado do todo-app</p>
            <h1>Sistema de notas de aula com CRUD completo.</h1>
            <p className="hero-lead">
              A estrutura reaproveita a arquitetura do projeto original: autenticacao com
              Supabase, rotas de API protegidas e interface principal para criar, listar, editar
              e excluir notas.
            </p>

            <div className="info-board">
              <article className="schema-card">
                <p className="schema-label">Estrutura da tabela</p>
                <div className="schema-shell">
                  <strong>notes</strong>
                  <ul className="schema-list">
                    {tableFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
                <p className="schema-copy">
                  No SQL do projeto, `user_id` tambem foi incluido para manter o isolamento por
                  usuario do todo-app.
                </p>
              </article>

              <section className="requirements-panel">
                <p className="requirements-kicker">Funcionalidades a implementar</p>
                <div className="requirements-grid">
                  {requestedFeatures.map((feature) => (
                    <article className="requirement-card" key={feature.index}>
                      <span>{feature.index}</span>
                      <h2>{feature.title}</h2>
                      <p>{feature.description}</p>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </section>

          <div className="hero-sidebar">
            <AuthPanel
              onAuthenticated={async () => {
                setError(null)
                await refreshNotes()
              }}
            />

            <section className="panel panel-muted">
              <div className="panel-header panel-header-compact">
                <div>
                  <p className="eyebrow">Como usar</p>
                  <h2>Fluxo montado para seguir o enunciado do print</h2>
                </div>
              </div>

              <ol className="step-list">
                {setupChecklist.map((step, index) => (
                  <li className="step-item" key={step}>
                    <span className="step-index">{index + 1}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </section>
      ) : (
        <>
          <section className="hero hero-compact">
            <p className="eyebrow">Painel de notas</p>
            <h1>Registre, revise e ajuste suas anotacoes sem sair da mesma tela.</h1>
            <p className="hero-lead">
              Cada nota fica vinculada ao usuario autenticado e a lista aparece ordenada por data,
              com edicao inline e confirmacao antes de excluir.
            </p>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Sessao ativa</p>
                <h2>{session.user.email}</h2>
              </div>

              <button className="ghost-button" onClick={() => void handleSignOut()} type="button">
                Sair
              </button>
            </div>

            <div className="quick-stats">
              <div>
                <span>Total de notas</span>
                <strong>{notes.length}</strong>
              </div>
              <div>
                <span>Ultima criacao</span>
                <strong>{formatLatestDate(notes[0]?.created_at ?? null)}</strong>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header panel-header-compact">
              <div>
                <p className="eyebrow">Nova nota</p>
                <h2>Adicione titulo e conteudo da aula</h2>
              </div>
            </div>

            <form
              className="note-form"
              onSubmit={(event) => {
                event.preventDefault()
                void handleAddNote()
              }}
            >
              <label className="field">
                <span>Titulo</span>
                <input
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex.: Resumo de banco de dados"
                  value={title}
                />
              </label>

              <label className="field">
                <span>Conteudo</span>
                <textarea
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Escreva os principais pontos vistos em aula..."
                  rows={7}
                  value={content}
                />
              </label>

              <button
                className="primary-button"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                type="submit"
              >
                {isSubmitting ? 'Salvando...' : 'Criar nota'}
              </button>
            </form>

            {error ? <p className="feedback feedback-error">{error}</p> : null}

            <NoteList
              editContent={editContent}
              editTitle={editTitle}
              editingNoteId={editingNoteId}
              isMutating={isMutatingNote}
              notes={notes}
              onCancelEdit={handleCancelEdit}
              onDeleteNote={(note) => void handleDeleteNote(note)}
              onEditContentChange={setEditContent}
              onEditTitleChange={setEditTitle}
              onSaveEdit={(note) => void handleSaveEdit(note)}
              onStartEdit={handleStartEdit}
            />
          </section>
        </>
      )}
    </main>
  )
}
