// src/context/app-context.tsx
"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

declare global {
  interface Window {
    electron?: {
      selectFolder: () => Promise<string | null>
      getVideosFromFolder: (folderPath: string) => Promise<any[]>
      getCourseStructure: (rootPath: string) => Promise<any[]>
      getVideoFile: (filePath: string) => Promise<string>
      findSubtitleFiles: (videoPath: string) => Promise<{ type: string; content: string }[]>
      saveNotes: (data: { courseName: string; videoName: string; content: string }) => Promise<boolean>
      loadNotes: (data: { courseName: string; videoName: string }) => Promise<string>
      getAppDataPath: () => Promise<string>
      saveVideoPosition: (data: { courseName: string; videoName: string; position: number }) => Promise<boolean>
      getVideoPosition: (data: { courseName: string; videoName: string }) => Promise<number>
      platform: string
      testIpc: () => Promise<string>
      // Add the new IPC listener method
      onCourseLoadingProgress: (callback: (data: { message: string; progress: number }) => void) => void
      removeCourseLoadingProgressListener: (callback: (data: { message: string; progress: number }) => void) => void
    }
  }
}

interface Video {
  name: string
  path: string
  duration: string
  progress: number
}

interface Section {
  name: string
  path: string
  videos: Video[]
}

interface Course {
  name: string
  path: string
  sections: Section[]
  icon?: string
  color?: string
  tags?: string[]
  isPinned?: boolean // Add this property
}

interface UserProfile {
  name: string
  avatar?: string
  learningGoals: string[]
  studyStreak: number
  totalStudyTime: number
  completedCourses: string[]
  skippedQuestions: number
  achievements: string[]
  dailyGoal: number // in minutes
  preferredStudyTime: string // "morning", "afternoon", "evening"
  notificationsEnabled: boolean
  autoPlayNext: boolean // New property for auto-play setting
}

interface StudySession {
  date: string
  courseName: string
  duration: number // in minutes
  completedVideos: string[]
}

interface Challenge {
  id: string
  type: "multiple-choice" | "open-ended"
  question: string
  options?: string[] // for multiple choice
  correctAnswer?: string // for multiple choice
  courseName: string
  sectionName: string
  videoName: string
}

interface Bookmark {
  id: string
  videoId: string
  courseId: string
  title: string
  timestamp: number
  createdAt: Date
}

interface AppContextType {
  courses: Course[]
  selectedFolderPath: string | null
  loadCourses: (folderPath: string) => Promise<void>
  selectFolder: () => Promise<string | null>
  saveVideoProgress: (courseName: string, videoName: string, progress: number) => void
  getVideoProgress: (courseName: string, videoName: string) => number
  saveNotes: (courseName: string, videoName: string, content: string) => Promise<boolean>
  loadNotes: (data: { courseName: string; videoName: string }) => Promise<string>
  saveVideoPosition: (courseName: string, videoName: string, position: number) => Promise<boolean>
  getVideoPosition: (courseName: string, videoName: string) => Promise<number>
  isElectron: boolean
  platform: string
  testIPC: () => Promise<string>
  removeCourse: (courseName: string) => void
  geminiApiKey: string
  setGeminiApiKey: (key: string) => void
  generateAINotes: (courseName: string, videoName: string, subtitleContent: string) => Promise<string>
  
  // New user profile related functions
  userProfile: UserProfile
  updateUserProfile: (profile: Partial<UserProfile>) => void
  studySessions: StudySession[]
  addStudySession: (session: StudySession) => void
  getTodayStudyTime: () => number
  getWeeklyProgress: () => { day: string; minutes: number }[]
  
  // Course customization - FIXED
  updateCourse: (courseName: string, updates: Partial<Course>) => void
  
  // Loading state
  isLoadingCourses: boolean
  loadingMessage: string
  loadingProgress: number
  
  // Pin/Unpin functions
  pinCourse: (courseName: string) => void
  unpinCourse: (courseName: string) => void
  getPinnedCourses: () => Course[]
  getRecentCourses: () => Course[]
  
