"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession } from "next-auth/react"
import { useTheme } from "@/components/theme-provider"
import { CommandPalette } from "@/components/search/command-palette"
import { NotificationsPopover } from "./notifications-popover"

export function TopNav() {
    const { data: session } = useSession()
    const { resolvedTheme, toggleTheme } = useTheme()

    // Get initials from name
    const getInitials = (name: string | null | undefined) => {
        if (!name) return "U"
        const parts = name.split(" ")
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 transition-colors">
            {/* Search */}
            <div className="flex flex-1 items-center gap-4">
                <CommandPalette />
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-9 w-9 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    {resolvedTheme === "dark" ? (
                        <Sun className="h-5 w-5" />
                    ) : (
                        <Moon className="h-5 w-5" />
                    )}
                    <span className="sr-only">Cambiar tema</span>
                </Button>

                {/* Notifications */}
                <NotificationsPopover />

                {/* Divider */}
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

                {/* User Profile */}
                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex flex-col items-end">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none">
                            {session?.user?.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {session?.user?.role === "SUPER_ADMIN" ? "Administrador" :
                                session?.user?.role === "BROKERAGE_ADMIN" ? "Admin Corredora" : "Agente"}
                        </span>
                    </div>
                    <Avatar className="h-9 w-9 ring-2 ring-slate-200 dark:ring-slate-700 ring-offset-2 ring-offset-white dark:ring-offset-slate-900">
                        <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                        <AvatarFallback className="bg-sky-600 text-white font-semibold text-sm">
                            {getInitials(session?.user?.name)}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    )
}
