/**
 * Configuration module for the 2048 game
 *
 * Provides URL hash-based configuration parsing and serialization,
 * default configuration values, and validation utilities.
 */

// Export all types and constants from defaultConfig
export type {
  GameConfig,
  Theme,
  GameMode,
  AnimationSpeed,
  ValidGridSize,
  ValidTargetValue,
} from './defaultConfig'

export {
  THEMES,
  GAME_MODES,
  ANIMATION_SPEEDS,
  VALID_GRID_SIZES,
  VALID_TARGET_VALUES,
  ANIMATION_SPEED_VALUES,
  DEFAULT_SPAWN_CONFIG,
  DEFAULT_CONFIG,
  validateGridSize,
  validateTargetValue,
  validateTheme,
  validateGameMode,
  validateAnimationSpeed,
  validateSpawnConfig,
} from './defaultConfig'

// Export all functions from urlConfig
export {
  parseConfigFromHash,
  serializeConfigToHash,
  updateURLHash,
  onHashChange,
  mergeConfigWithHash,
  resetURLHash,
} from './urlConfig'
