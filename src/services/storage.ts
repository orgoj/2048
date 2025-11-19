/**
 * localStorage Service for 2048 Game Data Persistence
 *
 * Provides type-safe storage for game state, statistics, high scores, and user preferences.
 * Uses localStorage API with automatic JSON serialization/deserialization.
 */

// ==================== Type Definitions ====================

/**
 * Represents a single tile on the game board
 */
export interface Tile {
  id: string
  value: number
  position: { row: number; col: number }
  isNew?: boolean
  mergedFrom?: Tile[]
}

/**
 * Complete game state for save/resume functionality
 */
export interface GameState {
  grid: (Tile | null)[][]
  score: number
  gridSize: number
  targetValue: number
  isGameOver: boolean
  isWon: boolean
  moveCount: number
  timestamp: number
}

/**
 * High score entry for a specific configuration
 */
export interface HighScoreEntry {
  score: number
  targetValue: number
  gridSize: number
  timestamp: number
  moveCount: number
  duration?: number // Game duration in seconds
}

/**
 * High scores organized by grid size and target value
 */
export interface HighScores {
  [key: string]: HighScoreEntry // key format: "gridSize_targetValue"
}

/**
 * Overall game statistics
 */
export interface GameStats {
  totalGames: number
  wins: number
  losses: number
  bestScore: number
  totalScore: number
  averageScore: number
  totalMoves: number
  averageMoves: number
  lastPlayed: number
}

/**
 * User preferences and settings
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  soundEnabled: boolean
  animationsEnabled: boolean
  gridSize: number
  targetValue: number
  showHints: boolean
  vibrationEnabled: boolean
}

/**
 * Storage error types
 */
