import React, { createContext, useContext, useState, useEffect } from "react";

const COLORS = {
  dark: {
    darkest: "var(--cth-admin-bg)",
    darker: "var(--cth-surface-raised)",
    cardBg: "var(--cth-surface-raised)",
    crimson: "var(--cth-admin-accent)",
    cinnabar: "var(--cth-admin-accent)",
    tuscany: "var(--cth-brand-muted)",
    ruby: "var(--cth-admin-muted)",
    textPrimary: "var(--cth-admin-ink)",
    textSecondary: "var(--cth-admin-muted)",
    textMuted: "var(--cth-surface-sidebar-muted)",
    border: "var(--cth-surface-sidebar-border)",
    accent: "var(--cth-admin-accent)",
    sidebarStart: "var(--cth-surface-sidebar-start)",
    sidebarEnd: "var(--cth-surface-sidebar-end)",
    sidebarHover: "var(--cth-sidebar-hover)",
    panel: "var(--cth-surface-raised)",
    appBg: "var(--cth-admin-bg)",
  },
  light: {
      darkest: "var(--cth-admin-bg)",
      darker: "var(--cth-admin-panel-alt)",
      cardBg: "var(--cth-admin-panel)",
      crimson: "var(--cth-brand-primary)",
      cinnabar: "var(--cth-admin-accent)",
      tuscany: "var(--cth-brand-muted)",
      ruby: "var(--cth-admin-ruby)",
      textPrimary: "var(--cth-admin-ink)",
      textSecondary: "var(--cth-admin-muted)",
      textMuted: "var(--cth-brand-muted)",
      border: "var(--cth-admin-border)",
      accent: "var(--cth-admin-accent)",
      sidebarStart: "var(--cth-brand-primary)",
      sidebarEnd: "var(--cth-brand-primary-deep)",
      sidebarHover: "var(--cth-sidebar-hover)",
      panel: "var(--cth-admin-panel)",
      appBg: "var(--cth-admin-bg)",
    },
};

const ThemeContext = createContext();

function applyThemeVarsFromPalette(c, mode) {
  const root = document.documentElement;
  const body = document.body;

  root.setAttribute("data-theme", mode);
  body.setAttribute("data-theme", mode);

  root.classList.toggle("dark", mode === "dark");
  body.classList.toggle("dark", mode === "dark");

  root.style.setProperty("--cth-darkest", c.darkest);
  root.style.setProperty("--cth-darker", c.darker);
  root.style.setProperty("--cth-card", c.cardBg);
  root.style.setProperty("--cth-text", c.textPrimary);
  root.style.setProperty("--cth-text2", c.textSecondary);
  root.style.setProperty("--cth-muted", c.textMuted);
  root.style.setProperty("--cth-border", c.border);
  root.style.setProperty("--cth-accent", c.cinnabar);
  root.style.setProperty("--cth-tuscany", c.tuscany);
  root.style.setProperty("--cth-ruby", c.ruby);

  root.style.setProperty("--cth-admin-bg", c.appBg);
  root.style.setProperty("--cth-admin-panel", c.panel);
  root.style.setProperty("--cth-admin-sidebar-start", c.sidebarStart);
  root.style.setProperty("--cth-admin-sidebar-end", c.sidebarEnd);
  root.style.setProperty("--cth-admin-sidebar-hover", c.sidebarHover);
  root.style.setProperty("--cth-admin-ink", c.textPrimary);
  root.style.setProperty("--cth-admin-ruby", c.ruby);
  root.style.setProperty("--cth-admin-border", c.border);
  root.style.setProperty("--cth-admin-border-dark", "var(--cth-surface-sidebar-border)");
  root.style.setProperty("--cth-admin-muted", c.textSecondary);

  root.style.setProperty("--cth-app-bg", c.appBg);
  root.style.setProperty("--cth-app-panel", c.panel);
  root.style.setProperty("--cth-app-ink", c.textPrimary);
  root.style.setProperty("--cth-app-muted", c.textMuted);
  root.style.setProperty("--cth-app-border", c.border);
  root.style.setProperty("--cth-app-accent", c.accent);
  root.style.setProperty("--cth-app-ruby", c.ruby);
}

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("cth-theme");
    const dark = savedTheme ? savedTheme === "dark" : true;
    const mode = dark ? "dark" : "light";
    setIsDark(dark);
    applyThemeVarsFromPalette(dark ? COLORS.dark : COLORS.light, mode);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      const mode = next ? "dark" : "light";
      localStorage.setItem("cth-theme", mode);
      applyThemeVarsFromPalette(next ? COLORS.dark : COLORS.light, mode);
      return next;
    });
  };

  useEffect(() => {
    const mode = isDark ? "dark" : "light";
    applyThemeVarsFromPalette(isDark ? COLORS.dark : COLORS.light, mode);
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
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function useColors() {
  const { colors } = useTheme();
  return colors;
}
