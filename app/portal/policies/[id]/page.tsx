import { getPortalSession, getClientIdsByRut } from "@/actions/portal-auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    ArrowLeft,
    Calendar,
    Building2,
    FileText,
    Shield,
    AlertTriangle,
    Download,
    Briefcase,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
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

export default async function PortalPolicyDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await getPortalSession()
    const { id } = await params

    if (!session) {
        redirect("/portal/login")
    }

    // Multi-corredor: obtener todos los clientIds del usuario
    const clientIds = await getClientIdsByRut(session.user.rut)

    const policy = await prisma.policy.findUnique({
        where: { id },
        include: {
            InsuranceCompany: true,
            Claim: {
                orderBy: { createdAt: "desc" },
                take: 5,
            },
            PolicyItem: true,
            PolicyAttachment: true,
            Client: {
                include: {
                    Tenant: {
                        select: { name: true, slug: true },
                    },
                },
            },
        },
    })

    // Validar que la póliza pertenece a uno de los clientes del usuario (por RUT)
    if (!policy || !clientIds.includes(policy.clientId)) {
        notFound()
    }

    const coverages = policy.coverages as Array<{
        name: string
        insuredAmount?: number
        premium?: number
    }> | null

    const today = new Date()
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    const isExpiringSoon = policy.status === "ACTIVE" && new Date(policy.endDate) <= in30Days

    return (
        <div className="container py-8 px-4">
            <div className="mb-6">
                <Link href="/portal/policies">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Pólizas
                    </Button>
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Póliza {policy.number}</h1>
                        <p className="text-muted-foreground mt-1">
                            {POLICY_TYPE_LABELS[policy.type]} - {policy.InsuranceCompany?.name || policy.company}
                        </p>
                        <p className="text-sm text-primary mt-1 flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {policy.Client.Tenant.name}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant={isExpiringSoon ? "destructive" : STATUS_COLORS[policy.status]}
                            className="text-sm px-3 py-1"
                        >
                            {isExpiringSoon ? "Por vencer" : STATUS_LABELS[policy.status]}
                        </Badge>
                        {policy.status === "ACTIVE" && (
                            <Link href="/portal/claims/new">
                                <Button variant="outline" size="sm">
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Reportar Siniestro
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Información Principal */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Información de la Póliza
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Número de Póliza
                                </p>
                                <p className="text-lg font-medium">{policy.number}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Tipo de Seguro
                                </p>
                                <p className="text-lg">{POLICY_TYPE_LABELS[policy.type]}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Compañía Aseguradora
                                </p>
                                <p className="text-lg">
                                    {policy.InsuranceCompany?.name || policy.company}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Prima Total
                                </p>
                                <p className="text-lg font-medium">
                                    {Number(policy.premium).toLocaleString("es-CL", {
                                        minimumFractionDigits: 2,
                                    })}{" "}
                                    {policy.currency}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Vigencia
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Fecha de Inicio
                                </p>
                                <p className="text-lg">
                                    {format(new Date(policy.startDate), "PPP", { locale: es })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Fecha de Término
                                </p>
                                <p className={`text-lg ${isExpiringSoon ? "text-red-600 font-medium" : ""}`}>
                                    {format(new Date(policy.endDate), "PPP", { locale: es })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coberturas */}
                    {coverages && coverages.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Coberturas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {coverages.map((coverage, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                        >
                                            <span className="font-medium">{coverage.name}</span>
                                            {coverage.insuredAmount && (
                                                <span className="text-muted-foreground">
                                                    {coverage.insuredAmount.toLocaleString("es-CL")}{" "}
                                                    {policy.currency}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Items asegurados */}
                    {policy.PolicyItem.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Bienes Asegurados</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {policy.PolicyItem.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-3 rounded-lg border"
                                        >
                                            <div>
                                                <p className="font-medium">{item.description}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Ítem #{item.itemNumber}
                                                </p>
                                            </div>
                                            <span className="font-medium">
                                                {Number(item.value).toLocaleString("es-CL", {
                                                    minimumFractionDigits: 2,
                                                })}{" "}
                                                {item.currency}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Documentos */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Download className="h-5 w-5" />
                                Documentos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {policy.PolicyAttachment.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-4">
                                    No hay documentos disponibles
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {policy.PolicyAttachment.map((attachment) => (
                                        <a
                                            key={attachment.id}
                                            href={attachment.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                                        >
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm truncate flex-1">
                                                {attachment.fileName}
                                            </span>
                                            <Download className="h-4 w-4 text-muted-foreground" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Siniestros recientes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Siniestros
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {policy.Claim.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-4">
                                    Sin siniestros registrados
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {policy.Claim.map((claim) => (
                                        <div
                                            key={claim.id}
                                            className="p-2 rounded-lg border text-sm"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">
                                                    {claim.number || `#${claim.id.slice(0, 8)}`}
                                                </span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {claim.status === "REPORTED"
                                                        ? "Reportado"
                                                        : claim.status === "IN_PROCESS"
                                                        ? "En Proceso"
                                                        : claim.status === "APPROVED"
                                                        ? "Aprobado"
                                                        : claim.status === "REJECTED"
                                                        ? "Rechazado"
                                                        : "Cerrado"}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground text-xs mt-1">
                                                {format(new Date(claim.date), "dd/MM/yyyy")}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {policy.status === "ACTIVE" && (
                                <Link href="/portal/claims/new" className="block mt-4">
                                    <Button variant="outline" size="sm" className="w-full">
                                        Reportar Siniestro
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contacto */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Compañía
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p className="font-medium">
                                {policy.InsuranceCompany?.name || policy.company}
                            </p>
                            {policy.InsuranceCompany?.phone && (
                                <p className="text-muted-foreground">
                                    Tel: {policy.InsuranceCompany.phone}
                                </p>
                            )}
                            {policy.InsuranceCompany?.email && (
                                <p className="text-muted-foreground">
                                    {policy.InsuranceCompany.email}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
