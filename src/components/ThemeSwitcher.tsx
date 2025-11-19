import React from 'react'
import { THEMES, type Theme, type ThemeConfig } from '../hooks/useTheme'
import styles from './ThemeSwitcher.module.css'

interface ThemeSwitcherProps {
  currentTheme: Theme
  onThemeChange: (theme: Theme) => void
}

/**
 * ThemeSwitcher component - displays theme options on the main screen
 */
export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onThemeChange }) => {
  return (
    <div className={styles.themeSwitcher}>
      <div className={styles.themeLabel}>Theme</div>
      <div className={styles.themeOptions}>
        {THEMES.map((theme: ThemeConfig) => (
          <button
            key={theme.id}
            className={`${styles.themeButton} ${currentTheme === theme.id ? styles.active : ''}`}
            onClick={() => onThemeChange(theme.id)}
            title={theme.name}
            aria-label={`Switch to ${theme.name} theme`}
          >
            <span className={styles.themeIcon}>{theme.icon}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ThemeSwitcher
