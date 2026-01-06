export interface Video {
    id: string;
    name: string;
    path: string;
    duration?: number;
    completed: boolean;
    progress: number; // 0 to 100
    lastPlayedAt?: number; // timestamp
    subtitles?: {
        path: string;
        lang: string; // 'en', 'es', etc.
        label: string; // 'English', 'Spanish'
    }[];
}

export interface Section {
    id: string;
    name: string;
    path: string;
    videos: Video[];
    isExpanded?: boolean;
}

export interface Course {
    id: string;
    name: string;
    path: string; // Root folder path
    sections: Section[];
    totalVideos: number;
    completedVideos: number;
    description?: string;
    coverImage?: string;
    lastPlayedVideoId?: string;
    isPinned?: boolean;
    color?: string; // Hex code or tailwind class
}

export interface Note {
    id: string; // usually `${courseId}-${videoId}`
    courseId: string;
    videoId: string;
    content: string;
    updatedAt: number;
}

export interface Folder {
    id: string;
    name: string;
    courseIds: string[];
    color?: string;
    createdAt: number;
}

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    type: 'daily' | 'weekly' | 'long-term';
    createdAt: number;
}

export interface QuizResult {
    id: string;
    videoId: string;
    courseId: string;
    score: number;
    totalQuestions: number;
    date: number;
}

export interface AiProfile {
    goals: string[];
    interests: string[];
    learningStyle: 'visual' | 'text' | 'practical';
    bio: string;
}

export interface ActiveQuiz {
    videoId: string;
    questions: any[]; // Using any for simplicity as per existing quiz structure, ideally strict type
    answers: Record<number, number>; // questionIndex -> optionIndex
    currentQuestionIndex: number;
    score: number;
    isCompleted: boolean;
}

export interface Bookmark {
    id: string;
    courseId: string;
    videoId: string;
    time: number;
    label: string;
    createdAt: number;
}

export interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
    timestamp: number;
}

export interface LibraryState {
    courses: Course[];
    folders: Folder[];
    notes: Record<string, Note>;
    todos: Todo[];
    quizResults: QuizResult[];
    bookmarks: Bookmark[]; // New
    aiProfile: AiProfile;
    isLoading: boolean;
    activeCourseId: string | null;
    setActiveCourse: (courseId: string | null) => void;
    activeVideoId: string | null;
    studyLog: Record<string, number>; // YYYY-MM-DD -> seconds
    activeQuiz: ActiveQuiz | null; // Persisted quiz state

    settings: {
        geminiApiKey: string | null;
        geminiModel: string;
        imageGenProvider: 'huggingface' | 'deepai' | 'magicstudio' | 'raphael' | 'pollinations' | 'puter' | 'custom-flux' | 'gemini';
        deepAiApiKey: string | null;
        huggingFaceApiKey: string | null;
    }
    fluxZeroGpuUuid: string | null;

    // Actions
    setImageGenProvider: (provider: 'huggingface' | 'deepai' | 'magicstudio' | 'raphael' | 'pollinations' | 'puter' | 'custom-flux' | 'gemini') => void;
    setDeepAiApiKey: (key: string) => void;
    setHuggingFaceApiKey: (key: string) => void;
    setFluxZeroGpuToken: (token: string) => void;
    setFluxZeroGpuUuid: (uuid: string) => void;
    setApiKey: (key: string) => void;
    setModel: (model: string) => void;
    clearData: () => void;
    // AI Actions
    addTodo: (text: string, type: 'daily' | 'weekly' | 'long-term') => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    updateAiProfile: (profile: Partial<AiProfile>) => void;
    addQuizResult: (result: QuizResult) => void;
    // Quiz Actions
    setActiveQuiz: (quiz: ActiveQuiz | null) => void;
    updateActiveQuiz: (updates: Partial<ActiveQuiz>) => void;
    // Bookmark Actions
    addBookmark: (bookmark: Bookmark) => void;
    removeBookmark: (id: string) => void;

    // Chat Actions
    chatSessions: Record<string, ChatMessage[]>; // videoId -> messages
    addChatMessage: (videoId: string, message: ChatMessage) => void;
    clearChatSession: (videoId: string) => void;
}

declare global {
    interface Window {
        electron: any;
    }
}
