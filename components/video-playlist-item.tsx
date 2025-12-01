    "use client"
    
    import { motion } from "framer-motion"
    import { Play } from "lucide-react"
    
    interface VideoPlaylistItemProps {
      video: {
        name: string
        duration: string
        progress: number
      }
      index: number
      isActive: boolean
      onClick: () => void
    }
    
    export function VideoPlaylistItem({ video, index, isActive, onClick }: VideoPlaylistItemProps) {
      return (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          onClick={onClick}
          className={`relative px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
            isActive
              ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white"
              : "hover:bg-gray-700/50 text-gray-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isActive ? "bg-gradient-to-r from-purple-500 to-blue-500" : "bg-gray-700"
              }`}
            >
              <Play className="w-4 h-4 text-white" />
            </div>
    
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-gray-300"}`}>{video.name}</p>
                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{video.duration}</span>
              </div>
    
              {/* Progress indicator */}
              {video.progress > 0 && (
                <div className="w-full h-1 bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    style={{ width: `${video.progress * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
    
          {/* Active indicator */}
          {isActive && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-500 to-blue-500 rounded-r-full"
            />
          )}
        </motion.div>
      )
    }
