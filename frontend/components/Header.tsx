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
        <div className="flex items-center gap-4">
          {showBack && (
            <Link href={backHref} className="btn btn-ghost btn-icon" title="Volver">
              ←
            </Link>
          )}
          <Link href="/" className="header-logo" style={{ textDecoration: 'none' }}>
            <img 
              src="/logo.webp" 
              alt="Copper Giant" 
              style={{ 
                height: '36px', 
                width: 'auto', 
                display: 'block',
                objectFit: 'contain'
              }}
            />
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
            style={{ fontSize: '0.85rem', padding: '8px 16px', gap: '6px' }}
          >
            ⚙ Configuración
          </button>
        </div>
      </div>
    </header>
  )
}