  // AI features
  generateDailyRecommendation: () => Promise<string>
  generateChallenge: (courseName: string, sectionName: string, videoName: string, subtitleContent: string) => Promise<Challenge>
  submitChallengeAnswer: (challengeId: string, answer: string) => Promise<{ correct: boolean; feedback: string }>
  skipChallenge: (challengeId: string) => void
  
  // Bookmark functions
  bookmarks: Bookmark[]
  addBookmark: (bookmark: Omit<Bookmark, "id" | "createdAt">) => void
  removeBookmark: (bookmarkId: string) => void
  getBookmarksByCourse: (courseId: string) => Bookmark[]
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(null)
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>({})
  const [geminiApiKey, setGeminiApiKey] = useState<string>("")
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  
  // New state for user profile and features
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Student",
    learningGoals: [],
    studyStreak: 0,
    totalStudyTime: 0,
    completedCourses: [],
    skippedQuestions: 0,
    achievements: [],
    dailyGoal: 30, // 30 minutes default
    preferredStudyTime: "evening",
    notificationsEnabled: true,
    autoPlayNext: false // Default to false for auto-play
  })
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  
  // Loading state
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [loadingProgress, setLoadingProgress] = useState(0)

  const isElectron = typeof window !== "undefined" && window.electron !== undefined
  const platform = isElectron && window.electron ? window.electron.platform : "web"

  useEffect(() => {
    if (isElectron) {
      // Load all saved courses from localStorage
      const savedCourses = localStorage.getItem("courses")
      if (savedCourses) {
        try {
          const parsedCourses = JSON.parse(savedCourses)
          setCourses(parsedCourses)
        } catch (error) {
          console.error("Error parsing saved courses:", error)
        }
      }

      const savedProgress = localStorage.getItem("videoProgress")
      if (savedProgress) {
        setVideoProgress(JSON.parse(savedProgress))
      }

      // Load Gemini API key from localStorage
      const savedApiKey = localStorage.getItem("geminiApiKey")
      if (savedApiKey) {
        setGeminiApiKey(savedApiKey)
      }
      
      // Load user profile from localStorage
      const savedProfile = localStorage.getItem("userProfile")
      if (savedProfile) {
        try {
          const parsedProfile = JSON.parse(savedProfile)
          setUserProfile(parsedProfile)
        } catch (error) {
          console.error("Error parsing user profile:", error)
        }
      }
      
      // Load study sessions from localStorage
      const savedSessions = localStorage.getItem("studySessions")
      if (savedSessions) {
        try {
          const parsedSessions = JSON.parse(savedSessions)
          setStudySessions(parsedSessions)
        } catch (error) {
          console.error("Error parsing study sessions:", error)
        }
      }
      
      // Load bookmarks from localStorage
      const savedBookmarks = localStorage.getItem("bookmarks")
      if (savedBookmarks) {
        try {
          const parsedBookmarks = JSON.parse(savedBookmarks)
          setBookmarks(parsedBookmarks)
        } catch (error) {
          console.error("Error parsing bookmarks:", error)
        }
      }
      
      // Set up progress listener using the exposed API
      if (window.electron && window.electron.onCourseLoadingProgress) {
        const handleProgress = (data: { message: string; progress: number }) => {
          setLoadingMessage(data.message)
          setLoadingProgress(data.progress)
        }
        
        window.electron.onCourseLoadingProgress(handleProgress)
        
        return () => {
          if (window.electron && window.electron.removeCourseLoadingProgressListener) {
            window.electron.removeCourseLoadingProgressListener(handleProgress)
          }
        }
      }
    }
  }, [isElectron])

  const loadCourses = async (folderPath: string) => {
    if (!isElectron || !window.electron) return

    console.log("Loading courses from:", folderPath)
    
    setIsLoadingCourses(true)
    setLoadingMessage("Scanning course structure...")
    setLoadingProgress(0)
    
    try {
      const courseStructure = await window.electron.getCourseStructure(folderPath)
      console.log("Course structure received:", courseStructure)
      
      if (courseStructure && courseStructure.length > 0) {
        const newCourse = courseStructure[0]
        
        // Check if course already exists
        const existingCourseIndex = courses.findIndex(c => c.path === folderPath)
        
        if (existingCourseIndex !== -1) {
          // Update existing course but preserve customizations
          const updatedCourses = [...courses]
          updatedCourses[existingCourseIndex] = {
            ...newCourse,
            icon: updatedCourses[existingCourseIndex].icon,
            color: updatedCourses[existingCourseIndex].color,
            tags: updatedCourses[existingCourseIndex].tags,
            isPinned: updatedCourses[existingCourseIndex].isPinned || false
          }
          setCourses(updatedCourses)
          localStorage.setItem("courses", JSON.stringify(updatedCourses))
        } else {
          // Add new course
          const updatedCourses = [...courses, { ...newCourse, isPinned: false }]
          setCourses(updatedCourses)
          localStorage.setItem("courses", JSON.stringify(updatedCourses))
        }
      }
    } catch (error) {
      console.error("Error loading courses:", error)
    } finally {
      setIsLoadingCourses(false)
      setLoadingMessage("")
      setLoadingProgress(0)
    }
  }

  const selectFolder = async () => {
    if (!isElectron || !window.electron) return null

    console.log("Opening folder selection dialog")
    
    try {
      const folderPath = await window.electron.selectFolder()
      console.log("Selected folder:", folderPath)
      
      if (folderPath) {
        await loadCourses(folderPath)
        return folderPath
      }
      return null
    } catch (error) {
      console.error("Error selecting folder:", error)
      return null
    }
  }

  const removeCourse = (courseName: string) => {
    const updatedCourses = courses.filter(c => c.name !== courseName)
    setCourses(updatedCourses)
    localStorage.setItem("courses", JSON.stringify(updatedCourses))
  }

  const testIPC = async () => {
    if (isElectron && window.electron) {
      try {
        const result = await window.electron.testIpc()
        console.log("Test result:", result)
        return result
      } catch (error) {
        console.error("Test IPC error:", error)
        return "Error"
      }
    }
    return "Not in Electron"
  }

  const saveVideoProgress = (courseName: string, videoName: string, progress: number) => {
    const key = `${courseName}/${videoName}`
    const updatedProgress = { ...videoProgress, [key]: progress }
    setVideoProgress(updatedProgress)
    localStorage.setItem("videoProgress", JSON.stringify(updatedProgress))
  }

  const getVideoProgress = (courseName: string, videoName: string) => {
    const key = `${courseName}/${videoName}`
    return videoProgress[key] || 0
  }

  const saveVideoPosition = async (courseName: string, videoName: string, position: number) => {
    if (!isElectron || !window.electron) {
      localStorage.setItem(`position_${courseName}_${videoName}`, position.toString())
      return true
    }

    return await window.electron.saveVideoPosition({ courseName, videoName, position })
  }

  const getVideoPosition = async (courseName: string, videoName: string) => {
    if (!isElectron || !window.electron) {
      const position = localStorage.getItem(`position_${courseName}_${videoName}`)
      return position ? parseFloat(position) : 0
    }

    return await window.electron.getVideoPosition({ courseName, videoName })
  }

  const saveNotes = async (courseName: string, videoName: string, content: string) => {
    if (!isElectron || !window.electron) {
      localStorage.setItem(`notes_${courseName}_${videoName}`, content)
      return true
    }

    return await window.electron.saveNotes({ courseName, videoName, content })
  }

  const loadNotes = async (data: { courseName: string; videoName: string }) => {
    if (!isElectron || !window.electron) {
      return localStorage.getItem(`notes_${data.courseName}_${data.videoName}`) || ""
    }

    return await window.electron.loadNotes({ courseName: data.courseName, videoName: data.videoName })
  }

  const setGeminiApiKeyHandler = (key: string) => {
    setGeminiApiKey(key)
    localStorage.setItem("geminiApiKey", key)
  }

  const generateAINotes = async (courseName: string, videoName: string, subtitleContent: string) => {
    if (!geminiApiKey) {
      throw new Error("Gemini API key is not set. Please set it in settings.")
    }

    // Validate API key format
    if (!geminiApiKey.startsWith("AIza")) {
      throw new Error("Invalid Gemini API key format. Please check your API key.")
    }

    try {
      const prompt = `
        You are an AI assistant helping to create structured notes from video subtitles. 
        Please analyze the following subtitle content from a video lesson and create comprehensive, well-structured notes.
        
        Video: ${videoName}
        Course: ${courseName}
        
        Subtitle content:
        ${subtitleContent}
        
        Please create notes in markdown format with the following structure:
        1. A main title using # (H1)
        2. Key topics covered in the lesson using ## (H2)
        3. Important points for each topic using bullet points (-)
        4. Highlight key terms or concepts using **bold**
        5. Include any code examples or technical details in code blocks
        
        Make the notes educational, concise, and easy to review. Focus on the most important concepts taught in the lesson.
      `

      console.log("Making Gemini API request...")
      
      // Try the correct endpoint for Gemini Pro
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      })

      console.log("Gemini API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Gemini API error response:", errorData)
        
        // If the model is not found, try to list available models
        if (errorData.error && errorData.error.code === 404) {
          try {
            const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
            if (modelsResponse.ok) {
              const modelsData = await modelsResponse.json();
              console.log("Available models:", modelsData.models);
              
              // Find a suitable model for text generation
              const textModel = modelsData.models.find((model: any) => 
                model.name.includes("text") || 
                model.name.includes("chat") || 
                model.name.includes("gemini-pro")
              );
              
              if (textModel) {
                console.log("Using model:", textModel.name);
                
                // Retry with the found model
                const retryResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${textModel.name}:generateContent?key=${geminiApiKey}`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    contents: [
                      {
                        parts: [
                          {
                            text: prompt
                          }
                        ]
                      }
                    ]
                  })
                });
                
                if (retryResponse.ok) {
                  const data = await retryResponse.json();
                  return data.candidates[0].content.parts[0].text;
                }
              }
            }
          } catch (modelsError) {
            console.error("Error fetching models:", modelsError);
          }
        }
        
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Gemini API response data:", data)
      
      // Check if the response has the expected structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        console.error("Unexpected Gemini API response structure:", data)
        throw new Error("Unexpected response from Gemini API")
      }
      
      return data.candidates[0].content.parts[0].text
    } catch (error) {
      console.error("Error generating AI notes:", error)
      throw error
    }
  }

  // New functions for user profile
  const updateUserProfile = (profileUpdates: Partial<UserProfile>) => {
    const updatedProfile = { ...userProfile, ...profileUpdates }
    setUserProfile(updatedProfile)
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile))
  }

  const addStudySession = (session: StudySession) => {
    const updatedSessions = [...studySessions, session]
    setStudySessions(updatedSessions)
    localStorage.setItem("studySessions", JSON.stringify(updatedSessions))
    
    // Update total study time
    const newTotalTime = userProfile.totalStudyTime + session.duration
    updateUserProfile({ totalStudyTime: newTotalTime })
    
    // Check if we need to update study streak
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    
    const hasStudiedToday = studySessions.some(s => s.date === today)
    const hasStudiedYesterday = studySessions.some(s => s.date === yesterday)
    
    if (!hasStudiedToday && hasStudiedYesterday) {
      updateUserProfile({ studyStreak: userProfile.studyStreak + 1 })
    } else if (!hasStudiedToday && !hasStudiedYesterday) {
      updateUserProfile({ studyStreak: 1 })
    }
  }

  const getTodayStudyTime = () => {
    const today = new Date().toDateString()
    return studySessions
      .filter(session => session.date === today)
      .reduce((total, session) => total + session.duration, 0)
  }

  const getWeeklyProgress = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const today = new Date()
    const weekData = []
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateString = date.toDateString()
      const dayName = days[date.getDay()]
      
      const dayMinutes = studySessions
        .filter(session => session.date === dateString)
        .reduce((total, session) => total + session.duration, 0)
      
      weekData.push({ day: dayName, minutes: dayMinutes })
    }
    
    return weekData
  }

  // FIXED: Single function to update course properties
  const updateCourse = (courseName: string, updates: Partial<Course>) => {
    const updatedCourses = courses.map(course => 
      course.name === courseName ? { ...course, ...updates } : course
    )
    
    // Create a new array reference to ensure React detects the change
    const newCoursesArray = [...updatedCourses]
    setCourses(newCoursesArray)
    localStorage.setItem("courses", JSON.stringify(newCoursesArray))
    
    // Force a re-render by creating a new reference after a short delay
    setTimeout(() => {
      setCourses([...newCoursesArray])
    }, 10)
  }

  // Pin a course
  const pinCourse = (courseName: string) => {
    const updatedCourses = courses.map(course => 
      course.name === courseName ? { ...course, isPinned: true } : course
    )
    
    // Create a new array reference to ensure React detects the change
    const newCoursesArray = [...updatedCourses]
    setCourses(newCoursesArray)
    localStorage.setItem("courses", JSON.stringify(newCoursesArray))
  }

  // Unpin a course
  const unpinCourse = (courseName: string) => {
    const updatedCourses = courses.map(course => 
      course.name === courseName ? { ...course, isPinned: false } : course
    )
    
    // Create a new array reference to ensure React detects the change
    const newCoursesArray = [...updatedCourses]
    setCourses(newCoursesArray)
    localStorage.setItem("courses", JSON.stringify(newCoursesArray))
  }

  // Get pinned courses
  const getPinnedCourses = () => {
    return courses.filter(course => course.isPinned)
  }

  // Get recent courses (based on last played)
  const getRecentCourses = () => {
    const lastPlayedCourseName = localStorage.getItem("lastPlayedCourse")
    if (lastPlayedCourseName) {
      const lastPlayedCourse = courses.find(c => c.name === lastPlayedCourseName)
      if (lastPlayedCourse) {
        // Return the last played course first, then the rest
        const otherCourses = courses.filter(c => c.name !== lastPlayedCourseName)
        return [lastPlayedCourse, ...otherCourses.slice(0, 2)] // Return last played + 2 more
      }
    }
    return courses.slice(0, 3) // Return first 3 courses if no last played
  }

  // AI features
  const generateDailyRecommendation = async () => {
    if (!geminiApiKey) {
      return "Please set your Gemini API key in settings to get personalized recommendations."
    }

    try {
      // Get the last played course
      const lastPlayedCourseName = localStorage.getItem("lastPlayedCourse")
      const lastPlayedCourse = courses.find(c => c.name === lastPlayedCourseName)
      
      // Get today's study time
      const todayMinutes = getTodayStudyTime()
      const remainingMinutes = Math.max(0, userProfile.dailyGoal - todayMinutes)
      
      // Get user goals
      const goalsText = userProfile.learningGoals.length > 0 
        ? userProfile.learningGoals.join(", ")
        : "general learning"
      
      const prompt = `
        Based on the following information, provide a brief, encouraging study recommendation for today:
        
        User's learning goals: ${goalsText}
        Today's study time so far: ${todayMinutes} minutes
        Daily goal: ${userProfile.dailyGoal} minutes
        Remaining time to reach goal: ${remainingMinutes} minutes
        Last studied course: ${lastPlayedCourseName || "None"}
        
        ${lastPlayedCourse ? `Last course progress: ${lastPlayedCourse.sections.reduce((acc, section) => acc + section.videos.length, 0)} videos total` : ""}
        
        Please provide a recommendation that is:
        1. Encouraging and positive
        2. Specific to their learning goals
        3. Takes into account their progress
        4. Suggests a specific course or topic to focus on
        5. Is concise (2-3 sentences max)
      `

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error("Unexpected response from Gemini API")
      }
      
      return data.candidates[0].content.parts[0].text
    } catch (error) {
      console.error("Error generating recommendation:", error)
      return "Continue your learning journey today! Focus on the course that aligns best with your goals."
    }
  }

  const generateChallenge = async (courseName: string, sectionName: string, videoName: string, subtitleContent: string) => {
    if (!geminiApiKey) {
      throw new Error("Gemini API key is not set. Please set it in settings.")
    }

    try {
      const challengeType = Math.random() > 0.5 ? "multiple-choice" : "open-ended"
      
      const prompt = `
        Based on the following subtitle content from a video lesson, create a ${challengeType} challenge question to test understanding:
        
        Video: ${videoName}
        Course: ${courseName}
        Section: ${sectionName}
        
        Subtitle content:
        ${subtitleContent}
        
        ${challengeType === "multiple-choice" 
          ? `Create a multiple-choice question with 4 options (A, B, C, D) where only one is correct. 
             Format your response as JSON with the following structure:
             {
               "question": "Your question here",
               "options": ["Option A", "Option B", "Option C", "Option D"],
               "correctAnswer": "A"
             }`
          : `Create an open-ended question that requires a detailed answer.
             Format your response as JSON with the following structure:
             {
               "question": "Your question here"
             }`
        }
        
        The question should test understanding of the key concepts in the video content.
      `

      // Try the correct endpoint for Gemini Pro
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Gemini API error response:", errorData)
        
        // If the model is not found, try to list available models
        if (errorData.error && errorData.error.code === 404) {
          try {
            const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
            if (modelsResponse.ok) {
              const modelsData = await modelsResponse.json();
              console.log("Available models:", modelsData.models);
              
              // Find a suitable model for text generation
              const textModel = modelsData.models.find((model: any) => 
                model.name.includes("text") || 
                model.name.includes("chat") || 
                model.name.includes("gemini-pro")
              );
              
              if (textModel) {
                console.log("Using model:", textModel.name);
                
                // Retry with the found model
                const retryResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${textModel.name}:generateContent?key=${geminiApiKey}`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    contents: [
                      {
                        parts: [
                          {
                            text: prompt
                          }
                        ]
                      }
                    ]
                  })
                });
                
                if (retryResponse.ok) {
                  const data = await retryResponse.json();
                  const challengeData = JSON.parse(data.candidates[0].content.parts[0].text)
                  
                  return {
                    id: `${courseName}-${sectionName}-${videoName}-${Date.now()}`,
                    type: challengeType,
                    question: challengeData.question,
                    options: challengeData.options,
                    correctAnswer: challengeData.correctAnswer,
                    courseName,
                    sectionName,
                    videoName
                  }
                }
              }
            }
          } catch (modelsError) {
            console.error("Error fetching models:", modelsError);
          }
        }
        
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Gemini API response data:", data)
      
      // Check if the response has the expected structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        console.error("Unexpected Gemini API response structure:", data)
        throw new Error("Unexpected response from Gemini API")
      }
      
      const challengeData = JSON.parse(data.candidates[0].content.parts[0].text)
      
      return {
        id: `${courseName}-${sectionName}-${videoName}-${Date.now()}`,
        type: challengeType,
        question: challengeData.question,
        options: challengeData.options,
        correctAnswer: challengeData.correctAnswer,
        courseName,
        sectionName,
        videoName
      }
    } catch (error) {
      console.error("Error generating challenge:", error)
      
      // If there's an error with the API, create a fallback challenge
      return {
        id: `${courseName}-${sectionName}-${videoName}-${Date.now()}`,
        type: "multiple-choice",
        question: `What was the main topic covered in "${videoName}"?`,
        options: [
          "The video covered React fundamentals",
          "The video covered advanced React patterns",
          "The video covered React hooks",
          "The video covered React performance optimization"
        ],
        correctAnswer: "A",
        courseName,
        sectionName,
        videoName
      }
    }
  }

  const submitChallengeAnswer = async (challengeId: string, answer: string) => {
    // This would normally be stored in a database, but for now we'll use localStorage
    const savedChallenges = localStorage.getItem("challenges")
    const challenges = savedChallenges ? JSON.parse(savedChallenges) : {}
    
    if (!challenges[challengeId]) {
      throw new Error("Challenge not found")
    }
    
    const challenge = challenges[challengeId]
    let isCorrect = false
    
    if (challenge.type === "multiple-choice") {
      isCorrect = answer === challenge.correctAnswer
    } else {
      // For open-ended questions, we'd need to use AI to evaluate the answer
      // For now, we'll just mark it as correct
      isCorrect = true
    }
    
    // Save the answer
    challenges[challengeId].userAnswer = answer
    challenges[challengeId].isCorrect = isCorrect
    challenges[challengeId].answeredAt = new Date().toISOString()
    
    localStorage.setItem("challenges", JSON.stringify(challenges))
    
    // Generate feedback
    let feedback = ""
    if (isCorrect) {
      feedback = "Great job! You've demonstrated a good understanding of the material."
    } else {
      if (challenge.type === "multiple-choice") {
        feedback = `Not quite right. The correct answer is ${challenge.correctAnswer}. Review the material and try again.`
      } else {
        feedback = "Thank you for your response. Consider reviewing the material to deepen your understanding."
      }
    }
    
    return { correct: isCorrect, feedback }
  }

  const skipChallenge = (challengeId: string) => {
    // Update the user profile to track skipped challenges
    updateUserProfile({ skippedQuestions: userProfile.skippedQuestions + 1 })
    
    // Save the skip in localStorage
    const savedChallenges = localStorage.getItem("challenges")
    const challenges = savedChallenges ? JSON.parse(savedChallenges) : {}
    
    if (challenges[challengeId]) {
      challenges[challengeId].skipped = true
      challenges[challengeId].skippedAt = new Date().toISOString()
      localStorage.setItem("challenges", JSON.stringify(challenges))
    }
  }

  // Bookmark functions
  const addBookmark = (bookmark: Omit<Bookmark, "id" | "createdAt">) => {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: `${bookmark.courseId}-${bookmark.videoId}-${Date.now()}`,
      createdAt: new Date()
    }
    
    const updatedBookmarks = [...bookmarks, newBookmark]
    setBookmarks(updatedBookmarks)
    localStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks))
  }

  const removeBookmark = (bookmarkId: string) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== bookmarkId)
    setBookmarks(updatedBookmarks)
    localStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks))
  }

  const getBookmarksByCourse = (courseId: string) => {
    return bookmarks.filter(b => b.courseId === courseId)
  }

  const value: AppContextType = {
    courses,
    selectedFolderPath,
    loadCourses,
    selectFolder,
    saveVideoProgress,
    getVideoProgress,
    saveNotes,
    loadNotes,
    saveVideoPosition,
    getVideoPosition,
    isElectron,
    platform,
    testIPC,
    removeCourse,
    geminiApiKey,
    setGeminiApiKey: setGeminiApiKeyHandler,
    generateAINotes,
    
    // New user profile related functions
    userProfile,
    updateUserProfile,
    studySessions,
    addStudySession,
    getTodayStudyTime,
    getWeeklyProgress,
    
    // Course customization - FIXED
    updateCourse,
    
    // Loading state
    isLoadingCourses,
    loadingMessage,
    loadingProgress,
    
    // Pin/Unpin functions
    pinCourse,
    unpinCourse,
    getPinnedCourses,
    getRecentCourses,
    
    // AI features
    generateDailyRecommendation,
    generateChallenge,
    submitChallengeAnswer,
    skipChallenge,
    
    // Bookmark functions
    bookmarks,
    addBookmark,
    removeBookmark,
    getBookmarksByCourse,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}