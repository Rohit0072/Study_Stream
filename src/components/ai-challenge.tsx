// src/components/ai-challenge.tsx
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Brain, CheckCircle, XCircle, SkipForward, Loader2 } from "lucide-react"
import { useApp } from "../context/app-context"

interface AIChallengeProps {
  courseName: string
  sectionName: string
  videoName: string
  subtitleContent: string
  onComplete: () => void
}

export function AIChallenge({ courseName, sectionName, videoName, subtitleContent, onComplete }: AIChallengeProps) {
  const { generateChallenge, submitChallengeAnswer, skipChallenge } = useApp()
  const [challenge, setChallenge] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [openEndedAnswer, setOpenEndedAnswer] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [challengeId, setChallengeId] = useState<string>("")

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const generatedChallenge = await generateChallenge(courseName, sectionName, videoName, subtitleContent)
        if (generatedChallenge) {
          setChallenge(generatedChallenge)
          setChallengeId(generatedChallenge.id)
          
          // Save the challenge to localStorage
          const savedChallenges = localStorage.getItem("challenges") || "{}"
          const challenges = JSON.parse(savedChallenges)
          challenges[generatedChallenge.id] = generatedChallenge
          localStorage.setItem("challenges", JSON.stringify(challenges))
        }
      } catch (error) {
        console.error("Error generating challenge:", error)
        // Create a fallback challenge if API fails
        const fallbackChallenge = {
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
        setChallenge(fallbackChallenge)
        setChallengeId(fallbackChallenge.id)
        
        // Save the fallback challenge to localStorage
        const savedChallenges = localStorage.getItem("challenges") || "{}"
        const challenges = JSON.parse(savedChallenges)
        challenges[fallbackChallenge.id] = fallbackChallenge
        localStorage.setItem("challenges", JSON.stringify(challenges))
      } finally {
        setLoading(false)
      }
    }

    loadChallenge()
  }, [courseName, sectionName, videoName, subtitleContent, generateChallenge])

  const handleSubmitAnswer = async () => {
    if (!challenge || !challengeId) return

    setSubmitting(true)
    try {
      const answer = challenge.type === "multiple-choice" ? selectedAnswer : openEndedAnswer
      const response = await submitChallengeAnswer(challengeId, answer)
      setResult(response)
      setShowResult(true)
    } catch (error) {
      console.error("Error submitting answer:", error)
      // Create a fallback result if API fails
      const isCorrect = challenge.type === "multiple-choice" 
        ? selectedAnswer === challenge.correctAnswer 
        : true; // For open-ended, assume correct
      
      setResult({
        correct: isCorrect,
        feedback: isCorrect 
          ? "Great job! You've demonstrated a good understanding of the material." 
          : "Not quite right. Review the material and try again."
      })
      setShowResult(true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkipChallenge = () => {
    if (!challengeId) return

    skipChallenge(challengeId)
    onComplete()
  }

  const handleClose = () => {
    onComplete()
  }

  const handleContinue = () => {
    setShowResult(false)
    if (result && result.correct) {
      onComplete()
    } else {
      // Reset for another attempt
      setSelectedAnswer("")
      setOpenEndedAnswer("")
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
          <div className="flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-purple-500 mr-3" />
            <h2 className="text-xl font-bold text-white">Generating Challenge</h2>
          </div>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mr-3" />
            <span className="text-gray-300">Creating a personalized challenge...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
          <div className="flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-500 mr-3" />
            <h2 className="text-xl font-bold text-white">Error</h2>
          </div>
          <p className="text-gray-300 mb-6">Failed to generate challenge. Please try again later.</p>
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 rounded-xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Brain className="w-6 h-6 text-purple-500 mr-2" />
            <h2 className="text-xl font-bold text-white">Knowledge Check</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">
            {courseName} / {sectionName}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            {videoName}
          </p>
        </div>

        {showResult ? (
          <>
            <div className="mb-6">
              <div className={`flex items-center mb-4 ${result?.correct ? "text-green-400" : "text-red-400"}`}>
                {result?.correct ? (
                  <CheckCircle className="w-6 h-6 mr-2" />
                ) : (
                  <XCircle className="w-6 h-6 mr-2" />
                )}
                <span className="text-lg font-semibold">
                  {result?.correct ? "Correct!" : "Not quite right"}
                </span>
              </div>
              <p className="text-gray-300">{result?.feedback}</p>
            </div>
            <button
              onClick={handleContinue}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {result?.correct ? "Continue" : "Try Again"}
            </button>
          </>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-white text-lg">{challenge.question}</p>
            </div>

            {challenge.type === "multiple-choice" ? (
              <div className="space-y-3 mb-6">
                {challenge.options?.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnswer(option)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedAnswer === option
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mb-6">
                <textarea
                  value={openEndedAnswer}
                  onChange={(e) => setOpenEndedAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={4}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSkipChallenge}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Skip
              </button>
              <button
                onClick={handleSubmitAnswer}
                disabled={submitting || (challenge.type === "multiple-choice" ? !selectedAnswer : !openEndedAnswer)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}