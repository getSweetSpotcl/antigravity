"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Search,
    User,
    Shield,
    AlertTriangle,
    FileText,
    Building2,
    Loader2,
    ArrowRight,
    Clock,
    Command,
    UserPlus,
    BarChart3,
    Settings,
} from "lucide-react"
import { globalSearch, type SearchResults, type SearchResult, type QuickAction } from "@/actions/search"
import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

const typeIcons = {
    client: User,
    policy: Shield,
    claim: AlertTriangle,
    quote: FileText,
    company: Building2,
}

const typeLabels = {
    client: "Cliente",
    policy: "Póliza",
    claim: "Siniestro",
    quote: "Cotización",
    company: "Compañía",
}

const actionIcons: Record<string, React.ElementType> = {
    FileText: FileText,
    UserPlus: UserPlus,
    Shield: Shield,
    AlertTriangle: AlertTriangle,
    BarChart3: BarChart3,
    Settings: Settings,
}

const RECENT_SEARCHES_KEY = "antigravity_recent_searches"
const MAX_RECENT_SEARCHES = 5

interface RecentSearch {
    query: string
    timestamp: number
}

const quickActionsData: QuickAction[] = [
    {
        id: "new-quote",
        title: "Nueva Cotización",
        description: "Crear una nueva cotización",
        url: "/dashboard/quotes?action=new",
        shortcut: "N",
        icon: "FileText",
    },
    {
        id: "new-client",
        title: "Nuevo Cliente",
        description: "Registrar un nuevo cliente",
        url: "/dashboard/clients?action=new",
        shortcut: "C",
        icon: "UserPlus",
    },
    {
        id: "new-policy",
        title: "Nueva Póliza",
        description: "Crear una nueva póliza",
        url: "/dashboard/policies?action=new",
        shortcut: "P",
        icon: "Shield",
    },
    {
        id: "new-claim",
        title: "Nuevo Siniestro",
        description: "Reportar un nuevo siniestro",
        url: "/dashboard/claims?action=new",
        shortcut: "S",
        icon: "AlertTriangle",
    },
    {
        id: "reports",
        title: "Reportes",
        description: "Ver centro de reportes",
        url: "/dashboard/reports",
        icon: "BarChart3",
    },
    {
        id: "settings",
        title: "Configuración",
        description: "Configurar preferencias",
        url: "/dashboard/settings",
        icon: "Settings",
    },
]

