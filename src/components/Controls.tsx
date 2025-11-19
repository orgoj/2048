import React from 'react'
import styles from './Controls.module.css'

interface ControlsProps {
  onNewGame: () => void
  onUndo: () => void
  canUndo: boolean
  onOpenStats?: () => void
  onOpenSettings?: () => void
  onToggleTheme?: () => void
  isDarkTheme?: boolean
}

/**
 * Controls component with game action buttons
 * Includes new game, undo, stats, settings, and theme toggle
 */
export const Controls: React.FC<ControlsProps> = ({
  onNewGame,
  onUndo,
  canUndo,
  onOpenStats,
  onOpenSettings,
  onToggleTheme,
  isDarkTheme = false,
}) => {
  return (
    <div className={styles.controls} role="toolbar" aria-label="Game controls">
      {/* Primary controls */}
      <div className={styles.primaryControls}>
        <button
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={onNewGame}
          aria-label="Start a new game"
        >
          <svg
            className={styles.buttonIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span>New Game</span>
        </button>

        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last move"
          aria-disabled={!canUndo}
        >
          <svg
            className={styles.buttonIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
          <span>Undo</span>
        </button>
      </div>

      {/* Secondary controls */}
      <div className={styles.secondaryControls}>
        {onToggleTheme && (
          <button
            className={`${styles.button} ${styles.buttonIcon}`}
            onClick={onToggleTheme}
            aria-label={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDarkTheme ? 'Light mode' : 'Dark mode'}
          >
            {isDarkTheme ? (
              <svg
                className={styles.icon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                className={styles.icon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        )}

        {onOpenStats && (
          <button
            className={`${styles.button} ${styles.buttonStats}`}
            onClick={onOpenStats}
            aria-label="View statistics"
          >
            <svg
              className={styles.buttonIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Stats</span>
          </button>
        )}

        {onOpenSettings && (
          <button
            className={`${styles.button} ${styles.buttonSettings}`}
            onClick={onOpenSettings}
            aria-label="Open settings"
          >
            <svg
              className={styles.buttonIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m-6 0l-4.2 4.2" />
            </svg>
            <span>Settings</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default Controls
