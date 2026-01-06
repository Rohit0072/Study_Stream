import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Course } from "@/types";
import { PlayCircle, BookOpen, Trash2, Info, Sparkles, Pin, Palette, FolderInput, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useLibraryStore } from "@/store/library-store";
import { CourseImageGenerator } from "./course-image-generator";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface CourseCardProps {
    course: Course;
    onClick?: () => void;
}

const PREMIUM_COLORS = [
    { name: "Default", value: "#0A0A0A" },
    { name: "Crimson", value: "#2A0A0A" },
    { name: "Navy", value: "#0A0A2A" },
    { name: "Forest", value: "#051A05" },
    { name: "Gold", value: "#1A1505" },
    { name: "Plum", value: "#1A051A" },
    { name: "Teal", value: "#051A1A" },
    { name: "Slate", value: "#1A1A1A" },
];

export function CourseCard({ course, onClick }: CourseCardProps) {
    const router = useRouter();
    const { removeCourse, toggleCoursePin, setCourseColor, folders, moveCourse } = useLibraryStore();

    // Initial folder determination
    const currentFolder = folders?.find(f => f.courseIds.includes(course.id));

    const calculateProgress = () => {
        if (course.totalVideos === 0) return 0;
        return Math.round((course.completedVideos / course.totalVideos) * 100);
    };

    const progress = calculateProgress();

    const handleCardClick = () => {
        if (onClick) {
            onClick();
            return;
        }

        // Navigation Logic
        let targetVideoId = course.lastPlayedVideoId;

        // If no last played, find the first video
        if (!targetVideoId) {
            // Find first section with videos
            const firstSectionWithVideos = course.sections.find(s => s.videos.length > 0);
            if (firstSectionWithVideos && firstSectionWithVideos.videos.length > 0) {
                targetVideoId = firstSectionWithVideos.videos[0].id;
            }
        }

        if (targetVideoId) {
            router.push(`/watch?c=${encodeURIComponent(course.id)}&v=${encodeURIComponent(targetVideoId)}`);
        } else {
            console.warn("No videos found in course", course.id);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to remove "${course.name}"?`)) {
            removeCourse(course.id);
        }
    };

    const [showGenerator, setShowGenerator] = useState(false);

    return (
        <>
            <CourseImageGenerator
                courseId={course.id}
                courseName={course.name}
                isOpen={showGenerator}
                onClose={() => setShowGenerator(false)}
            />

            <Card
                className="group cursor-pointer hover:border-primary/50 transition-all hover:scale-[1.02] relative"
                onClick={handleCardClick}
                style={{ backgroundColor: course.color || '#0A0A0A' }}
            >
                <div className="aspect-video w-full bg-secondary/30 relative flex items-center justify-center overflow-hidden rounded-t-lg">
                    {course.coverImage ? (
                        <img
                            src={course.coverImage}
                            alt={course.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <BookOpen className="h-12 w-12 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                        {/* Button container needs pointer-events-auto */}
                    </div>

                    {/* Hover Overlay Buttons - Centered Resume */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
                        <Button variant="ghost" className="text-white gap-2 pointer-events-auto" onClick={handleCardClick}>
                            <PlayCircle className="h-6 w-6" />
                            Resume
                        </Button>
                    </div>
                </div>

                {/* Top Right Action Buttons - Moved outside overflow-hidden container to prevent popup clipping */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-30 flex gap-2">
                    {/* Color Picker Dropdown */}
                    <div onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-white text-black bg-white/90 backdrop-blur-sm"
                                    title="Change Color"
                                >
                                    <Palette className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                side="bottom"
                                className="p-3 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl grid grid-cols-4 gap-2.5 w-[140px] z-[100]"
                            >
                                {PREMIUM_COLORS.map((color) => (
                                    <DropdownMenuItem
                                        key={color.value}
                                        className={cn(
                                            "w-6 h-6 rounded-full border border-white/10 hover:scale-110 transition-transform hover:border-white/50 p-0 cursor-pointer focus:bg-transparent focus:scale-110",
                                            course.color === color.value && "ring-2 ring-white ring-offset-1 ring-offset-black"
                                        )}
                                        style={{ backgroundColor: color.value }}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Stop propagation just in case
                                            setCourseColor(course.id, color.value);
                                            // Dropdown closes automatically
                                        }}
                                        title={color.name}
                                    />
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Move to Folder Dropdown */}
                    <div onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-white text-black bg-white/80 backdrop-blur-sm"
                                    title="Move to Folder"
                                >
                                    <FolderInput className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-neutral-900 border-white/10 text-white z-[100]">
                                <DropdownMenuLabel>Move to...</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem
                                    onClick={() => moveCourse(course.id, null)}
                                    className="cursor-pointer hover:bg-white/10 justify-between group/item"
                                >
                                    <span>Library (Root)</span>
                                    {!currentFolder && <Check className="h-3 w-3 text-blue-400" />}
                                </DropdownMenuItem>
                                {folders?.map(folder => (
                                    <DropdownMenuItem
                                        key={folder.id}
                                        onClick={() => moveCourse(course.id, folder.id)}
                                        className="cursor-pointer hover:bg-white/10 justify-between group/item"
                                    >
                                        <span className="truncate max-w-[120px]">{folder.name}</span>
                                        {currentFolder?.id === folder.id && <Check className="h-3 w-3 text-blue-400" />}
                                    </DropdownMenuItem>
                                ))}
                                {(!folders || folders.length === 0) && (
                                    <DropdownMenuItem disabled className="text-muted-foreground text-xs italic">
                                        No folders created
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 hover:bg-white text-black bg-white/80 backdrop-blur-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowGenerator(true);
                        }}
                        title="Generate AI Cover"
                    >
                        <Sparkles className="h-4 w-4 text-purple-600" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 hover:bg-white text-black bg-white/80 backdrop-blur-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/course?id=${encodeURIComponent(course.id)}`);
                        }}
                        title="Course Overview"
                    >
                        <Info className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className={`h-8 w-8 hover:bg-white transition-colors bg-white/80 backdrop-blur-sm ${course.isPinned ? "bg-white text-black" : "text-black"}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleCoursePin(course.id);
                        }}
                        title={course.isPinned ? "Unpin Course" : "Pin Course"}
                    >
                        <Pin className={`h-4 w-4 ${course.isPinned ? "fill-black" : ""}`} />
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 shadow-sm"
                        onClick={handleDelete}
                        title="Remove Course"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-1 text-base">{course.name}</CardTitle>
                    <CardDescription className="line-clamp-1 text-xs">
                        {course.sections.length} Sections • {course.totalVideos} Videos
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="space-y-2">
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{progress}% Complete</span>
                            <span>{course.completedVideos}/{course.totalVideos}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
