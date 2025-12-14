"use client"

import {
    LayoutDashboard,
    Users,
    FileSpreadsheet,
    ShieldAlert,
    Settings,
    LogOut,
    Briefcase,
    Building2,
    RefreshCw,
    BarChart3,
    Lock,
    Shield,
    Wallet
} from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
    SidebarHeader,
} from "@/components/ui/sidebar"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// Menu items organized by sections
const mainItems = [
    {
        title: "Resumen",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Cotizaciones",
        url: "/dashboard/quotes",
        icon: FileSpreadsheet,
    },
    {
        title: "Pólizas",
        url: "/dashboard/policies",
        icon: Briefcase,
    },
    {
        title: "Renovaciones",
        url: "/dashboard/renewals",
        icon: RefreshCw,
    },
    {
        title: "Siniestros",
        url: "/dashboard/claims",
        icon: ShieldAlert,
    },
    {
        title: "Comisiones",
        url: "/dashboard/commissions",
        icon: Wallet,
    },
]

const managementItems = [
    {
        title: "Clientes",
        url: "/dashboard/clients",
        icon: Users,
    },
    {
        title: "Compañías",
        url: "/dashboard/companies",
        icon: Building2,
    },
    {
        title: "Reportes",
        url: "/dashboard/reports",
        icon: BarChart3,
    },
    {
        title: "Configuración",
        url: "/dashboard/settings",
        icon: Settings,
    },
]

export function AppSidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()

    const NavItem = ({ item, isActive }: { item: typeof mainItems[0], isActive: boolean }) => (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={isActive}
                className={`
                    h-11 px-4 rounded-lg transition-all duration-200 font-medium w-full justify-start group/item
                    ${isActive
                        ? "bg-sky-500/20 text-sky-300"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }
                `}
            >
                <Link href={item.url} className="flex items-center w-full gap-3">
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm font-medium flex-1">{item.title}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )

    return (
        <Sidebar className="border-r border-white/10 bg-[#1e3a5f] w-64">
            {/* Header with Logo */}
            <SidebarHeader className="h-auto border-b border-white/10 p-6 flex flex-row items-center justify-start shrink-0">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-sky-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white">GiCS</h1>
                        <p className="text-xs text-sky-300">Insurance Platform</p>
                    </div>
                </Link>
            </SidebarHeader>

            <SidebarContent className="p-4">
                {/* Main Navigation */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-1">
                            {mainItems.map((item) => {
                                const isActive = pathname === item.url ||
                                    (item.url !== "/dashboard" && pathname.startsWith(item.url))
                                return <NavItem key={item.title} item={item} isActive={isActive} />
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Management Section */}
                <SidebarGroup className="mt-8">
                    <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">
                        Gestión
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-1">
                            {managementItems.map((item) => {
                                const isActive = pathname === item.url || pathname.startsWith(item.url)
                                return <NavItem key={item.title} item={item} isActive={isActive} />
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Admin Section */}
                {session?.user?.role === "SUPER_ADMIN" && (
                    <SidebarGroup className="mt-8">
                        <SidebarGroupLabel className="text-xs font-semibold text-amber-400/60 uppercase tracking-wider px-4 mb-2">
                            Administrador
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname.startsWith("/admin")}
                                        className={`
                                            h-11 px-4 rounded-lg transition-all duration-200 font-medium w-full justify-start
                                            ${pathname.startsWith("/admin")
                                                ? "bg-amber-500/20 text-amber-400"
                                                : "text-slate-300 hover:bg-amber-500/10 hover:text-amber-400"
                                            }
                                        `}
                                    >
                                        <Link href="/admin/tenants" className="flex items-center w-full gap-3">
                                            <Lock className="h-5 w-5" />
                                            <span className="text-sm font-medium flex-1">Panel Admin</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter className="p-4 border-t border-white/10">
                {/* User Info */}
                <div className="px-4 py-2 mb-2">
                    <div className="text-sm font-medium text-white truncate">
                        {session?.user?.name}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                        {session?.user?.email}
                    </div>
                </div>

                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => signOut()}
                            className="h-11 px-4 rounded-lg text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                            <div className="flex items-center w-full gap-3">
                                <LogOut className="h-5 w-5" />
                                <span className="text-sm font-medium">Cerrar Sesión</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
