import { getPortalSession, getClientIdsByRut } from "@/actions/portal-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Plus, FileText, Calendar, Briefcase } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { ClaimStatus } from "@prisma/client"

const STATUS_LABELS: Record<ClaimStatus, string> = {
    REPORTED: "Reportado",
    IN_PROCESS: "En Proceso",
    APPROVED: "Aprobado",
    REJECTED: "Rechazado",
    CLOSED: "Cerrado",
}

const STATUS_COLORS: Record<ClaimStatus, "default" | "secondary" | "destructive" | "outline"> = {
    REPORTED: "secondary",
    IN_PROCESS: "default",
    APPROVED: "outline",
    REJECTED: "destructive",
    CLOSED: "secondary",
}

export default async function PortalClaimsPage() {
    const session = await getPortalSession()

    if (!session) {
        redirect("/portal/login")
    }

    // Multi-corredor: obtener todos los clientIds del usuario
    const clientIds = await getClientIdsByRut(session.user.rut)

    const claims = await prisma.claim.findMany({
        where: {
            Policy: { clientId: { in: clientIds } },
        },
        include: {
            Policy: {
                select: {
                    number: true,
                    type: true,
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
            },
        },
        orderBy: { createdAt: "desc" },
    })

    const activeClaims = claims.filter((c) =>
        ["REPORTED", "IN_PROCESS"].includes(c.status)
    )
    const closedClaims = claims.filter((c) =>
        ["APPROVED", "REJECTED", "CLOSED"].includes(c.status)
    )

    return (
        <div className="container py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Mis Siniestros</h1>
                    <p className="text-muted-foreground mt-1">
                        Reporte y haga seguimiento de sus siniestros en todos sus corredores
                    </p>
                    {session.tenants.length > 1 && (
                        <p className="text-sm text-primary mt-2">
                            Mostrando siniestros de {session.tenants.length} corredores
                        </p>
                    )}
                </div>
                <Link href="/portal/claims/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Reportar Siniestro
                    </Button>
                </Link>
            </div>

            {claims.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No tiene siniestros registrados</h3>
                        <p className="text-muted-foreground mt-2 mb-4">
                            Si necesita reportar un siniestro, haga clic en el botón
                        </p>
                        <Link href="/portal/claims/new">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Reportar Siniestro
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {/* Siniestros Activos */}
                    {activeClaims.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                En Proceso ({activeClaims.length})
                            </h2>
                            <div className="space-y-4">
                                {activeClaims.map((claim) => (
                                    <Card key={claim.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="pt-6">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-semibold text-lg">
                                                            {claim.number || `Siniestro #${claim.id.slice(0, 8)}`}
                                                        </h3>
                                                        <Badge variant={STATUS_COLORS[claim.status]}>
                                                            {STATUS_LABELS[claim.status]}
                                                        </Badge>
                                                    </div>
                                                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="h-4 w-4" />
                                                            Póliza {claim.Policy.number}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4" />
                                                            Fecha del siniestro: {format(new Date(claim.date), "PPP", { locale: es })}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Briefcase className="h-4 w-4" />
                                                            {claim.Policy.Client.Tenant.name}
                                                        </div>
                                                    </div>
                                                    <p className="mt-3 text-sm line-clamp-2">
                                                        {claim.description}
                                                    </p>
                                                </div>
                                                <div className="text-right sm:ml-4">
                                                    {claim.claimAmount && (
                                                        <div className="text-sm">
                                                            <span className="text-muted-foreground">Monto reclamado:</span>
                                                            <p className="font-medium">
                                                                {Number(claim.claimAmount).toLocaleString("es-CL", {
                                                                    minimumFractionDigits: 2,
                                                                })}{" "}
                                                                {claim.currency}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Siniestros Cerrados */}
                    {closedClaims.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
                                Cerrados ({closedClaims.length})
                            </h2>
                            <div className="space-y-4">
                                {closedClaims.map((claim) => (
                                    <Card key={claim.id} className="opacity-75">
                                        <CardContent className="pt-6">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-semibold">
                                                            {claim.number || `Siniestro #${claim.id.slice(0, 8)}`}
                                                        </h3>
                                                        <Badge variant={STATUS_COLORS[claim.status]}>
                                                            {STATUS_LABELS[claim.status]}
                                                        </Badge>
                                                    </div>
                                                    <div className="mt-2 text-sm text-muted-foreground">
                                                        <span>Póliza {claim.Policy.number}</span>
                                                        <span className="mx-2">•</span>
                                                        <span>{format(new Date(claim.date), "dd/MM/yyyy")}</span>
                                                        <span className="mx-2">•</span>
                                                        <span>{claim.Policy.Client.Tenant.name}</span>
                                                    </div>
                                                </div>
                                                {claim.approvedAmount && (
                                                    <div className="text-right text-sm">
                                                        <span className="text-muted-foreground">Monto aprobado:</span>
                                                        <p className="font-medium text-green-600">
                                                            {Number(claim.approvedAmount).toLocaleString("es-CL", {
                                                                minimumFractionDigits: 2,
                                                            })}{" "}
                                                            {claim.currency}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
