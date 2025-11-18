/**
 * 2048 Game - Entry Point
 * Initializes the React application with theme support
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import global styles and themes
import './styles/global.css'
import './styles/themes.css'

// Initialize theme before rendering
import { initializeTheme } from './hooks/useTheme'

// Import main App component
import App from './App.tsx'

// Initialize theme immediately (before React renders)
initializeTheme()

// Render the application
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
