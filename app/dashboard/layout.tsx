import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { TopNav } from "@/components/dashboard/top-nav"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SessionProvider } from "@/components/providers/session-provider"
import { AdminContextBanner } from "@/components/admin/admin-context-banner"
import { cookies } from "next/headers"
import { ADMIN_TENANT_COOKIE } from "@/lib/tenant-context"
import { prisma } from "@/lib/db"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session || !session.user) {
        redirect("/auth/login")
    }

    const cookieStore = await cookies()
    const adminContextId = cookieStore.get(ADMIN_TENANT_COOKIE)?.value
    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const hasActiveContext = !!adminContextId && isSuperAdmin

    let tenantName = ""
    if (hasActiveContext) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: adminContextId },
            select: { name: true }
        })
        tenantName = tenant?.name || "Desconocido"
    }

    return (
        <SessionProvider>
            <SidebarProvider>
                <AppSidebar />
                <main className="flex min-h-screen flex-1 flex-col bg-[#F0F4F8]">
                    <AdminContextBanner
                        isSuperAdmin={isSuperAdmin}
                        hasActiveContext={hasActiveContext}
                        tenantName={tenantName}
                    />
                    <TopNav />
                    <div className="flex-1 p-8">
                        <div className="flex items-center gap-2 pb-4 md:hidden">
                            <SidebarTrigger />
                        </div>
                        {children}
                    </div>
                </main>
            </SidebarProvider>
        </SessionProvider>
    )
}
