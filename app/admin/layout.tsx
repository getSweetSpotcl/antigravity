import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { TopNav } from "@/components/dashboard/top-nav"
import { SessionProvider } from "@/components/providers/session-provider"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) {
        redirect("/auth/login")
    }

    if (session.user.role !== "SUPER_ADMIN") {
        redirect("/dashboard")
    }

    return (
        <SessionProvider>
            <SidebarProvider>
                <AppSidebar />
                <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950">
                    <TopNav />
                    <div className="flex-1 overflow-y-auto">
                        <div className="container mx-auto p-6 max-w-7xl">
                            {children}
                        </div>
                    </div>
                </main>
            </SidebarProvider>
        </SessionProvider>
    )
}
