// src/pages/home.tsx
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BookOpen, Brain, Clock, Play, Plus, Library, Settings, ChevronRight, TrendingUp, Target, Award, Flame, Bookmark, Pin } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useApp } from "../context/app-context"
import { CourseCard } from "../components/course-card"
import { CourseCustomizationModal } from "../components/course-customization-modal"
import { LoadingIndicator } from "../components/loading-indicator"
import { ThemeSwitcher } from "../components/theme-switcher"
import { ThemeCard } from "../components/theme-card"
import { ThemeButton } from "../components/theme-button"
import { ThemeBackground } from "../components/theme-background"

export default function HomePage() {
  const navigate = useNavigate()
  const { 
    courses, 
    selectFolder, 
    userProfile, 
    getTodayStudyTime, 
    getWeeklyProgress,
    generateDailyRecommendation,
    updateCourse,
    updateUserProfile,
    studySessions,
    isLoadingCourses,
    loadingMessage,
    bookmarks,
    getPinnedCourses,
    getRecentCourses,
    pinCourse,
    unpinCourse
  } = useApp()
  
  const [lastPlayedCourse, setLastPlayedCourse] = useState<any>(null)
  const [dailyRecommendation, setDailyRecommendation] = useState<string>("")
  const [weeklyProgress, setWeeklyProgress] = useState<{day: string; minutes: number}[]>([])
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [tempProfile, setTempProfile] = useState({...userProfile})
  const [showCourseCustomization, setShowCourseCustomization] = useState(false)
  const [selectedCourseForCustomization, setSelectedCourseForCustomization] = useState<string>("")
  const [displayCourses, setDisplayCourses] = useState<any[]>([])
  const [logoUrl, setLogoUrl] = useState<string>("")

  // Calculate total study time from all sessions
  const calculateTotalStudyTime = () => {
    return studySessions.reduce((total, session) => total + session.duration, 0)
  }

  // Calculate study streak
  const calculateStudyStreak = () => {
    if (studySessions.length === 0) return 0
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let streak = 0
    let currentDate = new Date(today)
    
    for (let i = 0; i < 365; i++) { // Check up to a year
      const dateString = currentDate.toDateString()
      const hasStudied = studySessions.some(session => 
        new Date(session.date).toDateString() === dateString
      )
      
      if (hasStudied) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (i > 0) { // Allow today to be not studied yet
        break
      } else {
        currentDate.setDate(currentDate.getDate() - 1)
      }
    }
    
    return streak
  }

  // Calculate total course duration
  const calculateTotalCourseDuration = () => {
    return courses.reduce((total, course) => {
      return total + course.sections.reduce((courseTotal, section) => {
        return courseTotal + section.videos.reduce((sectionTotal, video) => {
          const [mins, secs] = video.duration.split(":").map(Number)
          return sectionTotal + (isNaN(mins) ? 0 : mins * 60) + (isNaN(secs) ? 0 : secs)
        }, 0)
      }, 0)
    }, 0)
  }

  useEffect(() => {
    // Load logo on component mount
    const loadLogo = async () => {
      try {
        if (window.electron) {
          const iconPath = await window.electron.getAppIconPath()
          if (iconPath) {
            // In development, Vite serves the icons
            if (iconPath.startsWith('http')) {
              setLogoUrl(iconPath)
            } else {
              // In production, use the file:// protocol
              setLogoUrl(`file://${iconPath}`)
            }
          } else {
            // Fallback to relative path
            setLogoUrl('./icons/icon.png')
          }
        } else {
          // Fallback for web environment
          setLogoUrl('./icons/icon.png')
        }
      } catch (error) {
        console.error('Error loading logo:', error)
        // Final fallback
        setLogoUrl('')
      }
    }
    
    loadLogo()
    
    // Get pinned courses or recent courses if no pinned courses
    const pinnedCourses = getPinnedCourses()
    if (pinnedCourses.length > 0) {
      setDisplayCourses(pinnedCourses)
    } else {
      setDisplayCourses(getRecentCourses())
    }
    
    // Find the last played course
    if (courses.length > 0) {
      // Check if there's a last played course in localStorage
      const lastPlayedCourseName = localStorage.getItem("lastPlayedCourse")
      if (lastPlayedCourseName) {
        const course = courses.find(c => c.name === lastPlayedCourseName)
        if (course) {
          setLastPlayedCourse(course)
          return
        }
      }
      
      // If no last played course, use the first course
      setLastPlayedCourse(courses[0])
    }
    
    // Get weekly progress
    setWeeklyProgress(getWeeklyProgress())
    
    // Generate daily recommendation
    generateDailyRecommendation().then(recommendation => {
      setDailyRecommendation(recommendation)
    }).catch(error => {
      console.error("Error generating recommendation:", error)
      setDailyRecommendation("Continue your learning journey today!")
    })
  }, [courses, getWeeklyProgress, generateDailyRecommendation, getPinnedCourses, getRecentCourses])

  const handleContinueLearning = () => {
    if (lastPlayedCourse) {
      // Save the course name as last played
      localStorage.setItem("lastPlayedCourse", lastPlayedCourse.name)
      navigate(`/playlist/${encodeURIComponent(lastPlayedCourse.name)}`)
    }
  }

  const handleAddCourse = async () => {
    await selectFolder()
  }

  const handleViewLibrary = () => {
    navigate("/library")
  }

  const handleViewBookmarks = () => {
    navigate("/bookmarks")
  }

  const handleOpenSettings = () => {
    navigate("/settings")
  }

  const handleSaveProfile = () => {
    // Update user profile
    const updatedProfile = {
      ...userProfile,
      ...tempProfile
    }
    
    // Extract learning goals from text
    const goalsText = tempProfile.learningGoalsText || ""
    const goals = goalsText.split(",").map(goal => goal.trim()).filter(goal => goal.length > 0)
    
    updateUserProfile({
      ...updatedProfile,
      learningGoals: goals
    })
    
    setShowProfileModal(false)
  }

  const handleOpenCourseCustomization = (courseName: string) => {
    setSelectedCourseForCustomization(courseName)
    setShowCourseCustomization(true)
  }

  const handleDeleteCourse = (courseName: string) => {
    // This would be implemented in the context
    // For now, just a placeholder
    console.log("Delete course:", courseName)
  }

  const handlePinCourse = (courseName: string) => {
    pinCourse(courseName)
    // Update display courses to reflect the change
    const pinnedCourses = getPinnedCourses()
    if (pinnedCourses.length > 0) {
      setDisplayCourses(pinnedCourses)
    }
  }

  const handleUnpinCourse = (courseName: string) => {
    unpinCourse(courseName)
    // Update display courses to reflect the change
    const pinnedCourses = getPinnedCourses()
    if (pinnedCourses.length > 0) {
      setDisplayCourses(pinnedCourses)
    } else {
      setDisplayCourses(getRecentCourses())
    }
  }

  // Dynamic calculations
  const todayMinutes = getTodayStudyTime()
  const totalStudyMinutes = calculateTotalStudyTime()
  const totalHours = Math.round(totalStudyMinutes / 60)
  const currentStreak = calculateStudyStreak()
  const totalCourseDuration = calculateTotalCourseDuration()
  const totalCourseHours = Math.round(totalCourseDuration / 60)
  const dailyProgress = Math.min(100, Math.round((todayMinutes / userProfile.dailyGoal) * 100))

  // Check if we're showing pinned or recent courses
  const pinnedCourses = getPinnedCourses()
  const isShowingPinned = pinnedCourses.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/20 to-background relative">
      <ThemeBackground />
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-theme-gradient flex items-center justify-center">
              {logoUrl ? (
                <img src={logoUrl} className="w-11 h-11 text-primary-foreground" alt="StudyStream Logo" />
              ) : (
                <div className="w-11 h-11 bg-primary-foreground rounded-lg flex items-center justify-center">
                  <span className="text-primary text-xl font-bold">SS</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">StudyStream</h1>
              <p className="text-muted-foreground text-sm">Your personal video learning assistant</p>
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
            <button
              onClick={() => setShowProfileModal(true)}
              className="p-2 rounded-lg bg-card text-card-foreground hover:bg-accent transition-colors"
              title="Profile"
            >
              <div className="w-8 h-8 rounded-full bg-theme-gradient flex items-center justify-center">
                <span className="text-primary-foreground font-medium text-sm">
                  {userProfile.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </button>
            <button
              onClick={handleOpenSettings}
              className="p-2 rounded-lg bg-card text-card-foreground hover:bg-accent transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Welcome Section with User Info */}
        <div className="mb-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold text-foreground mb-2"
          >
            Welcome back, {userProfile.name}!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-muted-foreground"
          >
            {userProfile.learningGoals.length > 0 
              ? `Focus: ${userProfile.learningGoals.join(", ")}`
              : "Continue your learning journey"
            }
          </motion.p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <ThemeCard>
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-xs text-muted-foreground">Streak</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{currentStreak}</div>
              <div className="text-xs text-muted-foreground">days</div>
            </ThemeCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ThemeCard>
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-muted-foreground">Today</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{todayMinutes}</div>
              <div className="text-xs text-muted-foreground">minutes</div>
            </ThemeCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <ThemeCard>
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{totalHours}</div>
              <div className="text-xs text-muted-foreground">hours studied</div>
            </ThemeCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <ThemeCard>
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-xs text-muted-foreground">Achievements</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{userProfile.achievements.length}</div>
              <div className="text-xs text-muted-foreground">earned</div>
            </ThemeCard>
          </motion.div>
        </div>

        {/* Daily Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <ThemeCard>
            <h3 className="text-lg font-semibold text-foreground mb-4">Daily Progress</h3>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Goal: {userProfile.dailyGoal} minutes</span>
              <span className="text-sm text-muted-foreground">{dailyProgress}%</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-theme-gradient rounded-full transition-all duration-500"
                style={{ width: `${dailyProgress}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {todayMinutes} / {userProfile.dailyGoal} minutes completed
            </div>
          </ThemeCard>
        </motion.div>

        {/* Weekly Progress Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-8"
        >
          <ThemeCard>
            <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Progress</h3>
            <div className="flex items-end justify-between h-32">
              {weeklyProgress.map((day, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-theme-gradient rounded-t transition-all duration-500"
                    style={{ 
                      height: `${Math.max(5, (day.minutes / userProfile.dailyGoal) * 100)}%`,
                      opacity: day.minutes > 0 ? 1 : 0.3
                    }}
                  ></div>
                  <span className="text-xs text-muted-foreground mt-2">{day.day}</span>
                  <span className="text-xs text-muted-foreground">{day.minutes}m</span>
                </div>
              ))}
            </div>
          </ThemeCard>
        </motion.div>

        {/* AI Recommendation */}
        {dailyRecommendation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <ThemeCard>
              <div className="flex items-start gap-3">
                <Brain className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Today's Recommendation</h3>
                  <p className="text-muted-foreground">{dailyRecommendation}</p>
                </div>
              </div>
            </ThemeCard>
          </motion.div>
        )}

        {/* Quick Actions - Restored original look with equal heights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={handleContinueLearning}
          >
            <ThemeCard className="bg-theme-gradient text-primary-foreground cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 h-full">
              <div className="flex items-center justify-between mb-4">
                <Play className="w-8 h-8" />
                <div className="bg-white/20 rounded-full px-3 py-1 text-sm">
                  Continue
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Continue Learning</h3>
              <p className="text-primary-foreground/80 flex-grow">
                {lastPlayedCourse 
                  ? `Resume ${lastPlayedCourse.name}` 
                  : "Start your learning journey"}
              </p>
            </ThemeCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onClick={handleViewLibrary}
          >
            <ThemeCard className="text-card-foreground cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 h-full">
              <div className="flex items-center justify-between mb-4">
                <Library className="w-8 h-8" />
                <div className="bg-secondary rounded-full px-3 py-1 text-sm text-secondary-foreground">
                  Browse
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">View Library</h3>
              <p className="text-muted-foreground flex-grow">Browse all your courses</p>
            </ThemeCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onClick={handleAddCourse}
          >
            <ThemeCard className="bg-gradient-to-br from-blue-600 to-blue-800 text-white cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 h-full">
              <div className="flex items-center justify-between mb-4">
                <Plus className="w-8 h-8" />
                <div className="bg-white/20 rounded-full px-3 py-1 text-sm">
                  Add New
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Add Course</h3>
              <p className="text-blue-100 flex-grow">Import a new course</p>
            </ThemeCard>
          </motion.div>
        </div>

        {/* Pinned/Recent Courses */}
        {displayCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {isShowingPinned ? "Pinned Courses" : "Recent Courses"}
                </h2>
                {isShowingPinned && (
                  <Pin className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <button
                onClick={handleViewLibrary}
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayCourses.map((course, index) => (
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
          </motion.div>
        )}

        {/* Empty State */}
        {courses.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center py-16"
          >
            <ThemeCard className="inline-block">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-card flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-2">No courses yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add your first course to start your learning journey
              </p>
              <ThemeButton onClick={handleAddCourse}>
                Add Your First Course
              </ThemeButton>
            </ThemeCard>
          </motion.div>
        )}
      </div>

      {/* Loading Indicator */}
      <LoadingIndicator isLoading={isLoadingCourses} message={loadingMessage} />

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">Your Profile</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-muted-foreground text-sm font-medium mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={tempProfile.name}
                  onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})}
                  className="w-full p-3 bg-input text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              
              <div>
                <label className="block text-muted-foreground text-sm font-medium mb-1">
                  Learning Goals (comma separated)
                </label>
                <input
                  type="text"
                  value={tempProfile.learningGoalsText || userProfile.learningGoals.join(", ")}
                  onChange={(e) => setTempProfile({...tempProfile, learningGoalsText: e.target.value})}
                  placeholder="e.g., React Developer, Docker, Kubernetes"
                  className="w-full p-3 bg-input text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              
              <div>
                <label className="block text-muted-foreground text-sm font-medium mb-1">
                  Daily Study Goal (minutes)
                </label>
                <input
                  type="number"
                  value={tempProfile.dailyGoal}
                  onChange={(e) => setTempProfile({...tempProfile, dailyGoal: parseInt(e.target.value) || 30})}
                  min="5"
                  max="480"
                  className="w-full p-3 bg-input text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              
              <div>
                <label className="block text-muted-foreground text-sm font-medium mb-1">
                  Preferred Study Time
                </label>
                <select
                  value={tempProfile.preferredStudyTime}
                  onChange={(e) => setTempProfile({...tempProfile, preferredStudyTime: e.target.value})}
                  className="w-full p-3 bg-input text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-muted-foreground text-sm font-medium">
                  Enable Notifications
                </label>
                <button
                  onClick={() => setTempProfile({...tempProfile, notificationsEnabled: !tempProfile.notificationsEnabled})}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    tempProfile.notificationsEnabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div className={`w-5 h-5 bg-background rounded-full transition-transform ${
                    tempProfile.notificationsEnabled ? "translate-x-6" : "translate-x-0.5"
                  }`}></div>
                </button>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <ThemeButton onClick={handleSaveProfile}>
                Save
              </ThemeButton>
            </div>
          </motion.div>
        </div>
      )}

      {/* Course Customization Modal */}
      <CourseCustomizationModal
        isOpen={showCourseCustomization}
        onClose={() => setShowCourseCustomization(false)}
        courseName={selectedCourseForCustomization}
      />
    </div>
  )
}