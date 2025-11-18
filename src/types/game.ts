/**
 * Type definitions for the 2048 game
 */

/**
 * Represents a position on the game board
 */
export interface Cell {
  row: number
  col: number
}

/**
 * Represents a tile on the game board
 */
export interface Tile {
  id: string
  value: number
  position: Cell
  mergedFrom?: Tile[]
}

/**
 * Represents the four possible movement directions
 */
export enum Direction {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT',
}

/**
 * Represents the game status
 */
export enum GameStatus {
  Playing = 'PLAYING',
  Won = 'WON',
  Lost = 'LOST',
}

/**
 * Configuration for tile spawning
 */
export interface SpawnConfig {
  value: number
  probability: number // Should sum to 1.0 across all spawn configs
}

/**
 * Configuration options for the game
 */
export interface GameConfig {
  gridSize: number // 3, 4, 5, or 6
  targetValue: number // 2048, 4096, 8192, etc.
  spawnValues: SpawnConfig[] // Default: [{value: 2, probability: 0.9}, {value: 4, probability: 0.1}]
  maxUndoStates?: number // Maximum number of previous states to keep (default: 10)
}

/**
 * Represents the complete game state
 */
export interface GameState {
  grid: (Tile | null)[][] // 2D array of tiles
  score: number
  status: GameStatus
  previousStates: GameState[] // For undo functionality
  config: GameConfig
  moveCount: number // Number of moves made
}

/**
 * Result of a move operation
 */
export interface MoveResult {
  newState: GameState
  moved: boolean // Whether any tiles actually moved
  score: number // Score gained from this move
  mergedTiles: Tile[] // Tiles that were merged in this move
}

/**
 * Metadata about a cell during move processing
 */
export interface CellMetadata {
  position: Cell
  value: number | null
  merged: boolean // Whether this cell has already merged in the current move
}

/**
 * Default game configuration
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  gridSize: 4,
  targetValue: 2048,
  spawnValues: [
    { value: 2, probability: 0.9 },
    { value: 4, probability: 0.1 },
  ],
  maxUndoStates: 10,
}

/**
 * Valid grid sizes
 */
export const VALID_GRID_SIZES = [3, 4, 5, 6] as const
export type ValidGridSize = (typeof VALID_GRID_SIZES)[number]

/**
 * Common target values
 */
export const COMMON_TARGET_VALUES = [2048, 4096, 8192, 16384] as const
export type CommonTargetValue = (typeof COMMON_TARGET_VALUES)[number]
