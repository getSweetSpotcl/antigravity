"use client"

import {
    LayoutDashboard,
    Users,
    FileText,
    FileSpreadsheet,
    ShieldAlert,
    Settings,
    LogOut,
    Briefcase,
    Building2,
    RefreshCw,
    BarChart3,
    Lock
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

// Menu items.
const items = [
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
        title: "Siniestros",
        url: "/dashboard/claims",
        icon: ShieldAlert,
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

    return (
        <Sidebar className="border-r border-slate-200 bg-white w-64">
            {/* Header aligned to left */}
            <SidebarHeader className="h-16 border-b border-slate-200 px-6 flex flex-row items-center justify-start shrink-0">
                <span className="text-2xl font-extrabold text-blue-600 tracking-tight">GIS.</span>
            </SidebarHeader>

            <SidebarContent className="p-4">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1">
                            {items.map((item) => {
                                const isActive = pathname === item.url
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            className={`
                                                h-10 px-4 rounded-lg transition-all duration-200 font-medium w-full justify-start
                                                ${isActive
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                                }
                                            `}
                                        >
                                            <Link href={item.url} className="flex items-center w-full relative">
                                                <item.icon className={`mr-3 h-[18px] w-[18px] ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                                                <span className="text-[14px]">{item.title}</span>
                                                {isActive && (
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}

                            {session?.user?.role === "SUPER_ADMIN" && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname.startsWith("/admin")}
                                        className={`
                                            h-10 px-4 rounded-lg transition-all duration-200 font-medium w-full justify-start mt-4
                                            ${pathname.startsWith("/admin")
                                                ? "bg-amber-50 text-amber-700"
                                                : "text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                                            }
                                        `}
                                    >
                                        <Link href="/admin/tenants" className="flex items-center w-full relative">
                                            <Lock className={`mr-3 h-[18px] w-[18px] ${pathname.startsWith("/admin") ? "text-amber-600" : "text-slate-400"}`} />
                                            <span className="text-[14px]">Administración</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-slate-100">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => signOut()}
                            className="h-11 px-4 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            <span>Cerrar Sesión</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
