/**
 * Game state management for 2048
 * Handles game initialization, moves, undo, and state transitions
 */

import type { GameState, GameConfig, MoveResult } from '../types/game'
import { Direction, GameStatus, DEFAULT_GAME_CONFIG } from '../types/game'
import {
  createEmptyGrid,
  spawnRandomTile,
  performMove,
  determineGameStatus,
  validateGameConfig,
  cloneGrid,
} from './gameLogic'

/**
 * Deep clones a game state (excluding previousStates to avoid circular references)
 */
function cloneGameState(state: GameState, includePreviousStates = false): GameState {
  return {
    grid: cloneGrid(state.grid),
    score: state.score,
    status: state.status,
    previousStates: includePreviousStates
      ? state.previousStates.map(s => cloneGameState(s, false))
      : [],
    config: { ...state.config },
    moveCount: state.moveCount,
    wonAndContinued: state.wonAndContinued,
  }
}

/**
 * Initializes a new game with the specified configuration
 * Spawns two initial tiles
 */
export function initializeGame(config: GameConfig = DEFAULT_GAME_CONFIG): GameState {
  // Validate configuration
  const errors = validateGameConfig(config)
  if (errors.length > 0) {
    throw new Error(`Invalid game configuration: ${errors.join(', ')}`)
  }

  // Create empty grid
  let grid = createEmptyGrid(config.gridSize)

  // Spawn first tile
  const gridWithFirstTile = spawnRandomTile(grid, config.spawnValues)
  if (!gridWithFirstTile) {
    throw new Error('Failed to spawn first tile')
  }
  grid = gridWithFirstTile

  // Spawn second tile
  const gridWithSecondTile = spawnRandomTile(grid, config.spawnValues)
  if (!gridWithSecondTile) {
    throw new Error('Failed to spawn second tile')
  }
  grid = gridWithSecondTile

  const initialState: GameState = {
    grid,
    score: 0,
    status: GameStatus.Playing,
    previousStates: [],
    config,
    moveCount: 0,
  }

  return initialState
}

/**
 * Performs a move in the specified direction
 * Updates the game state and returns the result
 */
export function move(state: GameState, direction: Direction): MoveResult {
  // Don't allow moves if game is over
  if (state.status === GameStatus.Lost) {
    return {
      newState: state,
      moved: false,
      score: 0,
      mergedTiles: [],
    }
  }

  // Perform the move
  const {
    grid: movedGrid,
    moved,
    score: scoreGained,
    mergedTiles,
  } = performMove(state.grid, direction)

  // If nothing moved, return the current state
  if (!moved) {
    return {
      newState: state,
      moved: false,
      score: 0,
      mergedTiles: [],
    }
  }

  // Spawn a new tile
  const gridWithNewTile = spawnRandomTile(movedGrid, state.config.spawnValues)
  if (!gridWithNewTile) {
    // This shouldn't happen if tiles moved, but handle it gracefully
    return {
      newState: state,
      moved: false,
      score: 0,
      mergedTiles: [],
    }
  }

  // Calculate new score
  const newScore = state.score + scoreGained

  // Determine new game status
  const newStatus = determineGameStatus(
    gridWithNewTile,
    state.config.targetValue,
    state.status,
    state.wonAndContinued
  )

  // Save current state to previousStates for undo
  const stateCopy = cloneGameState(state, false)
  const previousStates = [stateCopy, ...state.previousStates].slice(
    0,
    state.config.maxUndoStates || 10
  )

  // Create new state
  const newState: GameState = {
    grid: gridWithNewTile,
    score: newScore,
    status: newStatus,
    previousStates,
    config: state.config,
    moveCount: state.moveCount + 1,
    wonAndContinued: state.wonAndContinued,
  }

  return {
    newState,
    moved: true,
    score: scoreGained,
    mergedTiles,
  }
}

/**
 * Undoes the last move
 * Returns the previous state or the current state if no undo is available
 */
export function undo(state: GameState): GameState {
  if (state.previousStates.length === 0) {
    return state
  }

  // Get the previous state
  const previousState = state.previousStates[0]

  // Restore the previous state but keep the remaining undo history
  return {
    ...previousState,
    previousStates: state.previousStates.slice(1),
  }
}

/**
 * Resets the game with the same configuration
 */
export function resetGame(state: GameState): GameState {
  return initializeGame(state.config)
}

/**
 * Resets the game with a new configuration
 */
export function resetGameWithConfig(config: GameConfig): GameState {
  return initializeGame(config)
}

/**
 * Continues playing after winning (doesn't reset, just changes status)
 */
export function continueAfterWin(state: GameState): GameState {
  if (state.status !== GameStatus.Won) {
    return state
  }

  return {
    ...state,
    status: GameStatus.Playing,
    wonAndContinued: true,
  }
}

/**
 * Gets the number of available undos
 */
export function getAvailableUndos(state: GameState): number {
  return state.previousStates.length
}

/**
 * Checks if undo is available
 */
export function canUndo(state: GameState): boolean {
  return state.previousStates.length > 0
}

/**
 * Gets the highest tile value on the board
 */
export function getHighestTileValue(state: GameState): number {
  let highest = 0
  for (const row of state.grid) {
    for (const tile of row) {
      if (tile && tile.value > highest) {
        highest = tile.value
      }
    }
  }
  return highest
}

/**
 * Gets statistics about the current game state
 */
export interface GameStatistics {
  score: number
  moveCount: number
  highestTile: number
  tileCount: number
  emptyCellCount: number
  status: GameStatus
  canUndo: boolean
  availableUndos: number
}

export function getGameStatistics(state: GameState): GameStatistics {
  let tileCount = 0
  let emptyCellCount = 0

  for (const row of state.grid) {
    for (const tile of row) {
      if (tile) {
        tileCount++
      } else {
        emptyCellCount++
      }
    }
  }

  return {
    score: state.score,
    moveCount: state.moveCount,
    highestTile: getHighestTileValue(state),
    tileCount,
    emptyCellCount,
    status: state.status,
    canUndo: canUndo(state),
    availableUndos: getAvailableUndos(state),
  }
}

/**
 * Serializes game state to JSON
 * Useful for saving/loading games
 */
export function serializeGameState(state: GameState): string {
  return JSON.stringify(state)
}

/**
 * Deserializes game state from JSON
 * Validates the structure before returning
 */
export function deserializeGameState(json: string): GameState {
  try {
    const state = JSON.parse(json) as GameState

    // Basic validation
    if (!state.grid || !Array.isArray(state.grid)) {
      throw new Error('Invalid game state: missing or invalid grid')
    }

    if (typeof state.score !== 'number') {
      throw new Error('Invalid game state: missing or invalid score')
    }

    if (!state.config) {
      throw new Error('Invalid game state: missing config')
    }

    // Validate config
    const errors = validateGameConfig(state.config)
    if (errors.length > 0) {
      throw new Error(`Invalid game state config: ${errors.join(', ')}`)
    }

    return state
  } catch (error) {
    throw new Error(
      `Failed to deserialize game state: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Creates a snapshot of the current state (for testing or debugging)
 */
export function createStateSnapshot(state: GameState): GameState {
  return cloneGameState(state, true)
}
