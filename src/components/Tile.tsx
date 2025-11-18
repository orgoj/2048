import React from 'react'
import type { Tile as TileType } from '../types/game'
import styles from './Tile.module.css'

interface TileProps {
  tile: TileType
  gridSize: number
  isNew?: boolean
  isMerged?: boolean
}

/**
 * Individual tile component with animations and styling
 * Displays a tile value with appropriate colors and animations
 */
export const Tile: React.FC<TileProps> = ({ tile, gridSize, isNew = false, isMerged = false }) => {
  const { value, position } = tile

  // Calculate tile size based on grid size
  const cellSize = 100 / gridSize
  const gap = 0.5 // gap between tiles in percentage

  // Position the tile using CSS Grid coordinates
  const style: React.CSSProperties = {
    '--row': position.row,
    '--col': position.col,
    '--cell-size': `${cellSize}%`,
    '--gap': `${gap}%`,
  } as React.CSSProperties

  // Get the power for styling (2 = 1, 4 = 2, 8 = 3, etc.)
  const power = Math.log2(value)

  // Determine tile class based on value
  const getTileClass = () => {
    if (value >= 2048) return styles.tile2048Plus
    return styles[`tile${value}`] || styles.tileDefault
  }

  // Combine classes
  const tileClasses = [
    styles.tile,
    getTileClass(),
    isNew && styles.tileNew,
    isMerged && styles.tileMerged,
  ]
    .filter(Boolean)
    .join(' ')

  // Adjust font size based on number of digits
  const getFontSizeClass = () => {
    if (value >= 1024) return styles.fontSmall
    if (value >= 128) return styles.fontMedium
    return styles.fontLarge
  }

  return (
    <div
      className={tileClasses}
      style={style}
      data-value={value}
      data-power={power}
      role="gridcell"
      aria-label={`Tile with value ${value}`}
    >
      <span className={`${styles.tileValue} ${getFontSizeClass()}`}>{value}</span>
    </div>
  )
}

export default Tile
