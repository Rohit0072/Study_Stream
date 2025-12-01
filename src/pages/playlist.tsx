// src/pages/playlist.tsx
"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Bookmark, Download, FileText, Maximize2, Minimize2, Pause, Play, X, Volume2, VolumeX, Brain } from "lucide-react"
import { useApp } from "../context/app-context"
import { VideoPlayer } from "../components/video-player"
import { VideoPlaylistItem } from "../components/video-playlist-item"
import { NotesPanel } from "../components/notes-panel"
import { AIChallenge } from "../components/ai-challenge"
import { BookmarkModal } from "../components/bookmark-modal"

function PlaylistPage() {
  const navigate = useNavigate()
  const { course } = useParams<{ course: string }>()
  const courseName = course ? decodeURIComponent(course) : ""

  const { 
    courses, 
    saveVideoProgress, 
    getVideoProgress, 
    saveNotes, 
    loadNotes,
    saveVideoPosition,
    getVideoPosition,
    isElectron,
    addStudySession,
    addBookmark,
    userProfile
  } = useApp()

  const [currentCourse, setCurrentCourse] = useState<any>(null)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showNotes, setShowNotes] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [videoUrl, setVideoUrl] = useState("")
  const [subtitleContent, setSubtitleContent] = useState("")
  const [videoLoading, setVideoLoading] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [videoPosition, setVideoPosition] = useState(0)
  const [lastWatchedVideo, setLastWatchedVideo] = useState<{sectionIndex: number, videoIndex: number} | null>(null)
  const [currentVideoPath, setCurrentVideoPath] = useState("")
  const [showChallenge, setShowChallenge] = useState(false)
  const [challengeVideo, setChallengeVideo] = useState<{courseName: string; sectionName: string; videoName: string; subtitleContent: string} | null>(null)
  const [studyStartTime, setStudyStartTime] = useState<number | null>(null)
  const [isNavigatingAway, setIsNavigatingAway] = useState(false)
  const [totalWatchTime, setTotalWatchTime] = useState(0)
  const [lastProgressSaveTime, setLastProgressSaveTime] = useState(0)
  const [isCourseLoading, setIsCourseLoading] = useState(true)
  const [courseError, setCourseError] = useState<string | null>(null)
  const [showBookmarkModal, setShowBookmarkModal] = useState(false)
  const [resetVideoPosition, setResetVideoPosition] = useState(false)
  const [videoPositions, setVideoPositions] = useState<Record<string, number>>({})

  const videoContainerRef = useRef<HTMLDivElement>(null)
  const positionSaveIntervalRef = useRef<NodeJS.Timeout>()
  const studySessionIntervalRef = useRef<NodeJS.Timeout>()
  const isChangingVideoRef = useRef(false)

  // Helper function to get directory path from file path (browser-compatible)
  const getDirname = (filePath: string) => {
    return filePath.substring(0, filePath.lastIndexOf('/'))
  }

  // Helper function to get basename without extension (browser-compatible)
  const getBasenameWithoutExt = (filePath: string) => {
    const filename = filePath.substring(filePath.lastIndexOf('/') + 1)
    const lastDotIndex = filename.lastIndexOf('.')
    if (lastDotIndex > 0) {
      return filename.substring(0, lastDotIndex)
    }
    return filename
  }

  // Save video position periodically
  useEffect(() => {
    if (isPlaying && currentCourse && videoPosition > 0 && !isNavigatingAway) {
      positionSaveIntervalRef.current = setInterval(() => {
        const currentSection = currentCourse.sections[currentSectionIndex]
        const currentVideo = currentSection.videos[currentVideoIndex]
        const videoKey = `${courseName}_${currentVideo.name}`
        
        // Update position in our state
        setVideoPositions(prev => ({
          ...prev,
          [videoKey]: videoPosition
        }))
        
        // Save to persistent storage
        if (saveVideoPosition) {
          saveVideoPosition(courseName, currentVideo.name, videoPosition)
        }
      }, 5000)
    } else {
      if (positionSaveIntervalRef.current) {
        clearInterval(positionSaveIntervalRef.current)
      }
    }

    return () => {
      if (positionSaveIntervalRef.current) {
        clearInterval(positionSaveIntervalRef.current)
      }
    }
  }, [isPlaying, videoPosition, currentCourse, currentSectionIndex, currentVideoIndex, courseName, saveVideoPosition, isNavigatingAway])

  // Track study time when video is playing
  useEffect(() => {
    if (isPlaying && studyStartTime) {
      studySessionIntervalRef.current = setInterval(() => {
        setTotalWatchTime(prev => prev + 1)
      }, 1000)
    } else {
      if (studySessionIntervalRef.current) {
        clearInterval(studySessionIntervalRef.current)
      }
    }

    return () => {
      if (studySessionIntervalRef.current) {
        clearInterval(studySessionIntervalRef.current)
      }
    }
  }, [isPlaying, studyStartTime])

  // Save video position when pausing or changing video
  useEffect(() => {
    if (!isPlaying && currentCourse && videoPosition > 0 && saveVideoPosition && !isNavigatingAway) {
      const currentSection = currentCourse.sections[currentSectionIndex]
      const currentVideo = currentSection.videos[currentVideoIndex]
      const videoKey = `${courseName}_${currentVideo.name}`
      
      setVideoPositions(prev => ({
        ...prev,
        [videoKey]: videoPosition
      }))
      
      saveVideoPosition(courseName, currentVideo.name, videoPosition)
    }
  }, [isPlaying, videoPosition, currentCourse, currentSectionIndex, currentVideoIndex, courseName, saveVideoPosition, isNavigatingAway])

  // Save video position when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentCourse && videoPosition > 0 && saveVideoPosition) {
        const currentSection = currentCourse.sections[currentSectionIndex]
        const currentVideo = currentSection.videos[currentVideoIndex]
        const videoKey = `${courseName}_${currentVideo.name}`
        
        setVideoPositions(prev => ({
          ...prev,
          [videoKey]: videoPosition
        }))
        
        saveVideoPosition(courseName, currentVideo.name, videoPosition)
      }
      
      if (studyStartTime && currentCourse && totalWatchTime > 0) {
        const sessionDuration = Math.round(totalWatchTime / 60)
        if (sessionDuration > 0) {
          const currentSection = currentCourse.sections[currentSectionIndex]
          const currentVideo = currentSection.videos[currentVideoIndex]
          
          addStudySession({
            date: new Date().toDateString(),
            courseName: currentCourse.name,
            duration: sessionDuration,
            completedVideos: [currentVideo.name]
          })
        }
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [currentCourse, currentSectionIndex, currentVideoIndex, videoPosition, courseName, saveVideoPosition, studyStartTime, addStudySession, totalWatchTime])

  useEffect(() => {
    setIsCourseLoading(true)
    setCourseError(null)
    
    const foundCourse = courses.find((c) => c.name === courseName)
    if (foundCourse) {
      if (!foundCourse.sections || !Array.isArray(foundCourse.sections)) {
        setCourseError("Invalid course structure: missing sections")
        setIsCourseLoading(false)
        return
      }
      
      const hasValidSections = foundCourse.sections.every(section => 
        section && section.videos && Array.isArray(section.videos) && section.videos.length > 0
      )
      
      if (!hasValidSections) {
        setCourseError("Invalid course structure: sections must contain videos")
        setIsCourseLoading(false)
        return
      }
      
      setCurrentCourse(foundCourse)

      // Load saved positions for all videos in the course
      const loadAllVideoPositions = async () => {
        const positions: Record<string, number> = {}
        
        for (const section of foundCourse.sections) {
          for (const video of section.videos) {
            const videoKey = `${courseName}_${video.name}`
            
            if (getVideoPosition) {
              try {
                const position = await getVideoPosition(courseName, video.name)
                positions[videoKey] = position
              } catch (error) {
                console.error("Error getting video position:", error)
                positions[videoKey] = 0
              }
            } else {
              // Fallback to localStorage
              const position = localStorage.getItem(`position_${courseName}_${video.name}`)
              positions[videoKey] = position ? parseFloat(position) : 0
            }
          }
        }
        
        setVideoPositions(positions)
        console.log("Loaded video positions:", positions)
      }

      // Try to get the last watched video from localStorage
      const lastWatchedSection = localStorage.getItem(`lastWatchedSection_${courseName}`)
      const lastWatchedVideo = localStorage.getItem(`lastWatchedVideo_${courseName}`)
      
      if (lastWatchedSection && lastWatchedVideo) {
        const sectionIdx = Number.parseInt(lastWatchedSection, 10)
        const videoIdx = Number.parseInt(lastWatchedVideo, 10)
        
        if (sectionIdx >= 0 && sectionIdx < foundCourse.sections.length && 
            videoIdx >= 0 && videoIdx < foundCourse.sections[sectionIdx].videos.length) {
          setCurrentSectionIndex(sectionIdx)
          setCurrentVideoIndex(videoIdx)
          setLastWatchedVideo({sectionIndex: sectionIdx, videoIndex: videoIdx})
          
          const newCollapsed: Record<string, boolean> = {}
          foundCourse.sections.forEach((section: any, index: number) => {
            newCollapsed[section.name] = index !== sectionIdx
          })
          setCollapsedSections(newCollapsed)
        } else {
          const newCollapsed: Record<string, boolean> = {}
          foundCourse.sections.forEach((section: any, index: number) => {
            newCollapsed[section.name] = index !== 0
          })
          setCollapsedSections(newCollapsed)
        }
      } else {
        const newCollapsed: Record<string, boolean> = {}
        foundCourse.sections.forEach((section: any, index: number) => {
          newCollapsed[section.name] = index !== 0
        })
        setCollapsedSections(newCollapsed)
      }

      const loadAllNotes = async () => {
        const allNotes: Record<string, string> = {}
        for (const section of foundCourse.sections) {
          for (const video of section.videos) {
            const noteContent = await loadNotes({ courseName, videoName: video.name })
            if (noteContent) {
              allNotes[video.name] = noteContent
            }
          }
        }
        setNotes(allNotes)
      }

      loadAllVideoPositions()
      loadAllNotes()
      setIsCourseLoading(false)
    } else {
      setCourseError("Course not found")
      setIsCourseLoading(false)
    }
  }, [courseName, courses, navigate, loadNotes, getVideoPosition])

  useEffect(() => {
    if (!currentCourse || isCourseLoading) return
    
    if (currentSectionIndex < 0 || currentSectionIndex >= currentCourse.sections.length) {
      console.error("Invalid section index:", currentSectionIndex)
      return
    }
    
    const currentSection = currentCourse.sections[currentSectionIndex]
    
    if (!currentSection || !currentSection.videos || currentVideoIndex < 0 || currentVideoIndex >= currentSection.videos.length) {
      console.error("Invalid video index:", currentVideoIndex)
      return
    }
    
    const video = currentSection.videos[currentVideoIndex]
    
    if (video.path !== currentVideoPath) {
      console.log("Loading video:", video.name, "from path:", video.path)
      setCurrentVideoPath(video.path)
      setVideoLoading(true)
      setSubtitleContent("")
      setIsPlaying(false)
      isChangingVideoRef.current = true
      setTotalWatchTime(0)
      
      // Get the saved position for this video from our state
      const videoKey = `${courseName}_${video.name}`
      const savedPosition = videoPositions[videoKey] || 0
      
      console.log("Got saved position for", video.name, ":", savedPosition)
      setVideoPosition(savedPosition)
      
      if (typeof window !== "undefined" && window.electron) {
        Promise.all([
          window.electron.getVideoFile(video.path),
          window.electron.findSubtitleFiles(video.path)
        ]).then(([videoFilePath, subtitleFiles]) => {
          console.log("Got video URL:", videoFilePath)
          console.log("Found subtitle files:", subtitleFiles)
          
          if (videoFilePath) {
            setVideoUrl(videoFilePath)
          } else {
            console.error("Received empty video URL")
            setVideoUrl("")
          }
          
          if (subtitleFiles.length > 0) {
            const vttFile = subtitleFiles.find(f => f.type === ".vtt") || subtitleFiles[0]
            setSubtitleContent(vttFile.content)
            console.log("Using subtitle file type:", vttFile.type, "with content length:", vttFile.content.length)
          } else {
            console.log("No subtitle files found")
            setSubtitleContent("")
          }
          
          setVideoLoading(false)
          isChangingVideoRef.current = false
        }).catch(error => {
          console.error("Error getting video file:", error)
          setVideoUrl("")
          setSubtitleContent("")
          setVideoLoading(false)
          isChangingVideoRef.current = false
        })
      } else {
        console.log("Not in Electron, using file:// protocol")
        setVideoUrl(`file://${video.path}`)
        setSubtitleContent("")
        setVideoLoading(false)
        isChangingVideoRef.current = false
      }
    }
  }, [currentCourse, currentSectionIndex, currentVideoIndex, courseName, currentVideoPath, videoPositions, isCourseLoading])

  const handleVideoSelect = useCallback((sectionIndex: number, videoIndex: number) => {
    if (isChangingVideoRef.current || isCourseLoading || !currentCourse) return
    
    if (sectionIndex < 0 || sectionIndex >= currentCourse.sections.length ||
        videoIndex < 0 || videoIndex >= currentCourse.sections[sectionIndex].videos.length) {
      console.error("Invalid video selection:", sectionIndex, videoIndex)
      return
    }
    
    // Save current video position before switching
    if (currentCourse && videoPosition > 0 && saveVideoPosition) {
      const currentSection = currentCourse.sections[currentSectionIndex]
      const currentVideo = currentSection.videos[currentVideoIndex]
      const videoKey = `${courseName}_${currentVideo.name}`
      
      setVideoPositions(prev => ({
        ...prev,
        [videoKey]: videoPosition
      }))
      
      saveVideoPosition(courseName, currentVideo.name, videoPosition)
    }
    
    // Save study session for current video before switching
    if (studyStartTime && currentCourse && totalWatchTime > 0) {
      const sessionDuration = Math.round(totalWatchTime / 60)
      if (sessionDuration > 0) {
        const currentSection = currentCourse.sections[currentSectionIndex]
        const currentVideo = currentSection.videos[currentVideoIndex]
        
        addStudySession({
          date: new Date().toDateString(),
          courseName: currentCourse.name,
          duration: sessionDuration,
          completedVideos: [currentVideo.name]
        })
      }
    }
    
    setCurrentSectionIndex(sectionIndex)
    setCurrentVideoIndex(videoIndex)
    localStorage.setItem(`lastWatchedSection_${courseName}`, sectionIndex.toString())
    localStorage.setItem(`lastWatchedVideo_${courseName}`, videoIndex.toString())
    setIsPlaying(false)
    setLastWatchedVideo({sectionIndex, videoIndex})
    
    // Reset study start time and watch time for new video
    setStudyStartTime(null)
    setTotalWatchTime(0)
    
    // Set reset position flag to true when manually selecting a video
    setResetVideoPosition(true)
    
    // Auto-collapse all sections except the selected one
    if (currentCourse) {
      const newCollapsed: Record<string, boolean> = {}
      currentCourse.sections.forEach((section: any, index: number) => {
        newCollapsed[section.name] = index !== sectionIndex
      })
      setCollapsedSections(newCollapsed)
    }
  }, [currentCourse, currentSectionIndex, currentVideoIndex, courseName, saveVideoPosition, studyStartTime, addStudySession, videoPosition, totalWatchTime, isCourseLoading])

  const handlePlayPause = useCallback(() => {
    if (!isPlaying && !studyStartTime) {
      setStudyStartTime(Date.now())
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying, studyStartTime])

  const handleToggleFullscreen = () => {
    if (!videoContainerRef.current) return

    if (!isFullscreen) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }

    setIsFullscreen(!isFullscreen)
  }

  const handleNoteChange = async (videoName: string, content: string) => {
    const updatedNotes = { ...notes, [videoName]: content }
    setNotes(updatedNotes)
    await saveNotes(courseName, videoName, content)
  }

  const handleExportNotes = () => {
    if (Object.keys(notes).length === 0) return

    const notesText = Object.entries(notes)
      .map(([video, content]) => `# ${video}\n\n${content}\n\n`)
      .join("---\n\n")

    const blob = new Blob([notesText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${courseName}_notes.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleVideoProgress = (progress: number) => {
    if (!currentCourse) return
    const currentSection = currentCourse.sections[currentSectionIndex]
    const currentVideo = currentSection.videos[currentVideoIndex]
    saveVideoProgress(courseName, currentVideo.name, progress)
    
    const now = Date.now()
    if (now - lastProgressSaveTime > 10000) {
      setLastProgressSaveTime(now)
      
      if (totalWatchTime > 0 && totalWatchTime % 600 === 0) {
        const sessionDuration = Math.round(totalWatchTime / 60)
        addStudySession({
          date: new Date().toDateString(),
          courseName: currentCourse.name,
          duration: 10,
          completedVideos: [currentVideo.name]
        })
      }
    }
  }

  const handleVideoTimeUpdate = (currentTime: number) => {
    setVideoPosition(currentTime)
    
    // Update position in our state
    if (currentCourse) {
      const currentSection = currentCourse.sections[currentSectionIndex]
      const currentVideo = currentSection.videos[currentVideoIndex]
      const videoKey = `${courseName}_${currentVideo.name}`
      
      setVideoPositions(prev => ({
        ...prev,
        [videoKey]: currentTime
      }))
    }
  }

  const handleBookmark = () => {
    if (!currentCourse) return
    setShowBookmarkModal(true)
  }

  const handleBookmarkSave = (title: string) => {
    if (!currentCourse) return
    
    const currentSection = currentCourse.sections[currentSectionIndex]
    const currentVideo = currentSection.videos[currentVideoIndex]
    
    addBookmark({
      videoId: currentVideo.name,
      courseId: courseName,
      title,
      timestamp: videoPosition
    })
  }

  // Function to handle next video
  const handleNextVideo = useCallback(() => {
    if (!currentCourse) return
    
    // Save current video position before switching
    if (currentCourse && videoPosition > 0 && saveVideoPosition) {
      const currentSection = currentCourse.sections[currentSectionIndex]
      const currentVideo = currentSection.videos[currentVideoIndex]
      const videoKey = `${courseName}_${currentVideo.name}`
      
      setVideoPositions(prev => ({
        ...prev,
        [videoKey]: videoPosition
      }))
      
      saveVideoPosition(courseName, currentVideo.name, videoPosition)
    }
    
    // Save study session for current video before switching
    if (studyStartTime && currentCourse && totalWatchTime > 0) {
      const sessionDuration = Math.round(totalWatchTime / 60)
      if (sessionDuration > 0) {
        const currentSection = currentCourse.sections[currentSectionIndex]
        const currentVideo = currentSection.videos[currentVideoIndex]
        
        addStudySession({
          date: new Date().toDateString(),
          courseName: currentCourse.name,
          duration: sessionDuration,
          completedVideos: [currentVideo.name]
        })
      }
    }
    
    // Calculate next video index
    const currentSection = currentCourse.sections[currentSectionIndex]
    let nextSectionIndex = currentSectionIndex
    let nextVideoIndex = currentVideoIndex + 1
    
    if (nextVideoIndex >= currentSection.videos.length) {
      nextVideoIndex = 0
      nextSectionIndex = currentSectionIndex + 1
      
      if (nextSectionIndex >= currentCourse.sections.length) {
        setIsPlaying(false)
        return
      }
    }
    
    // Update to the next video
    setCurrentSectionIndex(nextSectionIndex)
    setCurrentVideoIndex(nextVideoIndex)
    localStorage.setItem(`lastWatchedSection_${courseName}`, nextSectionIndex.toString())
    localStorage.setItem(`lastWatchedVideo_${courseName}`, nextVideoIndex.toString())
    setIsPlaying(false)
    setLastWatchedVideo({sectionIndex: nextSectionIndex, videoIndex: nextVideoIndex})
    
    // Reset study start time and watch time for new video
    setStudyStartTime(null)
    setTotalWatchTime(0)
    
    // Set reset position flag to true when auto-playing next video
    setResetVideoPosition(true)
    
    // Auto-collapse all sections except the selected one
    const newCollapsed: Record<string, boolean> = {}
    currentCourse.sections.forEach((section: any, index: number) => {
      newCollapsed[section.name] = index !== nextSectionIndex
    })
    setCollapsedSections(newCollapsed)
  }, [currentCourse, currentSectionIndex, currentVideoIndex, courseName, saveVideoPosition, studyStartTime, addStudySession, videoPosition, totalWatchTime])

  // Function to handle previous video
  const handlePreviousVideo = useCallback(() => {
    if (!currentCourse) return
    
    // Save current video position before switching
    if (currentCourse && videoPosition > 0 && saveVideoPosition) {
      const currentSection = currentCourse.sections[currentSectionIndex]
      const currentVideo = currentSection.videos[currentVideoIndex]
      const videoKey = `${courseName}_${currentVideo.name}`
      
      setVideoPositions(prev => ({
        ...prev,
        [videoKey]: videoPosition
      }))
      
      saveVideoPosition(courseName, currentVideo.name, videoPosition)
    }
    
    // Save study session for current video before switching
    if (studyStartTime && currentCourse && totalWatchTime > 0) {
      const sessionDuration = Math.round(totalWatchTime / 60)
      if (sessionDuration > 0) {
        const currentSection = currentCourse.sections[currentSectionIndex]
        const currentVideo = currentSection.videos[currentVideoIndex]
        
        addStudySession({
          date: new Date().toDateString(),
          courseName: currentCourse.name,
          duration: sessionDuration,
          completedVideos: [currentVideo.name]
        })
      }
    }
    
    // Calculate previous video index
    const currentSection = currentCourse.sections[currentSectionIndex]
    let prevSectionIndex = currentSectionIndex
    let prevVideoIndex = currentVideoIndex - 1
    
    if (prevVideoIndex < 0) {
      prevSectionIndex = currentSectionIndex - 1
      
      if (prevSectionIndex < 0) {
        return
      }
      
      const prevSection = currentCourse.sections[prevSectionIndex]
      prevVideoIndex = prevSection.videos.length - 1
    }
    
    // Update to the previous video
    setCurrentSectionIndex(prevSectionIndex)
    setCurrentVideoIndex(prevVideoIndex)
    localStorage.setItem(`lastWatchedSection_${courseName}`, prevSectionIndex.toString())
    localStorage.setItem(`lastWatchedVideo_${courseName}`, prevVideoIndex.toString())
    setIsPlaying(false)
    setLastWatchedVideo({sectionIndex: prevSectionIndex, videoIndex: prevVideoIndex})
    
    // Reset study start time and watch time for new video
    setStudyStartTime(null)
    setTotalWatchTime(0)
    
    // Set reset position flag to true when going to previous video
    setResetVideoPosition(true)
    
    // Auto-collapse all sections except the selected one
    const newCollapsed: Record<string, boolean> = {}
    currentCourse.sections.forEach((section: any, index: number) => {
      newCollapsed[section.name] = index !== prevSectionIndex
    })
    setCollapsedSections(newCollapsed)
  }, [currentCourse, currentSectionIndex, currentVideoIndex, courseName, saveVideoPosition, studyStartTime, addStudySession, videoPosition, totalWatchTime])

  const toggleSectionCollapse = (sectionName: string) => {
    setCollapsedSections(prev => {
      const newCollapsed = { ...prev }
      newCollapsed[sectionName] = !prev[sectionName]
      
      if (!newCollapsed[sectionName] && currentCourse) {
        currentCourse.sections.forEach((section: any, index: number) => {
          if (section.name !== sectionName) {
            newCollapsed[section.name] = true
          }
        })
      }
      
      return newCollapsed
    })
  }

  // Function to handle showing challenges
  const handleShowChallenge = (sectionName: string, videoName: string, subtitleContent: string) => {
    setChallengeVideo({
      courseName,
      sectionName,
      videoName,
      subtitleContent
    })
    setShowChallenge(true)
  }

  // Function to handle challenge completion
  const handleChallengeComplete = () => {
    setShowChallenge(false)
    setChallengeVideo(null)
  }

  // Handle navigation away
  const handleNavigateBack = () => {
    setIsNavigatingAway(true)
    
    // Save current video position before navigating away
    if (currentCourse && videoPosition > 0 && saveVideoPosition) {
      const currentSection = currentCourse.sections[currentSectionIndex]
      const currentVideo = currentSection.videos[currentVideoIndex]
      const videoKey = `${courseName}_${currentVideo.name}`
      
      setVideoPositions(prev => ({
        ...prev,
        [videoKey]: videoPosition
      }))
      
      saveVideoPosition(courseName, currentVideo.name, videoPosition)
    }
    
    // Save study session before navigating away
    if (studyStartTime && currentCourse && totalWatchTime > 0) {
      const sessionDuration = Math.round(totalWatchTime / 60)
      if (sessionDuration > 0) {
        const currentSection = currentCourse.sections[currentSectionIndex]
        const currentVideo = currentSection.videos[currentVideoIndex]
        
        addStudySession({
          date: new Date().toDateString(),
          courseName: currentCourse.name,
          duration: sessionDuration,
          completedVideos: [currentVideo.name]
        })
      }
    }
    
    // Pause the video before navigating
    setIsPlaying(false)
    navigate("/library")
  }

  // Sort sections by numeric prefix if available
  const sortedSections = currentCourse ? [...currentCourse.sections].sort((a, b) => {
    const aMatch = a.name.match(/^(\d+)/)
    const bMatch = b.name.match(/^(\d+)/)
    if (aMatch && bMatch) return Number(aMatch[1]) - Number(bMatch[1])
    return a.name.localeCompare(b.name)
  }) : []

  // Show loading state while course is loading
  if (isCourseLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading course...</p>
        </div>
      </div>
    )
  }

  // Show error state if course is not found or has invalid structure
  if (courseError || !currentCourse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Course Error</h2>
          <p className="text-gray-300 mb-6">
            {courseError || "The course could not be loaded. Please try again."}
          </p>
          <button
            onClick={() => navigate("/library")}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    )
  }

  // Additional validation before rendering
  if (!currentCourse.sections || currentCourse.sections.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-yellow-500 text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-white mb-4">Empty Course</h2>
          <p className="text-gray-300 mb-6">
            This course doesn't contain any sections or videos.
          </p>
          <button
            onClick={() => navigate("/library")}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    )
  }

  // Validate current indices before accessing sections and videos
  if (currentSectionIndex < 0 || currentSectionIndex >= currentCourse.sections.length) {
    console.error("Invalid section index:", currentSectionIndex)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Navigation Error</h2>
          <p className="text-gray-300 mb-6">
            Invalid section index. Please navigate back and try again.
          </p>
          <button
            onClick={() => navigate("/library")}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    )
  }

  const currentSection = currentCourse.sections[currentSectionIndex]
  
  // Validate current section has videos
  if (!currentSection || !currentSection.videos || currentSection.videos.length === 0) {
    console.error("Invalid section or no videos in section:", currentSection)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Section Error</h2>
          <p className="text-gray-300 mb-6">
            This section doesn't contain any videos.
          </p>
          <button
            onClick={() => navigate("/library")}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    )
  }

  // Validate current video index
  if (currentVideoIndex < 0 || currentVideoIndex >= currentSection.videos.length) {
    console.error("Invalid video index:", currentVideoIndex)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Video Error</h2>
          <p className="text-gray-300 mb-6">
            Invalid video index. Please navigate back and try again.
          </p>
          <button
            onClick={() => navigate("/library")}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    )
  }

  const currentVideo = currentSection.videos[currentVideoIndex]
  const videoKey = `${courseName}_${currentVideo.name}`

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 flex-shrink-0">
        <button
          onClick={handleNavigateBack}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Library</span>
        </button>
        <h1 className="text-xl font-bold text-white truncate">{currentCourse.name}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-2 rounded-lg transition-colors ${
              showNotes ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 72px)' }}>
        {/* Sidebar with sections - Fixed height with scrolling */}
        <div className="w-80 bg-gray-800/50 backdrop-blur-sm border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700 flex-shrink-0">
            <h2 className="text-lg font-medium text-white">Course Content</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              {sortedSections.map((section: any, sectionIndex: number) => {
                const originalIndex = currentCourse.sections.findIndex(s => s.name === section.name)
                const isCollapsed = collapsedSections[section.name] !== false
                
                return (
                  <div key={section.name}>
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        originalIndex === currentSectionIndex
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                          : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
                      }`}
                      onClick={() => toggleSectionCollapse(section.name)}
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                        <span className="font-medium">{section.name}</span>
                      </div>
                      <span className="text-sm bg-white/20 px-2 py-1 rounded">
                        {section.videos.length} videos
                      </span>
                    </div>
                    {!isCollapsed && (
                      <div className="ml-4 mt-2 space-y-1">
                        {section.videos.map((video: any, videoIndex: number) => (
                          <div
                            key={video.name}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              originalIndex === currentSectionIndex && videoIndex === currentVideoIndex
                                ? "bg-purple-600/20 text-white border-l-2 border-purple-500"
                                : "text-gray-300 hover:bg-gray-700/50"
                            }`}
                            onClick={() => handleVideoSelect(originalIndex, videoIndex)}
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                              <Play className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{video.name}</p>
                              <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                                <span>{video.duration}</span>
                                <span>{Math.round(getVideoProgress(courseName, video.name) * 100)}%</span>
                              </div>
                              {getVideoProgress(courseName, video.name) > 0 && (
                                <div className="w-full h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                                    style={{ width: `${getVideoProgress(courseName, video.name) * 100}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main content area with video player */}
        <div className="flex-1 flex flex-col">
          <div ref={videoContainerRef} className={`flex-1 ${isFullscreen ? "fixed inset-0 z-50 bg-black" : ""}`}>
            <div className="relative h-full flex flex-col">
              <div className="flex-1 bg-black flex items-center justify-center">
                {videoLoading ? (
                  <div className="flex items-center justify-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
                    Loading video...
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <VideoPlayer
                      videoSrc={videoUrl}
                      subtitleContent={subtitleContent}
                      isPlaying={isPlaying}
                      onPlayPause={handlePlayPause}
                      onProgress={handleVideoProgress}
                      onTimeUpdate={handleVideoTimeUpdate}
                      initialPosition={resetVideoPosition ? 0 : videoPositions[videoKey] || 0}
                      onBookmark={handleBookmark}
                      onNextVideo={handleNextVideo}
                      onPreviousVideo={handlePreviousVideo}
                      autoPlayNext={userProfile.autoPlayNext || false}
                      resetPosition={resetVideoPosition}
                      videoKey={videoKey}
                      videoPath={currentVideo.path}
                    />
                  </div>
                )}
              </div>

              {/* Video controls */}
              <div className="p-4 bg-gray-800/50 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-white truncate">{currentVideo.name}</h3>
                  <div className="text-sm text-gray-400">{currentVideo.duration}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={handlePlayPause} className="p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors">
                    {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                  </button>

                  <button onClick={handleBookmark} className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors">
                    <Bookmark className="w-5 h-5 text-white" />
                  </button>

                  {/* New Challenge Button */}
                  <button
                    onClick={() => {
                      if (subtitleContent) {
                        handleShowChallenge(currentSection.name, currentVideo.name, subtitleContent)
                      } else {
                        alert("Quizzes require subtitles. Please make sure subtitle files are available for this video.")
                      }
                    }}
                    className={`p-2 rounded-full transition-colors ${
                      subtitleContent 
                        ? "bg-blue-600 text-white hover:bg-blue-700" 
                        : "bg-gray-600 text-gray-400 hover:bg-gray-700"
                    }`}
                    title={subtitleContent ? "Test your understanding" : "Quizzes require subtitles"}
                  >
                    <Brain className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleToggleFullscreen}
                    className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-5 h-5 text-white" />
                    ) : (
                      <Maximize2 className="w-5 h-5 text-white" />
                    )}
                  </button>

                  <button
                    onClick={handleExportNotes}
                    className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors ml-auto"
                  >
                    <Download className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes panel - Fixed height with scrolling */}
        <AnimatePresence>
          {showNotes && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="w-80 bg-gray-800/50 backdrop-blur-sm border-l border-gray-700 flex flex-col"
            >
              <div className="p-4 border-b border-gray-700 flex-shrink-0">
                <h3 className="text-lg font-medium text-white mb-1">Notes</h3>
                <p className="text-sm text-gray-400 truncate">{currentVideo.name}</p>
              </div>
              <div className="flex-1 overflow-hidden">
                <NotesPanel
                  videoName={currentVideo.name}
                  content={notes[currentVideo.name] || ""}
                  onChange={(content) => handleNoteChange(currentVideo.name, content)}
                  subtitleContent={subtitleContent}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bookmark Modal */}
      <BookmarkModal
        isOpen={showBookmarkModal}
        onClose={() => setShowBookmarkModal(false)}
        onSave={handleBookmarkSave}
        currentTime={videoPosition}
        videoName={currentVideo.name}
      />

      {/* AI Challenge Component */}
      {showChallenge && challengeVideo && (
        <AIChallenge
          courseName={challengeVideo.courseName}
          sectionName={challengeVideo.sectionName}
          videoName={challengeVideo.videoName}
          subtitleContent={challengeVideo.subtitleContent}
          onComplete={handleChallengeComplete}
        />
      )}
    </div>
  )
}

export default PlaylistPage