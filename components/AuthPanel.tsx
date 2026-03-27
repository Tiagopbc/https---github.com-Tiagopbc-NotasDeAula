'use client'

import { useState } from 'react'

import { supabase } from '@/lib/supabaseClient'

type AuthPanelProps = {
  onAuthenticated: () => Promise<void>
}

export default function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setIsSubmitting(true)
    setError(null)
    setMessage(null)

    const credentials = {
      email: email.trim(),
      password,
    }

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp(credentials)

        if (signUpError) {
          setError(signUpError.message)
          return
        }

        if (data.session) {
          await onAuthenticated()
          setEmail('')
          setPassword('')
          return
        }

        setMessage(
          'Conta criada. Se a confirmação por email estiver ativa, valide seu email antes de entrar.'
        )
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword(credentials)

      if (signInError) {
        setError(signInError.message)
        return
      }

      await onAuthenticated()
      setEmail('')
      setPassword('')
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Erro inesperado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="panel panel-auth">
      <div className="panel-header panel-header-compact">
        <div>
          <p className="eyebrow">Autenticação</p>
          <h2>{mode === 'login' ? 'Entrar na sua conta' : 'Criar uma conta'}</h2>
        </div>
      </div>

      <div className="mode-toggle" aria-label="Modo de autenticação">
        <button
          className={mode === 'login' ? 'mode-button mode-button-active' : 'mode-button'}
          onClick={() => {
            setMode('login')
            setError(null)
            setMessage(null)
          }}
          type="button"
        >
          Entrar
        </button>
        <button
          className={mode === 'signup' ? 'mode-button mode-button-active' : 'mode-button'}
          onClick={() => {
            setMode('signup')
            setError(null)
            setMessage(null)
          }}
          type="button"
        >
          Criar conta
        </button>
      </div>

      <p className="panel-copy">
        {mode === 'login'
          ? 'Entre para acessar suas notas de aula privadas.'
          : 'Crie sua conta para salvar notas e revisar o conteúdo quando quiser.'}
      </p>

      <form className="stack-md" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label className="field">
          <span>Senha</span>
          <input
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo de 6 caracteres"
            required
            type="password"
            value={password}
          />
        </label>

        {error ? <p className="feedback feedback-error">{error}</p> : null}
        {message ? <p className="feedback feedback-success">{message}</p> : null}

        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
        </button>

        <p className="panel-note">
          Cada usuário enxerga somente as próprias notas, seguindo o mesmo isolamento do todo-app.
        </p>
      </form>
    </section>
  )
}
