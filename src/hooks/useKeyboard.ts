/**
 * Keyboard controls hook for 2048
 * Handles arrow keys, WASD, and undo shortcuts
 */

import { useEffect, useCallback } from 'react'
import { Direction } from '../types/game'

/**
 * Key bindings configuration
 */
export interface KeyBindings {
  up: string[]
  down: string[]
  left: string[]
  right: string[]
  undo: string[]
}

/**
 * Default key bindings
 */
const DEFAULT_KEY_BINDINGS: KeyBindings = {
  up: ['ArrowUp', 'KeyW', 'w', 'W'],
  down: ['ArrowDown', 'KeyS', 's', 'S'],
  left: ['ArrowLeft', 'KeyA', 'a', 'A'],
  right: ['ArrowRight', 'KeyD', 'd', 'D'],
  undo: ['KeyZ', 'z', 'Z'],
}

/**
 * Keyboard hook options
 */
export interface UseKeyboardOptions {
  onMove: (direction: Direction) => void
  onUndo: () => void
  keyBindings?: KeyBindings
  enabled?: boolean
}

/**
 * Keyboard controls hook
 *
 * Listens to keyboard events and triggers game moves:
 * - Arrow keys: Move in the corresponding direction
 * - WASD keys: Alternative move controls
 * - Ctrl/Cmd+Z: Undo last move
 *
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * useKeyboard({
 *   onMove: (direction) => game.move(direction),
 *   onUndo: () => game.undo(),
 *   enabled: !isPaused,
 * });
 * ```
 */
export function useKeyboard(options: UseKeyboardOptions): void {
  const { onMove, onUndo, keyBindings = DEFAULT_KEY_BINDINGS, enabled = true } = options

  /**
   * Get the direction for a given key
   */
  const getDirectionForKey = useCallback(
    (key: string, code: string): Direction | null => {
      // Check both key and code to support different keyboard layouts
      const keyOrCode = code || key

      if (keyBindings.up.includes(key) || keyBindings.up.includes(keyOrCode)) {
        return Direction.Up
      }
      if (keyBindings.down.includes(key) || keyBindings.down.includes(keyOrCode)) {
        return Direction.Down
      }
      if (keyBindings.left.includes(key) || keyBindings.left.includes(keyOrCode)) {
        return Direction.Left
      }
      if (keyBindings.right.includes(key) || keyBindings.right.includes(keyOrCode)) {
        return Direction.Right
      }
      return null
    },
    [keyBindings]
  )

  /**
   * Check if the key combination is for undo
   */
  const isUndoKey = useCallback(
    (event: KeyboardEvent): boolean => {
      const { key, code, ctrlKey, metaKey } = event
      const keyOrCode = code || key

      // Ctrl+Z or Cmd+Z
      const hasModifier = ctrlKey || metaKey
      const isZKey = keyBindings.undo.includes(key) || keyBindings.undo.includes(keyOrCode)

      return hasModifier && isZKey
    },
    [keyBindings]
  )

  /**
   * Handle keydown events
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) {
        return
      }

      // Check for undo first
      if (isUndoKey(event)) {
        event.preventDefault()
        onUndo()
        return
      }

      // Check for directional keys
      const direction = getDirectionForKey(event.key, event.code)
      if (direction !== null) {
        event.preventDefault() // Prevent scrolling with arrow keys
        onMove(direction)
      }
    },
    [enabled, isUndoKey, getDirectionForKey, onMove, onUndo]
  )

  /**
   * Set up and clean up keyboard event listeners
   */
  useEffect(() => {
    if (!enabled) {
      return
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])
}

/**
 * Hook to disable arrow key scrolling globally
 *
 * Prevents arrow keys from scrolling the page while playing the game.
 * Should be used in the root component.
 *
 * @example
 * ```tsx
 * function App() {
 *   usePreventArrowKeyScrolling();
 *   return <Game />;
 * }
 * ```
 */
export function usePreventArrowKeyScrolling(): void {
  useEffect(() => {
    const preventScrolling = (event: KeyboardEvent) => {
      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
      if (arrowKeys.includes(event.key)) {
        event.preventDefault()
      }
    }

    window.addEventListener('keydown', preventScrolling, { passive: false })

    return () => {
      window.removeEventListener('keydown', preventScrolling)
    }
  }, [])
}
