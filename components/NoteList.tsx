import type { Note } from '@/lib/notes'

type NoteListProps = {
  notes: Note[]
  editingNoteId: number | null
  editTitle: string
  editContent: string
  isMutating: boolean
  onStartEdit: (note: Note) => void
  onCancelEdit: () => void
  onEditTitleChange: (value: string) => void
  onEditContentChange: (value: string) => void
  onSaveEdit: (note: Note) => void
  onDeleteNote: (note: Note) => void
}

function formatCreatedAt(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function NoteList({
  notes,
  editingNoteId,
  editTitle,
  editContent,
  isMutating,
  onStartEdit,
  onCancelEdit,
  onEditTitleChange,
  onEditContentChange,
  onSaveEdit,
  onDeleteNote,
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <p className="empty-state">
        Nenhuma nota cadastrada ainda. Crie a primeira para registrar o conteúdo da aula.
      </p>
    )
  }

  return (
    <div className="note-list">
      {notes.map((note) => {
        const isEditing = editingNoteId === note.id

        return (
          <article className="note-item" key={note.id}>
            {isEditing ? (
              <form
                className="note-edit-grid"
                onSubmit={(event) => {
                  event.preventDefault()
                  onSaveEdit(note)
                }}
              >
                <label className="field">
                  <span>Título</span>
                  <input
                    disabled={isMutating}
                    onChange={(event) => onEditTitleChange(event.target.value)}
                    value={editTitle}
                  />
                </label>

                <label className="field">
                  <span>Conteúdo</span>
                  <textarea
                    disabled={isMutating}
                    onChange={(event) => onEditContentChange(event.target.value)}
                    rows={6}
                    value={editContent}
                  />
                </label>

                <div className="note-actions">
                  <button className="primary-button" disabled={isMutating} type="submit">
                    {isMutating ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                  <button
                    className="ghost-button"
                    disabled={isMutating}
                    onClick={onCancelEdit}
                    type="button"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="note-head">
                  <div>
                    <h3>{note.title}</h3>
                    <p className="note-date">Criada em {formatCreatedAt(note.created_at)}</p>
                  </div>

                  <div className="note-actions">
                    <button
                      className="ghost-button"
                      disabled={isMutating}
                      onClick={() => onStartEdit(note)}
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      className="danger-button"
                      disabled={isMutating}
                      onClick={() => onDeleteNote(note)}
                      type="button"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                <p className="note-body">{note.content}</p>
              </>
            )}
          </article>
        )
      })}
    </div>
  )
}
