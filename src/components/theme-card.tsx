// src/components/theme-card.tsx
"use client"

import { React } from "react"
import { useTheme } from "../context/theme-context"

interface ThemeCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export function ThemeCard({ children, className = "", onClick, hover = true }: ThemeCardProps) {
  const { theme, activeCustomTheme } = useTheme()
  
  const getThemeStyles = () => {
    // Handle custom theme
    if (theme === "custom" && activeCustomTheme) {
      const customTheme = activeCustomTheme
      const baseStyles = {
        backgroundColor: `rgb(${customTheme.card})`,
        color: `rgb(${customTheme.cardForeground})`,
        borderColor: `rgb(${customTheme.border})`,
        borderRadius: customTheme.radius,
        position: "relative" as const,
        overflow: "hidden" as const,
        transition: "all 0.3s ease",
      }

      // Add texture effects
      if (customTheme.texture === "wood") {
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, rgb(${customTheme.card}) 0%, rgb(${customTheme.primary}) 50%, rgb(${customTheme.card}) 100%)`,
          boxShadow: customTheme.effects?.shadows === "none" ? "none" : 
                     customTheme.effects?.shadows === "subtle" ? "0 2px 8px rgba(0,0,0,0.1)" :
                     customTheme.effects?.shadows === "strong" ? "0 8px 32px rgba(0,0,0,0.3)" :
                     customTheme.effects?.shadows === "glow" ? `0 0 20px rgba(${customTheme.primary}, 0.3)` :
                     "0 4px 16px rgba(0,0,0,0.2)",
          border: `1px solid rgb(${customTheme.border})`,
        }
      } else if (customTheme.texture === "glass") {
        return {
          ...baseStyles,
          backdropFilter: customTheme.effects?.backdropBlur ? "blur(16px)" : "none",
          WebkitBackdropFilter: customTheme.effects?.backdropBlur ? "blur(16px)" : "none",
          background: `rgba(${customTheme.card}, ${customTheme.effects?.backdropBlur ? "0.25" : "1"})`,
          boxShadow: customTheme.effects?.shadows === "none" ? "none" : 
                     customTheme.effects?.shadows === "subtle" ? "0 2px 8px rgba(0,0,0,0.1)" :
                     customTheme.effects?.shadows === "strong" ? "0 8px 32px rgba(0,0,0,0.3)" :
                     customTheme.effects?.shadows === "glow" ? `0 0 20px rgba(${customTheme.primary}, 0.3)` :
                     "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          border: `1px solid rgba(${customTheme.border}, 0.2)`,
        }
      } else if (customTheme.texture === "metal") {
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, rgb(${customTheme.card}) 0%, rgb(${customTheme.secondary}) 50%, rgb(${customTheme.card}) 100%)`,
          boxShadow: customTheme.effects?.shadows === "none" ? "none" : 
                     customTheme.effects?.shadows === "subtle" ? "0 2px 8px rgba(0,0,0,0.1)" :
                     customTheme.effects?.shadows === "strong" ? "0 8px 32px rgba(0,0,0,0.3)" :
                     customTheme.effects?.shadows === "glow" ? `0 0 20px rgba(${customTheme.primary}, 0.3)` :
                     "0 4px 16px rgba(0,0,0,0.2)",
          border: `1px solid rgb(${customTheme.border})`,
        }
      } else if (customTheme.texture === "carbon") {
        return {
          ...baseStyles,
          background: `radial-gradient(circle at 1px 1px, rgb(${customTheme.muted}) 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
          backgroundColor: `rgb(${customTheme.card})`,
          boxShadow: customTheme.effects?.shadows === "none" ? "none" : 
                     customTheme.effects?.shadows === "subtle" ? "0 2px 8px rgba(0,0,0,0.1)" :
                     customTheme.effects?.shadows === "strong" ? "0 8px 32px rgba(0,0,0,0.3)" :
                     customTheme.effects?.shadows === "glow" ? `0 0 20px rgba(${customTheme.primary}, 0.3)` :
                     "0 4px 16px rgba(0,0,0,0.2)",
          border: `1px solid rgb(${customTheme.border})`,
        }
      } else if (customTheme.texture === "fabric") {
        return {
          ...baseStyles,
          background: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(${customTheme.muted}, 0.1) 2px, rgba(${customTheme.muted}, 0.1) 4px)`,
          backgroundColor: `rgb(${customTheme.card})`,
          boxShadow: customTheme.effects?.shadows === "none" ? "none" : 
                     customTheme.effects?.shadows === "subtle" ? "0 2px 8px rgba(0,0,0,0.1)" :
                     customTheme.effects?.shadows === "strong" ? "0 8px 32px rgba(0,0,0,0.3)" :
                     customTheme.effects?.shadows === "glow" ? `0 0 20px rgba(${customTheme.primary}, 0.3)` :
                     "0 4px 16px rgba(0,0,0,0.2)",
          border: `1px solid rgb(${customTheme.border})`,
        }
      } else if (customTheme.texture === "stone") {
        return {
          ...baseStyles,
          background: `radial-gradient(ellipse at top, rgb(${customTheme.card}) 0%, rgb(${customTheme.muted}) 100%)`,
          boxShadow: customTheme.effects?.shadows === "none" ? "none" : 
                     customTheme.effects?.shadows === "subtle" ? "inset 0 1px 3px rgba(0,0,0,0.1)" :
                     customTheme.effects?.shadows === "strong" ? "inset 0 2px 8px rgba(0,0,0,0.3)" :
                     customTheme.effects?.shadows === "glow" ? `inset 0 0 20px rgba(${customTheme.primary}, 0.2)` :
                     "inset 0 1px 3px rgba(0,0,0,0.2)",
          border: `1px solid rgb(${customTheme.border})`,
        }
      } else if (customTheme.texture === "leather") {
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, rgb(${customTheme.card}) 0%, rgb(${customTheme.secondary}) 100%)`,
          boxShadow: customTheme.effects?.shadows === "none" ? "none" : 
                     customTheme.effects?.shadows === "subtle" ? "0 2px 8px rgba(0,0,0,0.1)" :
                     customTheme.effects?.shadows === "strong" ? "0 8px 32px rgba(0,0,0,0.3)" :
                     customTheme.effects?.shadows === "glow" ? `0 0 20px rgba(${customTheme.primary}, 0.3)` :
                     "0 4px 16px rgba(0,0,0,0.2)",
          border: `1px solid rgb(${customTheme.border})`,
        }
      }
      
      return baseStyles
    }

    // Handle predefined themes
    switch (theme) {
      case "wood":
        return {
          background: "linear-gradient(135deg, #5b3c35 0%, #7c5046 50%, #5b3c35 100%)",
          boxShadow: "inset 0 2px 5px rgba(0,0,0,0.3), inset 0 -2px 5px rgba(255,255,255,0.1), 0 5px 15px rgba(0,0,0,0.5)",
          border: "1px solid #3d2817",
          position: "relative" as const,
          overflow: "hidden" as const,
          transition: "all 0.3s ease",
        }
      case "glass":
        return {
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          background: "rgba(30, 41, 59, 0.25)",
          position: "relative" as const,
          overflow: "hidden" as const,
          transition: "all 0.3s ease",
        }
      case "metal":
        return {
          background: "linear-gradient(135deg, #6b7280 0%, #9ca3af 50%, #6b7280 100%)",
          boxShadow: "inset 0 2px 5px rgba(0,0,0,0.3), inset 0 -2px 5px rgba(255,255,255,0.2), 0 5px 15px rgba(0,0,0,0.3)",
          border: "1px solid #4b5563",
          position: "relative" as const,
          overflow: "hidden" as const,
          transition: "all 0.3s ease",
        }
      default:
        return {
          backgroundColor: "rgb(var(--card))",
          borderColor: "rgb(var(--border))",
          transition: "all 0.3s ease",
        }
    }
  }
  
  const getHoverStyles = () => {
    if (!hover) return {}
    
    if (theme === "custom" && activeCustomTheme) {
      return {
        transform: "translateY(-2px)",
        boxShadow: activeCustomTheme.effects?.shadows === "glow" ? 
          `0 8px 32px rgba(${activeCustomTheme.primary}, 0.4)` :
          activeCustomTheme.effects?.shadows === "strong" ?
          "0 12px 40px rgba(0,0,0,0.4)" :
          activeCustomTheme.effects?.shadows === "subtle" ?
          "0 4px 16px rgba(0,0,0,0.2)" :
          "0 8px 24px rgba(0,0,0,0.3)"
      }
    }
    
    return {
      transform: "translateY(-2px)",
      boxShadow: theme === "glass" ? "0 12px 40px 0 rgba(31, 38, 135, 0.5)" : "0 8px 24px rgba(0,0,0,0.3)"
    }
  }
  
  return (
    <div 
      className={`card_modif rounded-xl p-6 cursor-pointer ${hover ? 'hover:scale-[1.02]' : ''} ${className}`}
      style={{...getThemeStyles(), ...(hover ? getHoverStyles() : {})}}
      onClick={onClick}
    >
      {/* Enhanced Wood Texture */}
      {(theme === "wood" || (theme === "custom" && activeCustomTheme?.texture === "wood")) && (
        <>
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: "repeating-linear-gradient(90deg, rgba(120, 80, 70, 0.1) 0px, transparent 1px, transparent 2px, rgba(120, 80, 70, 0.1) 3px), repeating-linear-gradient(0deg, rgba(120, 80, 70, 0.1) 0px, transparent 1px, transparent 2px, rgba(120, 80, 70, 0.1) 3px)",
              backgroundSize: "100px 100px, 100px 100px",
              opacity: 0.5,
              pointerEvents: "none" as const,
            }}
          />
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,0.05) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.05) 3px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.05) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.05) 3px)",
              backgroundSize: "20px 20px, 20px 20px",
              opacity: 0.3,
              pointerEvents: "none" as const,
            }}
          />
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.1) 100%)",
              pointerEvents: "none" as const,
            }}
          />
        </>
      )}
      
      {/* Enhanced Glass Texture */}
      {(theme === "glass" || (theme === "custom" && activeCustomTheme?.texture === "glass")) && (
        <>
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)",
              pointerEvents: "none" as const,
            }}
          />
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, transparent 1px, transparent 2px, rgba(255,255,255,0.03) 3px)",
              backgroundSize: "40px 40px",
              opacity: 0.5,
              pointerEvents: "none" as const,
            }}
          />
          <div 
            style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
              pointerEvents: "none" as const,
            }}
          />
        </>
      )}
      
      {/* Enhanced Metal Texture */}
      {(theme === "metal" || (theme === "custom" && activeCustomTheme?.texture === "metal")) && (
        <>
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, transparent 1px, transparent 2px, rgba(255,255,255,0.05) 3px)",
              backgroundSize: "10px 10px",
              opacity: 0.5,
              pointerEvents: "none" as const,
            }}
          />
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 100%)",
              pointerEvents: "none" as const,
            }}
          />
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              pointerEvents: "none" as const,
            }}
          />
        </>
      )}

      {/* Carbon Fiber Texture */}
      {theme === "custom" && activeCustomTheme?.texture === "carbon" && (
        <>
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              pointerEvents: "none" as const,
            }}
          />
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.02) 50%, transparent 60%)",
              pointerEvents: "none" as const,
            }}
          />
        </>
      )}

      {/* Fabric Texture */}
      {theme === "custom" && activeCustomTheme?.texture === "fabric" && (
        <div 
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px), repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
            backgroundSize: "4px 4px, 4px 4px",
            pointerEvents: "none" as const,
          }}
        />
      )}

      {/* Stone Texture */}
      {theme === "custom" && activeCustomTheme?.texture === "stone" && (
        <>
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(255,255,255,0.03) 0%, transparent 50%)",
              pointerEvents: "none" as const,
            }}
          />
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 11px)",
              backgroundSize: "20px 20px",
              pointerEvents: "none" as const,
            }}
          />
        </>
      )}

      {/* Leather Texture */}
      {theme === "custom" && activeCustomTheme?.texture === "leather" && (
        <>
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 6px)",
              backgroundSize: "6px 100%",
              pointerEvents: "none" as const,
            }}
          />
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 70%)",
              pointerEvents: "none" as const,
            }}
          />
        </>
      )}
      
      {children}
    </div>
  )
}