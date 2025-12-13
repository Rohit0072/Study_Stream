// src/components/theme-button.tsx
"use client"

import { React } from "react"
import { useTheme } from "../../context/theme-context"

interface ThemeButtonProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

export function ThemeButton({ 
  children, 
  className = "", 
  onClick, 
  disabled = false,
  variant = "primary",
  size = "md"
}: ThemeButtonProps) {
  const { theme, activeCustomTheme } = useTheme()
  
  const getThemeStyles = () => {
    // Handle custom theme
    if (theme === "custom" && activeCustomTheme) {
      const customTheme = activeCustomTheme
      const baseStyles = {
        borderRadius: customTheme.radius,
        position: "relative" as const,
        overflow: "hidden" as const,
        transition: "all 0.3s ease",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
      }

      const sizeStyles = size === "sm" ? { padding: "0.5rem 1rem", fontSize: "0.875rem" } :
                         size === "lg" ? { padding: "0.75rem 2rem", fontSize: "1rem" } :
                         { padding: "0.5rem 1.5rem", fontSize: "0.875rem" }

      if (variant === "primary") {
        return {
          ...baseStyles,
          ...sizeStyles,
          backgroundColor: `rgb(${customTheme.primary})`,
          color: `rgb(${customTheme.primaryForeground})`,
          boxShadow: customTheme.effects?.shadows === "none" ? "none" : 
                     customTheme.effects?.shadows === "subtle" ? "0 2px 8px rgba(0,0,0,0.1)" :
                     customTheme.effects?.shadows === "strong" ? "0 4px 16px rgba(0,0,0,0.3)" :
                     customTheme.effects?.shadows === "glow" ? `0 0 20px rgba(${customTheme.primary}, 0.3)` :
                     "0 2px 8px rgba(0,0,0,0.2)",
        }
      } else if (variant === "secondary") {
        return {
          ...baseStyles,
          ...sizeStyles,
          backgroundColor: `rgb(${customTheme.secondary})`,
          color: `rgb(${customTheme.secondaryForeground})`,
          boxShadow: customTheme.effects?.shadows === "none" ? "none" : 
                     customTheme.effects?.shadows === "subtle" ? "0 2px 8px rgba(0,0,0,0.1)" :
                     customTheme.effects?.shadows === "strong" ? "0 4px 16px rgba(0,0,0,0.3)" :
                     customTheme.effects?.shadows === "glow" ? `0 0 20px rgba(${customTheme.secondary}, 0.3)` :
                     "0 2px 8px rgba(0,0,0,0.2)",
        }
      } else if (variant === "outline") {
        return {
          ...baseStyles,
          ...sizeStyles,
          backgroundColor: "transparent",
          color: `rgb(${customTheme.primary})`,
          border: `1px solid rgb(${customTheme.primary})`,
        }
      } else {
        return {
          ...baseStyles,
          ...sizeStyles,
          backgroundColor: "transparent",
          color: `rgb(${customTheme.foreground})`,
        }
      }
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
          borderRadius: "0.375rem",
          padding: size === "sm" ? "0.5rem 1rem" : size === "lg" ? "0.75rem 2rem" : "0.5rem 1.5rem",
          fontSize: size === "sm" ? "0.875rem" : size === "lg" ? "1rem" : "0.875rem",
          color: "#f8fafc",
        }
      case "glass":
        return {
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 4px 15px 0 rgba(31, 38, 135, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          background: "rgba(96, 165, 250, 0.2)",
          position: "relative" as const,
          overflow: "hidden" as const,
          transition: "all 0.3s ease",
          borderRadius: "0.75rem",
          padding: size === "sm" ? "0.5rem 1rem" : size === "lg" ? "0.75rem 2rem" : "0.5rem 1.5rem",
          fontSize: size === "sm" ? "0.875rem" : size === "lg" ? "1rem" : "0.875rem",
          color: "#ffffff", // Explicitly set white text for glass theme
        }
      case "metal":
        return {
          background: "linear-gradient(135deg, #6b7280 0%, #9ca3af 50%, #6b7280 100%)",
          boxShadow: "inset 0 2px 5px rgba(0,0,0,0.3), inset 0 -2px 5px rgba(255,255,255,0.2), 0 5px 15px rgba(0,0,0,0.3)",
          border: "1px solid #4b5563",
          position: "relative" as const,
          overflow: "hidden" as const,
          transition: "all 0.3s ease",
          borderRadius: "0.25rem",
          padding: size === "sm" ? "0.5rem 1rem" : size === "lg" ? "0.75rem 2rem" : "0.5rem 1.5rem",
          fontSize: size === "sm" ? "0.875rem" : size === "lg" ? "1rem" : "0.875rem",
          color: "#f8fafc",
        }
      default:
        return {
          backgroundColor: variant === "primary" ? "rgb(var(--primary))" : 
                          variant === "secondary" ? "rgb(var(--secondary))" :
                          variant === "outline" ? "transparent" : "transparent",
          color: variant === "primary" ? "rgb(var(--primary-foreground))" : 
                 variant === "secondary" ? "rgb(var(--secondary-foreground))" :
                 variant === "outline" ? "rgb(var(--primary))" : "rgb(var(--foreground))",
          border: variant === "outline" ? "1px solid rgb(var(--primary))" : "none",
          borderRadius: "var(--radius)",
          padding: size === "sm" ? "0.5rem 1rem" : size === "lg" ? "0.75rem 2rem" : "0.5rem 1.5rem",
          fontSize: size === "sm" ? "0.875rem" : size === "lg" ? "1rem" : "0.875rem",
          transition: "all 0.3s ease",
        }
    }
  }
  
  const getHoverStyles = () => {
    if (disabled) return { opacity: 0.5, cursor: "not-allowed" }
    
    if (theme === "custom" && activeCustomTheme) {
      return {
        transform: "scale(1.05)",
        boxShadow: activeCustomTheme.effects?.shadows === "glow" ? 
          `0 0 30px rgba(${activeCustomTheme.primary}, 0.5)` :
          activeCustomTheme.effects?.shadows === "strong" ?
          "0 8px 24px rgba(0,0,0,0.4)" :
          activeCustomTheme.effects?.shadows === "subtle" ?
          "0 4px 12px rgba(0,0,0,0.2)" :
          "0 6px 16px rgba(0,0,0,0.3)"
      }
    }
    
    return {
      transform: "scale(1.05)",
      boxShadow: theme === "glass" ? "0 8px 24px 0 rgba(31, 38, 135, 0.4)" : "0 6px 16px rgba(0,0,0,0.3)"
    }
  }
  
  return (
    <button 
      className={`font-medium ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      style={{...getThemeStyles(), ...(disabled ? {} : getHoverStyles())}}
      onClick={onClick}
      disabled={disabled}
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
              bottom: 0,
              background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 70%)",
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
              backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, transparent 1px, transparent 2px, rgba(255,255,255,0.05) 3px)",
              backgroundSize: "20px 20px",
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
        </>
      )}

      {/* Carbon Fiber Texture */}
      {theme === "custom" && activeCustomTheme?.texture === "carbon" && (
        <div 
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "10px 10px",
            pointerEvents: "none" as const,
          }}
        />
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
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)",
            backgroundSize: "4px 4px",
            pointerEvents: "none" as const,
          }}
        />
      )}

      {/* Stone Texture */}
      {theme === "custom" && activeCustomTheme?.texture === "stone" && (
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
      )}

      {/* Leather Texture */}
      {theme === "custom" && activeCustomTheme?.texture === "leather" && (
        <div 
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)",
            backgroundSize: "4px 100%",
            pointerEvents: "none" as const,
          }}
        />
      )}
      
      <span style={{ position: "relative", zIndex: 1 }}>
        {children}
      </span>
    </button>
  )
}