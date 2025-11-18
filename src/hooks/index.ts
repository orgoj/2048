/**
 * Barrel exports for all game hooks
 */

// Main game hook
export { useGame } from './useGame'
export type { UseGameReturn } from './useGame'

// Keyboard controls hook
export { useKeyboard, usePreventArrowKeyScrolling } from './useKeyboard'
export type { KeyBindings, UseKeyboardOptions } from './useKeyboard'

// Touch controls hook
export { useTouch, useDisablePinchZoom, usePreventDoubleTapZoom } from './useTouch'
export type { UseTouchOptions, UseTouchReturn } from './useTouch'

// Game statistics hook
export { useGameStats, useGameStatsReadOnly, useIsPersonalBest } from './useGameStats'
export type { ComputedStats, UseGameStatsReturn } from './useGameStats'
