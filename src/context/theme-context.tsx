// src/context/theme-context.tsx
"use client"

import { createContext, useContext, useState, useEffect } from "react"

type PredefinedTheme = "default" | "wood" | "glass" | "metal"
type Theme = PredefinedTheme | "custom"

interface CustomTheme {
  name: string
  displayName: string
  background: string
  foreground: string
  card: string
  cardForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
  border: string
  muted: string
  mutedForeground: string
  radius: string
  gradientStart: string
  gradientEnd: string
  texture?: string
  effects?: {
    backdropBlur?: boolean
    shadows?: string
    animations?: boolean
  }
}

interface ThemeContextType {
  theme: Theme
  customThemes: CustomTheme[]
  activeCustomTheme: CustomTheme | null
  setTheme: (theme: Theme, customTheme?: CustomTheme) => void
  addCustomTheme: (theme: CustomTheme) => void
  updateCustomTheme: (theme: CustomTheme) => void
  deleteCustomTheme: (themeName: string) => void
  themeLoaded: boolean
  exportTheme: (theme: CustomTheme) => string
  importTheme: (themeData: string) => boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const defaultCustomThemes: CustomTheme[] = []

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("default")
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(defaultCustomThemes)
  const [activeCustomTheme, setActiveCustomTheme] = useState<CustomTheme | null>(null)
  const [themeLoaded, setThemeLoaded] = useState(false)

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("studystream-theme") as Theme
    const savedCustomThemes = localStorage.getItem("studystream-custom-themes")
    const savedActiveCustomTheme = localStorage.getItem("studystream-active-custom-theme")
    
    if (savedTheme && ["default", "wood", "glass", "metal", "custom"].includes(savedTheme)) {
      setThemeState(savedTheme)
    }
    
    if (savedCustomThemes) {
      try {
        setCustomThemes(JSON.parse(savedCustomThemes))
      } catch (e) {
        console.error("Failed to load custom themes:", e)
      }
    }
    
    if (savedActiveCustomTheme) {
      try {
        setActiveCustomTheme(JSON.parse(savedActiveCustomTheme))
      } catch (e) {
        console.error("Failed to load active custom theme:", e)
      }
    }
    
    setThemeLoaded(true)
  }, [])

  const applyThemeToDocument = (themeToApply: Theme, customTheme?: CustomTheme) => {
    // Remove all theme classes
    document.documentElement.classList.remove(
      "theme-default", 
      "theme-wood", 
      "theme-glass", 
      "theme-metal",
      "theme-custom"
    )
    
    // Add the new theme class
    document.documentElement.classList.add(`theme-${themeToApply}`)
    
    // If it's a custom theme, apply custom CSS variables
    if (themeToApply === "custom" && customTheme) {
      const root = document.documentElement
      root.style.setProperty('--background', customTheme.background)
      root.style.setProperty('--foreground', customTheme.foreground)
      root.style.setProperty('--card', customTheme.card)
      root.style.setProperty('--card-foreground', customTheme.cardForeground)
      root.style.setProperty('--primary', customTheme.primary)
      root.style.setProperty('--primary-foreground', customTheme.primaryForeground)
      root.style.setProperty('--secondary', customTheme.secondary)
      root.style.setProperty('--secondary-foreground', customTheme.secondaryForeground)
      root.style.setProperty('--accent', customTheme.accent)
      root.style.setProperty('--accent-foreground', customTheme.accentForeground)
      root.style.setProperty('--border', customTheme.border)
      root.style.setProperty('--muted', customTheme.muted)
      root.style.setProperty('--muted-foreground', customTheme.mutedForeground)
      root.style.setProperty('--radius', customTheme.radius)
      root.style.setProperty('--gradient-start', customTheme.gradientStart)
      root.style.setProperty('--gradient-end', customTheme.gradientEnd)
    }
  }

  const setTheme = (newTheme: Theme, customTheme?: CustomTheme) => {
    setThemeState(newTheme)
    localStorage.setItem("studystream-theme", newTheme)
    
    if (newTheme === "custom" && customTheme) {
      setActiveCustomTheme(customTheme)
      localStorage.setItem("studystream-active-custom-theme", JSON.stringify(customTheme))
    } else {
      setActiveCustomTheme(null)
      localStorage.removeItem("studystream-active-custom-theme")
    }
    
    applyThemeToDocument(newTheme, customTheme)
  }

  const addCustomTheme = (theme: CustomTheme) => {
    const updatedThemes = [...customThemes, theme]
    setCustomThemes(updatedThemes)
    localStorage.setItem("studystream-custom-themes", JSON.stringify(updatedThemes))
  }

  const updateCustomTheme = (updatedTheme: CustomTheme) => {
    const updatedThemes = customThemes.map(t => 
      t.name === updatedTheme.name ? updatedTheme : t
    )
    setCustomThemes(updatedThemes)
    localStorage.setItem("studystream-custom-themes", JSON.stringify(updatedThemes))
    
    // If this is the active custom theme, update it
    if (activeCustomTheme?.name === updatedTheme.name) {
      setActiveCustomTheme(updatedTheme)
      localStorage.setItem("studystream-active-custom-theme", JSON.stringify(updatedTheme))
      applyThemeToDocument("custom", updatedTheme)
    }
  }

  const deleteCustomTheme = (themeName: string) => {
    const updatedThemes = customThemes.filter(t => t.name !== themeName)
    setCustomThemes(updatedThemes)
    localStorage.setItem("studystream-custom-themes", JSON.stringify(updatedThemes))
    
    // If this was the active custom theme, switch to default
    if (activeCustomTheme?.name === themeName) {
      setTheme("default")
    }
  }

  const exportTheme = (theme: CustomTheme): string => {
    return JSON.stringify(theme, null, 2)
  }

  const importTheme = (themeData: string): boolean => {
    try {
      const theme = JSON.parse(themeData) as CustomTheme
      // Validate theme structure
      if (theme.name && theme.displayName && theme.background && theme.foreground) {
        addCustomTheme(theme)
        return true
      }
      return false
    } catch (e) {
      console.error("Failed to import theme:", e)
      return false
    }
  }

  useEffect(() => {
    // Apply the initial theme
    if (themeLoaded) {
      applyThemeToDocument(theme, activeCustomTheme || undefined)
    }
  }, [theme, themeLoaded, activeCustomTheme])

  const value: ThemeContextType = {
    theme,
    customThemes,
    activeCustomTheme,
    setTheme,
    addCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    themeLoaded,
    exportTheme,
    importTheme
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}