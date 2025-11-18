/**
 * Barrel exports for 2048 game components
 * Provides a single entry point for importing all game UI components
 */

export { Tile } from './Tile'
export { Grid } from './Grid'
export { Header } from './Header'
export { Controls } from './Controls'
export { GameModal } from './GameModal'
export { default as Settings } from './Settings'
export { default as Stats } from './Stats'

// Re-export default exports as well for flexibility
export { default as TileDefault } from './Tile'
export { default as GridDefault } from './Grid'
export { default as HeaderDefault } from './Header'
export { default as ControlsDefault } from './Controls'
export { default as GameModalDefault } from './GameModal'
