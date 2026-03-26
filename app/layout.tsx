import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'Notas de Aula com Supabase',
  description: 'Aplicacao de notas de aula com autenticacao e CRUD completo.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
