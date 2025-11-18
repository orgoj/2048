/**
 * useTheme Hook
 * React hook for managing theme state and persistence
 *
 * Features:
 * - Reads theme from localStorage on mount
 * - Applies theme to document root via data-theme attribute
 * - Syncs with storage service for persistence
 * - Provides theme getter and setter
 * - Supports system preference detection for 'auto' mode
 */

import { useState, useEffect, useCallback } from 'react'
import { loadPreferences, updatePreference } from '../services/storage'

/**
 * Available theme options
 */
export type Theme =
  | 'classic'
  | 'dark'
  | 'neon'
  | 'ocean'
  | 'sunset'
  | 'forest'
  | 'midnight'
  | 'candy'
  | 'pastel'

/**
 * Theme configuration with display metadata
 */
export interface ThemeConfig {
  id: Theme
  name: string
  description: string
  icon?: string
}

/**
 * Available themes with metadata
 */
export const THEMES: ThemeConfig[] = [
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Calming ocean/water theme with blues',
    icon: '🌊',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional 2048 beige/brown palette',
    icon: '🎨',
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'High contrast dark mode with vibrant colors',
    icon: '🌙',
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Cyberpunk neon theme with glowing effects',
    icon: '⚡',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm sunset gradient from yellow to purple',
    icon: '🌅',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural greens with earthy tones',
    icon: '🌲',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark purple to silver starlight gradient',
    icon: '🌌',
  },
  {
    id: 'candy',
    name: 'Candy',
    description: 'Sweet pink and purple candy colors',
    icon: '🍬',
  },
  {
    id: 'pastel',
    name: 'Pastel',
    description: 'Soft rainbow pastel palette',
    icon: '🎀',
  },
]

/**
 * Default theme
 */
const DEFAULT_THEME: Theme = 'ocean'

/**
 * Apply theme to document root
 */
function applyTheme(theme: Theme): void {
  // Remove any existing theme data attributes
  document.documentElement.removeAttribute('data-theme')

  // Set new theme
  document.documentElement.setAttribute('data-theme', theme)

  // Also set it as a class for backward compatibility (if needed)
  document.documentElement.className = `theme-${theme}`
}

/**
 * Detect system color scheme preference
 */
function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Convert legacy theme values to new theme system
 */
function migrateLegacyTheme(legacyTheme: 'light' | 'dark' | 'auto' | string): Theme {
  switch (legacyTheme) {
    case 'light':
      return 'ocean' // Migrate light to ocean (new default)
    case 'dark':
      return 'ocean' // Migrate dark to ocean (new default)
    case 'auto':
      // Auto mode: default to ocean
      return 'ocean'
    default: {
      // Check if it's already a valid new theme
      const validThemes: Theme[] = [
        'classic',
        'dark',
        'neon',
        'ocean',
        'sunset',
        'forest',
        'midnight',
        'candy',
        'pastel',
      ]
      if (validThemes.includes(legacyTheme as Theme)) {
        return legacyTheme as Theme
      }
      return DEFAULT_THEME
    }
  }
}

/**
 * Custom hook for theme management
 *
 * @returns [currentTheme, setTheme] - Current theme and function to update it
 *
 * @example
 * ```tsx
 * function App() {
 *   const [theme, setTheme] = useTheme();
 *
 *   return (
 *     <div>
 *       <p>Current theme: {theme}</p>
 *       <button onClick={() => setTheme('dark')}>Dark Mode</button>
 *       <button onClick={() => setTheme('neon')}>Neon Mode</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(): [Theme, (theme: Theme) => void] {
  // Initialize state with theme from localStorage or default
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    try {
      // First check for the new theme system (v2)
      const storedThemeV2 = localStorage.getItem('2048_theme_v2') as Theme | null
      const validThemes: Theme[] = [
        'classic',
        'dark',
        'neon',
        'ocean',
        'sunset',
        'forest',
        'midnight',
        'candy',
        'pastel',
      ]
      if (storedThemeV2 && validThemes.includes(storedThemeV2)) {
        return storedThemeV2
      }

      // Fall back to legacy theme system and migrate
      const preferences = loadPreferences()
      // The storage service still uses 'light' | 'dark' | 'auto'
      // We need to migrate this to the new theme system
      const migratedTheme = migrateLegacyTheme(preferences.theme)

      // Save the migrated theme for next time
      localStorage.setItem('2048_theme_v2', migratedTheme)

      return migratedTheme
    } catch (error) {
      console.error('Failed to load theme from preferences:', error)
      return DEFAULT_THEME
    }
  })

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(currentTheme)
  }, [currentTheme])

  // Listen for system preference changes (for future auto mode support)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user has not manually set a theme
      try {
        const preferences = loadPreferences()
        if (preferences.theme === 'auto') {
          const newTheme = e.matches ? 'dark' : 'classic'
          setCurrentTheme(newTheme)
        }
      } catch (error) {
        console.error('Failed to handle system preference change:', error)
      }
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  // Theme setter function with persistence
  const setTheme = useCallback((newTheme: Theme) => {
    try {
      // Update local state
      setCurrentTheme(newTheme)

      // Persist to storage
      // Note: The storage service expects 'light' | 'dark' | 'auto'
      // We'll map our themes to this for now, but ideally the storage service
      // should be updated to support the new theme system
      let storageThemeValue: 'light' | 'dark' | 'auto'
      switch (newTheme) {
        case 'classic':
          storageThemeValue = 'light'
          break
        case 'dark':
          storageThemeValue = 'dark'
          break
        case 'neon':
        case 'ocean':
          // For now, store these as 'dark' in the legacy system
          // In a future update, we should extend the UserPreferences type
          storageThemeValue = 'dark'
          break
        default:
          storageThemeValue = 'light'
      }

      updatePreference('theme', storageThemeValue)

      // Also store the actual theme in a custom key for full support
      localStorage.setItem('2048_theme_v2', newTheme)

      console.log(`Theme changed to: ${newTheme}`)
    } catch (error) {
      console.error('Failed to save theme preference:', error)
      // Still update the UI even if storage fails
      setCurrentTheme(newTheme)
    }
  }, [])

  return [currentTheme, setTheme]
}

/**
 * Hook to get theme configuration
 */
export function useThemeConfig(theme: Theme): ThemeConfig {
  return THEMES.find(t => t.id === theme) || THEMES[0]
}

/**
 * Hook to get all available themes
 */
export function useAvailableThemes(): ThemeConfig[] {
  return THEMES
}

/**
 * Initialize theme on app load
 * Call this once in your app's entry point
 */
export function initializeTheme(): void {
  try {
    // First check for the new theme system
    const storedThemeV2 = localStorage.getItem('2048_theme_v2') as Theme | null
    const validThemes: Theme[] = [
      'classic',
      'dark',
      'neon',
      'ocean',
      'sunset',
      'forest',
      'midnight',
      'candy',
      'pastel',
    ]

    if (storedThemeV2 && validThemes.includes(storedThemeV2)) {
      applyTheme(storedThemeV2)
      return
    }

    // Fall back to legacy theme from preferences and migrate to ocean
    const preferences = loadPreferences()
    const theme = migrateLegacyTheme(preferences.theme)
    applyTheme(theme)

    // Save migrated theme to new system
    localStorage.setItem('2048_theme_v2', theme)
  } catch (error) {
    console.error('Failed to initialize theme:', error)
    // Always default to ocean
    applyTheme(DEFAULT_THEME)
    localStorage.setItem('2048_theme_v2', DEFAULT_THEME)
  }
}

/**
 * Export utility functions
 */
export { applyTheme, getSystemPreference }

/**
 * Default export
 */
export default useTheme
