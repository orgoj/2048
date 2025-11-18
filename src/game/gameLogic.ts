/**
 * Core game logic for 2048
 * Contains pure functions for game operations
 */

import type { Cell, Tile, GameConfig, SpawnConfig } from '../types/game'
import { Direction, GameStatus } from '../types/game'

/**
 * Generates a unique ID for a tile
 */
let tileIdCounter = 0
export function generateTileId(): string {
  return `tile-${Date.now()}-${tileIdCounter++}`
}

/**
 * Creates a new tile at the specified position
 */
export function createTile(position: Cell, value: number): Tile {
  return {
    id: generateTileId(),
    value,
    position,
  }
}

/**
 * Creates an empty grid of the specified size
 */
export function createEmptyGrid(size: number): (Tile | null)[][] {
  return Array(size)
    .fill(null)
    .map(() => Array(size).fill(null))
}

/**
 * Deep clones the grid
 */
export function cloneGrid(grid: (Tile | null)[][]): (Tile | null)[][] {
  return grid.map(row =>
    row.map(tile =>
      tile
        ? {
            ...tile,
            position: { ...tile.position },
            mergedFrom: tile.mergedFrom?.map(t => ({ ...t })),
          }
        : null
    )
  )
}

/**
 * Gets all empty cells in the grid
 */
export function getEmptyCells(grid: (Tile | null)[][]): Cell[] {
  const emptyCells: Cell[] = []
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col] === null) {
        emptyCells.push({ row, col })
      }
    }
  }
  return emptyCells
}

/**
 * Gets all tiles from the grid
 */
export function getAllTiles(grid: (Tile | null)[][]): Tile[] {
  const tiles: Tile[] = []
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const tile = grid[row][col]
      if (tile !== null) {
        tiles.push(tile)
      }
    }
  }
  return tiles
}

/**
 * Selects a random spawn value based on probabilities
 */
export function selectSpawnValue(spawnValues: SpawnConfig[]): number {
  const random = Math.random()
  let cumulative = 0

  for (const config of spawnValues) {
    cumulative += config.probability
    if (random <= cumulative) {
      return config.value
    }
  }

  // Fallback to first value if probabilities don't sum to 1
  return spawnValues[0].value
}

/**
 * Spawns a new tile in a random empty cell
 * Returns the new grid with the spawned tile, or null if no empty cells
 */
export function spawnRandomTile(
  grid: (Tile | null)[][],
  spawnValues: SpawnConfig[]
): (Tile | null)[][] | null {
  const emptyCells = getEmptyCells(grid)

  if (emptyCells.length === 0) {
    return null
  }

  const newGrid = cloneGrid(grid)
  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  const value = selectSpawnValue(spawnValues)
  const newTile = createTile(randomCell, value)

  newGrid[randomCell.row][randomCell.col] = newTile

  return newGrid
}

/**
 * Gets the traversal order for cells based on direction
 * This ensures we process cells in the correct order during a move
 */
function getTraversalOrder(direction: Direction, gridSize: number): Cell[] {
  const cells: Cell[] = []

  switch (direction) {
    case Direction.Up:
      // Process from top to bottom
      for (let col = 0; col < gridSize; col++) {
        for (let row = 0; row < gridSize; row++) {
          cells.push({ row, col })
        }
      }
      break

    case Direction.Down:
      // Process from bottom to top
      for (let col = 0; col < gridSize; col++) {
        for (let row = gridSize - 1; row >= 0; row--) {
          cells.push({ row, col })
        }
      }
      break

    case Direction.Left:
      // Process from left to right
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          cells.push({ row, col })
        }
      }
      break

    case Direction.Right:
      // Process from right to left
      for (let row = 0; row < gridSize; row++) {
        for (let col = gridSize - 1; col >= 0; col--) {
          cells.push({ row, col })
        }
      }
      break
  }

  return cells
}

/**
 * Gets the next cell in the given direction
 */
function getNextCell(cell: Cell, direction: Direction): Cell | null {
  switch (direction) {
    case Direction.Up:
      return cell.row > 0 ? { row: cell.row - 1, col: cell.col } : null
    case Direction.Down:
      return { row: cell.row + 1, col: cell.col }
    case Direction.Left:
      return cell.col > 0 ? { row: cell.row, col: cell.col - 1 } : null
    case Direction.Right:
      return { row: cell.row, col: cell.col + 1 }
  }
}

/**
 * Checks if a cell is within the grid bounds
 */
function isWithinBounds(cell: Cell, gridSize: number): boolean {
  return cell.row >= 0 && cell.row < gridSize && cell.col >= 0 && cell.col < gridSize
}

/**
 * Finds the farthest position a tile can move to in the given direction
 * Returns the farthest empty position and the next position (which might contain a tile to merge with)
 */
function findFarthestPosition(
  position: Cell,
  direction: Direction,
  grid: (Tile | null)[][],
  mergedCells: Set<string>
): { farthest: Cell; next: Cell | null } {
  let previous = position
  let current = getNextCell(position, direction)

  // Keep moving until we hit a boundary or a tile
  while (current && isWithinBounds(current, grid.length)) {
    const cellKey = `${current.row},${current.col}`
    const tile = grid[current.row][current.col]

    if (tile !== null || mergedCells.has(cellKey)) {
      break
    }

    previous = current
    current = getNextCell(current, direction)
  }

  return {
    farthest: previous,
    next: current && isWithinBounds(current, grid.length) ? current : null,
  }
}

