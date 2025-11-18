/**
 * Settings Panel Component for 2048 Game
 *
 * A modern modal for configuring all game parameters including grid size,
 * target value, theme, game mode, animation speed, and sound effects.
 * Supports URL-based configuration sharing.
 */

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react'
import type { GameConfig } from '../config/defaultConfig'
import {
  DEFAULT_CONFIG,
  VALID_GRID_SIZES,
  VALID_TARGET_VALUES,
  THEMES,
  GAME_MODES,
  ANIMATION_SPEEDS,
  type Theme,
  type GameMode,
} from '../config/defaultConfig'
import { serializeConfigToHash } from '../config/urlConfig'
import styles from './Settings.module.css'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
  currentConfig: GameConfig
  onConfigChange: (config: GameConfig) => void
}

/**
 * Theme preview colors for visual selection
 */
const THEME_PREVIEWS: Record<Theme, { primary: string; secondary: string; accent: string }> = {
  classic: { primary: '#edc22e', secondary: '#edc53f', accent: '#edc850' },
  dark: { primary: '#2d3748', secondary: '#4a5568', accent: '#718096' },
  neon: { primary: '#ff00ff', secondary: '#00ffff', accent: '#ffff00' },
  ocean: { primary: '#0077be', secondary: '#4fc3f7', accent: '#81d4fa' },
}

/**
 * Game mode descriptions
 */
const MODE_DESCRIPTIONS: Record<GameMode, string> = {
  classic: 'Traditional 2048 gameplay with no time limit',
  zen: 'Relaxed mode with unlimited undo',
  timed: 'Race against the clock to reach the target',
}

export default function Settings({
  isOpen,
  onClose,
  currentConfig,
  onConfigChange,
}: SettingsProps) {
  const [config, setConfig] = useState<GameConfig>(currentConfig)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [copied, setCopied] = useState(false)

  // Sync internal state with prop changes when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfig(currentConfig)
    }
  }, [currentConfig, isOpen])

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleApply = () => {
    onConfigChange(config)
    onClose()
  }

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG)
    setSoundEnabled(true)
  }

  const handleShare = async () => {
    const hash = serializeConfigToHash(config)
    const url = `${window.location.origin}${window.location.pathname}${hash ? '#' + hash : ''}`

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
      // Fallback: show URL in alert
      alert(`Share this URL:\n${url}`)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Game Settings</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close settings">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {/* Grid Size Selection */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Grid Size</h3>
            <div className={styles.gridSelector}>
              {VALID_GRID_SIZES.map(size => (
                <button
                  key={size}
                  className={`${styles.gridOption} ${config.size === size ? styles.active : ''}`}
                  onClick={() => setConfig({ ...config, size })}
                >
                  <span className={styles.gridLabel}>
                    {size}×{size}
                  </span>
                  <span className={styles.gridPreview}>
                    {Array.from({ length: size }).map((_, i) => (
                      <span key={i} className={styles.gridRow}>
                        {Array.from({ length: size }).map((_, j) => (
                          <span key={j} className={styles.gridCell} />
                        ))}
                      </span>
                    ))}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Target Value Selection */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Target Value</h3>
            <div className={styles.targetSelector}>
              {VALID_TARGET_VALUES.map(target => (
                <button
                  key={target}
                  className={`${styles.targetOption} ${config.target === target ? styles.active : ''}`}
                  onClick={() => setConfig({ ...config, target })}
                >
                  {target.toLocaleString()}
                </button>
              ))}
            </div>
          </section>

          {/* Theme Selection */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Theme</h3>
            <div className={styles.themeSelector}>
              {THEMES.map(theme => (
                <button
                  key={theme}
                  className={`${styles.themeCard} ${config.theme === theme ? styles.active : ''}`}
                  onClick={() => setConfig({ ...config, theme })}
                >
                  <div className={styles.themePreview}>
                    <span
                      className={styles.themeColor}
                      style={{ backgroundColor: THEME_PREVIEWS[theme].primary }}
                    />
                    <span
                      className={styles.themeColor}
                      style={{ backgroundColor: THEME_PREVIEWS[theme].secondary }}
                    />
                    <span
                      className={styles.themeColor}
                      style={{ backgroundColor: THEME_PREVIEWS[theme].accent }}
                    />
                  </div>
                  <span className={styles.themeName}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Game Mode Selection */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Game Mode</h3>
            <div className={styles.modeSelector}>
              {GAME_MODES.map(mode => (
                <button
                  key={mode}
                  className={`${styles.modeCard} ${config.mode === mode ? styles.active : ''}`}
                  onClick={() => setConfig({ ...config, mode })}
                >
                  <span className={styles.modeName}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </span>
                  <span className={styles.modeDescription}>{MODE_DESCRIPTIONS[mode]}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Animation Speed */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Animation Speed</h3>
            <div className={styles.speedSelector}>
              {ANIMATION_SPEEDS.map(speed => (
                <button
                  key={speed}
                  className={`${styles.speedOption} ${config.animSpeed === speed ? styles.active : ''}`}
                  onClick={() => setConfig({ ...config, animSpeed: speed })}
                >
                  {speed.charAt(0).toUpperCase() + speed.slice(1)}
                </button>
              ))}
            </div>
          </section>

          {/* Sound Effects Toggle */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Sound Effects</h3>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={e => setSoundEnabled(e.target.checked)}
              />
              <span className={styles.toggleSlider} />
              <span className={styles.toggleLabel}>{soundEnabled ? 'Enabled' : 'Disabled'}</span>
            </label>
          </section>
        </div>

        <div className={styles.footer}>
          <button className={styles.shareButton} onClick={handleShare}>
            {copied ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share Configuration
              </>
            )}
          </button>
          <button className={styles.resetButton} onClick={handleReset}>
            Reset to Defaults
          </button>
          <button className={styles.applyButton} onClick={handleApply}>
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  )
}
