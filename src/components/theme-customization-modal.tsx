// src/components/theme-customization-modal.tsx
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Palette, Download, Upload, Eye, Save, Trash2, Copy, Check } from "lucide-react"
import { useTheme } from "../context/theme-context"
import { CustomTheme } from "../context/theme-context"

interface ThemeCustomizationModalProps {
  isOpen: boolean
  onClose: () => void
  editingTheme?: CustomTheme | null
}

const predefinedTextures = [
  { name: "none", label: "None", preview: "solid" },
  { name: "wood", label: "Wood", preview: "wood" },
  { name: "metal", label: "Metal", preview: "metal" },
  { name: "glass", label: "Glass", preview: "glass" },
  { name: "carbon", label: "Carbon Fiber", preview: "carbon" },
  { name: "fabric", label: "Fabric", preview: "fabric" },
  { name: "stone", label: "Stone", preview: "stone" },
  { name: "leather", label: "Leather", preview: "leather" }
]

const presetThemes = [
  {
    name: "midnight",
    displayName: "Midnight Blue",
    background: "15, 23, 42",
    foreground: "248, 250, 252",
    card: "30, 41, 59",
    cardForeground: "248, 250, 252",
    primary: "59, 130, 246",
    primaryForeground: "255, 255, 255",
    secondary: "51, 65, 85",
    secondaryForeground: "248, 250, 252",
    accent: "99, 102, 241",
    accentForeground: "255, 255, 255",
    border: "71, 85, 105",
    muted: "51, 65, 85",
    mutedForeground: "148, 163, 184",
    radius: "0.5rem",
    gradientStart: "59, 130, 246",
    gradientEnd: "99, 102, 241",
    texture: "none"
  },
  {
    name: "forest",
    displayName: "Forest Green",
    background: "20, 33, 20",
    foreground: "240, 253, 244",
    card: "34, 68, 34",
    cardForeground: "240, 253, 244",
    primary: "34, 197, 94",
    primaryForeground: "20, 33, 20",
    secondary: "54, 83, 54",
    secondaryForeground: "240, 253, 244",
    accent: "74, 222, 128",
    accentForeground: "20, 33, 20",
    border: "74, 111, 74",
    muted: "54, 83, 54",
    mutedForeground: "187, 247, 208",
    radius: "0.5rem",
    gradientStart: "34, 197, 94",
    gradientEnd: "74, 222, 128",
    texture: "wood"
  },
  {
    name: "sunset",
    displayName: "Sunset Orange",
    background: "67, 20, 7",
    foreground: "255, 251, 235",
    card: "124, 45, 18",
    cardForeground: "255, 251, 235",
    primary: "251, 146, 60",
    primaryForeground: "67, 20, 7",
    secondary: "154, 52, 18",
    secondaryForeground: "255, 251, 235",
    accent: "254, 215, 170",
    accentForeground: "67, 20, 7",
    border: "194, 65, 12",
    muted: "154, 52, 18",
    mutedForeground: "254, 243, 199",
    radius: "0.75rem",
    gradientStart: "251, 146, 60",
    gradientEnd: "254, 215, 170",
    texture: "metal"
  }
]

