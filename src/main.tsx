import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Initialize theme on app start
function initializeTheme() {
  const savedSettings = localStorage.getItem('dashboard-settings');
  let theme = 'light';
  
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      theme = settings.theme || 'light';
    } catch (e) {
      // Use default theme if parsing fails
    }
  }
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    // System theme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

// Call initializeTheme after function definition
initializeTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)