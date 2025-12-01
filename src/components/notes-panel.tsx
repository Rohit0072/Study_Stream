// src/components/notes-panel.tsx
"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Bold, Check, Italic, Save, Brain, Loader2, AlertCircle } from "lucide-react"
import { useApp } from "../context/app-context"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface NotesPanelProps {
  videoName: string
  content: string
  onChange: (content: string) => void
  subtitleContent?: string // Add subtitle content prop
}

export function NotesPanel({ videoName, content, onChange, subtitleContent }: NotesPanelProps) {
  const [notes, setNotes] = useState(content)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveAnimation, setShowSaveAnimation] = useState(false)
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(true)
  const { geminiApiKey, generateAINotes } = useApp()

  useEffect(() => {
    setNotes(content)
  }, [videoName, content])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value)
  }

  const handleSave = () => {
    onChange(notes)
    setIsSaving(true)
    setShowSaveAnimation(true)
    setTimeout(() => {
      setShowSaveAnimation(false)
      setIsSaving(false)
    }, 1500)
  }

  const handleFormatText = (format: "bold" | "italic") => {
    const textarea = document.getElementById("notes-textarea") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = notes.substring(start, end)

    let formattedText = ""
    if (format === "bold") {
      formattedText = `**${selectedText}**`
    } else if (format === "italic") {
      formattedText = `*${selectedText}*`
    }

    const newText = notes.substring(0, start) + formattedText + notes.substring(end)
    setNotes(newText)
    onChange(newText)
  }

  const handleGenerateAINotes = async () => {
    if (!geminiApiKey) {
      setGenerationError("Please set your Gemini API key in settings first.")
      setTimeout(() => setGenerationError(null), 3000)
      return
    }

    if (!subtitleContent || subtitleContent.trim() === "") {
      setGenerationError("No subtitle content available for this video. Please make sure subtitle files are available.")
      setTimeout(() => setGenerationError(null), 3000)
      return
    }

    setIsGeneratingNotes(true)
    setGenerationError(null)

    try {
      // Extract course name from the current URL or use a default
      const pathParts = window.location.pathname.split('/')
      const courseName = pathParts.length > 2 ? decodeURIComponent(pathParts[2]) : "Unknown Course"
      
      const aiNotes = await generateAINotes(courseName, videoName, subtitleContent)
      
      // Prepend a header to indicate these are AI-generated notes
      const formattedNotes = `# AI Generated Notes\n\n${aiNotes}\n\n---\n\n*You can edit these notes as needed.*`
      
      setNotes(formattedNotes)
      onChange(formattedNotes)
    } catch (error) {
      console.error("Error generating AI notes:", error)
      setGenerationError(error instanceof Error ? error.message : "Failed to generate AI notes")
    } finally {
      setIsGeneratingNotes(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes !== content) {
        onChange(notes)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [notes, content, onChange])

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-gray-700 flex items-center gap-1 flex-shrink-0">
        <button onClick={() => handleFormatText("bold")} className="h-8 w-8 rounded-md text-gray-300 hover:bg-gray-700">
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleFormatText("italic")}
          className="h-8 w-8 rounded-md text-gray-300 hover:bg-gray-700"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="mx-1 h-6 w-px bg-gray-700" />
        
        {/* AI Notes Button */}
        <button
          onClick={handleGenerateAINotes}
          disabled={isGeneratingNotes || !subtitleContent}
          className={`h-8 rounded-md text-gray-300 hover:bg-gray-700 px-2 flex items-center gap-1 ${
            isGeneratingNotes ? "opacity-50 cursor-not-allowed" : ""
          } ${!subtitleContent ? "opacity-30 cursor-not-allowed" : ""}`}
          title={subtitleContent ? "Generate AI notes from subtitles" : "No subtitles available"}
        >
          {isGeneratingNotes ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Brain className="w-4 h-4" />
          )}
          <span className="text-xs">AI</span>
        </button>
        
        <div className="mx-1 h-6 w-px bg-gray-700" />
        
        {/* Preview/Edit Toggle */}
        <button
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className={`h-8 rounded-md px-2 flex items-center gap-1 ${
            isPreviewMode 
              ? "bg-purple-600 text-white" 
              : "text-gray-300 hover:bg-gray-700"
          }`}
          title={isPreviewMode ? "Switch to edit mode" : "Switch to preview mode"}
        >
          <span className="text-xs">{isPreviewMode ? "Preview" : "Edit"}</span>
        </button>
        
        <div className="mx-1 h-6 w-px bg-gray-700" />
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="h-8 rounded-md text-gray-300 hover:bg-gray-700 ml-auto px-2 relative"
        >
          {showSaveAnimation ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 text-green-400"
            >
              <Check className="w-4 h-4" />
              <span>Saved</span>
            </motion.div>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1 inline-block" />
              <span>Save</span>
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {generationError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-2 mt-2 p-2 bg-red-900/50 text-red-300 text-sm rounded-md flex items-start gap-2 flex-shrink-0"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{generationError}</span>
        </motion.div>
      )}

      {/* Loading State */}
      {isGeneratingNotes && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-2 mt-2 p-2 bg-blue-900/50 text-blue-300 text-sm rounded-md flex items-center gap-2 flex-shrink-0"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating AI notes from subtitles...</span>
        </motion.div>
      )}

      <div className="flex-1 p-4 overflow-hidden">
        {isPreviewMode ? (
          <div className="w-full h-full bg-gray-800/50 border border-gray-700 text-white rounded-md p-4 overflow-y-auto prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes || "No notes yet. Click the AI button to generate notes from subtitles."}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            id="notes-textarea"
            value={notes}
            onChange={handleChange}
            placeholder="Take notes for this video..."
            className="w-full h-full resize-none bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 rounded-md p-2"
          />
        )}
      </div>
    </div>
  )
}