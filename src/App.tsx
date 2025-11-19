/**
 * 2048 Game - Main Application Component
 *
 * Integrates all game components, hooks, and state management.
 * Provides URL-based configuration, modal management, and responsive layout.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Title,
  Grid,
  GameInfo,
  Controls,
  ThemeSwitcher,
  GameModal,
  ShareModal,
  Settings,
  Stats,
} from './components'
import {
  useGame,
  useKeyboard,
  useTouch,
  useGameStats,
  usePreventArrowKeyScrolling,
  useDisablePinchZoom,
} from './hooks'
import { useTheme, type Theme } from './hooks/useTheme'
import { parseConfigFromHash, updateURLHash } from './config/urlConfig'
import type { GameConfig } from './config/defaultConfig'
import { Direction, GameStatus } from './types/game'
import { getAllHighScores } from './services/storage'
import type { HighScoreEntry } from './services/storage'
import styles from './App.module.css'

/**
 * Modal state types
 */
type ModalType = 'settings' | 'stats' | null

/**
 * Main App Component
 */
export default function App() {
  // ==================== State Management ====================

  // Parse initial config from URL or use defaults
  const [gameConfig, setGameConfig] = useState<GameConfig>(() => parseConfigFromHash())

  // Modal state
  const [activeModal, setActiveModal] = useState<ModalType>(null)

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false)

  // High scores - initialize from storage
  const [highScores, setHighScores] = useState<HighScoreEntry[]>(() => getAllHighScores())

  // ==================== Game State & Hooks ====================

  // Main game state
  const { gameState, move, undo, newGame, continueGame, canUndo, config, isGameOver, hasWon } =
    useGame()

  // Theme management
  const [currentTheme, setTheme] = useTheme()

  // Statistics
  const { stats, updateStats, resetStats } = useGameStats()

  // ==================== Input Handlers ====================

  // Handle keyboard input
  const handleMove = useCallback(
    (direction: Direction) => {
      if (!isGameOver) {
        move(direction)
      }
    },
    [move, isGameOver]
  )

  // Keyboard controls
  useKeyboard({
    onMove: handleMove,
    onUndo: () => {
      if (canUndo && !isGameOver) {
        undo()
      }
    },
    enabled: activeModal === null, // Disable when modal is open
  })

  // Touch controls for mobile
  const touchHandlers = useTouch({
    onMove: handleMove,
    enabled: activeModal === null,
  })

  // Prevent default browser behaviors
  usePreventArrowKeyScrolling()
  useDisablePinchZoom()

  // ==================== Effects ====================

  // Refresh high scores handler
  const refreshHighScores = useCallback(() => {
    setHighScores(getAllHighScores())
  }, [])

  // Sync URL hash with game config
  useEffect(() => {
    updateURLHash(gameConfig)
  }, [gameConfig])

  // Sync theme from config
  useEffect(() => {
    setTheme(gameConfig.theme)
  }, [gameConfig.theme, setTheme])

  // Listen for hash changes (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const newConfig = parseConfigFromHash()
      setGameConfig(newConfig)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Record game end in statistics
  useEffect(() => {
    if (gameState.status === GameStatus.Won || gameState.status === GameStatus.Lost) {
      const isWin = gameState.status === GameStatus.Won
      updateStats(gameState.score, gameState.moveCount, isWin)
    }
  }, [gameState.status, gameState.score, gameState.moveCount, updateStats])

  // Refresh high scores when game ends
  // This is a valid use of setState in effect - we're synchronizing with external storage
  useEffect(() => {
    if (gameState.status === GameStatus.Won || gameState.status === GameStatus.Lost) {
      refreshHighScores() // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [gameState.status, refreshHighScores])

  // ==================== Modal Handlers ====================

  const openSettings = useCallback(() => setActiveModal('settings'), [])
  const openStats = useCallback(() => setActiveModal('stats'), [])
  const closeModal = useCallback(() => setActiveModal(null), [])

  const handleConfigChange = useCallback((newConfig: GameConfig) => {
    setGameConfig(newConfig)
    // The URL and theme will be updated by effects above
  }, [])

  const handleThemeChange = useCallback(
    (theme: Theme) => {
      setTheme(theme)
      setGameConfig(prev => ({ ...prev, theme: theme as GameConfig['theme'] }))
    },
    [setTheme]
  )

  const handleResetStats = useCallback(() => {
    resetStats()
    const scores = getAllHighScores()
    setHighScores(scores)
  }, [resetStats])

  // ==================== Share Handler ====================

  const handleShare = useCallback(() => {
    setShareModalOpen(true)
  }, [])

  const closeShareModal = useCallback(() => {
    setShareModalOpen(false)
  }, [])

  // ==================== Render ====================

  return (
    <div className={styles.app} {...touchHandlers}>
      <div className={styles.container}>
        {/* Title only at top */}
        <Title targetValue={config.target} />

        {/* Game Grid */}
        <Grid gameState={gameState} />

        {/* Game Info with scores - below grid */}
        <GameInfo score={gameState.score} bestScore={stats.bestScore} targetValue={config.target} />

        {/* Control Buttons */}
        <Controls
          onNewGame={newGame}
          onUndo={undo}
          canUndo={canUndo}
          onOpenSettings={openSettings}
        />

        {/* Theme Switcher on main screen */}
        <ThemeSwitcher currentTheme={currentTheme} onThemeChange={handleThemeChange} />

        {/* Share Modal */}
        <ShareModal isOpen={shareModalOpen} onClose={closeShareModal} url={window.location.href} />

        {/* Game Over/Win Modal */}
        {(isGameOver || hasWon) && gameState.status !== GameStatus.Playing && (
          <GameModal
            isOpen={true}
            isWin={hasWon}
            score={gameState.score}
            moves={gameState.moveCount}
            onNewGame={newGame}
            onContinue={hasWon ? continueGame : undefined}
            onShare={handleShare}
          />
        )}

        {/* Settings Modal */}
        {activeModal === 'settings' && (
          <Settings
            isOpen={true}
            onClose={closeModal}
            currentConfig={gameConfig}
            onConfigChange={handleConfigChange}
          />
        )}

        {/* Stats Modal - Overlay Style */}
        {activeModal === 'stats' && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <button
                className={styles.modalClose}
                onClick={closeModal}
                aria-label="Close statistics"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <Stats stats={stats} highScores={highScores} onReset={handleResetStats} />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerLinks}>
              <a
                href="https://github.com/orgoj/2048"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerLink}
                title="View on GitHub"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <span className={styles.footerSeparator}>•</span>
              <button
                className={styles.footerLink}
                onClick={openStats}
                title="View Statistics"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
