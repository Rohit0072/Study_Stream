// src/context/course-context.tsx
"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

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
  isPinned?: boolean
}

interface CourseContextType {
  courses: Course[]
  loadCourses: (folderPath: string) => Promise<void>
  selectFolder: () => Promise<string | null>
  removeCourse: (courseName: string) => void
  updateCourse: (courseName: string, updates: Partial<Course>) => void
  pinCourse: (courseName: string) => void
  unpinCourse: (courseName: string) => void
  getPinnedCourses: () => Course[]
  getRecentCourses: () => Course[]
  isLoadingCourses: boolean
  loadingMessage: string
  loadingProgress: number
}

const CourseContext = createContext<CourseContextType | undefined>(undefined)

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [loadingProgress, setLoadingProgress] = useState(0)
  const isElectron = typeof window !== "undefined" && window.electron !== undefined

  useEffect(() => {
    if (isElectron) {
      const savedCourses = localStorage.getItem("courses")
      if (savedCourses) {
        try {
          const parsedCourses = JSON.parse(savedCourses)
          setCourses(parsedCourses)
        } catch (error) {
          console.error("Error parsing saved courses:", error)
        }
      }

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

    setIsLoadingCourses(true)
    setLoadingMessage("Scanning course structure...")
    setLoadingProgress(0)

    try {
      const courseStructure = await window.electron.getCourseStructure(folderPath)
      if (courseStructure && courseStructure.length > 0) {
        const newCourse = courseStructure[0]
        const existingCourseIndex = courses.findIndex(c => c.path === folderPath)

        if (existingCourseIndex !== -1) {
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
    try {
      const folderPath = await window.electron.selectFolder()
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

  const updateCourse = (courseName: string, updates: Partial<Course>) => {
    const updatedCourses = courses.map(course =>
      course.name === courseName ? { ...course, ...updates } : course
    )
    setCourses(updatedCourses)
    localStorage.setItem("courses", JSON.stringify(updatedCourses))
  }

  const pinCourse = (courseName: string) => {
    const updatedCourses = courses.map(course =>
      course.name === courseName ? { ...course, isPinned: true } : course
    )
    setCourses(updatedCourses)
    localStorage.setItem("courses", JSON.stringify(updatedCourses))
  }

  const unpinCourse = (courseName: string) => {
    const updatedCourses = courses.map(course =>
      course.name === courseName ? { ...course, isPinned: false } : course
    )
    setCourses(updatedCourses)
    localStorage.setItem("courses", JSON.stringify(updatedCourses))
  }

  const getPinnedCourses = () => {
    return courses.filter(course => course.isPinned)
  }

  const getRecentCourses = () => {
    const lastPlayedCourseName = localStorage.getItem("lastPlayedCourse")
    if (lastPlayedCourseName) {
      const lastPlayedCourse = courses.find(c => c.name === lastPlayedCourseName)
      if (lastPlayedCourse) {
        const otherCourses = courses.filter(c => c.name !== lastPlayedCourseName)
        return [lastPlayedCourse, ...otherCourses.slice(0, 2)]
      }
    }
    return courses.slice(0, 3)
  }

  const value: CourseContextType = {
    courses,
    loadCourses,
    selectFolder,
    removeCourse,
    updateCourse,
    pinCourse,
    unpinCourse,
    getPinnedCourses,
    getRecentCourses,
    isLoadingCourses,
    loadingMessage,
    loadingProgress,
  }

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
}

export function useCourses() {
  const context = useContext(CourseContext)
  if (context === undefined) {
    throw new Error("useCourses must be used within a CourseProvider")
  }
  return context
}
