/**
 * Unit tests for gameLogic.ts
 * Tests core game logic functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createEmptyGrid,
  createTile,
  generateTileId,
  cloneGrid,
  getEmptyCells,
  getAllTiles,
  selectSpawnValue,
  spawnRandomTile,
  performMove,
  hasMovesAvailable,
  hasWon,
  determineGameStatus,
  validateGameConfig,
} from '../gameLogic'
import { Direction, GameStatus } from '../../types/game'
import type { GameConfig, SpawnConfig, Tile } from '../../types/game'

describe('gameLogic', () => {
  describe('createEmptyGrid', () => {
    it('should create a grid of the specified size filled with nulls', () => {
      const grid = createEmptyGrid(4)
      expect(grid).toHaveLength(4)
      expect(grid[0]).toHaveLength(4)
      expect(grid.every(row => row.every(cell => cell === null))).toBe(true)
    })

    it('should create grids of different sizes', () => {
      const sizes = [3, 4, 5, 6]
      sizes.forEach(size => {
        const grid = createEmptyGrid(size)
        expect(grid).toHaveLength(size)
        expect(grid[0]).toHaveLength(size)
      })
    })

    it('should create independent arrays for each row', () => {
      const grid = createEmptyGrid(4)
      grid[0][0] = createTile({ row: 0, col: 0 }, 2)
      expect(grid[1][0]).toBeNull()
      expect(grid[0][1]).toBeNull()
    })
  })

  describe('generateTileId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateTileId()
      const id2 = generateTileId()
      expect(id1).not.toBe(id2)
    })

    it('should generate IDs in the expected format', () => {
      const id = generateTileId()
      expect(id).toMatch(/^tile-\d+-\d+$/)
    })
  })

  describe('createTile', () => {
    it('should create a tile with the specified value and position', () => {
      const position = { row: 1, col: 2 }
      const tile = createTile(position, 4)

      expect(tile.value).toBe(4)
      expect(tile.position).toEqual(position)
      expect(tile.id).toBeDefined()
    })

    it('should create tiles with unique IDs', () => {
      const tile1 = createTile({ row: 0, col: 0 }, 2)
      const tile2 = createTile({ row: 0, col: 1 }, 2)
      expect(tile1.id).not.toBe(tile2.id)
    })
  })

  describe('cloneGrid', () => {
    it('should create a deep copy of the grid', () => {
      const grid = createEmptyGrid(4)
      grid[0][0] = createTile({ row: 0, col: 0 }, 2)
      grid[1][1] = createTile({ row: 1, col: 1 }, 4)

      const cloned = cloneGrid(grid)

      expect(cloned).toEqual(grid)
      expect(cloned).not.toBe(grid)
      expect(cloned[0]).not.toBe(grid[0])
      expect(cloned[0][0]).not.toBe(grid[0][0])
    })

    it('should clone tiles with mergedFrom', () => {
      const grid = createEmptyGrid(4)
      const tile1 = createTile({ row: 0, col: 0 }, 2)
      const tile2 = createTile({ row: 0, col: 1 }, 2)
      const mergedTile = createTile({ row: 0, col: 0 }, 4)
      mergedTile.mergedFrom = [tile1, tile2]
      grid[0][0] = mergedTile

      const cloned = cloneGrid(grid)

      expect(cloned[0][0]?.mergedFrom).toHaveLength(2)
      expect(cloned[0][0]?.mergedFrom?.[0]).not.toBe(tile1)
    })
  })

  describe('getEmptyCells', () => {
    it('should return all cells for an empty grid', () => {
      const grid = createEmptyGrid(4)
      const emptyCells = getEmptyCells(grid)
      expect(emptyCells).toHaveLength(16)
    })

    it('should return correct empty cells for a partially filled grid', () => {
      const grid = createEmptyGrid(4)
      grid[0][0] = createTile({ row: 0, col: 0 }, 2)
      grid[1][1] = createTile({ row: 1, col: 1 }, 4)

      const emptyCells = getEmptyCells(grid)
      expect(emptyCells).toHaveLength(14)
      expect(emptyCells.some(cell => cell.row === 0 && cell.col === 0)).toBe(false)
      expect(emptyCells.some(cell => cell.row === 1 && cell.col === 1)).toBe(false)
    })

    it('should return empty array for a full grid', () => {
      const grid = createEmptyGrid(2)
      grid[0][0] = createTile({ row: 0, col: 0 }, 2)
      grid[0][1] = createTile({ row: 0, col: 1 }, 4)
      grid[1][0] = createTile({ row: 1, col: 0 }, 2)
      grid[1][1] = createTile({ row: 1, col: 1 }, 4)

      const emptyCells = getEmptyCells(grid)
      expect(emptyCells).toHaveLength(0)
    })
  })

  describe('getAllTiles', () => {
    it('should return empty array for an empty grid', () => {
      const grid = createEmptyGrid(4)
      const tiles = getAllTiles(grid)
      expect(tiles).toHaveLength(0)
    })

    it('should return all tiles from a partially filled grid', () => {
      const grid = createEmptyGrid(4)
      grid[0][0] = createTile({ row: 0, col: 0 }, 2)
      grid[1][1] = createTile({ row: 1, col: 1 }, 4)
      grid[2][2] = createTile({ row: 2, col: 2 }, 8)

      const tiles = getAllTiles(grid)
      expect(tiles).toHaveLength(3)
      expect(tiles.map(t => t.value).sort()).toEqual([2, 4, 8])
    })
  })

  describe('selectSpawnValue', () => {
    it('should return values based on probabilities', () => {
      const spawnValues: SpawnConfig[] = [
        { value: 2, probability: 0.9 },
        { value: 4, probability: 0.1 },
      ]

      // Mock Math.random to test deterministically
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      expect(selectSpawnValue(spawnValues)).toBe(2)

      vi.spyOn(Math, 'random').mockReturnValue(0.95)
      expect(selectSpawnValue(spawnValues)).toBe(4)

      vi.restoreAllMocks()
    })

    it('should return first value if probabilities do not sum to 1', () => {
      const spawnValues: SpawnConfig[] = [
        { value: 2, probability: 0.5 },
        { value: 4, probability: 0.3 },
      ]

      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      expect(selectSpawnValue(spawnValues)).toBe(2)
      vi.restoreAllMocks()
    })

    it('should handle single spawn value', () => {
      const spawnValues: SpawnConfig[] = [{ value: 8, probability: 1.0 }]
      expect(selectSpawnValue(spawnValues)).toBe(8)
    })
  })

  describe('spawnRandomTile', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('should spawn a tile in a random empty cell', () => {
      const grid = createEmptyGrid(4)
      const spawnValues: SpawnConfig[] = [{ value: 2, probability: 1.0 }]

      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      const newGrid = spawnRandomTile(grid, spawnValues)

      expect(newGrid).not.toBeNull()
      const tiles = getAllTiles(newGrid!)
      expect(tiles).toHaveLength(1)
      expect(tiles[0].value).toBe(2)
    })

    it('should return null if grid is full', () => {
      const grid = createEmptyGrid(2)
      grid[0][0] = createTile({ row: 0, col: 0 }, 2)
      grid[0][1] = createTile({ row: 0, col: 1 }, 4)
      grid[1][0] = createTile({ row: 1, col: 0 }, 2)
      grid[1][1] = createTile({ row: 1, col: 1 }, 4)

      const spawnValues: SpawnConfig[] = [{ value: 2, probability: 1.0 }]
      const newGrid = spawnRandomTile(grid, spawnValues)

      expect(newGrid).toBeNull()
    })

    it('should not modify the original grid', () => {
      const grid = createEmptyGrid(4)
      const spawnValues: SpawnConfig[] = [{ value: 2, probability: 1.0 }]

      spawnRandomTile(grid, spawnValues)

      expect(getAllTiles(grid)).toHaveLength(0)
    })
  })

  describe('performMove', () => {
    describe('movement in all directions', () => {
      it('should move tiles left correctly', () => {
        const grid = createEmptyGrid(4)
        grid[0][2] = createTile({ row: 0, col: 2 }, 2)
        grid[0][3] = createTile({ row: 0, col: 3 }, 4)

        const { grid: newGrid, moved } = performMove(grid, Direction.Left)

        expect(moved).toBe(true)
        expect(newGrid[0][0]?.value).toBe(2)
        expect(newGrid[0][1]?.value).toBe(4)
        expect(newGrid[0][2]).toBeNull()
        expect(newGrid[0][3]).toBeNull()
      })

      it('should move tiles right correctly', () => {
        const grid = createEmptyGrid(4)
        grid[0][0] = createTile({ row: 0, col: 0 }, 2)
        grid[0][1] = createTile({ row: 0, col: 1 }, 4)

        const { grid: newGrid, moved } = performMove(grid, Direction.Right)

        expect(moved).toBe(true)
        expect(newGrid[0][2]?.value).toBe(2)
        expect(newGrid[0][3]?.value).toBe(4)
        expect(newGrid[0][0]).toBeNull()
        expect(newGrid[0][1]).toBeNull()
      })

      it('should move tiles up correctly', () => {
        const grid = createEmptyGrid(4)
        grid[2][0] = createTile({ row: 2, col: 0 }, 2)
        grid[3][0] = createTile({ row: 3, col: 0 }, 4)

        const { grid: newGrid, moved } = performMove(grid, Direction.Up)

        expect(moved).toBe(true)
        expect(newGrid[0][0]?.value).toBe(2)
        expect(newGrid[1][0]?.value).toBe(4)
        expect(newGrid[2][0]).toBeNull()
        expect(newGrid[3][0]).toBeNull()
      })

      it('should move tiles down correctly', () => {
        const grid = createEmptyGrid(4)
        grid[0][0] = createTile({ row: 0, col: 0 }, 2)
        grid[1][0] = createTile({ row: 1, col: 0 }, 4)

        const { grid: newGrid, moved } = performMove(grid, Direction.Down)

        expect(moved).toBe(true)
        expect(newGrid[2][0]?.value).toBe(2)
        expect(newGrid[3][0]?.value).toBe(4)
        expect(newGrid[0][0]).toBeNull()
        expect(newGrid[1][0]).toBeNull()
      })
    })

    describe('tile merging', () => {
      it('should merge two tiles with the same value', () => {
        const grid = createEmptyGrid(4)
        grid[0][0] = createTile({ row: 0, col: 0 }, 2)
        grid[0][1] = createTile({ row: 0, col: 1 }, 2)

        const { grid: newGrid, moved, score } = performMove(grid, Direction.Left)

        expect(moved).toBe(true)
        expect(newGrid[0][0]?.value).toBe(4)
        expect(newGrid[0][1]).toBeNull()
        expect(score).toBe(4)
      })

      it('should merge multiple pairs in a row', () => {
        const grid = createEmptyGrid(4)
        grid[0][0] = createTile({ row: 0, col: 0 }, 2)
        grid[0][1] = createTile({ row: 0, col: 1 }, 2)
        grid[0][2] = createTile({ row: 0, col: 2 }, 4)
        grid[0][3] = createTile({ row: 0, col: 3 }, 4)

        const { grid: newGrid, moved, score } = performMove(grid, Direction.Left)

        expect(moved).toBe(true)
        expect(newGrid[0][0]?.value).toBe(4)
        expect(newGrid[0][1]?.value).toBe(8)
        expect(newGrid[0][2]).toBeNull()
        expect(newGrid[0][3]).toBeNull()
        expect(score).toBe(12) // 4 + 8
      })

      it('should not double-merge tiles in a single move', () => {
        const grid = createEmptyGrid(4)
        grid[0][0] = createTile({ row: 0, col: 0 }, 2)
        grid[0][1] = createTile({ row: 0, col: 1 }, 2)
        grid[0][2] = createTile({ row: 0, col: 2 }, 2)

        const { grid: newGrid, score } = performMove(grid, Direction.Left)

        // Should merge first two 2s into 4, leaving third 2 separate
        expect(newGrid[0][0]?.value).toBe(4)
        expect(newGrid[0][1]?.value).toBe(2)
        expect(newGrid[0][2]).toBeNull()
        expect(score).toBe(4)
      })

      it('should store mergedFrom information', () => {
        const grid = createEmptyGrid(4)
        const tile1 = createTile({ row: 0, col: 0 }, 2)
        const tile2 = createTile({ row: 0, col: 1 }, 2)
        grid[0][0] = tile1
        grid[0][1] = tile2

        const { grid: newGrid } = performMove(grid, Direction.Left)

        expect(newGrid[0][0]?.mergedFrom).toBeDefined()
        expect(newGrid[0][0]?.mergedFrom).toHaveLength(2)
      })
    })

    describe('edge cases', () => {
      it('should not move if no tiles can move', () => {
        const grid = createEmptyGrid(4)
        grid[0][0] = createTile({ row: 0, col: 0 }, 2)
        grid[0][1] = createTile({ row: 0, col: 1 }, 4)

        const { moved } = performMove(grid, Direction.Left)

        expect(moved).toBe(false)
      })

      it('should handle empty grid', () => {
        const grid = createEmptyGrid(4)
        const { grid: newGrid, moved, score } = performMove(grid, Direction.Left)

        expect(moved).toBe(false)
        expect(score).toBe(0)
        expect(getAllTiles(newGrid)).toHaveLength(0)
      })

      it('should handle full grid with no merges', () => {
        const grid = createEmptyGrid(2)
        grid[0][0] = createTile({ row: 0, col: 0 }, 2)
        grid[0][1] = createTile({ row: 0, col: 1 }, 4)
        grid[1][0] = createTile({ row: 1, col: 0 }, 8)
        grid[1][1] = createTile({ row: 1, col: 1 }, 16)

        const { moved } = performMove(grid, Direction.Left)

        expect(moved).toBe(false)
      })

      it('should handle tiles at the edge correctly', () => {
        const grid = createEmptyGrid(4)
        grid[0][0] = createTile({ row: 0, col: 0 }, 2)

        const { grid: newGrid, moved } = performMove(grid, Direction.Left)

        expect(moved).toBe(false)
        expect(newGrid[0][0]?.value).toBe(2)
      })
    })
  })

  describe('hasMovesAvailable', () => {
    it('should return true for an empty grid', () => {
      const grid = createEmptyGrid(4)
      expect(hasMovesAvailable(grid)).toBe(true)
    })

    it('should return true if empty cells exist', () => {
      const grid = createEmptyGrid(4)
      grid[0][0] = createTile({ row: 0, col: 0 }, 2)
      grid[0][1] = createTile({ row: 0, col: 1 }, 4)

      expect(hasMovesAvailable(grid)).toBe(true)
    })

    it('should return true if adjacent tiles can merge', () => {
      const grid = createEmptyGrid(2)
      grid[0][0] = createTile({ row: 0, col: 0 }, 2)
      grid[0][1] = createTile({ row: 0, col: 1 }, 2)
      grid[1][0] = createTile({ row: 1, col: 0 }, 4)
      grid[1][1] = createTile({ row: 1, col: 1 }, 8)

      expect(hasMovesAvailable(grid)).toBe(true)
    })

    it('should return false if grid is full and no merges possible', () => {
      const grid = createEmptyGrid(2)
      grid[0][0] = createTile({ row: 0, col: 0 }, 2)
      grid[0][1] = createTile({ row: 0, col: 1 }, 4)
      grid[1][0] = createTile({ row: 1, col: 0 }, 8)
      grid[1][1] = createTile({ row: 1, col: 1 }, 16)

      expect(hasMovesAvailable(grid)).toBe(false)
    })

    it('should check vertical merges', () => {
      const grid = createEmptyGrid(2)
      grid[0][0] = createTile({ row: 0, col: 0 }, 2)
      grid[0][1] = createTile({ row: 0, col: 1 }, 4)
      grid[1][0] = createTile({ row: 1, col: 0 }, 2)
      grid[1][1] = createTile({ row: 1, col: 1 }, 8)

      expect(hasMovesAvailable(grid)).toBe(true)
    })
  })

  describe('hasWon', () => {
    it('should return false if no tile reaches target', () => {
      const grid = createEmptyGrid(4)
      grid[0][0] = createTile({ row: 0, col: 0 }, 2)
      grid[0][1] = createTile({ row: 0, col: 1 }, 1024)

      expect(hasWon(grid, 2048)).toBe(false)
    })

    it('should return true if a tile reaches the target value', () => {
      const grid = createEmptyGrid(4)
      grid[0][0] = createTile({ row: 0, col: 0 }, 2048)

      expect(hasWon(grid, 2048)).toBe(true)
    })

    it('should return true if a tile exceeds the target value', () => {
      const grid = createEmptyGrid(4)
      grid[0][0] = createTile({ row: 0, col: 0 }, 4096)

      expect(hasWon(grid, 2048)).toBe(true)
    })

    it('should work with different target values', () => {
      const grid = createEmptyGrid(4)
      grid[0][0] = createTile({ row: 0, col: 0 }, 4096)

      expect(hasWon(grid, 4096)).toBe(true)
      expect(hasWon(grid, 8192)).toBe(false)
    })
  })

  describe('determineGameStatus', () => {
    it('should return Playing for a new game', () => {
      const grid = createEmptyGrid(4)
      grid[0][0] = createTile({ row: 0, col: 0 }, 2)

      const status = determineGameStatus(grid, 2048, GameStatus.Playing)
      expect(status).toBe(GameStatus.Playing)
    })

    it('should return Won when target is reached', () => {
      const grid = createEmptyGrid(4)
      grid[0][0] = createTile({ row: 0, col: 0 }, 2048)

      const status = determineGameStatus(grid, 2048, GameStatus.Playing)
      expect(status).toBe(GameStatus.Won)
    })

    it('should return Lost when no moves available', () => {
      const grid = createEmptyGrid(2)
      grid[0][0] = createTile({ row: 0, col: 0 }, 2)
      grid[0][1] = createTile({ row: 0, col: 1 }, 4)
      grid[1][0] = createTile({ row: 1, col: 0 }, 8)
      grid[1][1] = createTile({ row: 1, col: 1 }, 16)

      const status = determineGameStatus(grid, 2048, GameStatus.Playing)
      expect(status).toBe(GameStatus.Lost)
    })

    it('should stay Won once won', () => {
      const grid = createEmptyGrid(4)
      grid[0][0] = createTile({ row: 0, col: 0 }, 2)

      const status = determineGameStatus(grid, 2048, GameStatus.Won)
      expect(status).toBe(GameStatus.Won)
    })
  })

  describe('validateGameConfig', () => {
    it('should return no errors for valid config', () => {
      const config: GameConfig = {
        gridSize: 4,
        targetValue: 2048,
        spawnValues: [
          { value: 2, probability: 0.9 },
          { value: 4, probability: 0.1 },
        ],
      }

      const errors = validateGameConfig(config)
      expect(errors).toHaveLength(0)
    })

    it('should validate grid size range', () => {
      const config: GameConfig = {
        gridSize: 2,
        targetValue: 2048,
        spawnValues: [{ value: 2, probability: 1.0 }],
      }

      const errors = validateGameConfig(config)
      expect(errors).toContain('Grid size must be between 3 and 6')
    })

    it('should validate target value is positive integer', () => {
      const config: GameConfig = {
        gridSize: 4,
        targetValue: -100,
        spawnValues: [{ value: 2, probability: 1.0 }],
      }

      const errors = validateGameConfig(config)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should validate target value is power of 2', () => {
      const config: GameConfig = {
        gridSize: 4,
        targetValue: 100,
        spawnValues: [{ value: 2, probability: 1.0 }],
      }

      const errors = validateGameConfig(config)
      expect(errors).toContain('Target value should be a power of 2')
    })

    it('should validate spawn values exist', () => {
      const config: GameConfig = {
        gridSize: 4,
        targetValue: 2048,
        spawnValues: [],
      }

      const errors = validateGameConfig(config)
      expect(errors).toContain('At least one spawn value must be configured')
    })

    it('should validate spawn probabilities sum to 1', () => {
      const config: GameConfig = {
        gridSize: 4,
        targetValue: 2048,
        spawnValues: [
          { value: 2, probability: 0.5 },
          { value: 4, probability: 0.3 },
        ],
      }

      const errors = validateGameConfig(config)
      expect(errors).toContain('Spawn value probabilities must sum to 1.0')
    })

    it('should validate spawn values are positive integers', () => {
      const config: GameConfig = {
        gridSize: 4,
        targetValue: 2048,
        spawnValues: [{ value: -2, probability: 1.0 }],
      }

      const errors = validateGameConfig(config)
      expect(errors).toContain('Spawn values must be positive integers')
    })

    it('should validate spawn probabilities are in valid range', () => {
      const config: GameConfig = {
        gridSize: 4,
        targetValue: 2048,
        spawnValues: [{ value: 2, probability: 1.5 }],
      }

      const errors = validateGameConfig(config)
      expect(errors).toContain('Spawn probabilities must be between 0 and 1')
    })
  })
})
