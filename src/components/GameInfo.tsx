import React, { useEffect, useState } from 'react'
import styles from './GameInfo.module.css'

interface GameInfoProps {
  score: number
  bestScore: number
  targetValue: number
}

/**
 * GameInfo component - displays score and best score below the game grid
 */
export const GameInfo: React.FC<GameInfoProps> = ({ score, bestScore, targetValue }) => {
  const [scoreIncrease, setScoreIncrease] = useState<number | null>(null)
  const [prevScore, setPrevScore] = useState(score)

  // Detect score changes and show increase animation
  useEffect(() => {
    if (score > prevScore) {
      const increase = score - prevScore
      setScoreIncrease(increase) // eslint-disable-line react-hooks/set-state-in-effect

      // Clear the animation after it completes
      const timer = setTimeout(() => {
        setScoreIncrease(null)
      }, 800)

      return () => clearTimeout(timer)
    }
    setPrevScore(score)
  }, [score, prevScore])

  return (
    <div className={styles.gameInfo}>
      <p className={styles.targetHint}>
        Join the tiles, get to <strong>{targetValue.toLocaleString()}</strong>!
      </p>

      <div className={styles.scores}>
        {/* Current Score */}
        <div className={styles.scoreBox}>
          <div className={styles.scoreLabel}>Score</div>
          <div className={styles.scoreValue} aria-live="polite" aria-atomic="true">
            {score.toLocaleString()}
          </div>
          {scoreIncrease !== null && (
            <div className={styles.scoreIncrease} aria-hidden="true">
              +{scoreIncrease}
            </div>
          )}
        </div>

        {/* Best Score */}
        <div className={styles.scoreBox}>
          <div className={styles.scoreLabel}>Best</div>
          <div className={styles.scoreValue} aria-live="polite" aria-atomic="true">
            {bestScore.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameInfo
