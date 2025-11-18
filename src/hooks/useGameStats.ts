/**
 * Game statistics hook for 2048
 * Manages loading, updating, and resetting game statistics
 */

import { useState, useCallback, useEffect } from 'react'
import type { GameStats } from '../services/storage'
import {
  loadStats,
  resetStats as resetStorageStats,
  updateStatsAfterGame,
} from '../services/storage'

/**
 * Computed statistics
 */
export interface ComputedStats extends GameStats {
  winRate: number // Percentage (0-100)
  lossRate: number // Percentage (0-100)
  gamesPlayed: number // Total games (wins + losses)
}

/**
 * Hook return type
 */
export interface UseGameStatsReturn {
  stats: ComputedStats
  updateStats: (score: number, moves: number, isWin: boolean) => void
  resetStats: () => void
  refreshStats: () => void
}

/**
 * Calculate computed statistics
 */
function computeStats(baseStats: GameStats): ComputedStats {
  const gamesPlayed = baseStats.wins + baseStats.losses
  const winRate = gamesPlayed > 0 ? (baseStats.wins / gamesPlayed) * 100 : 0
  const lossRate = gamesPlayed > 0 ? (baseStats.losses / gamesPlayed) * 100 : 0

  return {
    ...baseStats,
    gamesPlayed,
    winRate,
    lossRate,
  }
}

/**
 * Game statistics hook
 *
 * Manages game statistics including:
 * - Loading stats from localStorage
 * - Updating stats after games
 * - Calculating win/loss rates
 * - Calculating averages
 * - Resetting statistics
 *
 * @returns Statistics data and control functions
 *
 * @example
 * ```tsx
 * const { stats, updateStats, resetStats } = useGameStats();
 *
 * // After a game ends
 * updateStats(score, moveCount, hasWon);
 *
 * // Display stats
 * console.log(`Win rate: ${stats.winRate.toFixed(1)}%`);
 * console.log(`Average score: ${stats.averageScore}`);
 *
 * // Reset all stats
 * resetStats();
 * ```
 */
export function useGameStats(): UseGameStatsReturn {
  const [stats, setStats] = useState<ComputedStats>(() => {
    const baseStats = loadStats()
    return computeStats(baseStats)
  })

  /**
   * Refresh stats from storage
   */
  const refreshStats = useCallback(() => {
    const baseStats = loadStats()
    setStats(computeStats(baseStats))
  }, [])

  /**
   * Update statistics after a game ends
   */
  const updateStats = useCallback(
    (score: number, moves: number, isWin: boolean) => {
      // Update in storage
      updateStatsAfterGame(score, moves, isWin)

      // Reload and compute
      refreshStats()
    },
    [refreshStats]
  )

  /**
   * Reset all statistics
   */
  const resetStats = useCallback(() => {
    // Reset in storage
    resetStorageStats()

    // Reload and compute
    refreshStats()
  }, [refreshStats])

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === '2048_game_stats' || event.key === null) {
        refreshStats()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [refreshStats])

  return {
    stats,
    updateStats,
    resetStats,
    refreshStats,
  }
}

/**
 * Hook to get statistics for display purposes only (no update functions)
 *
 * This is a lighter version of useGameStats that only provides read access.
 *
 * @returns Computed statistics
 *
 * @example
 * ```tsx
 * const stats = useGameStatsReadOnly();
 *
 * return (
 *   <div>
 *     <p>Games played: {stats.gamesPlayed}</p>
 *     <p>Win rate: {stats.winRate.toFixed(1)}%</p>
 *     <p>Best score: {stats.bestScore}</p>
 *   </div>
 * );
 * ```
 */
export function useGameStatsReadOnly(): ComputedStats {
  const [stats, setStats] = useState<ComputedStats>(() => {
    const baseStats = loadStats()
    return computeStats(baseStats)
  })

  useEffect(() => {
    const refreshStats = () => {
      const baseStats = loadStats()
      setStats(computeStats(baseStats))
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === '2048_game_stats' || event.key === null) {
        refreshStats()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return stats
}

/**
 * Hook to check if this is a personal best score
 *
 * @param currentScore - Current game score
 * @returns True if current score beats the best score
 *
 * @example
 * ```tsx
 * const isPersonalBest = useIsPersonalBest(gameState.score);
 *
 * {isPersonalBest && <div>New Personal Best!</div>}
 * ```
 */
export function useIsPersonalBest(currentScore: number): boolean {
  const [bestScore, setBestScore] = useState<number>(() => {
    const stats = loadStats()
    return stats.bestScore
  })

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === '2048_game_stats' || event.key === null) {
        const stats = loadStats()
        setBestScore(stats.bestScore)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return currentScore > bestScore
}
