// src/components/course-customization-modal.tsx
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Palette, Tag, Save } from "lucide-react"
import { useApp } from "../../context/app-context"

interface CourseCustomizationModalProps {
  isOpen: boolean
  onClose: () => void
  courseName: string
}

export function CourseCustomizationModal({ isOpen, onClose, courseName }: CourseCustomizationModalProps) {
  const { courses, updateCourse } = useApp()
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  
  // Find the course to customize
  const course = courses.find(c => c.name === courseName)
  
  // Initialize state with current course values or defaults
  const [icon, setIcon] = useState(course?.icon || "📚")
  const [color, setColor] = useState(course?.color || "#8B5CF6")
  const [tags, setTags] = useState(course?.tags ? course.tags.join(", ") : "")

  // Course icon options
  const courseIcons = [
    "📚", "💻", "🎨", "🔬", "📊", "🎵", "📷", "🏗️", 
    "🌐", "📱", "🔧", "🎯", "🚀", "💡", "🔐", "📈"
  ]
  
  // Course color options
  const courseColors = [
    "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", 
    "#EC4899", "#6366F1", "#14B8A6", "#F97316", "#84CC16"
  ]

  const handleSave = () => {
    setIsSaving(true)
    
    // Parse tags from comma-separated string
    const parsedTags = tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
    
    // Update course with new values
    updateCourse(courseName, {
      icon,
      color,
      tags: parsedTags
    })
    
    setSaveMessage("Course customization saved successfully!")
    setIsSaving(false)
    
    setTimeout(() => {
      setSaveMessage("")
      onClose()
    }, 1500)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Customize Course</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Course Name Display */}
              <div>
                <p className="text-sm text-gray-400 mb-2">Course</p>
                <p className="text-white font-medium">{courseName}</p>
              </div>

              {/* Icon Selection */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-purple-400" />
                  <label className="text-sm font-medium text-gray-300">Course Icon</label>
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {courseIcons.map((iconOption) => (
                    <button
                      key={iconOption}
                      onClick={() => setIcon(iconOption)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                        icon === iconOption 
                          ? "bg-purple-600 text-white ring-2 ring-white ring-offset-2 ring-offset-gray-800" 
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {iconOption}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Color Selection */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-purple-400" />
                  <label className="text-sm font-medium text-gray-300">Course Color</label>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {courseColors.map((colorOption) => (
                    <button
                      key={colorOption}
                      onClick={() => setColor(colorOption)}
                      className={`w-12 h-12 rounded-lg transition-all ${
                        color === colorOption 
                          ? "ring-2 ring-white ring-offset-2 ring-offset-gray-800" 
                          : ""
                      }`}
                      style={{ backgroundColor: colorOption }}
                    ></button>
                  ))}
                </div>
              </div>
              
              {/* Tags Input */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-purple-400" />
                  <label className="text-sm font-medium text-gray-300">Tags</label>
                </div>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., React, Frontend, Advanced"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">Separate multiple tags with commas</p>
              </div>

              {/* Preview */}
              <div>
                <p className="text-sm font-medium text-gray-300 mb-3">Preview</p>
                <div 
                  className="p-4 rounded-lg border-2"
                  style={{ 
                    borderColor: `${color}60`,
                    background: `linear-gradient(to bottom right, ${color}10, ${color}05), linear-gradient(to bottom right, rgb(31 41 55), rgb(17 24 39))`
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ 
                        background: `linear-gradient(to bottom right, ${color}, ${color}dd)`,
                        boxShadow: `0 4px 12px ${color}40`
                      }}
                    >
                      <span className="text-xl">{icon}</span>
                    </div>
                    <h3 className="text-white font-medium">{courseName}</h3>
                  </div>
                  {tags && (
                    <div className="flex flex-wrap gap-1">
                      {tags.split(",").slice(0, 3).map((tag, index) => (
                        <span 
                          key={index} 
                          className="text-xs px-2 py-1 rounded"
                          style={{ 
                            backgroundColor: `${color}30`,
                            color: color
                          }}
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>
              </div>

              {saveMessage && (
                <div className="text-green-400 text-sm text-center">
                  {saveMessage}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}