export enum StorageErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  PARSE_ERROR = 'PARSE_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export class StorageError extends Error {
  constructor(
    public type: StorageErrorType,
    message: string
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

// ==================== Storage Keys ====================

const STORAGE_PREFIX = '2048_'

const KEYS = {
  GAME_STATE: `${STORAGE_PREFIX}game_state`,
  HIGH_SCORES: `${STORAGE_PREFIX}high_scores`,
  GAME_STATS: `${STORAGE_PREFIX}game_stats`,
  PREFERENCES: `${STORAGE_PREFIX}preferences`,
} as const

// ==================== Default Values ====================

const DEFAULT_STATS: GameStats = {
  totalGames: 0,
  wins: 0,
  losses: 0,
  bestScore: 0,
  totalScore: 0,
  averageScore: 0,
  totalMoves: 0,
  averageMoves: 0,
  lastPlayed: 0,
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'auto',
  soundEnabled: true,
  animationsEnabled: true,
  gridSize: 4,
  targetValue: 2048,
  showHints: true,
  vibrationEnabled: false,
}

// ==================== Helper Functions ====================

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Generic function to save data to localStorage
 */
function saveToStorage<T>(key: string, data: T): void {
  if (!isLocalStorageAvailable()) {
    throw new StorageError(
      StorageErrorType.NOT_AVAILABLE,
      'localStorage is not available in this browser'
    )
  }

  try {
    const serialized = JSON.stringify(data)
    localStorage.setItem(key, serialized)
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new StorageError(
        StorageErrorType.QUOTA_EXCEEDED,
        'localStorage quota exceeded. Please clear some data or disable data persistence.'
      )
    }
    throw new StorageError(
      StorageErrorType.UNKNOWN,
      `Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generic function to load data from localStorage
 */
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available, using default value')
    return defaultValue
  }

  try {
    const serialized = localStorage.getItem(key)
    if (serialized === null) {
      return defaultValue
    }
    return JSON.parse(serialized) as T
  } catch (error) {
    console.error(`Failed to load data from ${key}:`, error)
    throw new StorageError(
      StorageErrorType.PARSE_ERROR,
      `Failed to parse stored data: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Remove a specific item from localStorage
 */
function removeFromStorage(key: string): void {
  if (!isLocalStorageAvailable()) {
    return
  }
  localStorage.removeItem(key)
}

// ==================== Game State Functions ====================

/**
 * Save the current game state to localStorage
 */
export function saveGameState(state: GameState): void {
  saveToStorage(KEYS.GAME_STATE, state)
}

/**
 * Load the saved game state from localStorage
 * Returns null if no saved state exists
 */
export function loadGameState(): GameState | null {
  if (!isLocalStorageAvailable()) {
    return null
  }

  try {
    const serialized = localStorage.getItem(KEYS.GAME_STATE)
    if (serialized === null) {
      return null
    }
    return JSON.parse(serialized) as GameState
  } catch (error) {
    console.error('Failed to load game state:', error)
    return null
  }
}

/**
 * Clear the saved game state
 */
export function clearGameState(): void {
  removeFromStorage(KEYS.GAME_STATE)
}

/**
 * Check if a saved game state exists
 */
export function hasSavedGameState(): boolean {
  if (!isLocalStorageAvailable()) {
    return false
  }
  return localStorage.getItem(KEYS.GAME_STATE) !== null
}

// ==================== High Scores Functions ====================

/**
 * Generate a key for high score lookup
 */
function getHighScoreKey(gridSize: number, targetValue: number): string {
  return `${gridSize}_${targetValue}`
}

/**
 * Save a high score for a specific configuration
 */
export function saveHighScore(entry: HighScoreEntry): void {
  const highScores = loadHighScores()
  const key = getHighScoreKey(entry.gridSize, entry.targetValue)

  // Only save if it's a new high score
  const existingScore = highScores[key]
  if (!existingScore || entry.score > existingScore.score) {
    highScores[key] = entry
    saveToStorage(KEYS.HIGH_SCORES, highScores)
  }
}

/**
 * Get high score for a specific configuration
 */
export function getHighScore(gridSize: number, targetValue: number): HighScoreEntry | null {
  const highScores = loadHighScores()
  const key = getHighScoreKey(gridSize, targetValue)
  return highScores[key] || null
}

/**
 * Load all high scores
 */
export function loadHighScores(): HighScores {
  return loadFromStorage(KEYS.HIGH_SCORES, {})
}

/**
 * Get all high scores as an array, sorted by score descending
 */
export function getAllHighScores(): HighScoreEntry[] {
  const highScores = loadHighScores()
  return Object.values(highScores).sort((a, b) => b.score - a.score)
}

/**
 * Clear all high scores
 */
export function clearHighScores(): void {
  removeFromStorage(KEYS.HIGH_SCORES)
}

// ==================== Game Statistics Functions ====================

/**
 * Save game statistics
 */
export function saveStats(stats: GameStats): void {
  saveToStorage(KEYS.GAME_STATS, stats)
}

/**
 * Load game statistics
 * Returns default stats if none exist
 */
export function loadStats(): GameStats {
  return loadFromStorage(KEYS.GAME_STATS, DEFAULT_STATS)
}

/**
 * Update statistics after a game ends
 */
export function updateStatsAfterGame(
  score: number,
  moves: number,
  isWin: boolean,
  duration?: number
): void {
  const stats = loadStats()

  stats.totalGames += 1
  stats.totalScore += score
  stats.totalMoves += moves

  if (isWin) {
    stats.wins += 1
  } else {
    stats.losses += 1
  }

  if (score > stats.bestScore) {
    stats.bestScore = score
  }

  stats.averageScore = Math.round(stats.totalScore / stats.totalGames)
  stats.averageMoves = Math.round(stats.totalMoves / stats.totalGames)
  stats.lastPlayed = Date.now()

  // Note: duration is passed but not stored in global stats
  // It's stored per high score entry instead
  void duration // Silence unused variable warning

  saveStats(stats)
}

/**
 * Reset all game statistics
 */
export function resetStats(): void {
  saveToStorage(KEYS.GAME_STATS, DEFAULT_STATS)
}

// ==================== User Preferences Functions ====================

/**
 * Save user preferences
 */
export function savePreferences(preferences: UserPreferences): void {
  saveToStorage(KEYS.PREFERENCES, preferences)
}

/**
 * Load user preferences
 * Returns default preferences if none exist
 */
export function loadPreferences(): UserPreferences {
  return loadFromStorage(KEYS.PREFERENCES, DEFAULT_PREFERENCES)
}

/**
 * Update a specific preference
 */
export function updatePreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): void {
  const preferences = loadPreferences()
  preferences[key] = value
  savePreferences(preferences)
}

/**
 * Reset preferences to defaults
 */
export function resetPreferences(): void {
  saveToStorage(KEYS.PREFERENCES, DEFAULT_PREFERENCES)
}

// ==================== Utility Functions ====================

/**
 * Clear all stored data
 */
export function clearAll(): void {
  Object.values(KEYS).forEach(key => {
    removeFromStorage(key)
  })
}

/**
 * Get the total size of stored data in bytes (approximate)
 */
export function getStorageSize(): number {
  if (!isLocalStorageAvailable()) {
    return 0
  }

  let totalSize = 0
  Object.values(KEYS).forEach(key => {
    const item = localStorage.getItem(key)
    if (item) {
      // Count both key and value size, plus overhead
      totalSize += key.length + item.length
    }
  })

  return totalSize
}

/**
 * Get storage size in human-readable format
 */
export function getStorageSizeFormatted(): string {
  const bytes = getStorageSize()

  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * Export all data as a JSON string (for backup/transfer)
 */
export function exportData(): string {
  const data = {
    gameState: loadGameState(),
    highScores: loadHighScores(),
    stats: loadStats(),
    preferences: loadPreferences(),
    exportDate: new Date().toISOString(),
  }

  return JSON.stringify(data, null, 2)
}

/**
 * Import data from a JSON string (for restore)
 */
export function importData(jsonString: string): void {
  try {
    const data = JSON.parse(jsonString)

    if (data.gameState) {
      saveGameState(data.gameState)
    }
    if (data.highScores) {
      saveToStorage(KEYS.HIGH_SCORES, data.highScores)
    }
    if (data.stats) {
      saveStats(data.stats)
    }
    if (data.preferences) {
      savePreferences(data.preferences)
    }
  } catch (error) {
    throw new StorageError(
      StorageErrorType.PARSE_ERROR,
      `Failed to import data: ${error instanceof Error ? error.message : 'Invalid JSON'}`
    )
  }
}

/**
 * Check if the storage is available and working
 */
export function checkStorageHealth(): {
  available: boolean
  size: number
  sizeFormatted: string
  keys: string[]
} {
  const available = isLocalStorageAvailable()
  const size = getStorageSize()
  const sizeFormatted = getStorageSizeFormatted()
  const keys = available
    ? Object.values(KEYS).filter(key => localStorage.getItem(key) !== null)
    : []

  return {
    available,
    size,
    sizeFormatted,
    keys,
  }
}

// ==================== Default Export ====================

/**
 * Storage service object with all functions
 */
const storageService = {
  // Game State
  saveGameState,
  loadGameState,
  clearGameState,
  hasSavedGameState,

  // High Scores
  saveHighScore,
  getHighScore,
  loadHighScores,
  getAllHighScores,
  clearHighScores,

  // Statistics
  saveStats,
  loadStats,
  updateStatsAfterGame,
  resetStats,

  // Preferences
  savePreferences,
  loadPreferences,
  updatePreference,
  resetPreferences,

  // Utility
  clearAll,
  getStorageSize,
  getStorageSizeFormatted,
  exportData,
  importData,
  checkStorageHealth,
}

export default storageService
