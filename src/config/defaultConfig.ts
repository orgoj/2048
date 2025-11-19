/**
 * Default configuration values for the 2048 game
 * Includes both game logic config and UI/UX preferences
 */

import type { SpawnConfig } from '../types/game'

/**
 * Available color themes
 */
export const THEMES = [
  'classic',
  'dark',
  'neon',
  'ocean',
  'sunset',
  'forest',
  'midnight',
  'candy',
  'pastel',
] as const
export type Theme = (typeof THEMES)[number]

/**
 * Available game modes
 */
export const GAME_MODES = ['classic', 'zen', 'timed'] as const
export type GameMode = (typeof GAME_MODES)[number]

/**
 * Available animation speeds
 */
export const ANIMATION_SPEEDS = ['slow', 'normal', 'fast'] as const
export type AnimationSpeed = (typeof ANIMATION_SPEEDS)[number]

/**
 * Valid grid sizes
 */
export const VALID_GRID_SIZES = [3, 4, 5, 6] as const
export type ValidGridSize = (typeof VALID_GRID_SIZES)[number]

/**
 * Common target values - includes smaller values for 3x3 grids
 */
export const VALID_TARGET_VALUES = [128, 256, 512, 1024, 2048, 4096, 8192, 16384] as const
export type ValidTargetValue = (typeof VALID_TARGET_VALUES)[number]

/**
 * Extended game configuration including UI/UX preferences
 */
export interface GameConfig {
  // Game logic configuration
  size: ValidGridSize
  target: ValidTargetValue
  spawn: SpawnConfig[]

  // UI/UX configuration
  theme: Theme
  mode: GameMode
  animSpeed: AnimationSpeed
}

/**
 * Animation speed values in milliseconds
 */
export const ANIMATION_SPEED_VALUES: Record<AnimationSpeed, number> = {
  slow: 300,
  normal: 150,
  fast: 75,
}

/**
 * Default spawn configuration
 * 90% chance of spawning a 2, 10% chance of spawning a 4
 */
export const DEFAULT_SPAWN_CONFIG: SpawnConfig[] = [
  { value: 2, probability: 0.9 },
  { value: 4, probability: 0.1 },
]

/**
 * Default game configuration
 */
export const DEFAULT_CONFIG: GameConfig = {
  size: 4,
  target: 2048,
  spawn: DEFAULT_SPAWN_CONFIG,
  theme: 'ocean',
  mode: 'classic',
  animSpeed: 'normal',
}

/**
 * Validates and normalizes a grid size value
 */
export function validateGridSize(value: unknown): ValidGridSize {
  const num = Number(value)
  if (VALID_GRID_SIZES.includes(num as ValidGridSize)) {
    return num as ValidGridSize
  }
  return DEFAULT_CONFIG.size
}

/**
 * Validates and normalizes a target value
 */
export function validateTargetValue(value: unknown): ValidTargetValue {
  const num = Number(value)
  if (VALID_TARGET_VALUES.includes(num as ValidTargetValue)) {
    return num as ValidTargetValue
  }
  return DEFAULT_CONFIG.target
}

/**
 * Validates and normalizes a theme value
 */
export function validateTheme(value: unknown): Theme {
  if (typeof value === 'string' && THEMES.includes(value as Theme)) {
    return value as Theme
  }
  return DEFAULT_CONFIG.theme
}

/**
 * Validates and normalizes a game mode value
 */
export function validateGameMode(value: unknown): GameMode {
  if (typeof value === 'string' && GAME_MODES.includes(value as GameMode)) {
    return value as GameMode
  }
  return DEFAULT_CONFIG.mode
}

/**
 * Validates and normalizes an animation speed value
 */
export function validateAnimationSpeed(value: unknown): AnimationSpeed {
  if (typeof value === 'string' && ANIMATION_SPEEDS.includes(value as AnimationSpeed)) {
    return value as AnimationSpeed
  }
  return DEFAULT_CONFIG.animSpeed
}

/**
 * Validates and normalizes spawn configuration
 * Format: "2:0.9,4:0.1" means 90% chance of 2, 10% chance of 4
 */
export function validateSpawnConfig(value: unknown): SpawnConfig[] {
  if (typeof value !== 'string') {
    return DEFAULT_SPAWN_CONFIG
  }

  try {
    const parts = value.split(',')
    const configs: SpawnConfig[] = []
    let totalProbability = 0

    for (const part of parts) {
      const [valueStr, probabilityStr] = part.trim().split(':')
      const tileValue = parseInt(valueStr, 10)
      const probability = parseFloat(probabilityStr)

      // Validate that value is a power of 2 and probability is valid
      if (
        !isNaN(tileValue) &&
        !isNaN(probability) &&
        tileValue > 0 &&
        (tileValue & (tileValue - 1)) === 0 && // Check if power of 2
        probability > 0 &&
        probability <= 1
      ) {
        configs.push({ value: tileValue, probability })
        totalProbability += probability
      }
    }

    // Ensure we have at least one config and probabilities are reasonable
    if (configs.length > 0 && Math.abs(totalProbability - 1.0) < 0.01) {
      // Normalize probabilities to sum to exactly 1.0
      configs.forEach(config => {
        config.probability = config.probability / totalProbability
      })
      return configs
    }
  } catch {
    // Fall through to return default
  }

  return DEFAULT_SPAWN_CONFIG
}
