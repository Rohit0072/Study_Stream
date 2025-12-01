    "use client"
    
    import { useEffect, useRef, useState } from "react"
    import { motion } from "framer-motion"
    import { FastForward, Pause, Play, Rewind, Volume2 } from "lucide-react"
    
    import { Slider } from "@/components/ui/slider"
    
    interface VideoPlayerProps {
      videoSrc: string
      isPlaying: boolean
      onPlayPause: () => void
    }
    
    export function VideoPlayer({ videoSrc, isPlaying, onPlayPause }: VideoPlayerProps) {
      const videoRef = useRef<HTMLVideoElement>(null)
      const [progress, setProgress] = useState(0)
      const [volume, setVolume] = useState(0.8)
      const [currentTime, setCurrentTime] = useState("0:00")
      const [duration, setDuration] = useState("0:00")
      const [showControls, setShowControls] = useState(true)
      const [videoError, setVideoError] = useState(false)
      const [isDemoMode, setIsDemoMode] = useState(false)
    
      useEffect(() => {
        // Check if we're in demo mode
        const folderPath = localStorage.getItem("selectedFolderPath")
        if (folderPath === "Demo Courses") {
          setIsDemoMode(true)
          setVideoError(true)
        }
      }, [])
    
      useEffect(() => {
        const video = videoRef.current
        if (!video) return
    
        if (isPlaying) {
          video.play().catch((error) => {
            // Autoplay was prevented or other error
            console.error("Video play error:", error)
            onPlayPause()
          })
        } else {
          video.pause()
        }
      }, [isPlaying, onPlayPause])
    
      useEffect(() => {
        const video = videoRef.current
        if (!video) return
    
        const handleTimeUpdate = () => {
          const currentProgress = video.currentTime / video.duration
          setProgress(isNaN(currentProgress) ? 0 : currentProgress)
    
          // Format current time
          const minutes = Math.floor(video.currentTime / 60)
          const seconds = Math.floor(video.currentTime % 60)
          setCurrentTime(`${minutes}:${seconds.toString().padStart(2, "0")}`)
        }
    
        const handleLoadedMetadata = () => {
          // Format duration
          const minutes = Math.floor(video.duration / 60)
          const seconds = Math.floor(video.duration % 60)
          setDuration(`${minutes}:${seconds.toString().padStart(2, "0")}`)
        }
    
        const handleError = () => {
          setVideoError(true)
          console.error("Video error:", video.error)
        }
    
        video.addEventListener("timeupdate", handleTimeUpdate)
        video.addEventListener("loadedmetadata", handleLoadedMetadata)
        video.addEventListener("error", handleError)
    
        // Hide controls after 3 seconds of inactivity
        let timeout: NodeJS.Timeout
        const handleMouseMove = () => {
          setShowControls(true)
          clearTimeout(timeout)
          timeout = setTimeout(() => {
            if (isPlaying) {
              setShowControls(false)
            }
          }, 3000)
        }
    
        const playerElement = document.getElementById("video-player-container")
        if (playerElement) {
          playerElement.addEventListener("mousemove", handleMouseMove)
        }
    
        return () => {
          video.removeEventListener("timeupdate", handleTimeUpdate)
          video.removeEventListener("loadedmetadata", handleLoadedMetadata)
          video.removeEventListener("error", handleError)
          if (playerElement) {
            playerElement.removeEventListener("mousemove", handleMouseMove)
          }
          clearTimeout(timeout)
        }
      }, [isPlaying])
    
      const handleVolumeChange = (value: number[]) => {
        const newVolume = value[0]
        setVolume(newVolume)
        if (videoRef.current) {
          videoRef.current.volume = newVolume
        }
      }
    
      const handleProgressChange = (value: number[]) => {
        const newProgress = value[0]
        setProgress(newProgress)
        if (videoRef.current) {
          videoRef.current.currentTime = newProgress * videoRef.current.duration
        }
      }
    
      const handleRewind = () => {
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
        }
      }
    
      const handleFastForward = () => {
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10)
        }
      }
    
      return (
        <div
          id="video-player-container"
          className="relative w-full h-full bg-black"
          onMouseEnter={() => setShowControls(true)}
        >
          {/* Video element */}
          {videoError ? (
            <div className="w-full h-full flex items-center justify-center flex-col text-white">
              <div className="text-xl mb-2">Unable to play video</div>
              {isDemoMode ? (
                <div className="text-sm text-gray-400 text-center max-w-md px-4">
                  <p className="mb-2">This is a demo mode. In a real application, videos would play here.</p>
                  <p>The app is currently running in a preview environment where file system access is restricted.</p>
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  <p className="mb-2">The video file may not be accessible or supported by your browser.</p>
                  <p>
                    Due to browser security restrictions, local video files cannot be directly played.
                    <br />
                    This app would require Electron or a similar framework for full file system access.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <video ref={videoRef} className="w-full h-full object-contain" src={videoSrc} playsInline>
              Your browser does not support the video tag.
            </video>
          )}
    
          {/* Video controls overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showControls ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-4"
          >
            {/* Top controls */}
            <div className="flex items-center justify-between">
              <div></div>
              <div className="flex items-center">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
                  <Volume2 className="w-4 h-4 text-white" />
                  <div className="w-20">
                    <Slider
                      value={[volume]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                      className="[&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-white [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
    
            {/* Center play/pause button */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onPlayPause}
                className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
              >
                {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
              </motion.button>
            </div>
    
            {/* Bottom controls */}
            <div className="space-y-2">
              {/* Progress bar */}
              <Slider
                value={[progress]}
                min={0}
                max={1}
                step={0.001}
                onValueChange={handleProgressChange}
                className="[&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-white [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-gradient-to-r [&>span:first-child_span]:from-purple-500 [&>span:first-child_span]:to-blue-500"
              />
    
              {/* Time and controls */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-white">
                  {currentTime} / {duration}
                </div>
    
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRewind}
                    className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20"
                  >
                    <Rewind className="w-4 h-4 text-white" />
                  </button>
    
                  <button
                    onClick={onPlayPause}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                  </button>
    
                  <button
                    onClick={handleFastForward}
                    className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20"
                  >
                    <FastForward className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )
    }
