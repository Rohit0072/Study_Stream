// src/pages/bookmarks.tsx
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BookOpen, Clock, Play, ExternalLink, Trash2, Bookmark } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useApp } from "../context/app-context"

export default function BookmarksPage() {
  const navigate = useNavigate()
  const { courses, bookmarks, removeBookmark } = useApp()
  const [selectedCourse, setSelectedCourse] = useState<string>("")

  useEffect(() => {
    // Set default selection if there are courses
    if (courses.length > 0 && !selectedCourse) {
      setSelectedCourse(courses[0].name)
    }
  }, [courses, selectedCourse])

  const handleCourseClick = (courseName: string) => {
    setSelectedCourse(courseName)
  }

  const handlePlayVideo = (courseName: string, videoName: string, timestamp: number) => {
    localStorage.setItem("lastPlayedCourse", courseName)
    navigate(`/playlist/${encodeURIComponent(courseName)}?video=${encodeURIComponent(videoName)}&time=${timestamp}`)
  }

  const handleDeleteBookmark = (bookmarkId: string) => {
    removeBookmark(bookmarkId)
  }

  const getCourseFromName = (courseName: string) => {
    return courses.find(c => c.name === courseName)
  }

  const getVideoFromName = (courseName: string, videoName: string) => {
    const course = getCourseFromName(courseName)
    if (!course) return null
    
    for (const section of course.sections) {
      const video = section.videos.find(v => v.name === videoName)
      if (video) return video
    }
    return null
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString()
  }

  // Group bookmarks by course
  const bookmarksByCourse = courses.reduce((acc, course) => {
    const courseBookmarks = bookmarks.filter(b => b.courseId === course.name)
    if (courseBookmarks.length > 0) {
      acc[course.name] = courseBookmarks
    }
    return acc
  }, {} as Record<string, typeof bookmarks>)

  const totalBookmarksCount = bookmarks.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Bookmarks</h1>
              <p className="text-gray-400 text-sm">Your saved video timestamps</p>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {totalBookmarksCount} total bookmark{totalBookmarksCount !== 1 ? "s" : ""}
          </div>
        </header>

        {totalBookmarksCount === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
              <Bookmark className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">No bookmarks yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Bookmark important moments in your videos to easily return to them later
            </p>
            <button
              onClick={() => navigate("/library")}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Course List */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-white mb-4">Courses</h2>
                <div className="space-y-2">
                  {Object.keys(bookmarksByCourse).map(courseName => (
                    <button
                      key={courseName}
                      onClick={() => handleCourseClick(courseName)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedCourse === courseName
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      <div className="font-medium truncate">{courseName}</div>
                      <div className="text-xs opacity-80">
                        {bookmarksByCourse[courseName].length} bookmark{bookmarksByCourse[courseName].length !== 1 ? "s" : ""}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bookmarks List */}
            <div className="lg:col-span-3">
              <div className="bg-gray-800 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-white mb-4">
                  {selectedCourse ? `Bookmarks - ${selectedCourse}` : "Select a course"}
                </h2>
                {selectedCourse && bookmarksByCourse[selectedCourse] ? (
                  <div className="space-y-3">
                    {bookmarksByCourse[selectedCourse]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((bookmark, index) => (
                        <motion.div
                          key={bookmark.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="bg-gray-700 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-white font-medium mb-1">{bookmark.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(bookmark.timestamp)}</span>
                                <span>•</span>
                                <span>{bookmark.videoId}</span>
                                <span>•</span>
                                <span>{formatDate(bookmark.createdAt)}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteBookmark(bookmark.id)}
                              className="text-gray-400 hover:text-red-400 transition-colors ml-4"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePlayVideo(bookmark.courseId, bookmark.videoId, bookmark.timestamp)}
                              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm"
                            >
                              <Play className="w-4 h-4" />
                              <span>Play from this timestamp</span>
                            </button>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">
                    {selectedCourse ? "No bookmarks for this course" : "Select a course to view bookmarks"}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}