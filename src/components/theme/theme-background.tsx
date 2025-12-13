// src/components/theme-background.tsx
"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "../../context/theme-context"

export function ThemeBackground() {
  const { theme, activeCustomTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    const container = containerRef.current
    
    // Clear any existing elements
    container.innerHTML = ""
    
    // Get current theme colors
    const getThemeColors = () => {
      if (theme === "custom" && activeCustomTheme) {
        return {
          primary: activeCustomTheme.primary,
          secondary: activeCustomTheme.secondary,
          background: activeCustomTheme.background,
          muted: activeCustomTheme.muted
        }
      }
      
      switch (theme) {
        case "wood":
          return {
            primary: "180, 83, 9",
            secondary: "120, 80, 70",
            background: "62, 39, 35",
            muted: "120, 80, 70"
          }
        case "glass":
          return {
            primary: "96, 165, 250",
            secondary: "51, 65, 85",
            background: "15, 23, 42",
            muted: "51, 65, 85"
          }
        case "metal":
          return {
            primary: "107, 114, 128",
            secondary: "75, 85, 99",
            background: "31, 41, 55",
            muted: "75, 85, 99"
          }
        default:
          return {
            primary: "139, 92, 246",
            secondary: "55, 65, 81",
            background: "17, 24, 39",
            muted: "55, 65, 81"
          }
      }
    }
    
    const colors = getThemeColors()
    const currentTexture = theme === "custom" ? activeCustomTheme?.texture : theme
    
    if (currentTexture === "wood") {
      // Enhanced wood grain effect
      for (let i = 0; i < 8; i++) {
        const grain = document.createElement("div")
        grain.className = "absolute inset-0 opacity-10"
        grain.style.background = `repeating-linear-gradient(${90 + i * 15}deg, rgba(${colors.secondary}, 0.1) 0px, transparent 1px, transparent 10px, rgba(${colors.secondary}, 0.1) 11px)`
        grain.style.transform = `translateY(${i * 20}px) rotate(${i * 5}deg)`
        container.appendChild(grain)
      }
      
      // Add wood knots
      for (let i = 0; i < 3; i++) {
        const knot = document.createElement("div")
        knot.className = "absolute rounded-full opacity-20"
        knot.style.width = `${50 + i * 20}px`
        knot.style.height = `${50 + i * 20}px`
        knot.style.background = `radial-gradient(circle, rgba(${colors.primary}, 0.3) 0%, rgba(${colors.primary}, 0) 70%)`
        knot.style.left = `${20 + i * 30}%`
        knot.style.top = `${30 + i * 15}%`
        container.appendChild(knot)
      }
    } else if (currentTexture === "glass") {
      // Enhanced glass reflection effect
      for (let i = 0; i < 5; i++) {
        const reflection = document.createElement("div")
        reflection.className = "absolute rounded-full opacity-15 blur-xl"
        reflection.style.width = `${150 + i * 50}px`
        reflection.style.height = `${150 + i * 50}px`
        reflection.style.background = `radial-gradient(circle, rgba(${colors.primary}, 0.2) 0%, rgba(${colors.primary}, 0) 70%)`
        reflection.style.left = `${10 + i * 20}%`
        reflection.style.top = `${20 + i * 15}%`
        reflection.style.animation = `float ${6 + i * 2}s ease-in-out infinite`
        reflection.style.animationDelay = `${i * 0.5}s`
        container.appendChild(reflection)
      }
      
      // Add glass streaks
      for (let i = 0; i < 3; i++) {
        const streak = document.createElement("div")
        streak.className = "absolute opacity-10"
        streak.style.width = "2px"
        streak.style.height = "100px"
        streak.style.background = `linear-gradient(to bottom, transparent, rgba(${colors.primary}, 0.3), transparent)`
        streak.style.left = `${30 + i * 25}%`
        streak.style.top = `${20 + i * 10}%`
        streak.style.transform = `rotate(${15 + i * 10}deg)`
        streak.style.animation = `shimmer ${8 + i * 2}s linear infinite`
        container.appendChild(streak)
      }
    } else if (currentTexture === "metal") {
      // Enhanced metal shine effect
      for (let i = 0; i < 8; i++) {
        const shine = document.createElement("div")
        shine.className = "absolute h-1 opacity-20"
        shine.style.width = `${80 + i * 40}px`
        shine.style.background = `linear-gradient(90deg, rgba(${colors.secondary}, 0) 0%, rgba(${colors.secondary}, 0.6) 50%, rgba(${colors.secondary}, 0) 100%)`
        shine.style.left = `${5 + i * 12}%`
        shine.style.top = `${15 + i * 10}%`
        shine.style.transform = `rotate(${i * 8}deg)`
        shine.style.animation = `shimmer ${4 + i * 0.5}s linear infinite`
        shine.style.animationDelay = `${i * 0.3}s`
        container.appendChild(shine)
      }
      
      // Add metal rivets
      for (let i = 0; i < 4; i++) {
        const rivet = document.createElement("div")
        rivet.className = "absolute rounded-full opacity-30"
        rivet.style.width = "8px"
        rivet.style.height = "8px"
        rivet.style.background = `radial-gradient(circle, rgba(${colors.secondary}, 0.8) 0%, rgba(${colors.secondary}, 0.2) 100%)`
        rivet.style.left = `${20 + i * 20}%`
        rivet.style.top = `${30 + i * 15}%`
        rivet.style.boxShadow = `0 2px 4px rgba(0,0,0,0.3)`
        container.appendChild(rivet)
      }
    } else if (currentTexture === "carbon") {
      // Carbon fiber pattern
      for (let i = 0; i < 6; i++) {
        const fiber = document.createElement("div")
        fiber.className = "absolute inset-0 opacity-20"
        fiber.style.background = `repeating-linear-gradient(${45 + i * 30}deg, transparent, transparent 2px, rgba(${colors.muted}, 0.3) 2px, rgba(${colors.muted}, 0.3) 4px)`
        fiber.style.backgroundSize = "20px 20px"
        container.appendChild(fiber)
      }
    } else if (currentTexture === "fabric") {
      // Fabric weave pattern
      for (let i = 0; i < 4; i++) {
        const thread = document.createElement("div")
        thread.className = "absolute inset-0 opacity-15"
        thread.style.background = `repeating-linear-gradient(${i % 2 === 0 ? 90 : 0}deg, transparent, transparent 3px, rgba(${colors.muted}, 0.2) 3px, rgba(${colors.muted}, 0.2) 6px)`
        thread.style.backgroundSize = "6px 6px"
        container.appendChild(thread)
      }
    } else if (currentTexture === "stone") {
      // Stone texture
      for (let i = 0; i < 5; i++) {
        const stone = document.createElement("div")
        stone.className = "absolute rounded-full opacity-10"
        stone.style.width = `${100 + i * 30}px`
        stone.style.height = `${100 + i * 30}px`
        stone.style.background = `radial-gradient(circle, rgba(${colors.muted}, 0.2) 0%, transparent 70%)`
        stone.style.left = `${Math.random() * 80}%`
        stone.style.top = `${Math.random() * 80}%`
        container.appendChild(stone)
      }
    } else if (currentTexture === "leather") {
      // Leather grain
      for (let i = 0; i < 10; i++) {
        const grain = document.createElement("div")
        grain.className = "absolute opacity-10"
        grain.style.width = "100%"
        grain.style.height = "1px"
        grain.style.background = `linear-gradient(90deg, transparent, rgba(${colors.secondary}, 0.3), transparent)`
        grain.style.top = `${10 + i * 8}%`
        grain.style.transform = `scaleX(${0.8 + Math.random() * 0.4})`
        container.appendChild(grain)
      }
    }
    
    // Add CSS animations
    const style = document.createElement("style")
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) translateX(0px); }
        25% { transform: translateY(-10px) translateX(5px); }
        50% { transform: translateY(-5px) translateX(-5px); }
        75% { transform: translateY(-15px) translateX(3px); }
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%) rotate(var(--rotation, 0deg)); }
        100% { transform: translateX(200%) rotate(var(--rotation, 0deg)); }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 0.1; }
        50% { opacity: 0.3; }
      }
    `
    document.head.appendChild(style)
    
    return () => {
      // Clean up
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [theme, activeCustomTheme])
  
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        background: theme === "custom" && activeCustomTheme ? 
          `rgb(${activeCustomTheme.background})` : 
          `rgb(var(--background))`
      }}
    />
  )
}