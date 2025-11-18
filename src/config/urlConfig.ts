/**
 * URL hash-based configuration system for the 2048 game
 *
 * Parses and serializes game configuration to/from URL hash parameters.
 *
 * Example URLs:
 * - Basic: #size=5&target=4096
 * - Full: #size=5&target=4096&theme=dark&mode=zen&animSpeed=fast
 * - With spawn: #size=4&target=2048&spawn=2:0.8,4:0.2
 * - Custom game: #size=6&target=16384&theme=neon&mode=timed&spawn=2:0.5,4:0.3,8:0.2
 */

import type { GameConfig } from './defaultConfig'
import {
  DEFAULT_CONFIG,
  validateGridSize,
  validateTargetValue,
  validateTheme,
  validateGameMode,
  validateAnimationSpeed,
  validateSpawnConfig,
  DEFAULT_SPAWN_CONFIG,
} from './defaultConfig'

/**
 * URL hash parameter keys
 */
const URL_PARAMS = {
  SIZE: 'size',
  TARGET: 'target',
  THEME: 'theme',
  MODE: 'mode',
  ANIM_SPEED: 'animSpeed',
  SPAWN: 'spawn',
} as const

/**
 * Parses the URL hash and returns a game configuration object
 *
 * @returns GameConfig object with values from URL or defaults
 *
 * @example
 * // URL: #size=5&target=4096&theme=dark
 * const config = parseConfigFromHash();
 * // Returns: { size: 5, target: 4096, theme: 'dark', mode: 'classic', animSpeed: 'normal', spawn: [...] }
 */
export function parseConfigFromHash(): GameConfig {
  const hash = window.location.hash.slice(1) // Remove the '#' prefix

  if (!hash) {
    return { ...DEFAULT_CONFIG }
  }

  // Parse URL search params from hash
  const params = new URLSearchParams(hash)

  // Extract and validate each parameter
  const config: GameConfig = {
    size: validateGridSize(params.get(URL_PARAMS.SIZE)),
    target: validateTargetValue(params.get(URL_PARAMS.TARGET)),
    theme: validateTheme(params.get(URL_PARAMS.THEME)),
    mode: validateGameMode(params.get(URL_PARAMS.MODE)),
    animSpeed: validateAnimationSpeed(params.get(URL_PARAMS.ANIM_SPEED)),
    spawn: validateSpawnConfig(params.get(URL_PARAMS.SPAWN)),
  }

  return config
}

/**
 * Serializes a game configuration object to a URL hash string
 *
 * Only includes parameters that differ from defaults to keep URLs clean
 *
 * @param config - Game configuration object
 * @returns URL hash string (without '#' prefix)
 *
 * @example
 * const config = { size: 5, target: 4096, theme: 'dark', mode: 'classic', animSpeed: 'normal', spawn: [...] };
 * const hash = serializeConfigToHash(config);
 * // Returns: "size=5&target=4096&theme=dark"
 */
export function serializeConfigToHash(config: GameConfig): string {
  const params = new URLSearchParams()

  // Only add parameters that differ from defaults
  if (config.size !== DEFAULT_CONFIG.size) {
    params.set(URL_PARAMS.SIZE, config.size.toString())
  }

  if (config.target !== DEFAULT_CONFIG.target) {
    params.set(URL_PARAMS.TARGET, config.target.toString())
  }

  if (config.theme !== DEFAULT_CONFIG.theme) {
    params.set(URL_PARAMS.THEME, config.theme)
  }

  if (config.mode !== DEFAULT_CONFIG.mode) {
    params.set(URL_PARAMS.MODE, config.mode)
  }

  if (config.animSpeed !== DEFAULT_CONFIG.animSpeed) {
    params.set(URL_PARAMS.ANIM_SPEED, config.animSpeed)
  }

  // For spawn config, check if it differs from default
  if (!spawnConfigsEqual(config.spawn, DEFAULT_SPAWN_CONFIG)) {
    params.set(URL_PARAMS.SPAWN, serializeSpawnConfig(config.spawn))
  }

  return params.toString()
}

/**
 * Updates the browser URL hash with the given configuration
 * without causing a page reload
 *
 * @param config - Game configuration object
 *
 * @example
 * const config = { size: 5, target: 4096, theme: 'dark', ... };
 * updateURLHash(config);
 * // Updates URL to: example.com/#size=5&target=4096&theme=dark
 */
export function updateURLHash(config: GameConfig): void {
  const hash = serializeConfigToHash(config)

  // Use replaceState to update URL without triggering navigation/reload
  if (hash) {
    window.history.replaceState(null, '', `#${hash}`)
  } else {
    // If hash is empty (all defaults), remove the hash
    window.history.replaceState(null, '', window.location.pathname)
  }
}

/**
 * Serializes spawn configuration to a string format
 *
 * @param spawn - Array of spawn configurations
 * @returns String in format "value:probability,value:probability"
 *
 * @example
 * serializeSpawnConfig([{ value: 2, probability: 0.9 }, { value: 4, probability: 0.1 }])
 * // Returns: "2:0.9,4:0.1"
 */
function serializeSpawnConfig(spawn: GameConfig['spawn']): string {
  return spawn.map(config => `${config.value}:${config.probability}`).join(',')
}

/**
 * Compares two spawn configurations for equality
 *
 * @param a - First spawn configuration
 * @param b - Second spawn configuration
 * @returns true if configurations are equal, false otherwise
 */
function spawnConfigsEqual(a: GameConfig['spawn'], b: GameConfig['spawn']): boolean {
  if (a.length !== b.length) {
    return false
  }

  // Sort both arrays by value for consistent comparison
  const sortedA = [...a].sort((x, y) => x.value - y.value)
  const sortedB = [...b].sort((x, y) => x.value - y.value)

  return sortedA.every((configA, index) => {
    const configB = sortedB[index]
    return (
      configA.value === configB.value && Math.abs(configA.probability - configB.probability) < 0.001
    )
  })
}

/**
 * Listens for hash changes and calls the provided callback with the new configuration
 *
 * @param callback - Function to call when hash changes
 * @returns Cleanup function to remove the event listener
 *
 * @example
 * const cleanup = onHashChange((config) => {
 *   console.log('Config changed:', config);
 * });
 *
 * // Later, when you want to stop listening:
 * cleanup();
 */
export function onHashChange(callback: (config: GameConfig) => void): () => void {
  const handler = () => {
    const config = parseConfigFromHash()
    callback(config)
  }

  window.addEventListener('hashchange', handler)

  return () => {
    window.removeEventListener('hashchange', handler)
  }
}

/**
 * Merges a partial configuration with the current URL configuration
 *
 * @param partial - Partial configuration to merge
 * @returns Complete merged configuration
 *
 * @example
 * // Current URL: #size=5&theme=dark
 * const config = mergeConfigWithHash({ target: 4096 });
 * // Returns: { size: 5, target: 4096, theme: 'dark', ... }
 */
export function mergeConfigWithHash(partial: Partial<GameConfig>): GameConfig {
  const currentConfig = parseConfigFromHash()
  return {
    ...currentConfig,
    ...partial,
  }
}

/**
 * Resets the URL hash to default configuration (removes all hash parameters)
 *
 * @example
 * resetURLHash();
 * // URL becomes: example.com/ (no hash)
 */
export function resetURLHash(): void {
  window.history.replaceState(null, '', window.location.pathname)
}
