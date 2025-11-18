import React, { useEffect, useRef } from 'react'
import styles from './GameModal.module.css'

interface GameModalProps {
  isOpen: boolean
  isWin: boolean
  score: number
  moves?: number
  onNewGame: () => void
  onContinue?: () => void
  onShare?: () => void
}

/**
 * GameModal component for win/lose screens
 * Displays game results with options to continue or start new game
 */
export const GameModal: React.FC<GameModalProps> = ({
  isOpen,
  isWin,
  score,
  moves,
  onNewGame,
  onContinue,
  onShare,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement

      // Focus on modal
      modalRef.current?.focus()

      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scroll
      document.body.style.overflow = ''

      // Restore previous focus
      previousFocusRef.current?.focus()
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onNewGame()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onNewGame])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onNewGame()
    }
  }

  const handleShare = () => {
    if (onShare) {
      onShare()
    } else {
      // Default share functionality
      const text = `I scored ${score.toLocaleString()} points in 2048!${moves ? ` Completed in ${moves} moves.` : ''}`

      if (navigator.share) {
        navigator
          .share({
            title: '2048 Game Score',
            text: text,
          })
          .catch(() => {
            // Silently fail if user cancels
          })
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(text).then(() => {
          alert('Score copied to clipboard!')
        })
      }
    }
  }

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        ref={modalRef}
        className={`${styles.modal} ${isWin ? styles.modalWin : styles.modalLose}`}
        tabIndex={-1}
      >
        {/* Icon */}
        <div className={styles.iconContainer}>
          {isWin ? (
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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
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
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h2 id="modal-title" className={styles.title}>
          {isWin ? 'Congratulations!' : 'Game Over'}
        </h2>

        {/* Message */}
        <p id="modal-description" className={styles.message}>
          {isWin
            ? "You've reached the target! You can continue playing or start a new game."
            : "No more moves available. Don't worry, practice makes perfect!"}
        </p>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Final Score</div>
            <div className={styles.statValue}>{score.toLocaleString()}</div>
          </div>

          {moves !== undefined && (
            <div className={styles.stat}>
              <div className={styles.statLabel}>Moves</div>
              <div className={styles.statValue}>{moves.toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={onNewGame}
            autoFocus
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
            Try Again
          </button>

          {isWin && onContinue && (
            <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={onContinue}>
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
                <polyline points="9 18 15 12 9 6" />
              </svg>
              Keep Playing
            </button>
          )}

          <button className={`${styles.button} ${styles.buttonTertiary}`} onClick={handleShare}>
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
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameModal
