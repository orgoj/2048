import React, { useState, useEffect, useRef } from 'react'
import styles from './ShareModal.module.css'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
}

/**
 * ShareModal component for displaying and copying share URLs
 * Shows the URL with a copy button and visual feedback
 */
export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, url }) => {
  const [copied, setCopied] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Auto-select URL when modal opens
  useEffect(() => {
    if (isOpen) {
      // Auto-select URL text
      setTimeout(() => {
        urlInputRef.current?.select()
      }, 100)
    }
  }, [isOpen])

  // Reset copied state when modal closes
  useEffect(() => {
    if (!isOpen && copied) {
      setCopied(false) // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [isOpen, copied])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      urlInputRef.current?.select()

      // Reset copied state after 3 seconds
      setTimeout(() => {
        setCopied(false)
      }, 3000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div ref={modalRef} className={styles.modal} tabIndex={-1}>
        {/* Close button */}
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Icon */}
        <div className={styles.iconContainer}>
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </div>

        {/* Title */}
        <h2 id="share-modal-title" className={styles.title}>
          Share Your Game Configuration
        </h2>

        {/* Message */}
        <p className={styles.message}>
          Copy this URL to share your game settings with others. They can use it to play with the
          same configuration!
        </p>

        {/* URL display */}
        <div className={styles.urlContainer}>
          <input
            ref={urlInputRef}
            type="text"
            value={url}
            readOnly
            className={styles.urlInput}
            aria-label="Shareable URL"
          />
          <button
            className={`${styles.copyButton} ${copied ? styles.copyButtonSuccess : ''}`}
            onClick={handleCopy}
            aria-label="Copy URL to clipboard"
          >
            {copied ? (
              <>
                <svg
                  className={styles.buttonIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg
                  className={styles.buttonIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Additional info */}
        <div className={styles.infoBox}>
          <svg
            className={styles.infoIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>This URL contains your current theme, grid size, and target value settings.</span>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
