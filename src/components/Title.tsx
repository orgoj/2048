import React from 'react'
import styles from './Title.module.css'

interface TitleProps {
  targetValue: number
}

/**
 * Simple title component - displays only the game title at the top
 */
export const Title: React.FC<TitleProps> = ({ targetValue }) => {
  return (
    <header className={styles.titleHeader} role="banner">
      <h1 className={styles.title}>
        {targetValue}
        <span className={styles.titleSubtext}>Game</span>
      </h1>
    </header>
  )
}

export default Title
