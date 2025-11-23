"use client"

import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession } from "next-auth/react"

export function TopNav() {
    const { data: session } = useSession()

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-8 shadow-sm">
            <div className="flex flex-1 items-center gap-4">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Buscar pólizas, clientes o siniestros..."
                        className="w-full bg-slate-50 pl-10 pr-4 h-10 border-none rounded-full text-sm focus-visible:ring-2 focus-visible:ring-blue-100 placeholder:text-slate-400 transition-all"
                    />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notificaciones</span>
                </Button>
                <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                    <div className="hidden flex-col items-end md:flex">
                        <span className="text-sm font-semibold text-slate-700 leading-none">{session?.user?.name}</span>
                        <span className="text-xs text-slate-400">{session?.user?.email}</span>
                    </div>
                    <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-100">
                        <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                        <AvatarFallback className="bg-blue-600 text-white font-bold">
                            {session?.user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    )
}
