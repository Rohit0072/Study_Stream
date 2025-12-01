    "use client"
    
    import { useState } from "react"
    import { motion } from "framer-motion"
    import { Folder, MoreVertical, Play, Trash } from "lucide-react"
    
    import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
    
    interface CourseCardProps {
      course: {
        name: string
        videos: {
          name: string
          duration: string
          progress: number
        }[]
      }
      index: number
      onClick: () => void
      onDelete: () => void
    }
    
    export function CourseCard({ course, index, onClick, onDelete }: CourseCardProps) {
      const [isHovered, setIsHovered] = useState(false)
    
      // Calculate total videos and total duration
      const totalVideos = course.videos.length
      const totalDuration = course.videos.reduce((acc, video) => {
        const [mins, secs] = video.duration.split(":").map(Number)
        return acc + mins * 60 + secs
      }, 0)
    
      // Format total duration
      const hours = Math.floor(totalDuration / 3600)
      const minutes = Math.floor((totalDuration % 3600) / 60)
      const formattedDuration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    
      // Calculate progress
      const totalProgress = course.videos.reduce((acc, video) => acc + video.progress, 0)
      const averageProgress = totalVideos > 0 ? totalProgress / totalVideos : 0
    
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{
            y: -5,
            transition: { duration: 0.2 },
          }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="relative group cursor-pointer"
        >
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-xl h-64">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    
            {/* Card content */}
            <div className="p-6 h-full flex flex-col" onClick={onClick}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Folder className="w-6 h-6 text-white" />
                </div>
    
                {/* The dropdown menu is now outside the clickable area */}
              </div>
    
              <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{course.name}</h3>
    
              <div className="text-sm text-gray-400 mb-4">
                <span>{totalVideos} videos</span>
                <span className="mx-2">•</span>
                <span>{formattedDuration}</span>
              </div>
    
              {/* Progress bar */}
              <div className="mt-auto">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(averageProgress * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    style={{ width: `${averageProgress * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
    
            {/* Hover overlay */}
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
                className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center"
              >
                <Play className="w-8 h-8 text-white" />
              </motion.div>
            </motion.div>
    
            {/* Three-dot menu positioned outside the hover overlay */}
            <div className="absolute top-6 right-6 z-10" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-gray-400 hover:text-white focus:outline-none bg-gray-800/80 hover:bg-gray-700 rounded-full p-1">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onDelete}>
                    <Trash className="w-4 h-4 mr-2" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
    
          {/* Card border glow effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-300 -z-10"></div>
        </motion.div>
      )
    }
