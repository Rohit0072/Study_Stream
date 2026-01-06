import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'
import { Course, LibraryState } from '@/types'
import { get, set, del } from 'idb-keyval'

// Custom Async Storage Adapter using IndexedDB
const storage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        // console.log(name, 'has been retrieved')
        return (await get(name)) || null
    },
    setItem: async (name: string, value: string): Promise<void> => {
        // console.log(name, 'with value', value, 'has been saved')
        await set(name, value)
    },
    removeItem: async (name: string): Promise<void> => {
        // console.log(name, 'has been deleted')
        await del(name)
    },
}

// Define User Profile Interface
export interface UserProfile {
    name: string;
    studyGoal: number; // Daily goal in hours
    preferredTime: string; // "morning", "night", etc.
}

interface LibraryActions {
    setCourses: (courses: Course[]) => void
    addCourse: (course: Course) => void
    removeCourse: (courseId: string) => void
    setLoading: (isLoading: boolean) => void
    setActiveCourse: (courseId: string | null) => void
    updateVideoProgress: (courseId: string, videoId: string, progress: number, completed: boolean, duration?: number) => void
    toggleSection: (courseId: string, sectionId: string) => void
    setSingleExpandedSection: (courseId: string, sectionId: string) => void
    trackStudyTime: (seconds: number) => void
    saveNote: (courseId: string, videoId: string, content: string) => void
    clearData: () => void
    setApiKey: (key: string) => void;
    setImageGenProvider: (provider: 'huggingface' | 'deepai' | 'magicstudio' | 'raphael' | 'pollinations' | 'puter') => void;
    setDeepAiApiKey: (key: string) => void;
    setHuggingFaceApiKey: (key: string) => void;
    setFluxZeroGpuToken: (token: string) => void;
    setFluxZeroGpuUuid: (uuid: string) => void;
    // New Actions
    updateUserProfile: (profile: Partial<UserProfile>) => void;
    updateCourseImage: (courseId: string, imageUrl: string) => void;
    toggleCoursePin: (courseId: string) => void;
    setCourseColor: (courseId: string, color: string) => void;
    setDevMode: (enabled: boolean) => void;
    addManualStudyLog: (date: string, seconds: number) => void;

    // Folder Actions
    createFolder: (name: string) => void;
    deleteFolder: (folderId: string) => void;
    renameFolder: (folderId: string, name: string) => void;
    moveCourse: (courseId: string, targetFolderId: string | null) => void; // null = root

    // AI Actions
    addTodo: (text: string, type: 'daily' | 'weekly' | 'long-term') => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    updateAiProfile: (profile: Partial<UserProfile>) => void; // Using Partial<UserProfile> to match generic, but acts on AiProfile logic 
    // Wait, the interface says `updateAiProfile: (profile: Partial<AiProfile>) => void;` in types.
    // Let me check lines again. I need to be careful with types.
    addQuizResult: (result: any) => void; // Using any temporarily to avoid import issues in replace block, will fix if needed
    addBookmark: (bookmark: any) => void;
    removeBookmark: (id: string) => void;
}

