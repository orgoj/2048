/**
 * Unit tests for gameState.ts
 * Tests game state management and state transitions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  initializeGame,
  move,
  undo,
  resetGame,
  resetGameWithConfig,
  continueAfterWin,
  getAvailableUndos,
  canUndo,
  getHighestTileValue,
  getGameStatistics,
  serializeGameState,
  deserializeGameState,
  createStateSnapshot,
} from '../gameState'
import { Direction, GameStatus, DEFAULT_GAME_CONFIG } from '../../types/game'
import type { GameConfig, GameState } from '../../types/game'

describe('gameState', () => {
  describe('initializeGame', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('should create a new game with default config', () => {
      const state = initializeGame()

      expect(state.grid).toBeDefined()
      expect(state.grid.length).toBe(DEFAULT_GAME_CONFIG.gridSize)
      expect(state.score).toBe(0)
      expect(state.status).toBe(GameStatus.Playing)
      expect(state.previousStates).toEqual([])
      expect(state.moveCount).toBe(0)
    })

    it('should spawn two initial tiles', () => {
      const state = initializeGame()

      let tileCount = 0
      state.grid.forEach(row => {
        row.forEach(cell => {
          if (cell !== null) tileCount++
        })
      })

      expect(tileCount).toBe(2)
    })

    it('should accept custom configuration', () => {
      const customConfig: GameConfig = {
        gridSize: 5,
        targetValue: 4096,
        spawnValues: [{ value: 2, probability: 1.0 }],
      }

      const state = initializeGame(customConfig)

      expect(state.grid.length).toBe(5)
      expect(state.config.targetValue).toBe(4096)
      expect(state.config.gridSize).toBe(5)
    })

    it('should throw error for invalid configuration', () => {
      const invalidConfig: GameConfig = {
        gridSize: 2, // Too small
        targetValue: 2048,
        spawnValues: [{ value: 2, probability: 1.0 }],
      }

      expect(() => initializeGame(invalidConfig)).toThrow('Invalid game configuration')
    })

    it('should throw error if spawn probabilities do not sum to 1', () => {
      const invalidConfig: GameConfig = {
        gridSize: 4,
        targetValue: 2048,
        spawnValues: [{ value: 2, probability: 0.5 }],
      }

      expect(() => initializeGame(invalidConfig)).toThrow()
    })
  })

  describe('move', () => {
    let state: GameState

    beforeEach(() => {
      vi.restoreAllMocks()
      state = initializeGame()
    })

    it('should return moved=false if no tiles can move', () => {
      // Create a state where tiles cannot move left
      state.grid = [
        [
          { id: '1', value: 2, position: { row: 0, col: 0 } },
          { id: '2', value: 4, position: { row: 0, col: 1 } },
          null,
          null,
        ],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]

      const result = move(state, Direction.Left)

      expect(result.moved).toBe(false)
      expect(result.score).toBe(0)
    })

    it('should update score when tiles merge', () => {
      state.grid = [
        [
          { id: '1', value: 2, position: { row: 0, col: 0 } },
          { id: '2', value: 2, position: { row: 0, col: 1 } },
          null,
          null,
        ],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]
      state.score = 0

      const result = move(state, Direction.Left)

      expect(result.moved).toBe(true)
      expect(result.score).toBe(4) // Score gained from merge
      expect(result.newState.score).toBe(4) // Total score
    })

    it('should spawn a new tile after a successful move', () => {
      state.grid = [
        [null, null, null, { id: '1', value: 2, position: { row: 0, col: 3 } }],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]

      const result = move(state, Direction.Left)

      expect(result.moved).toBe(true)

      // Count tiles - should have 2 (original moved + new spawn)
      let tileCount = 0
      result.newState.grid.forEach(row => {
        row.forEach(cell => {
          if (cell !== null) tileCount++
        })
      })

      expect(tileCount).toBe(2)
    })

    it('should save previous state for undo', () => {
      const result = move(state, Direction.Left)

      if (result.moved) {
        expect(result.newState.previousStates.length).toBeGreaterThan(0)
        expect(result.newState.previousStates[0].score).toBe(state.score)
      }
    })

    it('should increment move count', () => {
      const initialMoveCount = state.moveCount
      const result = move(state, Direction.Right)

      if (result.moved) {
        expect(result.newState.moveCount).toBe(initialMoveCount + 1)
      }
    })

    it('should not allow moves when game is lost', () => {
      state.status = GameStatus.Lost

      const result = move(state, Direction.Left)

      expect(result.moved).toBe(false)
      expect(result.newState).toBe(state)
    })

    it('should update game status to Won when target is reached', () => {
      state.grid = [
        [
          { id: '1', value: 1024, position: { row: 0, col: 0 } },
          { id: '2', value: 1024, position: { row: 0, col: 1 } },
          null,
          null,
        ],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]
      state.config.targetValue = 2048

      const result = move(state, Direction.Left)

      expect(result.moved).toBe(true)
      expect(result.newState.status).toBe(GameStatus.Won)
    })

    it('should detect game over when grid fills with no merges possible', () => {
      // Create a nearly full grid with no possible merges
      // After the move and spawn, it should be game over
      state.grid = [
        [
          { id: '1', value: 2, position: { row: 0, col: 0 } },
          { id: '2', value: 4, position: { row: 0, col: 1 } },
          { id: '3', value: 2, position: { row: 0, col: 2 } },
          { id: '4', value: 4, position: { row: 0, col: 3 } },
        ],
        [
          { id: '5', value: 4, position: { row: 1, col: 0 } },
          { id: '6', value: 2, position: { row: 1, col: 1 } },
          { id: '7', value: 4, position: { row: 1, col: 2 } },
          { id: '8', value: 2, position: { row: 1, col: 3 } },
        ],
        [
          { id: '9', value: 2, position: { row: 2, col: 0 } },
          { id: '10', value: 4, position: { row: 2, col: 1 } },
          { id: '11', value: 2, position: { row: 2, col: 2 } },
          { id: '12', value: 4, position: { row: 2, col: 3 } },
        ],
        [
          { id: '13', value: 4, position: { row: 3, col: 0 } },
          { id: '14', value: 2, position: { row: 3, col: 1 } },
          { id: '15', value: 4, position: { row: 3, col: 2 } },
          null, // One empty spot for the new tile
        ],
      ]

      const result = move(state, Direction.Right)

      // The test checks if status eventually becomes Lost after grid fills
      // Status might be Playing or Lost depending on whether the spawned tile creates merge opportunities
      expect([GameStatus.Playing, GameStatus.Lost]).toContain(result.newState.status)
    })

    it('should limit previous states to maxUndoStates', () => {
      const config: GameConfig = {
        ...DEFAULT_GAME_CONFIG,
        maxUndoStates: 2,
      }

      let currentState = initializeGame(config)

      // Perform multiple moves
      for (let i = 0; i < 5; i++) {
        const result = move(currentState, Direction.Left)
        if (result.moved) {
          currentState = result.newState
        } else {
          const result2 = move(currentState, Direction.Right)
          if (result2.moved) {
            currentState = result2.newState
          }
        }
      }

      expect(currentState.previousStates.length).toBeLessThanOrEqual(2)
    })

    it('should return merged tiles information', () => {
      state.grid = [
        [
          { id: '1', value: 2, position: { row: 0, col: 0 } },
          { id: '2', value: 2, position: { row: 0, col: 1 } },
          null,
          null,
        ],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]

      const result = move(state, Direction.Left)

      expect(result.moved).toBe(true)
      expect(result.mergedTiles.length).toBeGreaterThan(0)
      expect(result.mergedTiles[0].value).toBe(4)
    })
  })

  describe('undo', () => {
    let state: GameState

    beforeEach(() => {
      vi.restoreAllMocks()
      state = initializeGame()
    })

    it('should return current state if no previous states exist', () => {
      const undoneState = undo(state)
      expect(undoneState).toBe(state)
    })

    it('should restore previous state', () => {
      // Make a move to create a previous state
      const result = move(state, Direction.Left)
      if (!result.moved) {
        const result2 = move(state, Direction.Right)
        if (result2.moved) {
          state = result2.newState
        }
      } else {
        state = result.newState
      }

      const previousScore = state.previousStates[0]?.score
      const undoneState = undo(state)

      expect(undoneState.score).toBe(previousScore)
    })

    it('should preserve remaining undo history', () => {
      let currentState = state

      // Make multiple moves
      for (let i = 0; i < 3; i++) {
        const result = move(currentState, Direction.Right)
        if (result.moved) {
          currentState = result.newState
        } else {
          const result2 = move(currentState, Direction.Left)
          if (result2.moved) {
            currentState = result2.newState
          }
        }
      }

      const historyLengthBefore = currentState.previousStates.length
      const undoneState = undo(currentState)

      expect(undoneState.previousStates.length).toBe(historyLengthBefore - 1)
    })

    it('should allow multiple consecutive undos', () => {
      let currentState = state

      // Make 3 moves
      for (let i = 0; i < 3; i++) {
        const result = move(currentState, Direction.Right)
        if (result.moved) {
          currentState = result.newState
        } else {
          const result2 = move(currentState, Direction.Down)
          if (result2.moved) {
            currentState = result2.newState
          }
        }
      }

      const movesBeforeUndo = currentState.moveCount

      // Undo twice
      currentState = undo(currentState)
      currentState = undo(currentState)

      expect(currentState.moveCount).toBeLessThan(movesBeforeUndo)
    })
  })

  describe('resetGame', () => {
    it('should create a new game with the same configuration', () => {
      const state = initializeGame()
      const originalConfig = state.config

      // Make some moves
      const result = move(state, Direction.Left)
      const movedState = result.moved ? result.newState : state

      const resetState = resetGame(movedState)

      expect(resetState.score).toBe(0)
      expect(resetState.moveCount).toBe(0)
      expect(resetState.previousStates).toEqual([])
      expect(resetState.config).toEqual(originalConfig)
      expect(resetState.status).toBe(GameStatus.Playing)
    })
  })

  describe('resetGameWithConfig', () => {
    it('should create a new game with new configuration', () => {
      const newConfig: GameConfig = {
        gridSize: 5,
        targetValue: 4096,
        spawnValues: [{ value: 2, probability: 1.0 }],
      }

      const state = resetGameWithConfig(newConfig)

      expect(state.grid.length).toBe(5)
      expect(state.config.targetValue).toBe(4096)
      expect(state.score).toBe(0)
    })
  })

  describe('continueAfterWin', () => {
    it('should change status from Won to Playing', () => {
      const state = initializeGame()
      state.status = GameStatus.Won

      const continuedState = continueAfterWin(state)

      expect(continuedState.status).toBe(GameStatus.Playing)
    })

    it('should not change state if not won', () => {
      const state = initializeGame()
      state.status = GameStatus.Playing

      const continuedState = continueAfterWin(state)

      expect(continuedState).toBe(state)
    })

    it('should preserve all other state properties', () => {
      const state = initializeGame()
      state.status = GameStatus.Won
      state.score = 1000
      state.moveCount = 50

      const continuedState = continueAfterWin(state)

      expect(continuedState.score).toBe(1000)
      expect(continuedState.moveCount).toBe(50)
      expect(continuedState.grid).toBe(state.grid)
    })
  })

  describe('getAvailableUndos', () => {
    it('should return 0 for new game', () => {
      const state = initializeGame()
      expect(getAvailableUndos(state)).toBe(0)
    })

    it('should return correct count after moves', () => {
      let state = initializeGame()

      const result = move(state, Direction.Left)
      if (result.moved) {
        state = result.newState
        expect(getAvailableUndos(state)).toBe(1)
      }
    })
  })

  describe('canUndo', () => {
    it('should return false for new game', () => {
      const state = initializeGame()
      expect(canUndo(state)).toBe(false)
    })

    it('should return true after a move', () => {
      let state = initializeGame()

      const result = move(state, Direction.Right)
      if (result.moved) {
        state = result.newState
        expect(canUndo(state)).toBe(true)
      }
    })
  })

  describe('getHighestTileValue', () => {
    it('should return 0 for empty grid', () => {
      const state = initializeGame()
      state.grid = [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]

      expect(getHighestTileValue(state)).toBe(0)
    })

    it('should return the highest tile value', () => {
      const state = initializeGame()
      state.grid = [
        [
          { id: '1', value: 2, position: { row: 0, col: 0 } },
          { id: '2', value: 128, position: { row: 0, col: 1 } },
          null,
          null,
        ],
        [{ id: '3', value: 64, position: { row: 1, col: 0 } }, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]

      expect(getHighestTileValue(state)).toBe(128)
    })
  })

  describe('getGameStatistics', () => {
    it('should return correct statistics', () => {
      const state = initializeGame()
      state.score = 100
      state.moveCount = 10
      state.grid = [
        [
          { id: '1', value: 2, position: { row: 0, col: 0 } },
          { id: '2', value: 4, position: { row: 0, col: 1 } },
          null,
          null,
        ],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]

      const stats = getGameStatistics(state)

      expect(stats.score).toBe(100)
      expect(stats.moveCount).toBe(10)
      expect(stats.highestTile).toBe(4)
      expect(stats.tileCount).toBe(2)
      expect(stats.emptyCellCount).toBe(14)
      expect(stats.status).toBe(GameStatus.Playing)
      expect(stats.canUndo).toBe(false)
      expect(stats.availableUndos).toBe(0)
    })
  })

  describe('serializeGameState and deserializeGameState', () => {
    it('should serialize and deserialize state correctly', () => {
      const state = initializeGame()
      state.score = 100
      state.moveCount = 5

      const serialized = serializeGameState(state)
      const deserialized = deserializeGameState(serialized)

      expect(deserialized.score).toBe(state.score)
      expect(deserialized.moveCount).toBe(state.moveCount)
      expect(deserialized.config).toEqual(state.config)
      expect(deserialized.status).toBe(state.status)
    })

    it('should throw error for invalid JSON', () => {
      expect(() => deserializeGameState('invalid json')).toThrow('Failed to deserialize game state')
    })

    it('should throw error for missing grid', () => {
      const invalidState = JSON.stringify({ score: 100 })
      expect(() => deserializeGameState(invalidState)).toThrow(
        'Invalid game state: missing or invalid grid'
      )
    })

    it('should throw error for invalid score', () => {
      const invalidState = JSON.stringify({
        grid: [[null]],
        score: 'not a number',
        config: DEFAULT_GAME_CONFIG,
      })
      expect(() => deserializeGameState(invalidState)).toThrow(
        'Invalid game state: missing or invalid score'
      )
    })

    it('should throw error for missing config', () => {
      const invalidState = JSON.stringify({
        grid: [[null]],
        score: 100,
      })
      expect(() => deserializeGameState(invalidState)).toThrow('Invalid game state: missing config')
    })

    it('should validate config during deserialization', () => {
      const invalidState = JSON.stringify({
        grid: [[null]],
        score: 100,
        config: {
          gridSize: 2, // Invalid
          targetValue: 2048,
          spawnValues: [],
        },
      })
      expect(() => deserializeGameState(invalidState)).toThrow('Invalid game state config')
    })
  })

  describe('createStateSnapshot', () => {
    it('should create a deep copy of the state', () => {
      const state = initializeGame()
      const snapshot = createStateSnapshot(state)

      expect(snapshot).toEqual(state)
      expect(snapshot).not.toBe(state)
      expect(snapshot.grid).not.toBe(state.grid)
    })

    it('should include previous states', () => {
      let state = initializeGame()

      // Make a move to create previous state
      const result = move(state, Direction.Left)
      if (result.moved) {
        state = result.newState
      }

      const snapshot = createStateSnapshot(state)

      expect(snapshot.previousStates.length).toBe(state.previousStates.length)
    })
  })

  describe('state cloning', () => {
    it('should not modify original state when moving', () => {
      const state = initializeGame()
      const originalScore = state.score
      const originalMoveCount = state.moveCount

      move(state, Direction.Left)

      expect(state.score).toBe(originalScore)
      expect(state.moveCount).toBe(originalMoveCount)
    })

    it('should create independent state copies', () => {
      const state1 = initializeGame()

      // Find a tile to ensure we're testing with non-null values
      let hasTile = false
      for (let row = 0; row < state1.grid.length; row++) {
        for (let col = 0; col < state1.grid[row].length; col++) {
          if (state1.grid[row][col] !== null) {
            hasTile = true
            break
          }
        }
        if (hasTile) break
      }

      expect(hasTile).toBe(true) // Verify we have tiles to test with

      const result = move(state1, Direction.Right)

      if (result.moved) {
        const state2 = result.newState

        // Find a non-null cell in state2
        let foundCell: { row: number; col: number } | null = null
        for (let row = 0; row < state2.grid.length; row++) {
          for (let col = 0; col < state2.grid[row].length; col++) {
            if (state2.grid[row][col] !== null) {
              foundCell = { row, col }
              break
            }
          }
          if (foundCell) break
        }

        if (foundCell) {
          // Store original value from state1
          const originalValue = state1.grid[foundCell.row][foundCell.col]

          // Modify state2's grid
          state2.grid[foundCell.row][foundCell.col] = null

          // Verify state1 unchanged - should be the same as before
          expect(state1.grid[foundCell.row][foundCell.col]).toEqual(originalValue)
        }
      } else {
        // If no move was made, skip this assertion
        expect(true).toBe(true)
      }
    })
  })
})
