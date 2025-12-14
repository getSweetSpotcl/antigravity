import { getPortalSession } from "@/actions/portal-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileText, AlertTriangle, MessageSquare, User, LogOut, Home } from "lucide-react"
import { PortalLogoutButton } from "@/components/portal/portal-logout-button"

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getPortalSession()

    // Las páginas de login y registro no requieren autenticación
    const isAuthPage = false // Se maneja en cada página

    return (
        <div className="min-h-screen bg-gray-50">
            {session && (
                <header className="sticky top-0 z-50 w-full border-b bg-white">
                    <div className="container flex h-16 items-center justify-between px-4">
                        <div className="flex items-center gap-6">
                            {session.primaryTenant.logoUrl ? (
                                <img
                                    src={session.primaryTenant.logoUrl}
                                    alt={session.primaryTenant.name}
                                    className="h-8 w-auto"
                                />
                            ) : (
                                <span className="text-xl font-bold text-primary">
                                    {session.primaryTenant.name}
                                </span>
                            )}

                            <nav className="hidden md:flex items-center gap-1">
                                <Link href="/portal">
                                    <Button variant="ghost" size="sm">
                                        <Home className="mr-2 h-4 w-4" />
                                        Inicio
                                    </Button>
                                </Link>
                                <Link href="/portal/policies">
                                    <Button variant="ghost" size="sm">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Mis Pólizas
                                    </Button>
                                </Link>
                                <Link href="/portal/claims">
                                    <Button variant="ghost" size="sm">
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        Siniestros
                                    </Button>
                                </Link>
                                <Link href="/portal/messages">
                                    <Button variant="ghost" size="sm">
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Mensajes
                                    </Button>
                                </Link>
                            </nav>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <User className="h-4 w-4" />
                                    <span className="hidden sm:inline">{session.user.name}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{session.user.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {session.user.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild className="md:hidden">
                                    <Link href="/portal">
                                        <Home className="mr-2 h-4 w-4" />
                                        Inicio
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="md:hidden">
                                    <Link href="/portal/policies">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Mis Pólizas
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="md:hidden">
                                    <Link href="/portal/claims">
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        Siniestros
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="md:hidden">
                                    <Link href="/portal/messages">
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Mensajes
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="md:hidden" />
                                <PortalLogoutButton />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    )
}
