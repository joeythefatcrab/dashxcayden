"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useRouter } from "next/navigation";

interface ThemeToggleProps {
  currentTheme: string;
}

export function ThemeToggle({ currentTheme }: ThemeToggleProps) {
  const [theme, setTheme] = useState(currentTheme);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else if (theme === "system") {
      // Check system preference
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemPrefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme]);

  const handleThemeChange = async (newTheme: string) => {
    setIsLoading(true);
    setTheme(newTheme);

    try {
      const response = await fetch("/api/user/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
      });

      if (!response.ok) {
        throw new Error("Failed to update theme");
      }

      // Refresh to update server-side rendered components
      router.refresh();
    } catch (error) {
      console.error("Failed to update theme:", error);
      // Revert on error
      setTheme(currentTheme);
    } finally {
      setIsLoading(false);
    }
  };

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Theme</div>
      <div className="grid grid-cols-3 gap-3">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;

          return (
            <button
              key={themeOption.value}
              onClick={() => handleThemeChange(themeOption.value)}
              disabled={isLoading}
              className={`
                flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all
                ${isActive
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
                }
                ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {themeOption.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Choose how the app looks. System follows your device settings.
      </p>
    </div>
  );
}
