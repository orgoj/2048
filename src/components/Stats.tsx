/**
 * Statistics Panel Component for 2048 Game
 *
 * Displays comprehensive game statistics, high scores, and provides
 * data management functionality (reset, export, import).
 */

import { useState } from 'react'
import type { GameStats, HighScoreEntry } from '../services/storage'
import { exportData, importData } from '../services/storage'
import styles from './Stats.module.css'

interface StatsProps {
  stats: GameStats
  highScores: HighScoreEntry[]
  onReset: () => void
}

export default function Stats({ stats, highScores, onReset }: StatsProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const winRate = stats.totalGames > 0 ? ((stats.wins / stats.totalGames) * 100).toFixed(1) : '0.0'

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
  const maxScore = Math.max(stats.bestScore, ...highScores.map(hs => hs.score), 1)

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
            <div className={styles.statValue}>{stats.totalGames}</div>
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
            <div className={styles.statValue}>{stats.wins}</div>
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
            <div className={styles.statValue}>{stats.losses}</div>
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
            <span className={styles.progressValue}>{stats.bestScore.toLocaleString()}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${getProgressBarWidth(stats.bestScore, maxScore)}%` }}
            />
          </div>
        </div>

        <div className={styles.progressStat}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Average Score</span>
            <span className={styles.progressValue}>{stats.averageScore.toLocaleString()}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${getProgressBarWidth(stats.averageScore, maxScore)}%` }}
            />
          </div>
        </div>

        <div className={styles.progressStat}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Total Moves</span>
            <span className={styles.progressValue}>{stats.totalMoves.toLocaleString()}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${getProgressBarWidth(stats.totalMoves, stats.totalMoves)}%` }}
            />
          </div>
        </div>

        <div className={styles.progressStat}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Average Moves</span>
            <span className={styles.progressValue}>{stats.averageMoves.toLocaleString()}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${getProgressBarWidth(stats.averageMoves, stats.totalMoves / Math.max(stats.totalGames, 1))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* High Scores Table */}
      <div className={styles.highScores}>
        <h3 className={styles.sectionTitle}>High Scores</h3>
        {highScores.length > 0 ? (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell}>Rank</div>
              <div className={styles.tableCell}>Score</div>
              <div className={styles.tableCell}>Grid</div>
              <div className={styles.tableCell}>Target</div>
              <div className={styles.tableCell}>Moves</div>
              <div className={styles.tableCell}>Date</div>
            </div>
            {highScores.slice(0, 5).map((entry, index) => (
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
            <span>Play some games to see your records here!</span>
          </div>
        )}
      </div>

      {stats.lastPlayed > 0 && (
        <div className={styles.lastPlayed}>Last played: {formatDate(stats.lastPlayed)}</div>
      )}
    </div>
  )
}
