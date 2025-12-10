"use client";

import { useEffect } from "react";

interface ThemeProviderProps {
  theme?: string;
  children: React.ReactNode;
}

export function ThemeProvider({ theme = "light", children }: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement;

    // Remove any existing theme classes
    root.classList.remove("dark", "light");

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.add("light");
    } else if (theme === "system") {
      // Check system preference
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemPrefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.add("light");
      }

      // Listen for system theme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove("dark", "light");
        root.classList.add(e.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  return <>{children}</>;
}
