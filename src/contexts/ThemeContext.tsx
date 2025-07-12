
import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeColor = 'blue' | 'purple' | 'teal' | 'green' | 'orange';
export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  themeColor: ThemeColor;
  themeMode: ThemeMode;
  setThemeColor: (color: ThemeColor) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeColor, setThemeColor] = useState<ThemeColor>('blue');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const savedColor = localStorage.getItem('theme-color') as ThemeColor;
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    
    if (savedColor) setThemeColor(savedColor);
    if (savedMode) setThemeMode(savedMode);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme-color', themeColor);
    document.documentElement.setAttribute('data-theme-color', themeColor);
  }, [themeColor]);

  useEffect(() => {
    localStorage.setItem('theme-mode', themeMode);
    document.documentElement.setAttribute('data-theme-mode', themeMode);
    
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{
      themeColor,
      themeMode,
      setThemeColor,
      setThemeMode,
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
