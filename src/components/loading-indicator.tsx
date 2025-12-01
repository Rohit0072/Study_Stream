// src/components/loading-indicator.tsx
"use client"

import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface LoadingIndicatorProps {
  isLoading: boolean
  message: string
  progress?: number
}

export function LoadingIndicator({ isLoading, message, progress = 0 }: LoadingIndicatorProps) {
  if (!isLoading) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
          Loading Course
        </h3>
        <p className="text-muted-foreground text-center mb-4">
          {message}
        </p>
        {progress > 0 && (
          <div className="w-full bg-muted rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
    </motion.div>
  )
}