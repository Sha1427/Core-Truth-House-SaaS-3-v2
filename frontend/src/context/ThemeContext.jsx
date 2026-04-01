import React, { createContext, useContext, useState, useEffect } from 'react';

const COLORS = {
  dark: {
    darkest: '#1c0828',
    darker: '#2b1040',
    cardBg: '#231035',
    crimson: '#AF0024',
    cinnabar: '#e04e35',
    tuscany: '#C7A09D',
    ruby: '#9B1B30',
    textPrimary: '#f8f5fa',
    textSecondary: '#e8e2ec',
    textMuted: '#b0a0b8',
    border: 'rgba(199, 160, 157, 0.2)',
    accent: '#AF0024',
  },
  light: {
    darkest: '#ffffff',
    darker: '#f8f5fa',
    cardBg: '#ffffff',
    crimson: '#AF0024',
    cinnabar: '#e04e35',
    tuscany: '#8B7355',
    ruby: '#9B1B30',
    textPrimary: '#1a0020',
    textSecondary: '#33033c',
    textMuted: '#6B5B5B',
    border: 'rgba(26, 0, 32, 0.1)',
    accent: '#AF0024',
  }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('cth-theme');
    if (savedTheme) {
      const dark = savedTheme === 'dark';
      setIsDark(dark);
      document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
    } else {
      document.body.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const newValue = !prev;
      localStorage.setItem('cth-theme', newValue ? 'dark' : 'light');
      document.body.setAttribute('data-theme', newValue ? 'dark' : 'light');
      applyThemeVars(newValue);
      return newValue;
    });
  };

  const applyThemeVars = (dark) => {
    const c = dark ? COLORS.dark : COLORS.light;
    const root = document.documentElement;
    root.style.setProperty('--cth-darkest', c.darkest);
    root.style.setProperty('--cth-darker', c.darker);
    root.style.setProperty('--cth-card', c.cardBg);
    root.style.setProperty('--cth-text', c.textPrimary);
    root.style.setProperty('--cth-text2', c.textSecondary);
    root.style.setProperty('--cth-muted', c.textMuted);
    root.style.setProperty('--cth-border', c.border);
    root.style.setProperty('--cth-accent', c.cinnabar);
    root.style.setProperty('--cth-tuscany', c.tuscany);
  };

  // Apply on mount
  useEffect(() => {
    applyThemeVars(isDark);
  }, [isDark]);

  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useColors() {
  const { colors } = useTheme();
  return colors;
}