export function CommandPalette() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResults | null>(null)
    const [isPending, startTransition] = useTransition()
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
    const router = useRouter()
    const quickActions = quickActionsData

    // Load recent searches from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
        if (stored) {
            try {
                setRecentSearches(JSON.parse(stored))
            } catch {
                // Ignore parse errors
            }
        }
    }, [])

    // Save recent search
    const saveRecentSearch = useCallback((searchQuery: string) => {
        const newSearch: RecentSearch = {
            query: searchQuery,
            timestamp: Date.now(),
        }
        const updated = [
            newSearch,
            ...recentSearches.filter((s) => s.query !== searchQuery),
        ].slice(0, MAX_RECENT_SEARCHES)
        setRecentSearches(updated)
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
    }, [recentSearches])

    // Clear recent searches
    const clearRecentSearches = () => {
        setRecentSearches([])
        localStorage.removeItem(RECENT_SEARCHES_KEY)
    }

    // Keyboard shortcut to open (Cmd+K or Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault()
                setOpen(true)
            }
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [])

    // Search when query changes
    useEffect(() => {
        if (query.length >= 2) {
            startTransition(async () => {
                const searchResults = await globalSearch(query)
                setResults(searchResults)
                setSelectedIndex(0)
            })
        } else {
            setResults(null)
            setSelectedIndex(0)
        }
    }, [query])

    // Reset on close
    useEffect(() => {
        if (!open) {
            setQuery("")
            setResults(null)
            setSelectedIndex(0)
        }
    }, [open])

    // Get all navigable items
    const getAllItems = useCallback((): (SearchResult | QuickAction)[] => {
        if (query.length >= 2 && results) {
            return [
                ...results.clients,
                ...results.policies,
                ...results.claims,
                ...results.quotes,
                ...results.companies,
            ]
        }
        return quickActions
    }, [query, results, quickActions])

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        const items = getAllItems()

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault()
                setSelectedIndex((prev) => (prev + 1) % items.length)
                break
            case "ArrowUp":
                e.preventDefault()
                setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
                break
            case "Enter":
                e.preventDefault()
                const selectedItem = items[selectedIndex]
                if (selectedItem) {
                    handleSelect(selectedItem)
                }
                break
            case "Escape":
                setOpen(false)
                break
        }
    }

    // Handle item selection
    const handleSelect = (item: SearchResult | QuickAction) => {
        if (query.length >= 2) {
            saveRecentSearch(query)
        }
        router.push(item.url)
        setOpen(false)
    }

    // Handle recent search selection
    const handleRecentSearch = (searchQuery: string) => {
        setQuery(searchQuery)
    }

    const showQuickActions = query.length < 2
    const showResults = query.length >= 2 && results
    const allItems = getAllItems()

    return (
        <>
            {/* Trigger button */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-3 w-full max-w-md px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
                <Search className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">Buscar clientes, pólizas, siniestros...</span>
                <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-1.5 font-mono text-[10px] font-medium text-muted-foreground flex-shrink-0">
                    <Command className="h-3 w-3" />K
                </kbd>
            </button>

            {/* Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 gap-0 max-w-2xl overflow-hidden">
                    <VisuallyHidden>
                        <DialogTitle>Búsqueda Global</DialogTitle>
                    </VisuallyHidden>
                    {/* Search input */}
                    <div className="flex items-center border-b px-3">
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Buscar clientes, pólizas, siniestros..."
                            className="h-12 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            autoFocus
                        />
                        {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>

                    <ScrollArea className="max-h-[400px]">
                        {/* Recent searches */}
                        {showQuickActions && recentSearches.length > 0 && (
                            <div className="p-2">
                                <div className="flex items-center justify-between px-2 py-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Búsquedas recientes
                                    </span>
                                    <button
                                        onClick={clearRecentSearches}
                                        className="text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        Limpiar
                                    </button>
                                </div>
                                {recentSearches.map((search) => (
                                    <button
                                        key={search.timestamp}
                                        onClick={() => handleRecentSearch(search.query)}
                                        className="flex items-center gap-2 w-full px-2 py-2 text-sm rounded-md hover:bg-accent"
                                    >
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>{search.query}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Quick actions */}
                        {showQuickActions && (
                            <div className="p-2">
                                <div className="px-2 py-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Acciones rápidas
                                    </span>
                                </div>
                                {quickActions.map((action, index) => {
                                    const Icon = actionIcons[action.icon] || FileText
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => handleSelect(action)}
                                            className={cn(
                                                "flex items-center gap-3 w-full px-2 py-2 text-sm rounded-md",
                                                selectedIndex === index
                                                    ? "bg-accent"
                                                    : "hover:bg-accent"
                                            )}
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                                                <Icon className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="font-medium">{action.title}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {action.description}
                                                </div>
                                            </div>
                                            {action.shortcut && (
                                                <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                                                    {action.shortcut}
                                                </kbd>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {/* Search results */}
                        {showResults && (
                            <div className="p-2">
                                {results.total === 0 ? (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        No se encontraron resultados para "{query}"
                                    </div>
                                ) : (
                                    <>
                                        {/* Group results by type */}
                                        {(["clients", "policies", "claims", "quotes", "companies"] as const).map(
                                            (type) => {
                                                const items = results[type]
                                                if (items.length === 0) return null

                                                const typeKey = type.slice(0, -1) as keyof typeof typeLabels
                                                const label = type === "companies" ? "Compañías" : `${typeLabels[typeKey]}s`

                                                // Calculate index offset
                                                let indexOffset = 0
                                                if (type === "policies") indexOffset = results.clients.length
                                                if (type === "claims")
                                                    indexOffset = results.clients.length + results.policies.length
                                                if (type === "quotes")
                                                    indexOffset =
                                                        results.clients.length +
                                                        results.policies.length +
                                                        results.claims.length
                                                if (type === "companies")
                                                    indexOffset =
                                                        results.clients.length +
                                                        results.policies.length +
                                                        results.claims.length +
                                                        results.quotes.length

                                                return (
                                                    <div key={type} className="mb-2">
                                                        <div className="px-2 py-1.5">
                                                            <span className="text-xs font-medium text-muted-foreground">
                                                                {label}
                                                            </span>
                                                        </div>
                                                        {items.map((item, index) => {
                                                            const Icon = typeIcons[item.type]
                                                            const globalIndex = indexOffset + index
                                                            return (
                                                                <button
                                                                    key={item.id}
                                                                    onClick={() => handleSelect(item)}
                                                                    className={cn(
                                                                        "flex items-center gap-3 w-full px-2 py-2 text-sm rounded-md",
                                                                        selectedIndex === globalIndex
                                                                            ? "bg-accent"
                                                                            : "hover:bg-accent"
                                                                    )}
                                                                >
                                                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                                                                        <Icon className="h-4 w-4" />
                                                                    </div>
                                                                    <div className="flex-1 text-left min-w-0">
                                                                        <div className="font-medium truncate">
                                                                            {item.title}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground truncate">
                                                                            {item.subtitle}
                                                                        </div>
                                                                    </div>
                                                                    {item.metadata?.status && (
                                                                        <Badge variant="secondary" className="shrink-0">
                                                                            {item.metadata.status}
                                                                        </Badge>
                                                                    )}
                                                                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                )
                                            }
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <kbd className="inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px]">
                                ↑↓
                            </kbd>
                            <span>navegar</span>
                            <kbd className="inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px]">
                                ↵
                            </kbd>
                            <span>seleccionar</span>
                            <kbd className="inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px]">
                                esc
                            </kbd>
                            <span>cerrar</span>
                        </div>
                        {showResults && results && (
                            <span>{results.total} resultado{results.total !== 1 ? "s" : ""}</span>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
