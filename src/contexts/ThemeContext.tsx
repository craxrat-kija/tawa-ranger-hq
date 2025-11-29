import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark" | "tawa";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "tawa-theme";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Load theme from localStorage on initialization, default to "light"
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
      if (savedTheme && ["light", "dark", "tawa"].includes(savedTheme)) {
        return savedTheme;
      }
    }
    return "light";
  });

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  // Apply theme to document root
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "tawa");
    
    // Clear TAWA theme custom properties if switching away from it
    if (theme !== "tawa") {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--accent");
    }
    
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "tawa") {
      root.classList.add("dark");
      root.style.setProperty("--primary", "120 30% 23%");
      root.style.setProperty("--accent", "45 75% 55%");
    } else {
      root.classList.add("light");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
