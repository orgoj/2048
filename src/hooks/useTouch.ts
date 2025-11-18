/**
 * Touch/swipe controls hook for 2048
 * Handles swipe gestures and touch interactions
 */

import { useCallback, useRef, useEffect } from 'react'
import { Direction } from '../types/game'

/**
 * Touch position
 */
interface TouchPosition {
  x: number
  y: number
  timestamp: number
}

/**
 * Touch hook options
 */
export interface UseTouchOptions {
  onMove: (direction: Direction) => void
  minSwipeDistance?: number
  maxSwipeTime?: number
  preventScroll?: boolean
  enabled?: boolean
}

/**
 * Touch hook return type
 */
export interface UseTouchReturn {
  onTouchStart: (event: React.TouchEvent) => void
  onTouchMove: (event: React.TouchEvent) => void
  onTouchEnd: (event: React.TouchEvent) => void
}

/**
 * Default configuration
 */
const DEFAULT_MIN_SWIPE_DISTANCE = 30 // pixels
const DEFAULT_MAX_SWIPE_TIME = 1000 // milliseconds

/**
 * Touch/swipe controls hook
 *
 * Detects swipe gestures and translates them to game moves:
 * - Swipe up: Move up
 * - Swipe down: Move down
 * - Swipe left: Move left
 * - Swipe right: Move right
 *
 * @param options - Configuration options
 * @returns Touch event handlers to attach to the game board element
 *
 * @example
 * ```tsx
 * const touchHandlers = useTouch({
 *   onMove: (direction) => game.move(direction),
 *   minSwipeDistance: 50,
 *   preventScroll: true,
 * });
 *
 * return <div {...touchHandlers}>Game Board</div>;
 * ```
 */
export function useTouch(options: UseTouchOptions): UseTouchReturn {
  const {
    onMove,
    minSwipeDistance = DEFAULT_MIN_SWIPE_DISTANCE,
    maxSwipeTime = DEFAULT_MAX_SWIPE_TIME,
    preventScroll = true,
    enabled = true,
  } = options

  const touchStartRef = useRef<TouchPosition | null>(null)
  const isSwiping = useRef(false)

  /**
   * Calculate the direction based on touch positions
   */
  const calculateDirection = useCallback(
    (start: TouchPosition, end: TouchPosition): Direction | null => {
      const deltaX = end.x - start.x
      const deltaY = end.y - start.y
      const deltaTime = end.timestamp - start.timestamp

      // Check if swipe was too slow
      if (deltaTime > maxSwipeTime) {
        return null
      }

      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      // Check if movement is significant enough
      if (absX < minSwipeDistance && absY < minSwipeDistance) {
        return null
      }

      // Determine primary direction
      if (absX > absY) {
        // Horizontal swipe
        return deltaX > 0 ? Direction.Right : Direction.Left
      } else {
        // Vertical swipe
        return deltaY > 0 ? Direction.Down : Direction.Up
      }
    },
    [minSwipeDistance, maxSwipeTime]
  )

  /**
   * Handle touch start
   */
  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled) {
        return
      }

      const touch = event.touches[0]
      if (!touch) {
        return
      }

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      }

      isSwiping.current = false

      // Prevent pull-to-refresh on mobile browsers
      if (preventScroll && event.cancelable) {
        event.preventDefault()
      }
    },
    [enabled, preventScroll]
  )

  /**
   * Handle touch move
   */
  const onTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || !touchStartRef.current) {
        return
      }

      const touch = event.touches[0]
      if (!touch) {
        return
      }

      const currentPos: TouchPosition = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      }

      // Calculate if this qualifies as a swipe
      const deltaX = Math.abs(currentPos.x - touchStartRef.current.x)
      const deltaY = Math.abs(currentPos.y - touchStartRef.current.y)

      if (deltaX > minSwipeDistance || deltaY > minSwipeDistance) {
        isSwiping.current = true
      }

      // Prevent scrolling during swipe
      if (preventScroll && isSwiping.current && event.cancelable) {
        event.preventDefault()
      }
    },
    [enabled, preventScroll, minSwipeDistance]
  )

  /**
   * Handle touch end
   */
  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || !touchStartRef.current) {
        return
      }

      const touch = event.changedTouches[0]
      if (!touch) {
        touchStartRef.current = null
        isSwiping.current = false
        return
      }

      const endPos: TouchPosition = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      }

      const direction = calculateDirection(touchStartRef.current, endPos)

      if (direction !== null) {
        onMove(direction)
      }

      // Reset state
      touchStartRef.current = null
      isSwiping.current = false
    },
    [enabled, calculateDirection, onMove]
  )

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}

/**
 * Hook to disable pinch-to-zoom on touch devices
 *
 * Prevents pinch-to-zoom gesture on the entire page.
 * Should be used in the root component.
 *
 * @example
 * ```tsx
 * function App() {
 *   useDisablePinchZoom();
 *   return <Game />;
 * }
 * ```
 */
export function useDisablePinchZoom(): void {
  useEffect(() => {
    const preventZoom = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault()
      }
    }

    const preventGestureZoom = (event: Event) => {
      event.preventDefault()
    }

    // Prevent pinch zoom
    document.addEventListener('touchmove', preventZoom, { passive: false })

    // Prevent gesture zoom on iOS Safari
    document.addEventListener('gesturestart', preventGestureZoom)
    document.addEventListener('gesturechange', preventGestureZoom)
    document.addEventListener('gestureend', preventGestureZoom)

    return () => {
      document.removeEventListener('touchmove', preventZoom)
      document.removeEventListener('gesturestart', preventGestureZoom)
      document.removeEventListener('gesturechange', preventGestureZoom)
      document.removeEventListener('gestureend', preventGestureZoom)
    }
  }, [])
}

/**
 * Hook to prevent double-tap zoom on touch devices
 *
 * Prevents double-tap-to-zoom gesture on the entire page.
 * Should be used in the root component.
 *
 * @example
 * ```tsx
 * function App() {
 *   usePreventDoubleTapZoom();
 *   return <Game />;
 * }
 * ```
 */
export function usePreventDoubleTapZoom(): void {
  useEffect(() => {
    let lastTouchEnd = 0

    const preventDoubleTapZoom = (event: TouchEvent) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }

    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false })

    return () => {
      document.removeEventListener('touchend', preventDoubleTapZoom)
    }
  }, [])
}
