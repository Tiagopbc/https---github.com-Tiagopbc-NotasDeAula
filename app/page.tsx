'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import AuthPanel from '@/components/AuthPanel'
import NoteList from '@/components/NoteList'
import { createNote, deleteNote, getNotes, updateNote } from '@/lib/noteApiClient'
import type { Note } from '@/lib/notes'
import { supabase } from '@/lib/supabaseClient'


function formatLatestDate(value: string | null) {
  if (!value) {
    return 'Nenhuma nota ainda'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível'
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
      setError('Título e conteúdo são obrigatórios para editar a nota.')
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
            Estamos verificando sua sessão e alinhando o ambiente com a mesma estrutura do
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
          <section className="hero hero-primary" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', paddingBottom: '3rem' }}>
            <p className="eyebrow">Plataforma Inteligente</p>
            <h1>Suas notas de aula centralizadas e seguras.</h1>
            <p className="hero-lead">
              Acesse seu acervo pessoal de notas a qualquer momento. Autenticação rápida, 
              armazenamento em nuvem com Supabase e edição em tempo real de onde estiver.
            </p>
          </section>

          <div className="hero-sidebar">
            <AuthPanel
              onAuthenticated={async () => {
                setError(null)
                await refreshNotes()
              }}
            />
          </div>
        </section>
      ) : (
        <>
          <section className="hero hero-compact">
            <p className="eyebrow">Painel de notas</p>
            <h1>Registre, revise e ajuste suas anotações sem sair da mesma tela.</h1>
            <p className="hero-lead">
              Cada nota fica vinculada ao usuário autenticado e a lista aparece ordenada por data,
              com edição inline e confirmação antes de excluir.
            </p>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Sessão ativa</p>
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
                <span>Última criação</span>
                <strong>{formatLatestDate(notes[0]?.created_at ?? null)}</strong>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header panel-header-compact">
              <div>
                <p className="eyebrow">Nova nota</p>
                <h2>Adicione título e conteúdo da aula</h2>
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
                <span>Título</span>
                <input
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex.: Resumo de banco de dados"
                  value={title}
                />
              </label>

              <label className="field">
                <span>Conteúdo</span>
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
