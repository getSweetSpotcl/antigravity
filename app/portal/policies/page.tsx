import { getPortalSession, getClientIdsByRut } from "@/actions/portal-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, Building2, ChevronRight, Briefcase } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import type { PolicyStatus, PolicyType } from "@prisma/client"

const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
    GENERAL: "General",
    LIFE: "Vida",
    HEALTH: "Salud",
    AUTO: "Automóvil",
    HOME: "Hogar",
    GUARANTEE: "Garantía",
}

const STATUS_LABELS: Record<PolicyStatus, string> = {
    ACTIVE: "Vigente",
    EXPIRED: "Vencida",
    CANCELLED: "Cancelada",
    RENEWED: "Renovada",
}

const STATUS_COLORS: Record<PolicyStatus, "default" | "secondary" | "destructive" | "outline"> = {
    ACTIVE: "default",
    EXPIRED: "destructive",
    CANCELLED: "secondary",
    RENEWED: "outline",
}

export default async function PortalPoliciesPage() {
    const session = await getPortalSession()

    if (!session) {
        redirect("/portal/login")
    }

    // Multi-corredor: buscar pólizas de todos los clientes con el mismo RUT
    const clientIds = await getClientIdsByRut(session.user.rut)

    const policies = await prisma.policy.findMany({
        where: {
            clientId: { in: clientIds },
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
            _count: {
                select: { Claim: true },
            },
        },
        orderBy: [
            { status: "asc" },
            { endDate: "asc" },
        ],
    })

    const activePolicies = policies.filter((p) => p.status === "ACTIVE")
    const otherPolicies = policies.filter((p) => p.status !== "ACTIVE")

    const today = new Date()
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    return (
        <div className="container py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Mis Pólizas</h1>
                <p className="text-muted-foreground mt-1">
                    Consulte el detalle de sus pólizas de seguro en todos sus corredores
                </p>
                {session.tenants.length > 1 && (
                    <p className="text-sm text-primary mt-2">
                        Mostrando pólizas de {session.tenants.length} corredores
                    </p>
                )}
            </div>

            {policies.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No tiene pólizas registradas</h3>
                        <p className="text-muted-foreground mt-2">
                            Contacte a su corredor para más información
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {/* Pólizas Activas */}
                    {activePolicies.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                Pólizas Vigentes ({activePolicies.length})
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                {activePolicies.map((policy) => {
                                    const isExpiringSoon = new Date(policy.endDate) <= in30Days
                                    return (
                                        <Link
                                            key={policy.id}
                                            href={`/portal/policies/${policy.id}`}
                                        >
                                            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <CardTitle className="text-lg">
                                                                {policy.number}
                                                            </CardTitle>
                                                            <p className="text-sm text-muted-foreground">
                                                                {POLICY_TYPE_LABELS[policy.type]}
                                                            </p>
                                                        </div>
                                                        <Badge
                                                            variant={isExpiringSoon ? "destructive" : "default"}
                                                        >
                                                            {isExpiringSoon ? "Por vencer" : "Vigente"}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Building2 className="h-4 w-4" />
                                                            {policy.InsuranceCompany?.name || policy.company}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Calendar className="h-4 w-4" />
                                                            Vigencia: {format(new Date(policy.startDate), "dd/MM/yyyy")} - {format(new Date(policy.endDate), "dd/MM/yyyy")}
                                                        </div>
                                                        {/* Multi-corredor: mostrar el corredor */}
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Briefcase className="h-4 w-4" />
                                                            Corredor: {policy.Client.Tenant.name}
                                                        </div>
                                                        <div className="flex items-center justify-between pt-2 border-t mt-3">
                                                            <span className="text-muted-foreground">
                                                                Prima: {Number(policy.premium).toLocaleString("es-CL", { minimumFractionDigits: 2 })} {policy.currency}
                                                            </span>
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Otras Pólizas */}
                    {otherPolicies.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
                                Pólizas Anteriores ({otherPolicies.length})
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                {otherPolicies.map((policy) => (
                                    <Link
                                        key={policy.id}
                                        href={`/portal/policies/${policy.id}`}
                                    >
                                        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full opacity-75">
                                            <CardHeader className="pb-2">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <CardTitle className="text-lg">
                                                            {policy.number}
                                                        </CardTitle>
                                                        <p className="text-sm text-muted-foreground">
                                                            {POLICY_TYPE_LABELS[policy.type]}
                                                        </p>
                                                    </div>
                                                    <Badge variant={STATUS_COLORS[policy.status]}>
                                                        {STATUS_LABELS[policy.status]}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Building2 className="h-4 w-4" />
                                                        {policy.InsuranceCompany?.name || policy.company}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Calendar className="h-4 w-4" />
                                                        {format(new Date(policy.startDate), "dd/MM/yyyy")} - {format(new Date(policy.endDate), "dd/MM/yyyy")}
                                                    </div>
                                                    {/* Multi-corredor: mostrar el corredor */}
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Briefcase className="h-4 w-4" />
                                                        Corredor: {policy.Client.Tenant.name}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
