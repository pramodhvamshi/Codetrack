import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="ct-theme-btn"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
    >
      <div className="icon-container">
        <Sun className="icon-sun" size={18} />
        <Moon className="icon-moon" size={18} />
      </div>
    </button>
  );
}
