"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Library, FileText, Settings, BarChart2, FolderSearch, BrainCircuit } from "lucide-react"

interface AppLayoutProps {
    children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
    const pathname = usePathname()

    const navItems = [
        { name: "Home", href: "/", icon: LayoutDashboard },
        { name: "Course Library", href: "/library", icon: Library },
        { name: "Productivity Center", href: "/ai-dashboard", icon: BrainCircuit },
        { name: "Recent Notes", href: "/notes", icon: FileText },
        { name: "Study Analytics", href: "/analytics", icon: BarChart2 },
        { name: "Scan Files", href: "/scan", icon: FolderSearch },
        { name: "Settings", href: "/settings", icon: Settings },
    ]

    return (
        <div className="flex h-screen bg-background overflow-hidden selection:bg-white/20">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-[#050505] flex flex-col">
                <div className="p-6 flex items-center gap-3">
                    <Image src="/logo.png" alt="Study Stream" width={32} height={32} className="rounded" />
                    <h1 className="text-xl font-bold tracking-tight text-white">STUDY STREAM</h1>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={false}
                                className={cn(
                                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-secondary text-white"
                                        : "text-muted-foreground hover:bg-secondary/50 hover:text-white"
                                )}
                            >
                                <Icon className={cn("mr-3 h-4 w-4", isActive ? "text-white" : "text-muted-foreground")} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer / Status Area could go here */}
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-xs text-muted-foreground">System Ready</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
                {/* Title Bar Drag Region (Electron) */}
                <div className="h-8 w-full app-drag-region flex-shrink-0" style={{ WebkitAppRegion: "drag" } as any} />

                <div className="flex-1 overflow-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
