// src/components/theme-switcher.tsx
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Palette, Check, Plus, Settings, Download, Upload, Trash2 } from "lucide-react"
import { useTheme } from "../../context/theme-context"
import { ThemeCustomizationModal } from "./theme-customization-modal"

type Theme = "default" | "wood" | "glass" | "metal" | "custom"

const predefinedThemes = [
  { name: "default", label: "Default", icon: "🌙", description: "Classic dark theme" },
  { name: "wood", label: "Wood", icon: "🪵", description: "Warm wooden texture" },
  { name: "glass", label: "Glass", icon: "🔮", description: "Transparent glass effect" },
  { name: "metal", label: "Metal", icon: "⚙️", description: "Sleek metallic finish" },
]

export function ThemeSwitcher() {
  const { 
    theme, 
    setTheme, 
    customThemes, 
    activeCustomTheme, 
    deleteCustomTheme,
    exportTheme,
    importTheme 
  } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)
  const [editingTheme, setEditingTheme] = useState(null)

  const handleThemeChange = (newTheme: Theme, customTheme?: any) => {
    setTheme(newTheme, customTheme)
    setIsOpen(false)
  }

  const handleEditCustomTheme = (customTheme: any) => {
    setEditingTheme(customTheme)
    setIsCustomModalOpen(true)
    setIsOpen(false)
  }

  const handleDeleteCustomTheme = (themeName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this theme?")) {
      deleteCustomTheme(themeName)
    }
  }

  const handleExportTheme = (customTheme: any, e: React.MouseEvent) => {
    e.stopPropagation()
    const themeData = exportTheme(customTheme)
    const blob = new Blob([themeData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${customTheme.name}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (importTheme(content)) {
          alert("Theme imported successfully!")
        } else {
          alert("Failed to import theme. Please check the file format.")
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-card/80 backdrop-blur-md text-card-foreground hover:bg-accent/80 transition-all duration-300 shadow-sm hover:shadow-md"
          title="Change theme"
        >
          <Palette className="w-5 h-5" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-12 bg-popover/95 backdrop-blur-lg border border-border/50 rounded-xl shadow-2xl p-2 w-80 z-50 max-h-96 overflow-y-auto"
            >
              {/* Predefined Themes */}
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Predefined Themes
                </div>
                {predefinedThemes.map((themeOption) => (
                  <button
                    key={themeOption.name}
                    onClick={() => handleThemeChange(themeOption.name as Theme)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/80 transition-all ${
                      theme === themeOption.name ? "bg-accent/80" : ""
                    }`}
                  >
                    <span className="text-xl">{themeOption.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-foreground">{themeOption.label}</div>
                      <div className="text-xs text-muted-foreground">{themeOption.description}</div>
                    </div>
                    {theme === themeOption.name && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Themes */}
              {customThemes.length > 0 && (
                <div className="mb-2 border-t border-border/50 pt-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Custom Themes
                  </div>
                  {customThemes.map((customTheme) => (
                    <button
                      key={customTheme.name}
                      onClick={() => handleThemeChange("custom", customTheme)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/80 transition-all group ${
                        theme === "custom" && activeCustomTheme?.name === customTheme.name ? "bg-accent/80" : ""
                      }`}
                    >
                      <div 
                        className="w-6 h-6 rounded border border-border/50"
                        style={{
                          backgroundColor: `rgb(${customTheme.primary})`
                        }}
                      />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-foreground">{customTheme.displayName}</div>
                        <div className="text-xs text-muted-foreground">{customTheme.name}</div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleEditCustomTheme(customTheme)}
                          className="p-1 hover:bg-accent/80 rounded"
                          title="Edit theme"
                        >
                          <Settings className="w-3 h-3 text-foreground" />
                        </button>
                        <button
                          onClick={(e) => handleExportTheme(customTheme, e)}
                          className="p-1 hover:bg-accent/80 rounded"
                          title="Export theme"
                        >
                          <Download className="w-3 h-3 text-foreground" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteCustomTheme(customTheme.name, e)}
                          className="p-1 hover:bg-accent/80 rounded"
                          title="Delete theme"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                      {theme === "custom" && activeCustomTheme?.name === customTheme.name && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-border/50 pt-2 mt-2">
                <button
                  onClick={() => {
                    setIsCustomModalOpen(true)
                    setIsOpen(false)
                    setEditingTheme(null)
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/80 transition-all text-primary"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Create Custom Theme</span>
                </button>
                
                <label className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/80 transition-all cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span className="font-medium">Import Theme</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportTheme}
                    className="hidden"
                  />
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ThemeCustomizationModal
        isOpen={isCustomModalOpen}
        onClose={() => {
          setIsCustomModalOpen(false)
          setEditingTheme(null)
        }}
        editingTheme={editingTheme}
      />
    </>
  )
}