import { getPortalSession, getClientIdsByRut } from "@/actions/portal-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, AlertTriangle, MessageSquare, Shield, ArrowRight, Briefcase } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function PortalDashboardPage() {
    const session = await getPortalSession()

    if (!session) {
        redirect("/portal/login")
    }

    // Multi-corredor: obtener clientIds de todos los corredores con el mismo RUT
    const clientIds = await getClientIdsByRut(session.user.rut)

    // Obtener datos del cliente de TODOS sus corredores
    const [policies, claims, unreadMessages] = await Promise.all([
        prisma.policy.findMany({
            where: {
                clientId: { in: clientIds },
                status: "ACTIVE",
            },
            include: {
                InsuranceCompany: {
                    select: { name: true },
                },
                Client: {
                    include: {
                        Tenant: {
                            select: { name: true, slug: true },
                        },
                    },
                },
            },
            orderBy: { endDate: "asc" },
            take: 5,
        }),
        prisma.claim.findMany({
            where: {
                Policy: { clientId: { in: clientIds } },
                status: { in: ["REPORTED", "IN_PROCESS"] },
            },
            include: {
                Policy: {
                    select: { number: true },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 3,
        }),
        prisma.portalMessage.count({
            where: {
                clientUserId: session.user.id,
                isFromClient: false,
                isRead: false,
            },
        }),
    ])

    // Contar pólizas por vencer (próximos 30 días)
    const today = new Date()
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiringPolicies = policies.filter(
        (p) => new Date(p.endDate) <= in30Days
    )

    return (
        <div className="container py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">
                    Bienvenido, {session.user.name.split(" ")[0]}
                </h1>
                <p className="text-muted-foreground mt-1">
                    Aquí puede ver el resumen de sus seguros
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pólizas Activas</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{policies.length}</div>
                        {expiringPolicies.length > 0 && (
                            <p className="text-xs text-orange-600">
                                {expiringPolicies.length} por vencer
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Siniestros Activos</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{claims.length}</div>
                        <p className="text-xs text-muted-foreground">En proceso</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{unreadMessages}</div>
                        <p className="text-xs text-muted-foreground">Sin leer</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {session.tenants.length > 1 ? "Mis Corredores" : "Mi Corredor"}
                        </CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{session.tenants.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {session.tenants.map(t => t.name).join(", ")}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Pólizas */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Mis Pólizas</CardTitle>
                        <Link href="/portal/policies">
                            <Button variant="ghost" size="sm">
                                Ver todas
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {policies.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                No tiene pólizas activas
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {policies.map((policy) => {
                                    const isExpiringSoon = new Date(policy.endDate) <= in30Days
                                    return (
                                        <Link
                                            key={policy.id}
                                            href={`/portal/policies/${policy.id}`}
                                            className="block"
                                        >
                                            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                                                <div>
                                                    <p className="font-medium">
                                                        Póliza {policy.number}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {policy.InsuranceCompany?.name || policy.company} • {policy.Client.Tenant.name}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <Badge
                                                        variant={isExpiringSoon ? "destructive" : "secondary"}
                                                    >
                                                        {isExpiringSoon ? "Por vencer" : "Vigente"}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Vence: {format(new Date(policy.endDate), "dd/MM/yyyy")}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Siniestros */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Siniestros Recientes</CardTitle>
                        <Link href="/portal/claims">
                            <Button variant="ghost" size="sm">
                                Ver todos
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {claims.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-muted-foreground mb-4">
                                    No tiene siniestros activos
                                </p>
                                <Link href="/portal/claims/new">
                                    <Button variant="outline" size="sm">
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        Reportar Siniestro
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {claims.map((claim) => (
                                    <div
                                        key={claim.id}
                                        className="flex items-center justify-between p-3 rounded-lg border"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {claim.number || `Siniestro #${claim.id.slice(0, 8)}`}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Póliza {claim.Policy.number}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge
                                                variant={
                                                    claim.status === "IN_PROCESS"
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {claim.status === "REPORTED"
                                                    ? "Reportado"
                                                    : "En Proceso"}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {format(new Date(claim.date), "dd/MM/yyyy")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <Link href="/portal/claims/new">
                                    <Button variant="outline" size="sm" className="w-full mt-2">
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        Reportar Nuevo Siniestro
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
