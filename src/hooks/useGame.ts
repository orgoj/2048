/**
 * Main game state hook for 2048
 * Manages game state, moves, undo, and persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { GameState, GameConfig as GameLogicConfig } from '../types/game'
import { Direction, GameStatus } from '../types/game'
import {
  initializeGame,
  move as performMove,
  undo as performUndo,
  resetGame,
  canUndo as checkCanUndo,
  serializeGameState,
  deserializeGameState,
} from '../game/gameState'
import { parseConfigFromHash, updateURLHash } from '../config/urlConfig'
import type { GameConfig } from '../config/defaultConfig'

const STORAGE_KEY = '2048_game_state'

/**
 * Converts URL/UI GameConfig to game logic GameConfig
 */
function convertToGameLogicConfig(config: GameConfig): GameLogicConfig {
  return {
    gridSize: config.size,
    targetValue: config.target,
    spawnValues: config.spawn,
    maxUndoStates: 10,
  }
}

/**
 * Hook return type
 */
export interface UseGameReturn {
  gameState: GameState
  move: (direction: Direction) => void
  undo: () => void
  newGame: () => void
  continueGame: () => void
  canUndo: boolean
  config: GameLogicConfig
  isGameOver: boolean
  hasWon: boolean
}

/**
 * Main game hook
 *
 * Manages the complete game state including:
 * - Game initialization from URL config
 * - Move handling (up, down, left, right)
 * - Undo functionality
 * - New game / reset
 * - Auto-save to localStorage
 * - Statistics updates
 *
 * @param externalConfig - Optional external config to use instead of URL hash
 * @returns Game state and control functions
 */
export function useGame(externalConfig?: GameConfig): UseGameReturn {
  const [config, setConfig] = useState<GameConfig>(() => externalConfig || parseConfigFromHash())
  const [gameState, setGameState] = useState<GameState>(() => {
    const configToUse = externalConfig || parseConfigFromHash()
    // Try to load from localStorage first
    const saved = loadGameState()
    if (
      saved &&
      saved.config.gridSize === configToUse.size &&
      saved.config.targetValue === configToUse.target
    ) {
      return saved
    }
    // Otherwise initialize new game
    return initializeGame(convertToGameLogicConfig(configToUse))
  })

  const previousStatusRef = useRef<GameStatus>(gameState.status)
  const previousConfigRef = useRef<{ size: number; target: number }>({
    size: config.size,
    target: config.target,
  })

  // Update config when external config changes
  useEffect(() => {
    if (externalConfig) {
      setConfig(externalConfig)
    }
  }, [externalConfig])

  // Restart game when config changes significantly (size or target)
  useEffect(() => {
    const prevConfig = previousConfigRef.current
    if (config.size !== prevConfig.size || config.target !== prevConfig.target) {
      // Config changed - start a new game with new config
      setGameState(initializeGame(convertToGameLogicConfig(config)))
      previousConfigRef.current = { size: config.size, target: config.target }
    }
  }, [config])

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    saveGameState(gameState)
  }, [gameState])

  // Update URL hash when config changes
  useEffect(() => {
    updateURLHash(config)
  }, [config])

  // Handle game over / win state changes
  useEffect(() => {
    const previousStatus = previousStatusRef.current
    const currentStatus = gameState.status

    // Check if game just ended (transitioned to Won or Lost)
    if (
      previousStatus === GameStatus.Playing &&
      (currentStatus === GameStatus.Won || currentStatus === GameStatus.Lost)
    ) {
      // Update stats
      updateStatsAfterGameEnd(gameState)
    }

    previousStatusRef.current = currentStatus
  }, [gameState.status, gameState])

  /**
   * Handle a move in the specified direction
   */
  const move = useCallback((direction: Direction) => {
    setGameState(currentState => {
      const result = performMove(currentState, direction)
      return result.newState
    })
  }, [])

  /**
   * Undo the last move
   */
  const undo = useCallback(() => {
    setGameState(currentState => performUndo(currentState))
  }, [])

  /**
   * Start a new game with the same configuration
   */
  const newGame = useCallback(() => {
    setGameState(currentState => resetGame(currentState))
  }, [])

  /**
   * Continue playing after winning
   */
  const continueGame = useCallback(() => {
    setGameState(currentState => {
      if (currentState.status !== GameStatus.Won) {
        return currentState
      }
      return {
        ...currentState,
        status: GameStatus.Playing,
      }
    })
  }, [])

  return {
    gameState,
    move,
    undo,
    newGame,
    continueGame,
    canUndo: checkCanUndo(gameState),
    config: convertToGameLogicConfig(config),
    isGameOver: gameState.status === GameStatus.Lost,
    hasWon: gameState.status === GameStatus.Won,
  }
}

/**
 * Save game state to localStorage
 */
function saveGameState(state: GameState): void {
  try {
    const serialized = serializeGameState(state)
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (error) {
    console.error('Failed to save game state:', error)
  }
}

/**
 * Load game state from localStorage
 */
function loadGameState(): GameState | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY)
    if (!serialized) {
      return null
    }
    return deserializeGameState(serialized)
  } catch (error) {
    console.error('Failed to load game state:', error)
    return null
  }
}

/**
 * Update statistics after game ends
 */
function updateStatsAfterGameEnd(state: GameState): void {
  // Import stats functions lazily to avoid circular dependencies
  import('../services/storage')
    .then(({ updateStatsAfterGame }) => {
      const isWin = state.status === GameStatus.Won
      updateStatsAfterGame(state.score, state.moveCount, isWin)
    })
    .catch(error => {
      console.error('Failed to update stats:', error)
    })
}
