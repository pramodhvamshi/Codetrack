import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('dark'); // Default to dark since the app was built dark

  useEffect(() => {
    // 1. Check local storage
    const storedTheme = localStorage.getItem('codetrack-theme');
    
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      // 2. Check system preference if no stored theme
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(systemPrefersDark ? 'dark' : 'light');
    }
  }, []);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('codetrack-theme', newTheme);
    
    // Apply class to root html element
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
