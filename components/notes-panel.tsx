    "use client"
    
    import type React from "react"
    
    import { useEffect, useState } from "react"
    import { motion } from "framer-motion"
    import { Bold, Check, Italic, Save } from "lucide-react"
    
    import { Button } from "@/components/ui/button"
    import { Separator } from "@/components/ui/separator"
    import { Textarea } from "@/components/ui/textarea"
    
    interface NotesPanelProps {
      videoName: string
      content: string
      onChange: (content: string) => void
    }
    
    export function NotesPanel({ videoName, content, onChange }: NotesPanelProps) {
      const [notes, setNotes] = useState(content)
      const [isSaving, setIsSaving] = useState(false)
      const [showSaveAnimation, setShowSaveAnimation] = useState(false)
    
      // Update notes when video changes
      useEffect(() => {
        setNotes(content)
      }, [videoName, content])
    
      const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value)
      }
    
      const handleSave = () => {
        onChange(notes)
        setIsSaving(true)
    
        // Show save animation
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
    
        // Auto-save after formatting
        onChange(newText)
      }
    
      // Auto-save notes after 2 seconds of inactivity
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
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white mb-1">Notes</h3>
            <p className="text-sm text-gray-400 truncate">{videoName}</p>
          </div>
    
          <div className="p-2 border-b border-gray-700 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleFormatText("bold")}
              className="h-8 w-8 rounded-md text-gray-300 hover:bg-gray-700"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleFormatText("italic")}
              className="h-8 w-8 rounded-md text-gray-300 hover:bg-gray-700"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 rounded-md text-gray-300 hover:bg-gray-700 ml-auto relative"
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
                  <Save className="w-4 h-4 mr-1" />
                  <span>Save</span>
                </>
              )}
            </Button>
          </div>
    
          <div className="flex-1 p-4 overflow-hidden">
            <Textarea
              id="notes-textarea"
              value={notes}
              onChange={handleChange}
              placeholder="Take notes for this video..."
              className="w-full h-full resize-none bg-gray-800/50 border-gray-700 text-white focus-visible:ring-purple-500"
            />
          </div>
        </div>
      )
    }
