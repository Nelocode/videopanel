'use client'

import Link from 'next/link'

interface HeaderProps {
  onSettings: () => void
  onHistory?: () => void
  showBack?: boolean
  backHref?: string
  rightSlot?: React.ReactNode
}

export default function Header({
  onSettings,
  onHistory,
  showBack,
  backHref = '/',
  rightSlot,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header-inner">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          {showBack && (
            <Link href={backHref} className="btn btn-ghost btn-icon" title="Volver">
              ←
            </Link>
          )}
          <Link href="/" className="header-logo" style={{ textDecoration: 'none' }}>
            <div className="header-logo-mark">VP</div>
            <span className="header-logo-name">
              Video<span>Panel</span>
            </span>
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="header-actions">
          {rightSlot}
          {onHistory && (
            <button className="btn btn-ghost btn-icon" onClick={onHistory} title="Historial">
              🕐
            </button>
          )}
          <button
            className="btn btn-outline"
            onClick={onSettings}
            style={{ fontSize: '0.82rem', padding: '7px 14px', gap: '6px' }}
          >
            ⚙ Configuración
          </button>
        </div>
      </div>
    </header>
  )
}
