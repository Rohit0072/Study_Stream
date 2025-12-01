// src/components/course-card.tsx
"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Folder, MoreVertical, Play, Trash, Settings, Pin, PinOff } from "lucide-react"

interface CourseCardProps {
  course: {
    name: string
    sections: {
      name: string
      videos: {
        name: string
        duration: string
        progress: number
      }[]
    }[]
    icon?: string
    color?: string
    tags?: string[]
    isPinned?: boolean // Add this property
  }
  index: number
  onClick: () => void
  onDelete: () => void
  onCustomize?: () => void
  onPin?: () => void // Add this property
  onUnpin?: () => void // Add this property
}

export function CourseCard({ course, index, onClick, onDelete, onCustomize, onPin, onUnpin }: CourseCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const totalSections = course.sections.length
  const totalVideos = course.sections.reduce((acc, section) => acc + section.videos.length, 0)
  
  const totalDuration = course.sections.reduce((acc, section) => {
    return acc + section.videos.reduce((sectionAcc, video) => {
      const [mins, secs] = video.duration.split(":").map(Number)
      return sectionAcc + (isNaN(mins) ? 0 : mins * 60) + (isNaN(secs) ? 0 : secs)
    }, 0)
  }, 0)
  
  const hours = Math.floor(totalDuration / 3600)
  const minutes = Math.floor((totalDuration % 3600) / 60)
  const formattedDuration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  
  const totalProgress = course.sections.reduce((acc, section) => {
    return acc + section.videos.reduce((sectionAcc, video) => sectionAcc + video.progress, 0)
  }, 0)
  const averageProgress = totalVideos > 0 ? totalProgress / totalVideos : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group cursor-pointer"
    >
      <div 
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-xl h-64 transition-all duration-300 ${course.isPinned ? 'ring-2 ring-yellow-500' : ''}`}
        style={{ 
          borderColor: course.color ? `${course.color}60` : undefined,
          boxShadow: course.color ? `0 4px 20px ${course.color}30` : undefined,
          background: course.color 
            ? `linear-gradient(to bottom right, ${course.color}10, ${course.color}05), linear-gradient(to bottom right, rgb(31 41 55), rgb(17 24 39))` 
            : undefined
        }}
      >
        {/* Pin indicator */}
        {course.isPinned && (
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-yellow-500 text-white p-1.5 rounded-full">
              <Pin className="w-4 h-4" />
            </div>
          </div>
        )}
        
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ 
            background: course.color 
              ? `linear-gradient(to bottom right, ${course.color}20, ${course.color}10)` 
              : "linear-gradient(to bottom right, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.05))"
          }}
        ></div>

        <div className="p-6 h-full flex flex-col" onClick={onClick}>
          <div className="flex items-start justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300"
              style={{ 
                background: course.color 
                  ? `linear-gradient(to bottom right, ${course.color}, ${course.color}dd)` 
                  : "linear-gradient(to bottom right, #8B5CF6, #3B82F6)",
                boxShadow: course.color ? `0 4px 12px ${course.color}40` : undefined
              }}
            >
              <span className="text-2xl">{course.icon || "📚"}</span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{course.name}</h3>

          <div className="text-sm text-gray-400 mb-4">
            <span>{totalSections} sections</span>
            <span className="mx-2">•</span>
            <span>{totalVideos} videos</span>
            <span className="mx-2">•</span>
            <span>{formattedDuration}</span>
          </div>

          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {course.tags.slice(0, 2).map((tag, tagIndex) => (
                <span 
                  key={tagIndex} 
                  className="text-xs px-2 py-1 rounded transition-all duration-300"
                  style={{ 
                    backgroundColor: course.color ? `${course.color}30` : "rgba(139, 92, 246, 0.3)",
                    color: course.color || "#A78BFA",
                    borderColor: course.color ? `${course.color}50` : undefined,
                    borderWidth: "1px",
                    borderStyle: "solid"
                  }}
                >
                  {tag}
                </span>
              ))}
              {course.tags.length > 2 && (
                <span 
                  className="text-xs px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: course.color ? `${course.color}30` : "rgba(139, 92, 246, 0.3)",
                    color: course.color || "#A78BFA"
                  }}
                >
                  +{course.tags.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Progress</span>
              <span>{Math.round(averageProgress * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${averageProgress * 100}%`,
                  background: course.color 
                    ? `linear-gradient(to right, ${course.color}, ${course.color}dd)` 
                    : "linear-gradient(to right, #8B5CF6, #3B82F6)"
                }}
              ></div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-gray-900/60 flex items-center justify-center"
          onClick={onClick}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: isHovered ? 1 : 0.8 }}
            transition={{ type: "spring", damping: 15 }}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ 
              background: course.color 
                ? `linear-gradient(to right, ${course.color}, ${course.color}dd)` 
                : "linear-gradient(to right, #8B5CF6, #3B82F6)",
              boxShadow: course.color ? `0 4px 20px ${course.color}60` : undefined
            }}
          >
            <Play className="w-8 h-8 text-white" />
          </motion.div>
        </motion.div>

        <div className="absolute top-6 right-6 z-10" onClick={(e) => e.stopPropagation()}>
          <div className="relative">
            <button
              className="text-gray-400 hover:text-white focus:outline-none bg-gray-800/80 hover:bg-gray-700 rounded-full p-1 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setShowDropdown(!showDropdown)
              }}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-20">
                <div className="py-1">
                  {course.isPinned ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onUnpin && onUnpin()
                        setShowDropdown(false)
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 w-full text-left"
                    >
                      <PinOff className="w-4 h-4 mr-2" />
                      <span>Unpin</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onPin && onPin()
                        setShowDropdown(false)
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 w-full text-left"
                    >
                      <Pin className="w-4 h-4 mr-2" />
                      <span>Pin</span>
                    </button>
                  )}
                  {onCustomize && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onCustomize()
                        setShowDropdown(false)
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 w-full text-left"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      <span>Customize</span>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                      setShowDropdown(false)
                    }}
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 w-full text-left"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div 
        className="absolute inset-0 rounded-xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-300 -z-10"
        style={{ 
          background: course.color 
            ? `linear-gradient(to right, ${course.color}30, ${course.color}10)` 
            : "linear-gradient(to right, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.1))"
        }}
      ></div>
    </motion.div>
  )
}