/**
 * Performs a move in the specified direction
 * Returns the new grid, whether any tiles moved, and the score gained
 */
export function performMove(
  grid: (Tile | null)[][],
  direction: Direction
): { grid: (Tile | null)[][]; moved: boolean; score: number; mergedTiles: Tile[] } {
  const gridSize = grid.length
  const newGrid = createEmptyGrid(gridSize)
  const mergedCells = new Set<string>() // Track which cells have merged in this move
  const mergedTiles: Tile[] = []
  let moved = false
  let score = 0

  const traversalOrder = getTraversalOrder(direction, gridSize)

  for (const cell of traversalOrder) {
    const tile = grid[cell.row][cell.col]

    if (tile === null) {
      continue
    }

    const { farthest, next } = findFarthestPosition(cell, direction, newGrid, mergedCells)

    // Check if we can merge with the next tile
    let newPosition = farthest
    let mergedTile: Tile | undefined

    if (next) {
      const nextTile = newGrid[next.row][next.col]
      const nextCellKey = `${next.row},${next.col}`

      if (nextTile && nextTile.value === tile.value && !mergedCells.has(nextCellKey)) {
        // Merge tiles
        const mergedValue = tile.value * 2
        mergedTile = createTile(next, mergedValue)
        mergedTile.mergedFrom = [
          { ...tile, position: { ...tile.position } },
          { ...nextTile, position: { ...nextTile.position } },
        ]

        newPosition = next
        mergedCells.add(nextCellKey)
        score += mergedValue
        mergedTiles.push(mergedTile)
      }
    }

    // Place the tile in its new position
    const finalTile = mergedTile || { ...tile, position: newPosition }
    newGrid[newPosition.row][newPosition.col] = finalTile

    // Check if the tile moved
    if (newPosition.row !== tile.position.row || newPosition.col !== tile.position.col) {
      moved = true
    }
  }

  return { grid: newGrid, moved, score, mergedTiles }
}

/**
 * Checks if any moves are available
 */
export function hasMovesAvailable(grid: (Tile | null)[][]): boolean {
  const gridSize = grid.length

  // Check for empty cells
  if (getEmptyCells(grid).length > 0) {
    return true
  }

  // Check for possible merges
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const tile = grid[row][col]
      if (tile === null) continue

      // Check adjacent cells
      const adjacentCells = [
        { row: row - 1, col }, // Up
        { row: row + 1, col }, // Down
        { row, col: col - 1 }, // Left
        { row, col: col + 1 }, // Right
      ]

      for (const adjCell of adjacentCells) {
        if (isWithinBounds(adjCell, gridSize)) {
          const adjTile = grid[adjCell.row][adjCell.col]
          if (adjTile && adjTile.value === tile.value) {
            return true
          }
        }
      }
    }
  }

  return false
}

/**
 * Checks if the player has won (any tile reached the target value)
 */
export function hasWon(grid: (Tile | null)[][], targetValue: number): boolean {
  const tiles = getAllTiles(grid)
  return tiles.some(tile => tile.value >= targetValue)
}

/**
 * Determines the game status
 */
export function determineGameStatus(
  grid: (Tile | null)[][],
  targetValue: number,
  currentStatus: GameStatus
): GameStatus {
  // Once won, stay won (unless game is reset)
  if (currentStatus === GameStatus.Won) {
    return GameStatus.Won
  }

  if (hasWon(grid, targetValue)) {
    return GameStatus.Won
  }

  if (!hasMovesAvailable(grid)) {
    return GameStatus.Lost
  }

  return GameStatus.Playing
}

/**
 * Validates game configuration
 */
export function validateGameConfig(config: GameConfig): string[] {
  const errors: string[] = []

  // Validate grid size
  if (config.gridSize < 3 || config.gridSize > 6) {
    errors.push('Grid size must be between 3 and 6')
  }

  // Validate target value
  if (config.targetValue <= 0 || !Number.isInteger(config.targetValue)) {
    errors.push('Target value must be a positive integer')
  }

  // Check if target value is a power of 2
  if ((config.targetValue & (config.targetValue - 1)) !== 0) {
    errors.push('Target value should be a power of 2')
  }

  // Validate spawn values
  if (!config.spawnValues || config.spawnValues.length === 0) {
    errors.push('At least one spawn value must be configured')
  } else {
    const totalProbability = config.spawnValues.reduce((sum, sv) => sum + sv.probability, 0)
    if (Math.abs(totalProbability - 1.0) > 0.001) {
      errors.push('Spawn value probabilities must sum to 1.0')
    }

    for (const sv of config.spawnValues) {
      if (sv.value <= 0 || !Number.isInteger(sv.value)) {
        errors.push('Spawn values must be positive integers')
      }
      if (sv.probability < 0 || sv.probability > 1) {
        errors.push('Spawn probabilities must be between 0 and 1')
      }
    }
  }

  return errors
}
