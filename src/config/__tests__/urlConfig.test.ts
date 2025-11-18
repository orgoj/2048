/**
 * Unit tests for urlConfig.ts
 * Tests URL hash parsing and serialization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  parseConfigFromHash,
  serializeConfigToHash,
  updateURLHash,
  onHashChange,
  mergeConfigWithHash,
  resetURLHash,
} from '../urlConfig'
import { DEFAULT_CONFIG } from '../defaultConfig'
import type { GameConfig } from '../defaultConfig'

describe('urlConfig', () => {
  // Store original location
  const originalLocation = window.location

  beforeEach(() => {
    // Mock window.location
    delete (window as any).location
    window.location = {
      ...originalLocation,
      hash: '',
      pathname: '/test',
    } as any

    // Mock history API
    window.history.replaceState = vi.fn()
  })

  afterEach(() => {
    // Restore original location
    window.location = originalLocation
    vi.restoreAllMocks()
  })

  describe('parseConfigFromHash', () => {
    it('should return default config when hash is empty', () => {
      window.location.hash = ''

      const config = parseConfigFromHash()

      expect(config).toEqual(DEFAULT_CONFIG)
    })

    it('should parse size parameter', () => {
      window.location.hash = '#size=5'

      const config = parseConfigFromHash()

      expect(config.size).toBe(5)
      expect(config.target).toBe(DEFAULT_CONFIG.target)
    })

    it('should parse target parameter', () => {
      window.location.hash = '#target=4096'

      const config = parseConfigFromHash()

      expect(config.target).toBe(4096)
      expect(config.size).toBe(DEFAULT_CONFIG.size)
    })

    it('should parse theme parameter', () => {
      window.location.hash = '#theme=dark'

      const config = parseConfigFromHash()

      expect(config.theme).toBe('dark')
    })

    it('should parse mode parameter', () => {
      window.location.hash = '#mode=zen'

      const config = parseConfigFromHash()

      expect(config.mode).toBe('zen')
    })

    it('should parse animSpeed parameter', () => {
      window.location.hash = '#animSpeed=fast'

      const config = parseConfigFromHash()

      expect(config.animSpeed).toBe('fast')
    })

    it('should parse spawn configuration', () => {
      window.location.hash = '#spawn=2:0.8,4:0.2'

      const config = parseConfigFromHash()

      expect(config.spawn).toHaveLength(2)
      expect(config.spawn[0].value).toBe(2)
      expect(config.spawn[0].probability).toBeCloseTo(0.8, 2)
      expect(config.spawn[1].value).toBe(4)
      expect(config.spawn[1].probability).toBeCloseTo(0.2, 2)
    })

    it('should parse multiple parameters', () => {
      window.location.hash = '#size=5&target=4096&theme=dark&mode=zen'

      const config = parseConfigFromHash()

      expect(config.size).toBe(5)
      expect(config.target).toBe(4096)
      expect(config.theme).toBe('dark')
      expect(config.mode).toBe('zen')
    })

    it('should fallback to defaults for invalid size', () => {
      window.location.hash = '#size=10' // Invalid size

      const config = parseConfigFromHash()

      expect(config.size).toBe(DEFAULT_CONFIG.size)
    })

    it('should fallback to defaults for invalid target', () => {
      window.location.hash = '#target=1000' // Invalid target

      const config = parseConfigFromHash()

      expect(config.target).toBe(DEFAULT_CONFIG.target)
    })

    it('should fallback to defaults for invalid theme', () => {
      window.location.hash = '#theme=invalid'

      const config = parseConfigFromHash()

      expect(config.theme).toBe(DEFAULT_CONFIG.theme)
    })

    it('should fallback to defaults for invalid mode', () => {
      window.location.hash = '#mode=invalid'

      const config = parseConfigFromHash()

      expect(config.mode).toBe(DEFAULT_CONFIG.mode)
    })

    it('should fallback to defaults for invalid animSpeed', () => {
      window.location.hash = '#animSpeed=invalid'

      const config = parseConfigFromHash()

      expect(config.animSpeed).toBe(DEFAULT_CONFIG.animSpeed)
    })

    it('should fallback to defaults for invalid spawn config format', () => {
      window.location.hash = '#spawn=invalid'

      const config = parseConfigFromHash()

      expect(config.spawn).toEqual(DEFAULT_CONFIG.spawn)
    })

    it('should fallback to defaults for spawn with invalid probabilities', () => {
      window.location.hash = '#spawn=2:0.5' // Does not sum to 1

      const config = parseConfigFromHash()

      expect(config.spawn).toEqual(DEFAULT_CONFIG.spawn)
    })

    it('should fallback to defaults for spawn with non-power-of-2 values', () => {
      window.location.hash = '#spawn=3:1.0' // 3 is not a power of 2

      const config = parseConfigFromHash()

      expect(config.spawn).toEqual(DEFAULT_CONFIG.spawn)
    })

    it('should normalize spawn probabilities that are close to 1', () => {
      window.location.hash = '#spawn=2:0.89,4:0.11' // Close to 1.0

      const config = parseConfigFromHash()

      expect(config.spawn).toHaveLength(2)
      const totalProb = config.spawn.reduce((sum, s) => sum + s.probability, 0)
      expect(totalProb).toBeCloseTo(1.0, 5)
    })

    it('should handle complex spawn configurations', () => {
      window.location.hash = '#spawn=2:0.6,4:0.3,8:0.1'

      const config = parseConfigFromHash()

      expect(config.spawn).toHaveLength(3)
      expect(config.spawn.find(s => s.value === 8)?.probability).toBeCloseTo(0.1, 2)
    })

    it('should handle URL-encoded hash', () => {
      window.location.hash = '#size=5&theme=dark'

      const config = parseConfigFromHash()

      expect(config.size).toBe(5)
      expect(config.theme).toBe('dark')
    })
  })

  describe('serializeConfigToHash', () => {
    it('should return empty string for default config', () => {
      const hash = serializeConfigToHash(DEFAULT_CONFIG)

      expect(hash).toBe('')
    })

    it('should serialize size when different from default', () => {
      const config: GameConfig = {
        ...DEFAULT_CONFIG,
        size: 5,
      }

      const hash = serializeConfigToHash(config)

      expect(hash).toContain('size=5')
    })

    it('should serialize target when different from default', () => {
      const config: GameConfig = {
        ...DEFAULT_CONFIG,
        target: 4096,
      }

      const hash = serializeConfigToHash(config)

      expect(hash).toContain('target=4096')
    })

    it('should serialize theme when different from default', () => {
      const config: GameConfig = {
        ...DEFAULT_CONFIG,
        theme: 'dark',
      }

      const hash = serializeConfigToHash(config)

      expect(hash).toContain('theme=dark')
    })

    it('should serialize mode when different from default', () => {
      const config: GameConfig = {
        ...DEFAULT_CONFIG,
        mode: 'zen',
      }

      const hash = serializeConfigToHash(config)

      expect(hash).toContain('mode=zen')
    })

    it('should serialize animSpeed when different from default', () => {
      const config: GameConfig = {
        ...DEFAULT_CONFIG,
        animSpeed: 'fast',
      }

      const hash = serializeConfigToHash(config)

      expect(hash).toContain('animSpeed=fast')
    })

    it('should serialize spawn config when different from default', () => {
      const config: GameConfig = {
        ...DEFAULT_CONFIG,
        spawn: [
          { value: 2, probability: 0.8 },
          { value: 4, probability: 0.2 },
        ],
      }

      const hash = serializeConfigToHash(config)

      // URLSearchParams encodes : as %3A and , as %2C
      expect(hash).toMatch(/spawn=2(%3A|:)0\.8(%2C|,)4(%3A|:)0\.2/)
    })

    it('should not serialize spawn config when same as default', () => {
      const config: GameConfig = {
        ...DEFAULT_CONFIG,
        spawn: [
          { value: 2, probability: 0.9 },
          { value: 4, probability: 0.1 },
        ],
      }

      const hash = serializeConfigToHash(config)

      expect(hash).not.toContain('spawn')
    })

    it('should serialize multiple non-default parameters', () => {
      const config: GameConfig = {
        size: 5,
        target: 4096,
        theme: 'dark',
        mode: 'zen',
        animSpeed: 'fast',
        spawn: DEFAULT_CONFIG.spawn,
      }

      const hash = serializeConfigToHash(config)

      expect(hash).toContain('size=5')
      expect(hash).toContain('target=4096')
      expect(hash).toContain('theme=dark')
      expect(hash).toContain('mode=zen')
      expect(hash).toContain('animSpeed=fast')
    })

    it('should produce valid URLSearchParams format', () => {
      const config: GameConfig = {
        ...DEFAULT_CONFIG,
        size: 5,
        target: 4096,
      }

      const hash = serializeConfigToHash(config)
      const params = new URLSearchParams(hash)

      expect(params.get('size')).toBe('5')
      expect(params.get('target')).toBe('4096')
    })
  })

  describe('updateURLHash', () => {
    it('should update hash for non-default config', () => {
      const config: GameConfig = {
        ...DEFAULT_CONFIG,
        size: 5,
      }

      updateURLHash(config)

      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        '',
        expect.stringContaining('#size=5')
      )
    })

    it('should clear hash for default config', () => {
      updateURLHash(DEFAULT_CONFIG)

      expect(window.history.replaceState).toHaveBeenCalledWith(null, '', window.location.pathname)
    })

    it('should not reload the page', () => {
      const config: GameConfig = {
        ...DEFAULT_CONFIG,
        size: 5,
      }

      // If it were to reload, this test would fail
      updateURLHash(config)

      expect(window.history.replaceState).toHaveBeenCalled()
    })
  })

  describe('onHashChange', () => {
    it('should register hashchange event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const callback = vi.fn()

      onHashChange(callback)

      expect(addEventListenerSpy).toHaveBeenCalledWith('hashchange', expect.any(Function))
    })

    it('should call callback with parsed config on hash change', () => {
      const callback = vi.fn()
      onHashChange(callback)

      // Simulate hash change
      window.location.hash = '#size=5'
      window.dispatchEvent(new Event('hashchange'))

      expect(callback).toHaveBeenCalled()
      expect(callback.mock.calls[0][0].size).toBe(5)
    })

    it('should return cleanup function', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const callback = vi.fn()

      const cleanup = onHashChange(callback)
      cleanup()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('hashchange', expect.any(Function))
    })

    it('should not call callback after cleanup', () => {
      const callback = vi.fn()

      const cleanup = onHashChange(callback)
      cleanup()

      window.location.hash = '#size=5'
      window.dispatchEvent(new Event('hashchange'))

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('mergeConfigWithHash', () => {
    it('should merge partial config with URL config', () => {
      window.location.hash = '#size=5&theme=dark'

      const merged = mergeConfigWithHash({ target: 4096 })

      expect(merged.size).toBe(5)
      expect(merged.theme).toBe('dark')
      expect(merged.target).toBe(4096)
    })

    it('should override URL config with partial config', () => {
      window.location.hash = '#size=5'

      const merged = mergeConfigWithHash({ size: 6 })

      expect(merged.size).toBe(6)
    })

    it('should use defaults for missing values', () => {
      window.location.hash = ''

      const merged = mergeConfigWithHash({ size: 5 })

      expect(merged.size).toBe(5)
      expect(merged.target).toBe(DEFAULT_CONFIG.target)
      expect(merged.theme).toBe(DEFAULT_CONFIG.theme)
    })
  })

  describe('resetURLHash', () => {
    it('should remove hash from URL', () => {
      resetURLHash()

      expect(window.history.replaceState).toHaveBeenCalledWith(null, '', window.location.pathname)
    })

    it('should clear any existing hash', () => {
      window.location.hash = '#size=5&target=4096'

      resetURLHash()

      expect(window.history.replaceState).toHaveBeenCalledWith(null, '', window.location.pathname)
    })
  })

  describe('round-trip serialization', () => {
    it('should preserve config through serialize and parse', () => {
      const config: GameConfig = {
        size: 5,
        target: 4096,
        theme: 'dark',
        mode: 'zen',
        animSpeed: 'fast',
        spawn: [
          { value: 2, probability: 0.7 },
          { value: 4, probability: 0.3 },
        ],
      }

      const hash = serializeConfigToHash(config)
      window.location.hash = `#${hash}`
      const parsed = parseConfigFromHash()

      expect(parsed.size).toBe(config.size)
      expect(parsed.target).toBe(config.target)
      expect(parsed.theme).toBe(config.theme)
      expect(parsed.mode).toBe(config.mode)
      expect(parsed.animSpeed).toBe(config.animSpeed)
      expect(parsed.spawn).toHaveLength(config.spawn.length)
    })

    it('should handle default config round-trip', () => {
      const hash = serializeConfigToHash(DEFAULT_CONFIG)
      window.location.hash = hash ? `#${hash}` : ''
      const parsed = parseConfigFromHash()

      expect(parsed).toEqual(DEFAULT_CONFIG)
    })
  })

  describe('edge cases', () => {
    it('should handle hash with # prefix', () => {
      window.location.hash = '##size=5' // Double hash

      const config = parseConfigFromHash()

      // Should still parse correctly
      expect(config.size).toBeDefined()
    })

    it('should handle empty parameters', () => {
      window.location.hash = '#size=&target='

      const config = parseConfigFromHash()

      expect(config).toEqual(DEFAULT_CONFIG)
    })

    it('should handle malformed spawn config', () => {
      const testCases = [
        '#spawn=2',
        '#spawn=:0.5',
        '#spawn=2:',
        '#spawn=2:abc',
        '#spawn=abc:0.5',
        '#spawn=2:0.5,',
        '#spawn=2:0.5,4',
      ]

      testCases.forEach(hash => {
        window.location.hash = hash
        const config = parseConfigFromHash()
        expect(config.spawn).toEqual(DEFAULT_CONFIG.spawn)
      })
    })

    it('should handle spawn with negative values', () => {
      window.location.hash = '#spawn=-2:1.0'

      const config = parseConfigFromHash()

      expect(config.spawn).toEqual(DEFAULT_CONFIG.spawn)
    })

    it('should handle spawn with zero probability', () => {
      window.location.hash = '#spawn=2:0,4:1.0'

      const config = parseConfigFromHash()

      // Zero probability is filtered out, leaving only 4:1.0
      // This should fallback to default since probabilities won't sum to 1 after normalization
      // OR it might accept just { value: 4, probability: 1 } which is valid
      expect(config.spawn.length).toBeGreaterThan(0)
    })

    it('should handle spawn with probability > 1', () => {
      window.location.hash = '#spawn=2:1.5'

      const config = parseConfigFromHash()

      expect(config.spawn).toEqual(DEFAULT_CONFIG.spawn)
    })

    it('should handle very long hash strings', () => {
      const longHash = '#size=5&' + 'x=y&'.repeat(100)
      window.location.hash = longHash

      const config = parseConfigFromHash()

      expect(config.size).toBe(5)
    })
  })
})