export const useLibraryStore = create<LibraryState & LibraryActions & { userProfile: UserProfile, devMode: boolean }>()(
    persist(
        (set, get) => ({
            courses: (typeof window !== 'undefined' && !(window as any).electron) ? [{
                id: 'real-path-test',
                name: 'Machine Learning & Data Science',
                path: 'D:\\courses\\DATA SCIENCE\\Machine-Learning-Data-Science-Deep-Learning-Python',
                totalVideos: 1,
                completedVideos: 0,
                sections: [
                    {
                        id: 'sec-1',
                        name: 'Getting Started',
                        path: 'D:\\courses\\DATA SCIENCE\\Machine-Learning-Data-Science-Deep-Learning-Python\\1 - Getting Started',
                        videos: [
                            {
                                id: 'vid-1',
                                name: '1 - Introduction',
                                path: 'D:\\courses\\DATA SCIENCE\\Machine-Learning-Data-Science-Deep-Learning-Python\\1 - Getting Started\\1 - Introduction.mp4',
                                completed: false,
                                progress: 0
                            }
                        ]
                    }
                ]
            }, {
                id: 'real-path-test-2', // Fixed ID duplicate in mock
                name: 'Machine Learning & Data Science',
                path: 'D:\\courses\\DATA SCIENCE\\Machine-Learning-Data-Science-Deep-Learning-Python',
                totalVideos: 1,
                completedVideos: 0,
                sections: [
                    {
                        id: 'sec-1',
                        name: 'Getting Started',
                        path: 'D:\\courses\\DATA SCIENCE\\Machine-Learning-Data-Science-Deep-Learning-Python\\1 - Getting Started',
                        videos: [
                            {
                                id: 'vid-1',
                                name: '1 - Introduction',
                                path: 'D:\\courses\\DATA SCIENCE\\Machine-Learning-Data-Science-Deep-Learning-Python\\1 - Getting Started\\1 - Introduction.mp4',
                                completed: false,
                                progress: 0
                            }
                        ]
                    }
                ]
            }] : [],
            folders: [],
            isLoading: false,
            activeCourseId: null,
            activeVideoId: null,
            studyLog: {},
            notes: {}, // Initialized notes state
            settings: {
                geminiApiKey: null,
                geminiModel: "gemini-1.5-flash",
                imageGenProvider: 'pollinations', // Default (HuggingFace is unreliable)
                huggingFaceApiKey: null,
                deepAiApiKey: null
            },
            todos: [],
            quizResults: [],
            aiProfile: {
                goals: [],
                interests: [],
                learningStyle: 'visual',
                bio: ''
            },
            fluxZeroGpuUuid: null,

            // User Profile
            userProfile: {
                name: "Student",
                studyGoal: 2, // Default 2h
                preferredTime: "any"
            },
            devMode: false,

            setApiKey: (key) => set((state) => ({
                settings: { ...state.settings, geminiApiKey: key }
            })),

            setModel: (model) => set((state) => ({
                settings: { ...state.settings, geminiModel: model }
            })),

            activeQuiz: null,
            setActiveQuiz: (quiz) => set({ activeQuiz: quiz }),
            updateActiveQuiz: (updates) => set((state) => ({
                activeQuiz: state.activeQuiz ? { ...state.activeQuiz, ...updates } : null
            })),
            bookmarks: [], // Initial empty state

            chatSessions: {},
            addChatMessage: (videoId, message) => set((state) => ({
                chatSessions: {
                    ...state.chatSessions,
                    [videoId]: [...(state.chatSessions[videoId] || []), message]
                }
            })),
            clearChatSession: (videoId) => set((state) => {
                const newSessions = { ...state.chatSessions };
                delete newSessions[videoId];
                return { chatSessions: newSessions };
            }),

            addBookmark: (bookmark) => set((state) => ({
                bookmarks: [...state.bookmarks, bookmark]
            })),

            removeBookmark: (id) => set((state) => ({
                bookmarks: state.bookmarks.filter(b => b.id !== id)
            })),

            setImageGenProvider: (provider) => set((state) => ({
                settings: { ...state.settings, imageGenProvider: provider }
            })),

            setHuggingFaceApiKey: (key) => set((state) => ({
                settings: { ...state.settings, huggingFaceApiKey: key }
            })),

            setDeepAiApiKey: (key) => set((state) => ({
                settings: { ...state.settings, deepAiApiKey: key }
            })),

            setFluxZeroGpuToken: (token) => { /* no-op in types for now but keeping interface compat */ },
            setFluxZeroGpuUuid: (uuid) => set((state) => ({ fluxZeroGpuUuid: uuid })),

            updateUserProfile: (profile) => set((state) => ({
                userProfile: { ...state.userProfile, ...profile }
            })),

            updateCourseImage: (courseId, imageUrl) => set((state) => ({
                courses: state.courses.map(course =>
                    course.id === courseId ? { ...course, coverImage: imageUrl } : course
                )
            })),

            toggleCoursePin: (courseId) => set((state) => ({
                courses: state.courses.map(course =>
                    course.id === courseId ? { ...course, isPinned: !course.isPinned } : course
                )
            })),

            setCourseColor: (courseId, color) => set((state) => ({
                courses: state.courses.map(course =>
                    course.id === courseId ? { ...course, color } : course
                )
            })),

            setDevMode: (enabled) => set({ devMode: enabled }),

            // Folder Implementation
            createFolder: (name) => set((state) => ({
                folders: [...(state.folders || []), {
                    id: crypto.randomUUID(),
                    name,
                    courseIds: [],
                    createdAt: Date.now()
                }]
            })),

            deleteFolder: (folderId) => set((state) => ({
                folders: (state.folders || []).filter(f => f.id !== folderId)
                // Courses that were in this folder automatically "become" root courses 
                // because they are no longer in any folder's courseIds list.
            })),

            renameFolder: (folderId, name) => set((state) => ({
                folders: (state.folders || []).map(f => f.id === folderId ? { ...f, name } : f)
            })),

            moveCourse: (courseId, targetFolderId) => set((state) => {
                const folders = state.folders || [];

                // 1. Remove from ANY existing folder
                const cleanedFolders = folders.map(f => ({
                    ...f,
                    courseIds: f.courseIds.filter(id => id !== courseId)
                }));

                // 2. Add to target folder if specified
                if (targetFolderId) {
                    return {
                        folders: cleanedFolders.map(f =>
                            f.id === targetFolderId
                                ? { ...f, courseIds: [...f.courseIds, courseId] }
                                : f
                        )
                    };
                }

                // If target is null (Root), we just leave it removed from cleanedFolders
                return { folders: cleanedFolders };
            }),

            addManualStudyLog: (date, seconds) => set((state) => ({
                studyLog: {
                    ...state.studyLog,
                    [date]: (state.studyLog[date] || 0) + seconds
                }
            })),

            addTodo: (text, type) => set((state) => ({
                todos: [...state.todos, {
                    id: crypto.randomUUID(),
                    text,
                    type,
                    completed: false,
                    createdAt: Date.now()
                }]
            })),

            toggleTodo: (id) => set((state) => ({
                todos: state.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
            })),

            deleteTodo: (id) => set((state) => ({
                todos: state.todos.filter(t => t.id !== id)
            })),

            updateAiProfile: (profile) => set((state) => ({
                aiProfile: { ...state.aiProfile, ...profile }
            })),

            addQuizResult: (result) => set((state) => ({
                quizResults: [...state.quizResults, result]
            })),

            setCourses: (courses) => set({ courses }),

            addCourse: (course) => {
                const exists = get().courses.some(c => c.path === course.path);
                if (!exists) {
                    set((state) => ({ courses: [...state.courses, course] }));
                }
            },

            removeCourse: (courseId) => set((state) => ({
                courses: state.courses.filter(c => c.id !== courseId),
                // Also remove from any folders
                folders: (state.folders || []).map(f => ({
                    ...f,
                    courseIds: f.courseIds.filter(id => id !== courseId)
                }))
            })),

            setLoading: (isLoading) => set({ isLoading }),

            setActiveCourse: (courseId) => set({ activeCourseId: courseId }),

            updateVideoProgress: (courseId, videoId, progress, completed, duration) => set((state) => {

                const newCourses = state.courses.map(course => {
                    if (course.id !== courseId) return course;

                    let courseCompletedCount = 0;

                    const newSections = course.sections.map(section => {
                        const newVideos = section.videos.map(video => {
                            if (video.id !== videoId) {
                                if (video.completed) courseCompletedCount++;
                                return video;
                            }

                            // Preserve existing completion status if false is passed
                            const newCompleted = completed || video.completed;
                            if (newCompleted) courseCompletedCount++;

                            return {
                                ...video,
                                progress,
                                completed: newCompleted,
                                lastPlayedAt: Date.now(),
                                duration: duration || video.duration
                            };
                        });
                        return { ...section, videos: newVideos };
                    });

                    return {
                        ...course,
                        sections: newSections,
                        completedVideos: courseCompletedCount,
                        lastPlayedVideoId: videoId
                    };
                });

                return { courses: newCourses };
            }),

            toggleSection: (courseId, sectionId) => set((state) => ({
                courses: state.courses.map(course => {
                    if (course.id !== courseId) return course;
                    return {
                        ...course,
                        sections: course.sections.map(section => {
                            if (section.id !== sectionId) return section;
                            return { ...section, isExpanded: section.isExpanded === undefined ? false : !section.isExpanded };
                        })
                    };
                })
            })),

            setSingleExpandedSection: (courseId, sectionId) => set((state) => ({
                courses: state.courses.map(course => {
                    if (course.id !== courseId) return course;
                    return {
                        ...course,
                        sections: course.sections.map(section => ({
                            ...section,
                            // Expand if matches ID, collapse otherwise
                            isExpanded: section.id === sectionId
                        }))
                    };
                })
            })),

            trackStudyTime: (seconds) => set((state) => {
                const today = new Date().toISOString().split('T')[0];
                const current = state.studyLog?.[today] || 0;
                return {
                    studyLog: {
                        ...state.studyLog,
                        [today]: current + seconds
                    }
                };
            }),

            saveNote: (courseId, videoId, content) => set((state) => {
                const id = `${courseId}-${videoId}`;
                return {
                    notes: {
                        ...state.notes,
                        [id]: {
                            id,
                            courseId,
                            videoId,
                            content,
                            updatedAt: Date.now()
                        }
                    }
                };
            }),

            clearData: () => {
                // Determine initial courses based on environment (Electron vs Web)
                const initialCourses = (typeof window !== 'undefined' && !(window as any).electron) ? [{
                    id: 'real-path-test',
                    name: 'Machine Learning & Data Science',
                    path: 'D:\\courses\\DATA SCIENCE\\Machine-Learning-Data-Science-Deep-Learning-Python',
                    totalVideos: 1,
                    completedVideos: 0,
                    sections: [
                        {
                            id: 'sec-1',
                            name: 'Getting Started',
                            path: 'D:\\courses\\DATA SCIENCE\\Machine-Learning-Data-Science-Deep-Learning-Python\\1 - Getting Started',
                            videos: [
                                {
                                    id: 'vid-1',
                                    name: '1 - Introduction',
                                    path: 'D:\\courses\\DATA SCIENCE\\Machine-Learning-Data-Science-Deep-Learning-Python\\1 - Getting Started\\1 - Introduction.mp4',
                                    completed: false,
                                    progress: 0
                                }
                            ]
                        }
                    ]
                }, {
                    id: 'real-path-test-2',
                    name: 'Machine Learning & Data Science',
                    path: 'D:\\courses\\DATA SCIENCE\\Machine-Learning-Data-Science-Deep-Learning-Python',
                    totalVideos: 1,
                    completedVideos: 0,
                    sections: [
                        {
                            id: 'sec-1',
                            name: 'Getting Started',
                            path: 'D:\\courses\\DATA SCIENCE\\Machine-Learning-Data-Science-Deep-Learning-Python\\1 - Getting Started',
                            videos: [
                                {
                                    id: 'vid-1',
                                    name: '1 - Introduction',
                                    path: 'D:\\courses\\DATA SCIENCE\\Machine-Learning-Data-Science-Deep-Learning-Python\\1 - Getting Started\\1 - Introduction.mp4',
                                    completed: false,
                                    progress: 0
                                }
                            ]
                        }
                    ]
                }] : [];

                set({
                    courses: initialCourses,
                    folders: [],
                    activeCourseId: null,
                    activeVideoId: null,
                    studyLog: {},
                    activeQuiz: null,
                    setActiveQuiz: (quiz) => set({ activeQuiz: quiz }),
                    updateActiveQuiz: (updates) => set((state) => ({
                        activeQuiz: state.activeQuiz ? { ...state.activeQuiz, ...updates } : null
                    })),
                    notes: {},
                    settings: {
                        geminiApiKey: null,
                        geminiModel: "gemini-1.5-flash",
                        imageGenProvider: 'pollinations',
                        deepAiApiKey: null,
                        huggingFaceApiKey: null
                    },
                    fluxZeroGpuUuid: null,
                    userProfile: {
                        name: "Student",
                        studyGoal: 2,
                        preferredTime: "any"
                    },
                    devMode: false,
                    todos: [],
                    quizResults: [],
                    aiProfile: {
                        goals: [],
                        interests: [],
                        learningStyle: 'visual',
                        bio: ''
                    }
                });
            }
        }),
        {
            name: 'library-storage-v2', // Bump version to force clear old unsorted data
            storage: createJSONStorage(() => storage), // Persist to IndexedDB (Async)
            onRehydrateStorage: () => (state) => {
                console.log('[LibraryStore] Hydration finished');
                if (state) {
                    console.log('[LibraryStore] Loaded state:', {
                        courses: state.courses?.length,
                        folders: state.folders?.length,
                        hasSettings: !!state.settings
                    });
                } else {
                    console.error('[LibraryStore] Hydration failed or state is empty');
                }
            }
        }
    )
)
