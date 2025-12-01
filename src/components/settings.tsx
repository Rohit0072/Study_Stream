// src/pages/settings.tsx
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Save, Key, Globe, Volume2, Moon, Sun, Info } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useApp } from "../context/app-context"

export default function SettingsPage() {
  const navigate = useNavigate()
  const { geminiApiKey, setGeminiApiKey } = useApp()
  const [apiKey, setApiKey] = useState(geminiApiKey || "")
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [savedMessage, setSavedMessage] = useState("")
  const [showApiKeyInfo, setShowApiKeyInfo] = useState(false)

  useEffect(() => {
    setApiKey(geminiApiKey || "")
  }, [geminiApiKey])

  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKey)
    setSavedMessage("API key saved successfully!")
    setTimeout(() => setSavedMessage(""), 3000)
  }

  const handleBack = () => {
    navigate("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-gray-400 text-sm">Customize your learning experience</p>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto">
          {/* API Key Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-800 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Gemini API Key</h2>
              <button
                onClick={() => setShowApiKeyInfo(!showApiKeyInfo)}
                className="ml-auto p-1 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            
            {showApiKeyInfo && (
              <div className="mb-4 p-3 bg-gray-700 rounded-lg text-sm text-gray-300">
                <p className="mb-2">Get your API key from:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Go to <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a></li>
                  <li>Create a new API key</li>
                  <li>Copy and paste it here</li>
                </ol>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Save API Key
              </button>
              
              {savedMessage && (
                <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-300 text-sm">
                  {savedMessage}
                </div>
              )}
            </div>
          </motion.div>

          {/* Appearance Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Appearance</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Theme</h3>
                  <p className="text-gray-400 text-sm">Choose your preferred theme</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsDarkMode(false)}
                    className={`p-2 rounded-lg ${!isDarkMode ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"} transition-colors`}
                  >
                    <Sun className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsDarkMode(true)}
                    className={`p-2 rounded-lg ${isDarkMode ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"} transition-colors`}
                  >
                    <Moon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">About</h2>
            </div>
            
            <div className="space-y-2 text-gray-300">
              <p>StudyStream v1.0.0</p>
              <p>Your personal video learning assistant</p>
              <p className="text-sm text-gray-400">© 2023 StudyStream. All rights reserved.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}