export function ThemeCustomizationModal({ isOpen, onClose, editingTheme }: ThemeCustomizationModalProps) {
  const { addCustomTheme, updateCustomTheme, exportTheme, importTheme: importThemeFromContext, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<"colors" | "textures" | "presets">("colors")
  const [themeName, setThemeName] = useState("")
  const [themeDisplayName, setThemeDisplayName] = useState("")
  const [currentTheme, setCurrentTheme] = useState<CustomTheme>({
    name: "",
    displayName: "",
    background: "17, 24, 39",
    foreground: "255, 255, 255",
    card: "31, 41, 55",
    cardForeground: "255, 255, 255",
    primary: "139, 92, 246",
    primaryForeground: "255, 255, 255",
    secondary: "55, 65, 81",
    secondaryForeground: "255, 255, 255",
    accent: "55, 65, 81",
    accentForeground: "255, 255, 255",
    border: "75, 85, 99",
    muted: "55, 65, 81",
    mutedForeground: "209, 213, 219",
    radius: "0.5rem",
    gradientStart: "139, 92, 246",
    gradientEnd: "59, 130, 246",
    texture: "none",
    effects: {
      backdropBlur: false,
      shadows: "default",
      animations: true
    }
  })

  useEffect(() => {
    if (editingTheme) {
      setThemeName(editingTheme.name)
      setThemeDisplayName(editingTheme.displayName)
      setCurrentTheme(editingTheme)
    } else {
      setThemeName("")
      setThemeDisplayName("")
      setCurrentTheme({
        name: "",
        displayName: "",
        background: "17, 24, 39",
        foreground: "255, 255, 255",
        card: "31, 41, 55",
        cardForeground: "255, 255, 255",
        primary: "139, 92, 246",
        primaryForeground: "255, 255, 255",
        secondary: "55, 65, 81",
        secondaryForeground: "255, 255, 255",
        accent: "55, 65, 81",
        accentForeground: "255, 255, 255",
        border: "75, 85, 99",
        muted: "55, 65, 81",
        mutedForeground: "209, 213, 219",
        radius: "0.5rem",
        gradientStart: "139, 92, 246",
        gradientEnd: "59, 130, 246",
        texture: "none",
        effects: {
          backdropBlur: false,
          shadows: "default",
          animations: true
        }
      })
    }
  }, [editingTheme, isOpen])

  const handleColorChange = (property: keyof CustomTheme, value: string) => {
    setCurrentTheme(prev => ({ ...prev, [property]: value }))
  }

  const handleEffectChange = (property: string, value: any) => {
    setCurrentTheme(prev => ({
      ...prev,
      effects: { ...prev.effects, [property]: value }
    }))
  }

  const applyPreset = (preset: typeof presetThemes[0]) => {
    setCurrentTheme({
      ...preset,
      effects: {
        backdropBlur: preset.texture === "glass",
        shadows: "default",
        animations: true
      }
    })
    setThemeDisplayName(preset.displayName)
  }

  const saveTheme = () => {
    if (!themeName.trim() || !themeDisplayName.trim()) {
      alert("Please enter both theme name and display name")
      return
    }

    const themeToSave: CustomTheme = {
      ...currentTheme,
      name: themeName.trim().toLowerCase().replace(/\s+/g, "-"),
      displayName: themeDisplayName.trim()
    }

    if (editingTheme) {
      updateCustomTheme(themeToSave)
    } else {
      addCustomTheme(themeToSave)
    }

    onClose()
  }

  const applyTheme = () => {
    if (!themeName.trim() || !themeDisplayName.trim()) {
      alert("Please enter both theme name and display name")
      return
    }

    const themeToSave: CustomTheme = {
      ...currentTheme,
      name: themeName.trim().toLowerCase().replace(/\s+/g, "-"),
      displayName: themeDisplayName.trim()
    }

    if (editingTheme) {
      updateCustomTheme(themeToSave)
    } else {
      addCustomTheme(themeToSave)
    }

    // Apply the theme immediately
    setTheme("custom", themeToSave)
    
    // Show success feedback
    const successMessage = document.createElement("div")
    successMessage.className = "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2"
    successMessage.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>Theme applied successfully!</span>
    `
    document.body.appendChild(successMessage)
    
    // Remove the message after 3 seconds
    setTimeout(() => {
      if (document.body.contains(successMessage)) {
        document.body.removeChild(successMessage)
      }
    }, 3000)
  }

  const exportCurrentTheme = () => {
    const themeData = exportTheme(currentTheme)
    const blob = new Blob([themeData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${themeName || "custom-theme"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (importThemeFromContext(content)) {
          alert("Theme imported successfully!")
        } else {
          alert("Failed to import theme. Please check the file format.")
        }
      }
      reader.readAsText(file)
    }
  }

  const copyToClipboard = () => {
    const themeData = exportTheme(currentTheme)
    navigator.clipboard.writeText(themeData)
    alert("Theme data copied to clipboard!")
  }

  const rgbToHex = (rgb: string) => {
    const values = rgb.split(",").map(v => parseInt(v.trim()))
    return "#" + values.map(v => v.toString(16).padStart(2, "0")).join("")
  }

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      hex
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Apply Button */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {editingTheme ? "Edit Theme" : "Create Custom Theme"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Design your perfect theme with custom colors and textures
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={applyTheme}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Apply Theme
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>

          {/* Theme Info */}
          <div className="p-6 border-b border-border bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Theme Name (Internal)
                </label>
                <input
                  type="text"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  placeholder="e.g., my-dark-theme"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={themeDisplayName}
                  onChange={(e) => setThemeDisplayName(e.target.value)}
                  placeholder="e.g., My Dark Theme"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {["colors", "textures", "presets"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 px-6 py-3 font-medium transition-colors ${
                  activeTab === tab
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Left Panel - Controls */}
              <div className="space-y-6">
                {activeTab === "colors" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Color Palette</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { key: "background", label: "Background" },
                        { key: "foreground", label: "Foreground" },
                        { key: "card", label: "Card Background" },
                        { key: "cardForeground", label: "Card Foreground" },
                        { key: "primary", label: "Primary" },
                        { key: "primaryForeground", label: "Primary Foreground" },
                        { key: "secondary", label: "Secondary" },
                        { key: "secondaryForeground", label: "Secondary Foreground" },
                        { key: "accent", label: "Accent" },
                        { key: "accentForeground", label: "Accent Foreground" },
                        { key: "border", label: "Border" },
                        { key: "muted", label: "Muted" },
                        { key: "mutedForeground", label: "Muted Foreground" },
                        { key: "gradientStart", label: "Gradient Start" },
                        { key: "gradientEnd", label: "Gradient End" }
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-3">
                          <label className="w-32 text-sm font-medium text-foreground">
                            {label}
                          </label>
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="color"
                              value={rgbToHex(currentTheme[key as keyof CustomTheme] as string)}
                              onChange={(e) => handleColorChange(key as keyof CustomTheme, hexToRgb(e.target.value))}
                              className="w-10 h-10 border border-border rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={currentTheme[key as keyof CustomTheme] as string}
                              onChange={(e) => handleColorChange(key as keyof CustomTheme, e.target.value)}
                              className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                              placeholder="R, G, B"
                            />
                          </div>
                        </div>
                      ))}

                      <div className="flex items-center gap-3">
                        <label className="w-32 text-sm font-medium text-foreground">
                          Border Radius
                        </label>
                        <select
                          value={currentTheme.radius}
                          onChange={(e) => handleColorChange("radius", e.target.value)}
                          className="flex-1 px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        >
                          <option value="0rem">None</option>
                          <option value="0.25rem">Small</option>
                          <option value="0.375rem">Default</option>
                          <option value="0.5rem">Medium</option>
                          <option value="0.75rem">Large</option>
                          <option value="1rem">Extra Large</option>
                          <option value="1.5rem">Rounded</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "textures" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Texture Type</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {predefinedTextures.map((texture) => (
                          <button
                            key={texture.name}
                            onClick={() => handleColorChange("texture", texture.name)}
                            className={`p-4 border rounded-lg transition-all ${
                              currentTheme.texture === texture.name
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-accent"
                            }`}
                          >
                            <div className="text-sm font-medium text-foreground">
                              {texture.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Effects</h3>
                      
                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={currentTheme.effects?.backdropBlur || false}
                            onChange={(e) => handleEffectChange("backdropBlur", e.target.checked)}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                          />
                          <span className="text-sm text-foreground">Backdrop Blur</span>
                        </label>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Shadow Style
                          </label>
                          <select
                            value={currentTheme.effects?.shadows || "default"}
                            onChange={(e) => handleEffectChange("shadows", e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                          >
                            <option value="none">None</option>
                            <option value="default">Default</option>
                            <option value="subtle">Subtle</option>
                            <option value="strong">Strong</option>
                            <option value="glow">Glow</option>
                          </select>
                        </div>

                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={currentTheme.effects?.animations !== false}
                            onChange={(e) => handleEffectChange("animations", e.target.checked)}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                          />
                          <span className="text-sm text-foreground">Enable Animations</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "presets" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Preset Themes</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {presetThemes.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => applyPreset(preset)}
                          className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
                        >
                          <div className="font-medium text-foreground">{preset.displayName}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Click to apply this preset
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel - Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Live Preview</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4 text-foreground" />
                    </button>
                    <button
                      onClick={exportCurrentTheme}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                      title="Export theme"
                    >
                      <Download className="w-4 h-4 text-foreground" />
                    </button>
                    <label className="p-2 hover:bg-accent rounded-lg transition-colors cursor-pointer" title="Import theme">
                      <Upload className="w-4 h-4 text-foreground" />
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportTheme}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div 
                  className="rounded-xl p-6 border"
                  style={{
                    backgroundColor: `rgb(${currentTheme.background})`,
                    borderColor: `rgb(${currentTheme.border})`,
                    color: `rgb(${currentTheme.foreground})`
                  }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold" style={{ color: `rgb(${currentTheme.foreground})` }}>
                        {themeDisplayName || "Preview Theme"}
                      </h4>
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 rounded text-sm font-medium"
                          style={{
                            backgroundColor: `rgb(${currentTheme.primary})`,
                            color: `rgb(${currentTheme.primaryForeground})`
                          }}
                        >
                          Primary
                        </button>
                        <button
                          className="px-3 py-1 rounded text-sm font-medium"
                          style={{
                            backgroundColor: `rgb(${currentTheme.secondary})`,
                            color: `rgb(${currentTheme.secondaryForeground})`
                          }}
                        >
                          Secondary
                        </button>
                      </div>
                    </div>

                    <div 
                      className="rounded-lg p-4"
                      style={{
                        backgroundColor: `rgb(${currentTheme.card})`,
                        borderColor: `rgb(${currentTheme.border})`,
                        color: `rgb(${currentTheme.cardForeground})`
                      }}
                    >
                      <h5 className="font-medium mb-2">Card Component</h5>
                      <p className="text-sm" style={{ color: `rgb(${currentTheme.mutedForeground})` }}>
                        This is how a card looks with your theme. The background, text, and borders all use your custom colors.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: `rgb(${currentTheme.primary})` }} />
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: `rgb(${currentTheme.secondary})` }} />
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: `rgb(${currentTheme.accent})` }} />
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: `rgb(${currentTheme.muted})` }} />
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: `rgb(${currentTheme.border})` }} />
                    </div>

                    <div 
                      className="h-2 rounded-full"
                      style={{
                        background: `linear-gradient(to right, rgb(${currentTheme.gradientStart}), rgb(${currentTheme.gradientEnd}))`
                      }}
                    />

                    <div className="text-sm" style={{ color: `rgb(${currentTheme.mutedForeground})` }}>
                      <p>• Border Radius: {currentTheme.radius}</p>
                      <p>• Texture: {currentTheme.texture}</p>
                      <p>• Effects: {currentTheme.effects?.backdropBlur ? "Blur" : "No Blur"}, {currentTheme.effects?.shadows}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
            <div className="text-sm text-muted-foreground">
              {editingTheme ? "Editing existing theme" : "Creating new custom theme"}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={saveTheme}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-foreground flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Only
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}