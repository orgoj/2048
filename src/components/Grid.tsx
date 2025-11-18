import React, { useMemo } from 'react'
import type { GameState } from '../types/game'
import { Tile } from './Tile'
import styles from './Grid.module.css'

interface GridProps {
  gameState: GameState
  previousGameState?: GameState
}

/**
 * Grid component that displays the game board with tiles
 * Renders empty cells as background and tiles on top
 */
export const Grid: React.FC<GridProps> = ({ gameState, previousGameState }) => {
  const { grid, config } = gameState
  const gridSize = config.gridSize

  // Create array of empty cells for background
  const emptyCells = useMemo(() => {
    const cells = []
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        cells.push({ row, col, key: `cell-${row}-${col}` })
      }
    }
    return cells
  }, [gridSize])

  // Flatten tiles from grid and determine if they're new or merged
  const tiles = useMemo(() => {
    const tileList = []
    const previousTileIds = new Set<string>()

    // Get all previous tile IDs
    if (previousGameState) {
      for (const row of previousGameState.grid) {
        for (const tile of row) {
          if (tile) {
            previousTileIds.add(tile.id)
          }
        }
      }
    }

    // Process current tiles
    for (const row of grid) {
      for (const tile of row) {
        if (tile) {
          const isNew = !previousTileIds.has(tile.id)
          const isMerged = tile.mergedFrom && tile.mergedFrom.length > 0

          tileList.push({
            tile,
            isNew,
            isMerged,
          })
        }
      }
    }

    return tileList
  }, [grid, previousGameState])

  return (
    <div
      className={styles.gridContainer}
      role="grid"
      aria-label={`${gridSize} by ${gridSize} game grid`}
    >
      <div
        className={styles.grid}
        style={
          {
            '--grid-size': gridSize,
          } as React.CSSProperties
        }
      >
        {/* Background cells */}
        <div className={styles.gridCells}>
          {emptyCells.map(cell => (
            <div
              key={cell.key}
              className={styles.gridCell}
              data-row={cell.row}
              data-col={cell.col}
              aria-label={`Empty cell at row ${cell.row + 1}, column ${cell.col + 1}`}
            />
          ))}
        </div>

        {/* Tiles layer */}
        <div className={styles.gridTiles}>
          {tiles.map(({ tile, isNew, isMerged }) => (
            <Tile key={tile.id} tile={tile} gridSize={gridSize} isNew={isNew} isMerged={isMerged} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Grid
