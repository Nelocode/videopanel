import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VideoPanel — Copper Giant',
  description: 'Plataforma de análisis de contenido en video con IA para el equipo de comunicaciones',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
