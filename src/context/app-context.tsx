// src/context/app-context.tsx
"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { CourseProvider, useCourses } from "./course-context"
import { UserProvider, useUser } from "./user-context"
import { AIProvider, useAI } from "./ai-context"

interface AppContextType {
  saveVideoProgress: (courseName: string, videoName: string, progress: number) => void
  getVideoProgress: (courseName: string, videoName: string) => number
  saveNotes: (courseName: string, videoName: string, content: string) => Promise<boolean>
  loadNotes: (data: { courseName: string; videoName: string }) => Promise<string>
  saveVideoPosition: (courseName: string, videoName: string, position: number) => Promise<boolean>
  getVideoPosition: (courseName: string, videoName: string) => Promise<number>
  isElectron: boolean
  platform: string
  testIPC: () => Promise<string>
  showNotification: (title: string, body: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const isElectron = typeof window !== "undefined" && window.electron !== undefined
  const platform = isElectron && window.electron ? window.electron.platform : "web"
  useEffect(() => {
    if (isElectron) {
      const savedProgress = localStorage.getItem("videoProgress")
      if (savedProgress) {
        setVideoProgress(JSON.parse(savedProgress))
      }
    }
  }, [isElectron])
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>({})

  const saveVideoProgress = (courseName: string, videoName: string, progress: number) => {
    const key = `${courseName}/${videoName}`
    const updatedProgress = { ...videoProgress, [key]: progress }
    setVideoProgress(updatedProgress)
    localStorage.setItem("videoProgress", JSON.stringify(updatedProgress))
  }

  const saveNotes = async (courseName: string, videoName: string, content: string) => {
    if (!isElectron || !window.electron) return false
    return await window.electron.saveNotes({ courseName, videoName, content })
  }

  const loadNotes = async (data: { courseName: string; videoName: string }) => {
    if (!isElectron || !window.electron) return ""
    return await window.electron.loadNotes(data)
  }

  const saveVideoPosition = async (courseName: string, videoName: string, position: number) => {
      if (!isElectron || !window.electron) return false
      return await window.electron.saveVideoPosition({ courseName, videoName, position })
  }

  const getVideoPosition = async (courseName: string, videoName: string) => {
        if (!isElectron || !window.electron) return 0
        return await window.electron.getVideoPosition({ courseName, videoName })
  }

  const testIPC = async () => {
      if (!isElectron || !window.electron) return "Not in Electron"
      return await window.electron.testIpc()
  }

  const getVideoProgress = (courseName: string, videoName: string) => {
    const key = `${courseName}/${videoName}`
    return videoProgress[key] || 0
  }

  const showNotification = (title: string, body: string) => {
    if (isElectron && window.electron) {
      window.electron.showNotification(title, body)
    }
  }

  const value: AppContextType = {
    saveVideoProgress,
    getVideoProgress,
    saveNotes,
    loadNotes,
    saveVideoPosition,
    getVideoPosition,
    isElectron,
    platform,
    testIPC,
    showNotification,
  }

  return (
    <AppContext.Provider value={value}>
      <CourseProvider>
        <UserProvider>
          <AIProvider>
            {children}
          </AIProvider>
        </UserProvider>
      </CourseProvider>
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return { ...context, ...useCourses(), ...useUser(), ...useAI() }
}