// src/components/video-player.tsx
"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { FastForward, Maximize2, Minimize2, Pause, Play, Rewind, Volume2, VolumeX, Settings, Subtitles, Bookmark, ExternalLink, AlertCircle, SkipBack, SkipForward } from "lucide-react"

interface VideoPlayerProps {
  videoSrc: string
  isPlaying: boolean
  onPlayPause: () => void
  onProgress?: (progress: number) => void
  onTimeUpdate?: (currentTime: number) => void
  onVideoEnd?: () => void
  subtitleContent?: string
  initialPosition?: number
  onNextVideo?: () => void
  onPreviousVideo?: () => void
  onBookmark?: () => void
  autoPlayNext?: boolean
  resetPosition?: boolean
  videoKey?: string
  videoPath?: string // Add the original file path for external player
}

interface SubtitleCue {
  start: number
  end: number
  text: string
}

interface VideoError {
  message: string
  code?: number
  name?: string
  canRetry?: boolean
  canOpenExternally?: boolean
}

export function VideoPlayer({ 
  videoSrc, 
  isPlaying, 
  onPlayPause, 
  onProgress, 
  onTimeUpdate,
  onVideoEnd,
  subtitleContent,
  initialPosition = 0,
  onNextVideo,
  onPreviousVideo,
  onBookmark,
  autoPlayNext = false,
  resetPosition = false,
  videoKey = "",
  videoPath = "" // Add the original file path
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [videoError, setVideoError] = useState<VideoError | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(0.8)
  const [videoState, setVideoState] = useState<string>("Loading...")
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("")
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>([])
  const [playAttemptCount, setPlayAttemptCount] = useState(0)
  const [positionSet, setPositionSet] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [playAfterReady, setPlayAfterReady] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showNextVideoLoading, setShowNextVideoLoading] = useState(false)
  const [nextVideoCountdown, setNextVideoCountdown] = useState(5)
  const [videoFormat, setVideoFormat] = useState<string>("")
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  const playTimeoutRef = useRef<NodeJS.Timeout>()
  const previousVideoSrcRef = useRef<string>("")
  const previousVideoKeyRef = useRef<string>("")
  const countdownIntervalRef = useRef<NodeJS.Timeout>()
  const savedPositionRef = useRef<number>(0)
  const countdownValueRef = useRef<number>(5) // Use a ref to track countdown value

  // Debug logging
  useEffect(() => {
    console.log("VideoPlayer - videoSrc:", videoSrc)
    console.log("VideoPlayer - videoKey:", videoKey)
    console.log("VideoPlayer - videoPath:", videoPath)
    console.log("VideoPlayer - subtitleContent length:", subtitleContent?.length || 0)
    console.log("VideoPlayer - isPlaying:", isPlaying)
    console.log("VideoPlayer - initialPosition:", initialPosition)
    console.log("VideoPlayer - resetPosition:", resetPosition)
  }, [videoSrc, videoKey, videoPath, subtitleContent, isPlaying, initialPosition, resetPosition])

  // Analyze video format
  const analyzeVideoFormat = useCallback(async () => {
    if (!videoPath || !window.electron) return
    
    setIsAnalyzingVideo(true)
    
    try {
      // Get file extension
      const extension = videoPath.split('.').pop()?.toLowerCase() || ''
      setVideoFormat(extension)
      
      // Check if the format is commonly supported
      const supportedFormats = ['mp4', 'webm', 'ogg', 'mov']
      const isCommonlySupported = supportedFormats.includes(extension)
      
      console.log(`Video format: ${extension}, commonly supported: ${isCommonlySupported}`)
      
      // If it's an MP4, we can try to analyze it further
      if (extension === 'mp4') {
        // In a real implementation, you might want to use a library like ffmpeg.js
        // to analyze the video codec. For now, we'll just check the file size
        // as a very rough indicator of potential issues
        const stats = await window.electron.getFileStats(videoPath)
        if (stats && stats.size > 500 * 1024 * 1024) { // 500MB
          console.log("Large video file detected, might have compatibility issues")
        }
      }
    } catch (error) {
      console.error("Error analyzing video format:", error)
    } finally {
      setIsAnalyzingVideo(false)
    }
  }, [videoPath])

  // A more robust VTT parser
  const parseVTT = (text: string): SubtitleCue[] => {
    const cues: SubtitleCue[] = []
    const lines = text.split('\n')
    let i = 0

    // Skip WEBVTT header
    while (i < lines.length && !lines[i].includes('-->')) {
      i++
    }

    while (i < lines.length) {
      const timeLine = lines[i]
      const timeMatch = timeLine.match(/(\d{2}:)?(\d{2}:\d{2})\.(\d{3})\s*-->\s*(\d{2}:)?(\d{2}:\d{2})\.(\d{3})/)
      if (timeMatch) {
        const parseTime = (timeStr: string) => {
          const parts = timeStr.split(':').map(Number)
          if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
          }
          return parts[0] * 60 + parts[1]
        }
        
        const start = parseTime(timeMatch[2]) + Number.parseFloat(`0.${timeMatch[3]}`)
        const end = parseTime(timeMatch[5]) + Number.parseFloat(`0.${timeMatch[6]}`)
        
        let textLines = []
        i++
        while (i < lines.length && lines[i].trim() !== '') {
          textLines.push(lines[i].trim())
          i++
        }

        cues.push({ start, end, text: textLines.join(' ') })
      }
      i++
    }
    return cues
  }

  // A more robust SRT parser
  const parseSRT = (text: string): SubtitleCue[] => {
    const cues: SubtitleCue[] = []
    const blocks = text.replace(/\r\n/g, '\n').split('\n\n')

    for (const block of blocks) {
      const lines = block.split('\n')
      if (lines.length > 1) {
        const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/)
        if (timeMatch) {
          const parseTime = (h: string, m: string, s: string, ms: string) =>
            Number.parseInt(h) * 3600 + Number.parseInt(m) * 60 + Number.parseInt(s) + Number.parseInt(ms) / 1000

          const start = parseTime(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4])
          const end = parseTime(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8])
          const text = lines.slice(2).join(' ')

          cues.push({ start, end, text })
        }
      }
    }
    return cues
  }

  // Parse subtitle content
  useEffect(() => {
    if (!subtitleContent || !subtitlesEnabled) {
      setSubtitles([])
      return
    }

    try {
      const isVTT = subtitleContent.includes('WEBVTT') || 
                    (subtitleContent.includes('-->') && subtitleContent.includes('.'))
      
      const isSRT = /^\d+\s*\n\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/m.test(subtitleContent)
      
      let parsedSubtitles: SubtitleCue[] = []
      
      if (isVTT) {
        parsedSubtitles = parseVTT(subtitleContent)
      } else if (isSRT) {
        parsedSubtitles = parseSRT(subtitleContent)
      }
      
      setSubtitles(parsedSubtitles)
      console.log("Parsed subtitles:", parsedSubtitles.length, "cues")
    } catch (error) {
      console.error("Error parsing subtitles:", error)
      setSubtitles([])
    }
  }, [subtitleContent, subtitlesEnabled])

  // Reset state when video source or key changes
  useEffect(() => {
    if (previousVideoSrcRef.current !== videoSrc || previousVideoKeyRef.current !== videoKey) {
      console.log("Video source or key changed, resetting state")
      
      // Save current position before switching if video was initialized
      if (videoRef.current && isInitialized && !resetPosition) {
        savedPositionRef.current = videoRef.current.currentTime
        console.log("Saved current position:", savedPositionRef.current)
      }
      
      setIsVideoReady(false)
      setPlayAfterReady(false)
      setPositionSet(false)
      setIsInitialized(false)
      setVideoError(null)
      setVideoState("Loading...")
      setProgress(0)
      setCurrentTime(0)
      setDuration(0)
      setShowNextVideoLoading(false)
      setNextVideoCountdown(5)
      countdownValueRef.current = 5
      
      // Clear any existing countdown interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = undefined
      }
      
      previousVideoSrcRef.current = videoSrc
      previousVideoKeyRef.current = videoKey
      
      // Analyze video format when source changes
      analyzeVideoFormat()
    }
  }, [videoSrc, videoKey, resetPosition, isInitialized, analyzeVideoFormat]);

  // Set initial video position
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoSrc || positionSet || !isInitialized) return

    const handleLoadedMetadata = () => {
      // Determine the position to use
      let position = 0
      
      if (resetPosition) {
        position = 0
        console.log("Using position 0 (resetPosition is true)")
      } else if (initialPosition > 0) {
        position = initialPosition
        console.log("Using initialPosition:", position)
      } else if (savedPositionRef.current > 0) {
        position = savedPositionRef.current
        console.log("Using saved position:", position)
      }
      
      console.log("Setting video position to:", position)
      video.currentTime = position
      setPositionSet(true)
    }

    // If metadata is already loaded, set position immediately
    if (video.readyState >= 1) {
      let position = 0
      
      if (resetPosition) {
        position = 0
      } else if (initialPosition > 0) {
        position = initialPosition
      } else if (savedPositionRef.current > 0) {
        position = savedPositionRef.current
      }
      
      console.log("Setting video position to:", position)
      video.currentTime = position
      setPositionSet(true)
    } else {
      video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true })
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }
  }, [initialPosition, positionSet, videoSrc, isInitialized, resetPosition])

  // Find current subtitle
  const findCurrentSubtitle = useCallback(() => {
    if (!subtitles.length || !subtitlesEnabled) {
      setCurrentSubtitle("")
      return
    }
    
    for (const cue of subtitles) {
      if (currentTime >= cue.start && currentTime <= cue.end) {
        setCurrentSubtitle(cue.text)
        return
      }
    }
    
    setCurrentSubtitle("")
  }, [subtitles, subtitlesEnabled, currentTime]);

  // Handle play/pause with retry logic
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoSrc) return

    console.log("VideoPlayer - Play/pause effect triggered, isPlaying:", isPlaying, "isVideoReady:", isVideoReady)

    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current)
    }

    if (isPlaying && isVideoReady) {
      playTimeoutRef.current = setTimeout(() => {
        video.play().catch((error) => {
          console.error("VideoPlayer - Play error:", error)
          
          if (error.name === "NotAllowedError" && playAttemptCount < 3) {
            console.log(`VideoPlayer - Retrying play attempt ${playAttemptCount + 1}`)
            setPlayAttemptCount(prev => prev + 1)
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.play().catch(e => {
                  console.error("VideoPlayer - Retry failed:", e)
                  setVideoError({
                    message: `Failed to play: ${e.message}`,
                    name: e.name,
                    canRetry: true,
                    canOpenExternally: true
                  })
                  onPlayPause()
                })
              }
            }, 1000)
          } else {
            setVideoError({
              message: `Failed to play: ${error.message}`,
              name: error.name,
              canRetry: true,
              canOpenExternally: true
            })
            onPlayPause()
          }
        })
      }, 100)
    } else if (isPlaying && !isVideoReady) {
      setPlayAfterReady(true)
    } else {
      video.pause()
      setPlayAttemptCount(0)
      setPlayAfterReady(false)
    }
  }, [isPlaying, isVideoReady, onPlayPause, playAttemptCount, videoSrc])

  // Add this new useEffect to handle playing after video is ready
  useEffect(() => {
    if (isVideoReady && playAfterReady && videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error("VideoPlayer - Play after ready error:", error)
        setVideoError({
          message: `Failed to play: ${error.message}`,
          name: error.name,
          canRetry: true,
          canOpenExternally: true
        })
        onPlayPause()
      })
      setPlayAfterReady(false)
    }
  }, [isVideoReady, playAfterReady, onPlayPause])

  // Handle playback speed
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = playbackSpeed
  }, [playbackSpeed])

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && 
          !document.activeElement?.closest('#video-player-container')) return
      
      switch(e.key) {
        case 'f':
        case 'F':
          e.preventDefault()
          handleFullscreen()
          break
        case '+':
        case '=':
          e.preventDefault()
          handleVolumeIncrease()
          break
        case '-':
        case '_':
          e.preventDefault()
          handleVolumeDecrease()
          break
        case '{':
          e.preventDefault()
          handleSpeedDecrease()
          break
        case '}':
          e.preventDefault()
          handleSpeedIncrease()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (e.shiftKey && onPreviousVideo) {
            onPreviousVideo()
          } else {
            handleRewind()
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (e.shiftKey && onNextVideo) {
            onNextVideo()
          } else {
            handleFastForward()
          }
          break
        case ' ':
          e.preventDefault()
          onPlayPause()
          break
        case 'b':
        case 'B':
          e.preventDefault()
          if (onBookmark) {
            onBookmark()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onPlayPause, onNextVideo, onPreviousVideo, onBookmark])

  // Handle video events
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadStart = () => {
      console.log("VideoPlayer - Load start")
      setVideoState("Loading...")
      setVideoError(null)
      setIsVideoReady(false)
    }

    const handleLoadedData = () => {
      console.log("VideoPlayer - Loaded data")
      setVideoState("Loaded")
      setIsVideoReady(false)
    }

    const handleCanPlay = () => {
      console.log("VideoPlayer - Can play")
      setVideoState("Ready to play")
      setIsVideoReady(true)
      setIsInitialized(true)
    }

    const handleTimeUpdate = () => {
      const currentProgress = video.duration > 0 ? video.currentTime / video.duration : 0
      setProgress(currentProgress)
      setCurrentTime(video.currentTime)
      
      findCurrentSubtitle()

      if (onProgress) {
        onProgress(currentProgress)
      }
      
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime)
      }
    }

    const handleLoadedMetadata = () => {
      console.log("VideoPlayer - Loaded metadata")
      setDuration(video.duration)
      setIsVideoReady(false)
      
      if (!positionSet) {
        let position = 0
        
        if (resetPosition) {
          position = 0
        } else if (initialPosition > 0) {
          position = initialPosition
        } else if (savedPositionRef.current > 0) {
          position = savedPositionRef.current
        }
        
        console.log("Setting video position to:", position)
        video.currentTime = position
        setPositionSet(true)
      }
    }

    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement
      console.error("VideoPlayer - Video error:", target.error)
      
      // Determine the type of error and provide appropriate options
      let errorMessage = target.error?.message || "Unknown video error"
      let canRetry = true
      let canOpenExternally = true
      
      // Check for specific error types
      if (target.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        errorMessage = "This video format is not supported by the built-in player. The video may use an unsupported codec or have an incompatible container format."
        canRetry = false
        canOpenExternally = true
      } else if (target.error?.code === MediaError.MEDIA_ERR_DECODE) {
        errorMessage = "The video could not be decoded, possibly due to a corrupted file or unsupported codec."
        canRetry = true
        canOpenExternally = true
      }
      
      setVideoError({
        message: errorMessage,
        code: target.error?.code,
        name: target.error?.name,
        canRetry,
        canOpenExternally
      })
      setVideoState("Error")
      setIsVideoReady(false)
    }

    const handleStalled = () => {
      console.log("VideoPlayer - Stalled")
      setVideoState("Stalled")
    }

    const handleWaiting = () => {
      console.log("VideoPlayer - Waiting")
      setVideoState("Buffering...")
    }

    const handlePlaying = () => {
      console.log("VideoPlayer - Playing")
      setVideoState("Playing")
      setPlayAttemptCount(0)
    }

    const handlePause = () => {
      console.log("VideoPlayer - Paused")
      setVideoState("Paused")
    }

    // New handler for video end
    const handleEnded = () => {
      console.log("VideoPlayer - Video ended")
      setVideoState("Ended")
      
      if (autoPlayNext && onNextVideo) {
        setShowNextVideoLoading(true)
        setNextVideoCountdown(5)
        countdownValueRef.current = 5
        
        console.log("Starting countdown for next video")
        
        // Clear any existing interval
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
        }
        
        // Start countdown
        countdownIntervalRef.current = setInterval(() => {
          countdownValueRef.current -= 1
          console.log("Countdown:", countdownValueRef.current)
          setNextVideoCountdown(countdownValueRef.current)
          
          if (countdownValueRef.current <= 0) {
            // Clear interval and play next video
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current)
              countdownIntervalRef.current = undefined
            }
            console.log("Countdown finished, playing next video")
            onNextVideo()
            countdownValueRef.current = 5
            setNextVideoCountdown(5)
          }
        }, 1000)
      } else {
        if (onVideoEnd) {
          onVideoEnd()
        }
      }
    }

    // Add all event listeners
    video.addEventListener("loadstart", handleLoadStart)
    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("error", handleError)
    video.addEventListener("stalled", handleStalled)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("playing", handlePlaying)
    video.addEventListener("pause", handlePause)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("loadstart", handleLoadStart)
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("error", handleError)
      video.removeEventListener("stalled", handleStalled)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("playing", handlePlaying)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("ended", handleEnded)
      
      // Clear countdown interval if component unmounts
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = undefined
      }
    }
  }, [onProgress, onTimeUpdate, initialPosition, positionSet, videoSrc, findCurrentSubtitle, autoPlayNext, onNextVideo, onVideoEnd, resetPosition])

  // Handle click outside to close settings
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle controls visibility
  const showControlsTemporarily = () => {
    setShowControls(true)
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 2000)
  }

  // Handle mouse movement
  const handleMouseMove = () => {
    showControlsTemporarily()
  }

  // Handle fullscreen
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Handle volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseFloat(e.target.value)
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    setPreviousVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }

  const handleVolumeIncrease = () => {
    const newVolume = Math.min(1, volume + 0.1)
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    setPreviousVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }

  const handleVolumeDecrease = () => {
    const newVolume = Math.max(0, volume - 0.1)
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    setPreviousVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume)
      setIsMuted(false)
      if (videoRef.current) {
        videoRef.current.volume = previousVolume
      }
    } else {
      setPreviousVolume(volume)
      setVolume(0)
      setIsMuted(true)
      if (videoRef.current) {
        videoRef.current.volume = 0
      }
    }
  }

  // Handle progress
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number.parseFloat(e.target.value)
    setProgress(newProgress)
    if (videoRef.current) {
      videoRef.current.currentTime = newProgress * videoRef.current.duration
    }
  }

  // Handle playback speed
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
    setShowSettings(false)
  }

  const handleSpeedIncrease = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const currentIndex = speeds.findIndex(s => s >= playbackSpeed)
    const nextIndex = Math.min(currentIndex + 1, speeds.length - 1)
    setPlaybackSpeed(speeds[nextIndex])
  }

  const handleSpeedDecrease = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const currentIndex = speeds.findIndex(s => s >= playbackSpeed)
    const prevIndex = Math.max(0, currentIndex - 1)
    setPlaybackSpeed(speeds[prevIndex])
  }

  // Toggle subtitles
  const toggleSubtitles = () => {
    setSubtitlesEnabled(!subtitlesEnabled)
  }

  // Handle skip buttons
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

  // Initialize controls visibility
  useEffect(() => {
    showControlsTemporarily()
  }, [isPlaying])

  // Retry loading video
  const handleRetry = () => {
    setVideoError(null)
    setVideoState("Loading...")
    setPlayAttemptCount(0)
    setPositionSet(false)
    setIsVideoReady(false)
    setIsInitialized(false)
    if (videoRef.current) {
      videoRef.current.load()
    }
  }

  // Open video in external player
  const handleOpenExternally = async () => {
    if (!videoPath || !window.electron) return
    
    try {
      await window.electron.openExternal(videoPath)
    } catch (error) {
      console.error("Error opening video externally:", error)
      setVideoError({
        message: `Failed to open video externally: ${error}`,
        canRetry: true,
        canOpenExternally: true
      })
    }
  }

  // Cancel auto-play next video
  const handleCancelAutoPlay = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = undefined
    }
    setShowNextVideoLoading(false)
    setNextVideoCountdown(5)
    countdownValueRef.current = 5
  }

  // Format time for display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div
      ref={containerRef}
      id="video-player-container"
      className="relative w-full h-full bg-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false)
        }
      }}
      tabIndex={0}
    >
      {videoError ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-white p-8">
          <div className="text-xl mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-500" />
            Unable to play video
          </div>
          <div className="text-sm text-gray-400 mb-4 text-center">{videoError.message}</div>
          
          {videoFormat && (
            <div className="text-xs text-gray-500 mb-4 text-center">
              Detected format: {videoFormat.toUpperCase()}
            </div>
          )}
          
          <div className="text-xs text-gray-500 mb-6 text-center max-w-md">
            Video URL: {videoSrc}
          </div>
          
          <div className="flex gap-4">
            {videoError.canRetry && (
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Retry
              </button>
            )}
            
            {videoError.canOpenExternally && (
              <button
                onClick={handleOpenExternally}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open in External Player
              </button>
            )}
          </div>
          
          <div className="mt-6 text-xs text-gray-500 max-w-md text-center">
            <p className="mb-2">Tips for resolving video playback issues:</p>
            <ul className="text-left space-y-1">
              <li>• Try opening the video in an external player like VLC or MPV</li>
              <li>• Convert the video to a more compatible format (H.264 MP4)</li>
              <li>• Check if the video file is corrupted</li>
              <li>• Some high-resolution or high-bitrate videos may not play well in Electron</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full">
          {videoSrc ? (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              src={videoSrc}
              playsInline
              onClick={onPlayPause}
              onEnded={onVideoEnd}
              crossOrigin="anonymous"
              preload="metadata"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <div className="text-xl mb-4">No video source</div>
                <div className="text-sm text-gray-400">Please select a video to play</div>
              </div>
            </div>
          )}
          
          {/* Subtitles */}
          {subtitlesEnabled && currentSubtitle && (
            <div className="absolute bottom-20 left-0 right-0 text-center px-4">
              <div className="inline-block bg-black/70 text-white px-3 py-1 rounded text-sm max-w-full">
                {currentSubtitle}
              </div>
            </div>
          )}
          
          {/* Buffering indicator */}
          {videoState === "Buffering..." && (
            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
              Buffering...
            </div>
          )}
          
          {/* Format warning */}
          {videoFormat && !['mp4', 'webm'].includes(videoFormat) && (
            <div className="absolute top-4 left-4 bg-yellow-500/80 text-black px-3 py-1 rounded text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {videoFormat.toUpperCase()} format may have compatibility issues
            </div>
          )}
          
          {/* Next Video Loading Screen */}
          {showNextVideoLoading && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
              <div className="text-white text-2xl mb-4">Next video starting in</div>
              <div className="text-white text-6xl font-bold mb-6">{nextVideoCountdown}</div>
              <button
                onClick={handleCancelAutoPlay}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Debug info overlay (only in development) */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute top-4 left-4 bg-black/50 text-white text-xs p-2 rounded">
          State: {videoState} | Duration: {formatTime(duration)} | Format: {videoFormat || "Unknown"}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-4 pointer-events-none"
      >
        {/* Top controls */}
        <div className="flex items-center justify-between pointer-events-auto">
          <div></div>
          <div className="flex items-center gap-2">
            {/* Bookmark button */}
            {onBookmark && (
              <button
                onClick={onBookmark}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Add bookmark (B)"
              >
                <Bookmark className="w-5 h-5 text-white" />
              </button>
            )}
            
            {/* Settings button */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>
              
              {showSettings && (
                <div 
                  ref={settingsRef}
                  className="absolute right-0 top-12 bg-gray-800 rounded-lg shadow-lg p-4 w-64 z-50"
                >
                  <h3 className="text-white font-medium mb-3">Settings</h3>
                  
                  {/* Playback Speed */}
                  <div className="mb-4">
                    <label className="text-gray-300 text-sm mb-2 block">Playback Speed</label>
                    <div className="flex flex-wrap gap-2">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`px-3 py-1 rounded text-sm ${
                            playbackSpeed === speed
                              ? "bg-purple-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Subtitles Toggle */}
                  <div>
                    <button
                      onClick={toggleSubtitles}
                      className={`flex items-center gap-2 px-3 py-2 rounded text-sm w-full ${
                        subtitlesEnabled
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      <Subtitles className="w-4 h-4" />
                      {subtitlesEnabled ? "Subtitles On" : "Subtitles Off"}
                    </button>
                  </div>
                  
                  {/* Open Externally Button */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <button
                      onClick={handleOpenExternally}
                      className="flex items-center gap-2 px-3 py-2 rounded text-sm w-full bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in External Player
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Fullscreen button - Only show when not in fullscreen */}
            {!isFullscreen && (
              <button
                onClick={handleFullscreen}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Enter fullscreen (F)"
              >
                <Maximize2 className="w-5 h-5 text-white" />
              </button>
            )}
            
            {/* Mini player button (only in fullscreen) */}
            {isFullscreen && (
              <button
                onClick={() => {
                  document.exitFullscreen()
                }}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Exit fullscreen (F)"
              >
                <Minimize2 className="w-5 h-5 text-white" />
              </button>
            )}
            
            {/* Volume control */}
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
              <button onClick={toggleMute} className="text-white">
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <div className="relative w-20 h-1">
                <div className="absolute inset-0 bg-gray-600 rounded-full"></div>
                <div 
                  className="absolute top-0 left-0 h-full bg-white rounded-full"
                  style={{ width: `${volume * 100}%` }}
                ></div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center play/pause button */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onPlayPause}
            className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
          </motion.button>
        </div>

        {/* Bottom controls */}
        <div className="space-y-2 pointer-events-auto">
          {/* Progress bar */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={progress}
              onChange={handleProgressChange}
              className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${progress * 100}%, #4B5563 ${progress * 100}%, #4B5563 100%)`
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRewind}
                className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Rewind 10 seconds (←)"
              >
                <Rewind className="w-4 h-4 text-white" />
              </button>

              {onPreviousVideo && (
                <button
                  onClick={onPreviousVideo}
                  className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="Previous video (Shift+←)"
                >
                  <SkipBack className="w-4 h-4 text-white" />
                </button>
              )}

              <button
                onClick={onPlayPause}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              >
                {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
              </button>

              {onNextVideo && (
                <button
                  onClick={onNextVideo}
                  className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="Next video (Shift+→)"
                >
                  <SkipForward className="w-4 h-4 text-white" />
                </button>
              )}
            </div>

            <button
              onClick={handleFastForward}
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
              title="Forward 10 seconds (→)"
            >
              <FastForward className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Add styles for the slider */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            cursor: pointer;
          }
          
          .slider::-moz-range-thumb {
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            cursor: pointer;
            border: none;
          }
        `
      }} />
    </div>
  )
}