/**
 * Unit tests for storage.ts
 * Tests localStorage service with mocked localStorage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  saveGameState,
  loadGameState,
  clearGameState,
  hasSavedGameState,
  saveHighScore,
  getHighScore,
  loadHighScores,
  getAllHighScores,
  clearHighScores,
  saveStats,
  loadStats,
  updateStatsAfterGame,
  resetStats,
  savePreferences,
  loadPreferences,
  updatePreference,
  resetPreferences,
  clearAll,
  getStorageSize,
  getStorageSizeFormatted,
  exportData,
  importData,
  checkStorageHealth,
  StorageError,
  StorageErrorType,
} from '../storage'
import type { GameState, HighScoreEntry, GameStats, UserPreferences } from '../storage'

describe('storage', () => {
  let localStorageMock: { [key: string]: string }

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {}

    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key]
      }),
      clear: vi.fn(() => {
        localStorageMock = {}
      }),
      get length() {
        return Object.keys(localStorageMock).length
      },
      key: vi.fn((index: number) => {
        const keys = Object.keys(localStorageMock)
        return keys[index] || null
      }),
    } as Storage
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Game State Functions', () => {
    const mockGameState: GameState = {
      grid: [
        [{ id: '1', value: 2, position: { row: 0, col: 0 } }, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ],
      score: 100,
      gridSize: 4,
      targetValue: 2048,
      isGameOver: false,
      isWon: false,
      moveCount: 10,
      timestamp: Date.now(),
    }

    describe('saveGameState', () => {
      it('should save game state to localStorage', () => {
        saveGameState(mockGameState)

        expect(localStorage.setItem).toHaveBeenCalled()
        const savedData = localStorageMock['2048_game_state']
        expect(savedData).toBeDefined()

        const parsed = JSON.parse(savedData)
        expect(parsed.score).toBe(mockGameState.score)
      })

      it('should throw error when localStorage is unavailable', () => {
        const originalLocalStorage = global.localStorage
        delete (global as any).localStorage

        expect(() => saveGameState(mockGameState)).toThrow(StorageError)

        global.localStorage = originalLocalStorage
      })

      it('should throw error when quota is exceeded', () => {
        // Create a fresh spy that throws QuotaExceededError
        const setItemSpy = vi.spyOn(global.localStorage, 'setItem')
        setItemSpy.mockImplementation(() => {
          const error = new Error('QuotaExceededError')
          error.name = 'QuotaExceededError'
          throw error
        })

        expect(() => saveGameState(mockGameState)).toThrow(StorageError)
        expect(() => saveGameState(mockGameState)).toThrow(/quota exceeded/i)

        setItemSpy.mockRestore()
      })
    })

    describe('loadGameState', () => {
      it('should load saved game state', () => {
        saveGameState(mockGameState)
        const loaded = loadGameState()

        expect(loaded).not.toBeNull()
        expect(loaded?.score).toBe(mockGameState.score)
        expect(loaded?.gridSize).toBe(mockGameState.gridSize)
      })

      it('should return null if no saved state exists', () => {
        const loaded = loadGameState()
        expect(loaded).toBeNull()
      })

      it('should return null if localStorage is unavailable', () => {
        const originalLocalStorage = global.localStorage
        delete (global as any).localStorage

        const loaded = loadGameState()
        expect(loaded).toBeNull()

        global.localStorage = originalLocalStorage
      })

      it('should return null if saved data is corrupted', () => {
        localStorageMock['2048_game_state'] = 'invalid json'

        const loaded = loadGameState()
        expect(loaded).toBeNull()
      })
    })

    describe('clearGameState', () => {
      it('should remove saved game state', () => {
        saveGameState(mockGameState)
        expect(hasSavedGameState()).toBe(true)

        clearGameState()
        expect(hasSavedGameState()).toBe(false)
      })

      it('should not throw if no saved state exists', () => {
        expect(() => clearGameState()).not.toThrow()
      })
    })

    describe('hasSavedGameState', () => {
      it('should return true when state exists', () => {
        saveGameState(mockGameState)
        expect(hasSavedGameState()).toBe(true)
      })

      it('should return false when state does not exist', () => {
        expect(hasSavedGameState()).toBe(false)
      })

      it('should return false when localStorage is unavailable', () => {
        const originalLocalStorage = global.localStorage
        delete (global as any).localStorage

        expect(hasSavedGameState()).toBe(false)

        global.localStorage = originalLocalStorage
      })
    })
  })

  describe('High Scores Functions', () => {
    const mockHighScore: HighScoreEntry = {
      score: 5000,
      targetValue: 2048,
      gridSize: 4,
      timestamp: Date.now(),
      moveCount: 100,
    }

    describe('saveHighScore', () => {
      it('should save a high score', () => {
        saveHighScore(mockHighScore)

        const highScores = loadHighScores()
        expect(highScores['4_2048']).toBeDefined()
        expect(highScores['4_2048'].score).toBe(5000)
      })

      it('should update high score if new score is higher', () => {
        saveHighScore(mockHighScore)
        saveHighScore({ ...mockHighScore, score: 6000 })

        const highScores = loadHighScores()
        expect(highScores['4_2048'].score).toBe(6000)
      })

      it('should not update high score if new score is lower', () => {
        saveHighScore(mockHighScore)
        saveHighScore({ ...mockHighScore, score: 3000 })

        const highScores = loadHighScores()
        expect(highScores['4_2048'].score).toBe(5000)
      })

      it('should save high scores for different configurations', () => {
        saveHighScore(mockHighScore)
        saveHighScore({ ...mockHighScore, gridSize: 5, score: 7000 })

        const highScores = loadHighScores()
        expect(highScores['4_2048']).toBeDefined()
        expect(highScores['5_2048']).toBeDefined()
      })
    })

    describe('getHighScore', () => {
      it('should retrieve high score for specific configuration', () => {
        saveHighScore(mockHighScore)

        const score = getHighScore(4, 2048)
        expect(score).not.toBeNull()
        expect(score?.score).toBe(5000)
      })

      it('should return null if no high score exists', () => {
        const score = getHighScore(4, 2048)
        expect(score).toBeNull()
      })
    })

    describe('loadHighScores', () => {
      it('should return empty object if no high scores exist', () => {
        const highScores = loadHighScores()
        expect(highScores).toEqual({})
      })

      it('should load all high scores', () => {
        saveHighScore(mockHighScore)
        saveHighScore({ ...mockHighScore, gridSize: 5, score: 7000 })

        const highScores = loadHighScores()
        expect(Object.keys(highScores)).toHaveLength(2)
      })
    })

    describe('getAllHighScores', () => {
      it('should return empty array if no high scores exist', () => {
        const scores = getAllHighScores()
        expect(scores).toEqual([])
      })

      it('should return all high scores sorted by score descending', () => {
        saveHighScore({ ...mockHighScore, score: 3000 })
        saveHighScore({ ...mockHighScore, gridSize: 5, score: 7000 })
        saveHighScore({ ...mockHighScore, gridSize: 6, score: 5000 })

        const scores = getAllHighScores()
        expect(scores).toHaveLength(3)
        expect(scores[0].score).toBe(7000)
        expect(scores[1].score).toBe(5000)
        expect(scores[2].score).toBe(3000)
      })
    })

    describe('clearHighScores', () => {
      it('should remove all high scores', () => {
        saveHighScore(mockHighScore)
        expect(Object.keys(loadHighScores())).toHaveLength(1)

        clearHighScores()
        expect(Object.keys(loadHighScores())).toHaveLength(0)
      })
    })
  })

  describe('Game Statistics Functions', () => {
    describe('loadStats', () => {
      it('should return default stats if none exist', () => {
        const stats = loadStats()

        expect(stats.totalGames).toBe(0)
        expect(stats.wins).toBe(0)
        expect(stats.losses).toBe(0)
        expect(stats.bestScore).toBe(0)
      })

      it('should load saved stats', () => {
        const customStats: GameStats = {
          totalGames: 10,
          wins: 3,
          losses: 7,
          bestScore: 5000,
          totalScore: 20000,
          averageScore: 2000,
          totalMoves: 500,
          averageMoves: 50,
          lastPlayed: Date.now(),
        }

        saveStats(customStats)
        const loaded = loadStats()

        expect(loaded.totalGames).toBe(10)
        expect(loaded.wins).toBe(3)
        expect(loaded.bestScore).toBe(5000)
      })
    })

    describe('updateStatsAfterGame', () => {
      beforeEach(() => {
        // Clear stats before each test in this group
        resetStats()
      })

      it('should increment total games', () => {
        updateStatsAfterGame(1000, 50, false)

        const stats = loadStats()
        expect(stats.totalGames).toBe(1)
      })

      it('should increment wins for winning game', () => {
        updateStatsAfterGame(2048, 100, true)

        const stats = loadStats()
        expect(stats.wins).toBe(1)
        expect(stats.losses).toBe(0)
      })

      it('should increment losses for losing game', () => {
        updateStatsAfterGame(500, 30, false)

        const stats = loadStats()
        expect(stats.wins).toBe(0)
        expect(stats.losses).toBe(1)
      })

      it('should update best score', () => {
        updateStatsAfterGame(1000, 50, false)
        updateStatsAfterGame(2000, 60, false)

        const stats = loadStats()
        expect(stats.bestScore).toBe(2000)
      })

      it('should not lower best score', () => {
        updateStatsAfterGame(2000, 50, false)
        updateStatsAfterGame(1000, 40, false)

        const stats = loadStats()
        expect(stats.bestScore).toBe(2000)
      })

      it('should calculate average score', () => {
        updateStatsAfterGame(1000, 50, false)
        updateStatsAfterGame(2000, 60, false)
        updateStatsAfterGame(3000, 70, false)

        const stats = loadStats()
        expect(stats.averageScore).toBe(2000)
      })

      it('should calculate average moves', () => {
        updateStatsAfterGame(1000, 50, false)
        updateStatsAfterGame(2000, 100, false)

        const stats = loadStats()
        expect(stats.averageMoves).toBe(75)
      })

      it('should update timestamp', () => {
        const beforeTime = Date.now()
        updateStatsAfterGame(1000, 50, false)
        const afterTime = Date.now()

        const stats = loadStats()
        expect(stats.lastPlayed).toBeGreaterThanOrEqual(beforeTime)
        expect(stats.lastPlayed).toBeLessThanOrEqual(afterTime)
      })
    })

    describe('resetStats', () => {
      it('should reset stats to defaults', () => {
        // Clear storage first
        Object.keys(localStorageMock).forEach(key => {
          delete localStorageMock[key]
        })

        updateStatsAfterGame(1000, 50, false)
        updateStatsAfterGame(2000, 60, true)

        // Verify stats were updated
        let stats = loadStats()
        expect(stats.totalGames).toBeGreaterThan(0)

        resetStats()

        stats = loadStats()
        expect(stats.totalGames).toBe(0)
        expect(stats.wins).toBe(0)
        expect(stats.losses).toBe(0)
        expect(stats.bestScore).toBe(0)
      })
    })
  })

  describe('User Preferences Functions', () => {
    describe('loadPreferences', () => {
      it('should return default preferences if none exist', () => {
        const prefs = loadPreferences()

        expect(prefs.theme).toBe('auto')
        expect(prefs.soundEnabled).toBe(true)
        expect(prefs.animationsEnabled).toBe(true)
        expect(prefs.gridSize).toBe(4)
      })

      it('should load saved preferences', () => {
        const customPrefs: UserPreferences = {
          theme: 'dark',
          soundEnabled: false,
          animationsEnabled: false,
          gridSize: 5,
          targetValue: 4096,
          showHints: false,
          vibrationEnabled: true,
        }

        savePreferences(customPrefs)
        const loaded = loadPreferences()

        expect(loaded.theme).toBe('dark')
        expect(loaded.soundEnabled).toBe(false)
        expect(loaded.gridSize).toBe(5)
      })
    })

    describe('updatePreference', () => {
      it('should update a single preference', () => {
        updatePreference('theme', 'dark')

        const prefs = loadPreferences()
        expect(prefs.theme).toBe('dark')
      })

      it('should preserve other preferences', () => {
        savePreferences({
          theme: 'light',
          soundEnabled: false,
          animationsEnabled: true,
          gridSize: 4,
          targetValue: 2048,
          showHints: true,
          vibrationEnabled: false,
        })

        updatePreference('theme', 'dark')

        const prefs = loadPreferences()
        expect(prefs.theme).toBe('dark')
        expect(prefs.soundEnabled).toBe(false)
      })

      it('should handle multiple updates', () => {
        updatePreference('theme', 'dark')
        updatePreference('soundEnabled', false)
        updatePreference('gridSize', 5)

        const prefs = loadPreferences()
        expect(prefs.theme).toBe('dark')
        expect(prefs.soundEnabled).toBe(false)
        expect(prefs.gridSize).toBe(5)
      })
    })

    describe('resetPreferences', () => {
      it('should reset preferences to defaults', () => {
        // Clear storage first
        Object.keys(localStorageMock).forEach(key => {
          delete localStorageMock[key]
        })

        // First, set some non-default preferences
        const customPrefs: UserPreferences = {
          theme: 'dark',
          soundEnabled: false,
          animationsEnabled: false,
          gridSize: 5,
          targetValue: 4096,
          showHints: false,
          vibrationEnabled: true,
        }
        savePreferences(customPrefs)

        // Verify preferences were saved
        let prefs = loadPreferences()
        expect(prefs.theme).toBe('dark')

        // Now reset
        resetPreferences()

        prefs = loadPreferences()
        expect(prefs.theme).toBe('auto')
        expect(prefs.soundEnabled).toBe(true)
        expect(prefs.animationsEnabled).toBe(true)
      })
    })
  })

  describe('Utility Functions', () => {
    describe('clearAll', () => {
      it('should clear all stored data', () => {
        // Clear storage first
        Object.keys(localStorageMock).forEach(key => {
          delete localStorageMock[key]
        })

        const mockGameState: GameState = {
          grid: [[null]],
          score: 100,
          gridSize: 4,
          targetValue: 2048,
          isGameOver: false,
          isWon: false,
          moveCount: 10,
          timestamp: Date.now(),
        }

        // Save various data
        saveGameState(mockGameState)
        saveHighScore({
          score: 1000,
          targetValue: 2048,
          gridSize: 4,
          timestamp: Date.now(),
          moveCount: 50,
        })
        updateStatsAfterGame(1000, 50, false)

        const customPrefs: UserPreferences = {
          theme: 'dark',
          soundEnabled: false,
          animationsEnabled: false,
          gridSize: 5,
          targetValue: 4096,
          showHints: false,
          vibrationEnabled: true,
        }
        savePreferences(customPrefs)

        // Verify data was saved
        expect(hasSavedGameState()).toBe(true)
        expect(Object.keys(loadHighScores()).length).toBeGreaterThan(0)

        clearAll()

        expect(hasSavedGameState()).toBe(false)
        expect(Object.keys(loadHighScores())).toHaveLength(0)

        // After clearAll, loading stats returns defaults
        const statsAfterClear = loadStats()
        expect(statsAfterClear.totalGames).toBe(0)
        expect(statsAfterClear.wins).toBe(0)

        // After clearAll, loading preferences returns defaults
        const prefsAfterClear = loadPreferences()
        expect(prefsAfterClear.theme).toBe('auto')
        expect(prefsAfterClear.soundEnabled).toBe(true)
      })
    })

    describe('getStorageSize', () => {
      it('should return 0 for empty storage', () => {
        const size = getStorageSize()
        expect(size).toBe(0)
      })

      it('should calculate approximate storage size', () => {
        saveGameState({
          grid: [[null]],
          score: 100,
          gridSize: 4,
          targetValue: 2048,
          isGameOver: false,
          isWon: false,
          moveCount: 10,
          timestamp: Date.now(),
        })

        const size = getStorageSize()
        expect(size).toBeGreaterThan(0)
      })

      it('should return 0 if localStorage is unavailable', () => {
        const originalLocalStorage = global.localStorage
        delete (global as any).localStorage

        const size = getStorageSize()
        expect(size).toBe(0)

        global.localStorage = originalLocalStorage
      })
    })

    describe('getStorageSizeFormatted', () => {
      it('should format size in bytes', () => {
        const formatted = getStorageSizeFormatted()
        expect(formatted).toMatch(/Bytes|KB|MB/)
      })

      it('should return "0 Bytes" for empty storage', () => {
        const formatted = getStorageSizeFormatted()
        expect(formatted).toBe('0 Bytes')
      })
    })

    describe('exportData and importData', () => {
      it('should export all data as JSON', () => {
        saveGameState({
          grid: [[null]],
          score: 100,
          gridSize: 4,
          targetValue: 2048,
          isGameOver: false,
          isWon: false,
          moveCount: 10,
          timestamp: Date.now(),
        })
        updateStatsAfterGame(1000, 50, false)

        const exported = exportData()
        expect(exported).toBeDefined()

        const parsed = JSON.parse(exported)
        expect(parsed.gameState).toBeDefined()
        expect(parsed.stats).toBeDefined()
        expect(parsed.exportDate).toBeDefined()
      })

      it('should import data successfully', () => {
        const data = {
          gameState: {
            grid: [[null]],
            score: 100,
            gridSize: 4,
            targetValue: 2048,
            isGameOver: false,
            isWon: false,
            moveCount: 10,
            timestamp: Date.now(),
          },
          stats: {
            totalGames: 10,
            wins: 5,
            losses: 5,
            bestScore: 5000,
            totalScore: 20000,
            averageScore: 2000,
            totalMoves: 500,
            averageMoves: 50,
            lastPlayed: Date.now(),
          },
          preferences: {
            theme: 'dark' as const,
            soundEnabled: false,
            animationsEnabled: true,
            gridSize: 4,
            targetValue: 2048,
            showHints: true,
            vibrationEnabled: false,
          },
        }

        importData(JSON.stringify(data))

        const loadedState = loadGameState()
        const loadedStats = loadStats()
        const loadedPrefs = loadPreferences()

        expect(loadedState?.score).toBe(100)
        expect(loadedStats.totalGames).toBe(10)
        expect(loadedPrefs.theme).toBe('dark')
      })

      it('should throw error for invalid JSON', () => {
        expect(() => importData('invalid json')).toThrow(StorageError)
      })

      it('should handle partial import', () => {
        const data = {
          stats: {
            totalGames: 5,
            wins: 2,
            losses: 3,
            bestScore: 3000,
            totalScore: 10000,
            averageScore: 2000,
            totalMoves: 250,
            averageMoves: 50,
            lastPlayed: Date.now(),
          },
        }

        importData(JSON.stringify(data))

        const stats = loadStats()
        expect(stats.totalGames).toBe(5)
      })
    })

    describe('checkStorageHealth', () => {
      it('should report storage as available', () => {
        const health = checkStorageHealth()

        expect(health.available).toBe(true)
      })

      it('should report storage as unavailable when localStorage is not available', () => {
        const originalLocalStorage = global.localStorage
        delete (global as any).localStorage

        const health = checkStorageHealth()
        expect(health.available).toBe(false)

        global.localStorage = originalLocalStorage
      })

      it('should include storage size', () => {
        const health = checkStorageHealth()

        expect(health.size).toBeGreaterThanOrEqual(0)
        expect(health.sizeFormatted).toBeDefined()
      })

      it('should list stored keys', () => {
        saveGameState({
          grid: [[null]],
          score: 100,
          gridSize: 4,
          targetValue: 2048,
          isGameOver: false,
          isWon: false,
          moveCount: 10,
          timestamp: Date.now(),
        })

        const health = checkStorageHealth()
        expect(health.keys.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Error Handling', () => {
    it('should throw StorageError with correct type for quota exceeded', () => {
      // Clear storage first
      Object.keys(localStorageMock).forEach(key => {
        delete localStorageMock[key]
      })

      const setItemSpy = vi.spyOn(global.localStorage, 'setItem')
      setItemSpy.mockImplementation(() => {
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      })

      let caughtError: any
      try {
        saveGameState({
          grid: [[null]],
          score: 100,
          gridSize: 4,
          targetValue: 2048,
          isGameOver: false,
          isWon: false,
          moveCount: 10,
          timestamp: Date.now(),
        })
      } catch (error) {
        caughtError = error
      }

      expect(caughtError).toBeInstanceOf(StorageError)
      expect(caughtError.type).toBe(StorageErrorType.QUOTA_EXCEEDED)
      expect(caughtError.message).toMatch(/quota exceeded/i)

      setItemSpy.mockRestore()
    })

    it('should throw StorageError with correct type for not available', () => {
      const originalLocalStorage = global.localStorage
      delete (global as any).localStorage

      try {
        saveGameState({
          grid: [[null]],
          score: 100,
          gridSize: 4,
          targetValue: 2048,
          isGameOver: false,
          isWon: false,
          moveCount: 10,
          timestamp: Date.now(),
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(StorageError)
        expect((error as StorageError).type).toBe(StorageErrorType.NOT_AVAILABLE)
      }

      global.localStorage = originalLocalStorage
    })

    it('should throw StorageError with correct type for parse error', () => {
      localStorageMock['2048_game_stats'] = 'invalid json'

      try {
        loadStats()
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(StorageError)
        expect((error as StorageError).type).toBe(StorageErrorType.PARSE_ERROR)
      }
    })
  })

  describe('localStorage unavailable scenarios', () => {
    it('should handle localStorage being blocked', () => {
      const originalLocalStorage = global.localStorage

      Object.defineProperty(global, 'localStorage', {
        get: () => {
          throw new Error('localStorage is not available')
        },
        configurable: true,
      })

      expect(() =>
        saveGameState({
          grid: [[null]],
          score: 100,
          gridSize: 4,
          targetValue: 2048,
          isGameOver: false,
          isWon: false,
          moveCount: 10,
          timestamp: Date.now(),
        })
      ).toThrow()

      Object.defineProperty(global, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
      })
    })
  })
})
