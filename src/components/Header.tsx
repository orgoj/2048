import React, { useEffect, useState } from 'react'
import styles from './Header.module.css'

interface HeaderProps {
  score: number
  bestScore: number
  targetValue: number
}

/**
 * Header component displaying game title, score, and best score
 * Includes animated score updates
 */
export const Header: React.FC<HeaderProps> = ({ score, bestScore, targetValue }) => {
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
    <header className={styles.header} role="banner">
      <div className={styles.headerTop}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>
            {targetValue}
            <span className={styles.titleSubtext}>Game</span>
          </h1>
          <p className={styles.subtitle}>
            Join the tiles, get to <strong>{targetValue.toLocaleString()}</strong>!
          </p>
        </div>

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

      {/* Optional: Add instructions or tips */}
      <div className={styles.instructions}>
        <p className={styles.instructionText}>
          Use your <strong>arrow keys</strong> or <strong>swipe</strong> to move the tiles
        </p>
      </div>
    </header>
  )
}

export default Header
