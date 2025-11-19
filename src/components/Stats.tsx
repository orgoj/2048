/**
 * Statistics Panel Component for 2048 Game
 *
 * Displays comprehensive game statistics, high scores, and provides
 * data management functionality (reset, export, import).
 */

import { useState, useMemo } from 'react'
import type { GameStats, HighScoreEntry } from '../services/storage'
import { exportData, importData } from '../services/storage'
import { VALID_GRID_SIZES } from '../config/defaultConfig'
import styles from './Stats.module.css'

interface StatsProps {
  stats: GameStats
  highScores: HighScoreEntry[]
  onReset: () => void
}

export default function Stats({ stats, highScores, onReset }: StatsProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [gridSizeFilter, setGridSizeFilter] = useState<number | 'all'>('all')

  // Filter high scores by grid size
  const filteredHighScores = useMemo(() => {
    if (gridSizeFilter === 'all') {
      return highScores
    }
    return highScores.filter(hs => hs.gridSize === gridSizeFilter)
  }, [highScores, gridSizeFilter])

  // Get available grid sizes from high scores
  const availableGridSizes = useMemo(() => {
    const sizes = new Set(highScores.map(hs => hs.gridSize))
    return VALID_GRID_SIZES.filter(size => sizes.has(size))
  }, [highScores])

  // Calculate filtered stats from high scores
  const filteredStats = useMemo(() => {
    if (gridSizeFilter === 'all') {
      return {
        totalGames: stats.totalGames,
        wins: stats.wins,
        losses: stats.losses,
        bestScore: stats.bestScore,
        averageScore: stats.averageScore,
        totalMoves: stats.totalMoves,
        averageMoves: stats.averageMoves,
      }
    }

    // Calculate stats from filtered high scores
    const scores = filteredHighScores
    if (scores.length === 0) {
      return {
        totalGames: 0,
        wins: 0,
        losses: 0,
        bestScore: 0,
        averageScore: 0,
        totalMoves: 0,
        averageMoves: 0,
      }
    }

    const totalScore = scores.reduce((sum, hs) => sum + hs.score, 0)
    const totalMoves = scores.reduce((sum, hs) => sum + hs.moveCount, 0)
    const bestScore = Math.max(...scores.map(hs => hs.score))

    return {
      totalGames: scores.length,
      wins: scores.length, // Each high score entry represents a completed game
      losses: 0, // We don't track losses per grid size
      bestScore,
      averageScore: Math.round(totalScore / scores.length),
      totalMoves,
      averageMoves: Math.round(totalMoves / scores.length),
    }
  }, [gridSizeFilter, filteredHighScores, stats])

  const winRate =
    filteredStats.totalGames > 0
      ? ((filteredStats.wins / filteredStats.totalGames) * 100).toFixed(1)
      : '0.0'

  const handleExport = () => {
    try {
      const data = exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `2048-stats-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export data:', err)
      alert('Failed to export data. Please try again.')
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'

    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        importData(text)
        setImportError(null)
        // Reload the page to reflect imported data
        window.location.reload()
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to import data')
      }
    }

    input.click()
  }

  const handleReset = () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true)
      return
    }
    onReset()
    setShowResetConfirm(false)
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getProgressBarWidth = (value: number, max: number) => {
    return Math.min((value / max) * 100, 100)
  }

  // Find max score for progress bar scaling
  const maxScore = Math.max(filteredStats.bestScore, ...filteredHighScores.map(hs => hs.score), 1)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Statistics</h2>
        <div className={styles.actions}>
          <button className={styles.actionButton} onClick={handleExport} title="Export statistics">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Export
          </button>
          <button className={styles.actionButton} onClick={handleImport} title="Import statistics">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
            Import
          </button>
          <button
            className={`${styles.actionButton} ${styles.resetButton} ${showResetConfirm ? styles.confirm : ''}`}
            onClick={handleReset}
            title={showResetConfirm ? 'Click again to confirm' : 'Reset all statistics'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            {showResetConfirm ? 'Confirm?' : 'Reset'}
          </button>
        </div>
      </div>

      {importError && (
        <div className={styles.error}>
          <strong>Import Error:</strong> {importError}
          <button onClick={() => setImportError(null)} className={styles.errorClose}>
            ×
          </button>
        </div>
      )}

      {/* Grid Size Filter - at the top */}
      <div className={styles.gridFilterSection}>
        <span className={styles.filterLabel}>Grid Size:</span>
        <div className={styles.gridFilter}>
          <button
            className={`${styles.filterButton} ${gridSizeFilter === 'all' ? styles.active : ''}`}
            onClick={() => setGridSizeFilter('all')}
          >
            All
          </button>
          {VALID_GRID_SIZES.map(size => (
            <button
              key={size}
              className={`${styles.filterButton} ${gridSizeFilter === size ? styles.active : ''} ${!availableGridSizes.includes(size) ? styles.disabled : ''}`}
              onClick={() => setGridSizeFilter(size)}
              disabled={!availableGridSizes.includes(size) && gridSizeFilter !== size}
            >
              {size}×{size}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{filteredStats.totalGames}</div>
            <div className={styles.statLabel}>Total Games</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.winIcon}`}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{filteredStats.wins}</div>
            <div className={styles.statLabel}>Wins</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.lossIcon}`}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{filteredStats.losses}</div>
            <div className={styles.statLabel}>Losses</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.rateIcon}`}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{winRate}%</div>
            <div className={styles.statLabel}>Win Rate</div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className={styles.detailedStats}>
        <h3 className={styles.sectionTitle}>Performance</h3>

        <div className={styles.progressStat}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Best Score</span>
            <span className={styles.progressValue}>{filteredStats.bestScore.toLocaleString()}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${getProgressBarWidth(filteredStats.bestScore, maxScore)}%` }}
            />
          </div>
        </div>

        <div className={styles.progressStat}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Average Score</span>
            <span className={styles.progressValue}>
              {filteredStats.averageScore.toLocaleString()}
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${getProgressBarWidth(filteredStats.averageScore, maxScore)}%` }}
            />
          </div>
        </div>

        <div className={styles.progressStat}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Total Moves</span>
            <span className={styles.progressValue}>
              {filteredStats.totalMoves.toLocaleString()}
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${filteredStats.totalMoves > 0 ? 100 : 0}%` }}
            />
          </div>
        </div>

        <div className={styles.progressStat}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Average Moves</span>
            <span className={styles.progressValue}>
              {filteredStats.averageMoves.toLocaleString()}
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${filteredStats.totalGames > 0 ? 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* High Scores Table */}
      <div className={styles.highScores}>
        <h3 className={styles.sectionTitle}>High Scores</h3>
        {filteredHighScores.length > 0 ? (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell}>Rank</div>
              <div className={styles.tableCell}>Score</div>
              <div className={styles.tableCell}>Grid</div>
              <div className={styles.tableCell}>Target</div>
              <div className={styles.tableCell}>Moves</div>
              <div className={styles.tableCell}>Date</div>
            </div>
            {filteredHighScores.slice(0, 10).map((entry, index) => (
              <div key={index} className={styles.tableRow}>
                <div className={`${styles.tableCell} ${styles.rankCell}`}>
                  {index === 0 && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  )}
                  #{index + 1}
                </div>
                <div className={styles.tableCell}>
                  <strong>{entry.score.toLocaleString()}</strong>
                </div>
                <div className={styles.tableCell}>
                  {entry.gridSize}×{entry.gridSize}
                </div>
                <div className={styles.tableCell}>{entry.targetValue.toLocaleString()}</div>
                <div className={styles.tableCell}>{entry.moveCount}</div>
                <div className={styles.tableCell}>{formatDate(entry.timestamp)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>No high scores yet</p>
            <span>
              {gridSizeFilter === 'all'
                ? 'Play some games to see your records here!'
                : `No scores for ${gridSizeFilter}×${gridSizeFilter} grid yet!`}
            </span>
          </div>
        )}
      </div>

      {stats.lastPlayed > 0 && (
        <div className={styles.lastPlayed}>Last played: {formatDate(stats.lastPlayed)}</div>
      )}
    </div>
  )
}
