// src/context/user-context.tsx
"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

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
  autoPlayNext: boolean
}

interface StudySession {
  date: string
  courseName: string
  duration: number // in minutes
  completedVideos: string[]
}

interface Bookmark {
  id: string
  videoId: string
  courseId: string
  title: string
  timestamp: number
  createdAt: Date
}

interface UserContextType {
  userProfile: UserProfile
  updateUserProfile: (profile: Partial<UserProfile>) => void
  studySessions: StudySession[]
  addStudySession: (session: StudySession) => void
  getTodayStudyTime: () => number
  getWeeklyProgress: () => { day: string; minutes: number }[]
  bookmarks: Bookmark[]
  addBookmark: (bookmark: Omit<Bookmark, "id" | "createdAt">) => void
  removeBookmark: (bookmarkId: string) => void
  getBookmarksByCourse: (courseId: string) => Bookmark[]
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Student",
    learningGoals: [],
    studyStreak: 0,
    totalStudyTime: 0,
    completedCourses: [],
    skippedQuestions: 0,
    achievements: [],
    dailyGoal: 30,
    preferredStudyTime: "evening",
    notificationsEnabled: true,
    autoPlayNext: false
  })
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const isElectron = typeof window !== "undefined" && window.electron !== undefined

  useEffect(() => {
    if (isElectron) {
      const savedProfile = localStorage.getItem("userProfile")
      if (savedProfile) {
        try {
          const parsedProfile = JSON.parse(savedProfile)
          setUserProfile(parsedProfile)
        } catch (error) {
          console.error("Error parsing user profile:", error)
        }
      }

      const savedSessions = localStorage.getItem("studySessions")
      if (savedSessions) {
        try {
          const parsedSessions = JSON.parse(savedSessions)
          setStudySessions(parsedSessions)
        } catch (error) {
          console.error("Error parsing study sessions:", error)
        }
      }

      const savedBookmarks = localStorage.getItem("bookmarks")
      if (savedBookmarks) {
        try {
          const parsedBookmarks = JSON.parse(savedBookmarks)
          setBookmarks(parsedBookmarks)
        } catch (error) {
          console.error("Error parsing bookmarks:", error)
        }
      }
    }
  }, [isElectron])

  const updateUserProfile = (profileUpdates: Partial<UserProfile>) => {
    const updatedProfile = { ...userProfile, ...profileUpdates }
    setUserProfile(updatedProfile)
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile))
  }

  const addStudySession = (session: StudySession) => {
    const updatedSessions = [...studySessions, session]
    setStudySessions(updatedSessions)
    localStorage.setItem("studySessions", JSON.stringify(updatedSessions))

    const newTotalTime = userProfile.totalStudyTime + session.duration
    updateUserProfile({ totalStudyTime: newTotalTime })

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

  const value: UserContextType = {
    userProfile,
    updateUserProfile,
    studySessions,
    addStudySession,
    getTodayStudyTime,
    getWeeklyProgress,
    bookmarks,
    addBookmark,
    removeBookmark,
    getBookmarksByCourse,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}