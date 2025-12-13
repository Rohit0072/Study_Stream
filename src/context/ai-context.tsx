// src/context/ai-context.tsx
"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useUser } from "./user-context"
import { useCourses } from "./course-context"

interface Challenge {
  id: string
  type: "multiple-choice" | "open-ended"
  question: string
  options?: string[]
  correctAnswer?: string
  courseName: string
  sectionName: string
  videoName: string
}

interface AIContextType {
  geminiApiKey: string
  setGeminiApiKey: (key: string) => void
  generateAINotes: (courseName: string, videoName: string, subtitleContent: string) => Promise<string>
  generateDailyRecommendation: () => Promise<string>
  generateChallenge: (courseName: string, sectionName: string, videoName: string, subtitleContent: string) => Promise<Challenge>
  submitChallengeAnswer: (challengeId: string, answer: string) => Promise<{ correct: boolean; feedback: string }>
  skipChallenge: (challengeId: string) => void
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [geminiApiKey, setGeminiApiKey] = useState<string>("")
  const { userProfile, getTodayStudyTime, updateUserProfile } = useUser()
  const { courses } = useCourses()
  const isElectron = typeof window !== "undefined" && window.electron !== undefined

  useEffect(() => {
    if (isElectron) {
      const savedApiKey = localStorage.getItem("geminiApiKey")
      if (savedApiKey) {
        setGeminiApiKey(savedApiKey)
      }
    }
  }, [isElectron])

  const setGeminiApiKeyHandler = (key: string) => {
    setGeminiApiKey(key)
    localStorage.setItem("geminiApiKey", key)
  }

  const generateAINotes = async (courseName: string, videoName: string, subtitleContent: string) => {
    if (!geminiApiKey) throw new Error("Gemini API key is not set.")
    if (!geminiApiKey.startsWith("AIza")) throw new Error("Invalid Gemini API key format.")

    const prompt = `...` // Same prompt as before
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })

    if (!response.ok) throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    const data = await response.json()
    return data.candidates[0].content.parts[0].text
  }

  const generateDailyRecommendation = async () => {
    if (!geminiApiKey) return "Please set your Gemini API key in settings."

    const lastPlayedCourseName = localStorage.getItem("lastPlayedCourse")
    const lastPlayedCourse = courses.find(c => c.name === lastPlayedCourseName)
    const todayMinutes = getTodayStudyTime()
    const remainingMinutes = Math.max(0, userProfile.dailyGoal - todayMinutes)
    const goalsText = userProfile.learningGoals.join(", ") || "general learning"

    const prompt = `...` // Same prompt as before
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })

    if (!response.ok) return "Continue your learning journey today!"
    const data = await response.json()
    return data.candidates[0].content.parts[0].text
  }

  const generateChallenge = async (courseName: string, sectionName: string, videoName: string, subtitleContent: string) => {
    if (!geminiApiKey) throw new Error("Gemini API key is not set.")

    const challengeType = Math.random() > 0.5 ? "multiple-choice" : "open-ended"
    const prompt = `...` // Same prompt as before

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })

    if (!response.ok) throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    const data = await response.json()
    const challengeData = JSON.parse(data.candidates[0].content.parts[0].text)

    return {
      id: `${courseName}-${sectionName}-${videoName}-${Date.now()}`,
      type: challengeType,
      ...challengeData,
      courseName,
      sectionName,
      videoName
    }
  }

  const submitChallengeAnswer = async (challengeId: string, answer: string) => {
    // ... (implementation from app-context)
  }

  const skipChallenge = (challengeId: string) => {
    updateUserProfile({ skippedQuestions: userProfile.skippedQuestions + 1 })
    // ... (rest of implementation from app-context)
  }

  const value: AIContextType = {
    geminiApiKey,
    setGeminiApiKey: setGeminiApiKeyHandler,
    generateAINotes,
    generateDailyRecommendation,
    generateChallenge,
    submitChallengeAnswer,
    skipChallenge,
  }

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>
}

export function useAI() {
  const context = useContext(AIContext)
  if (context === undefined) {
    throw new Error("useAI must be used within an AIProvider")
  }
  return context
}