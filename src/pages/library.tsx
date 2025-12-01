// src/pages/library.tsx
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BookOpen, Plus, Search, Filter, Bookmark } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useApp } from "../context/app-context"
import { CourseCard } from "../components/course-card"
import { CourseCustomizationModal } from "../components/course-customization-modal"
import { LoadingIndicator } from "../components/loading-indicator"
import { ThemeSwitcher } from "../components/theme-switcher"
import { ThemeCard } from "../components/theme-card"
import { ThemeButton } from "../components/theme-button"
import { ThemeBackground } from "../components/theme-background"

export default function LibraryPage() {
  const navigate = useNavigate()
  const { 
    courses, 
    selectFolder, 
    removeCourse,
    pinCourse,
    unpinCourse,
    isLoadingCourses,
    loadingMessage,
    loadingProgress,
    bookmarks
  } = useApp()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [showCourseCustomization, setShowCourseCustomization] = useState(false)
  const [selectedCourseForCustomization, setSelectedCourseForCustomization] = useState<string>("")

  const handleAddCourse = async () => {
    await selectFolder()
  }

  const handleViewBookmarks = () => {
    navigate("/bookmarks")
  }

  const handleOpenCourseCustomization = (courseName: string) => {
    setSelectedCourseForCustomization(courseName)
    setShowCourseCustomization(true)
  }

  const handleDeleteCourse = (courseName: string) => {
    removeCourse(courseName)
  }

  const handlePinCourse = (courseName: string) => {
    pinCourse(courseName)
  }

  const handleUnpinCourse = (courseName: string) => {
    unpinCourse(courseName)
  }

  // Filter courses based on search term
  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.tags && course.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  )

  // Sort courses: pinned courses first, then alphabetically
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    // If one is pinned and the other is not, the pinned one comes first
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    
    // If both are pinned or both are not pinned, sort alphabetically
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/20 to-background relative">
      <ThemeBackground />
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-lg bg-card text-card-foreground hover:bg-accent transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Course Library</h1>
              <p className="text-muted-foreground text-sm">Manage your learning materials</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <button
              onClick={handleViewBookmarks}
              className="p-2 rounded-lg bg-card text-card-foreground hover:bg-accent transition-colors relative"
              title="Bookmarks"
            >
              <Bookmark className="w-5 h-5" />
              {bookmarks.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {bookmarks.length}
                </span>
              )}
            </button>
            <ThemeButton onClick={handleAddCourse}>
              <Plus className="w-5 h-5" />
              Add Course
            </ThemeButton>
          </div>
        </header>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-input text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Course Grid */}
        {sortedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedCourses.map((course, index) => (
              <CourseCard
                key={course.name}
                course={course}
                index={index}
                onClick={() => {
                  localStorage.setItem("lastPlayedCourse", course.name)
                  navigate(`/playlist/${encodeURIComponent(course.name)}`)
                }}
                onDelete={() => handleDeleteCourse(course.name)}
                onCustomize={() => handleOpenCourseCustomization(course.name)}
                onPin={() => handlePinCourse(course.name)}
                onUnpin={() => handleUnpinCourse(course.name)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            {searchTerm ? (
              <ThemeCard className="inline-block">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-card flex items-center justify-center">
                  <Search className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Try adjusting your search terms or add a new course
                </p>
              </ThemeCard>
            ) : (
              <ThemeCard className="inline-block">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-card flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Add your first course to start your learning journey
                </p>
              </ThemeCard>
            )}
            <ThemeButton onClick={handleAddCourse}>
              Add Your First Course
            </ThemeButton>
          </div>
        )}

        {/* Loading Indicator */}
        <LoadingIndicator 
          isLoading={isLoadingCourses} 
          message={loadingMessage} 
          progress={loadingProgress}
        />

        {/* Course Customization Modal */}
        <CourseCustomizationModal
          isOpen={showCourseCustomization}
          onClose={() => setShowCourseCustomization(false)}
          courseName={selectedCourseForCustomization}
        />
      </div>
    </div>
  )
}