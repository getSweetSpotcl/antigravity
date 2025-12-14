import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getClaimById } from "@/actions/claim"
import { serializeDecimal } from "@/lib/serialize"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { UpdateClaimStatus } from "@/components/claims/update-claim-status"
import { AttachmentList } from "@/components/shared/attachment-list"
import type { ClaimStatus } from "@prisma/client"

const getStatusLabel = (status: ClaimStatus) => {
    const labels: Record<ClaimStatus, string> = {
        REPORTED: "Reportado",
        IN_PROCESS: "En Proceso",
        APPROVED: "Aprobado",
        REJECTED: "Rechazado",
        CLOSED: "Cerrado",
    }
    return labels[status] || status
}

const getStatusVariant = (status: ClaimStatus): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<ClaimStatus, "default" | "secondary" | "destructive" | "outline"> = {
        REPORTED: "secondary",
        IN_PROCESS: "default",
        APPROVED: "outline",
        REJECTED: "destructive",
        CLOSED: "secondary",
    }
    return variants[status] || "secondary"
}

export default async function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.tenantId) {
        redirect("/auth/login")
    }

    const claimRaw = await getClaimById(id)
    const claim = serializeDecimal(claimRaw)

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center space-x-4">
                <Link href="/dashboard/claims">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h2 className="text-3xl font-bold tracking-tight">
                        Siniestro {claim.number || `#${claim.id.slice(0, 8)}`}
                    </h2>
                    <p className="text-muted-foreground">
                        Reportado el {format(claim.createdAt, "PPP", { locale: es })}
                    </p>
                </div>
                <Badge variant={getStatusVariant(claim.status)} className="text-lg px-4 py-2">
                    {getStatusLabel(claim.status)}
                </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Información del Siniestro</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Fecha del Siniestro</p>
                            <p className="text-lg">{format(claim.date, "PPP", { locale: es })}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                            <p className="text-sm mt-1">{claim.description}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Póliza Afectada</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Número de Póliza</p>
                            <Link
                                href={`/dashboard/policies/${claim.policyId}`}
                                className="text-lg text-blue-600 hover:underline"
                            >
                                {claim.Policy.number}
                            </Link>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                            <p className="text-lg">
                                {claim.Policy.Client.firstName} {claim.Policy.Client.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{claim.Policy.Client.rut}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Compañía Aseguradora</p>
                            <p className="text-lg">
                                {claim.Policy.InsuranceCompany?.name || claim.Policy.company}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="h-3 w-3 rounded-full bg-blue-600" />
                                        <div className="h-full w-0.5 bg-gray-200 mt-2" />
                                    </div>
                                    <div className="pb-8">
                                        <p className="font-medium">Siniestro Reportado</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(claim.createdAt, "PPP 'a las' p", { locale: es })}
                                        </p>
                                    </div>
                                </div>
                                {claim.status !== "REPORTED" && (
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="h-3 w-3 rounded-full bg-blue-600" />
                                            {claim.status !== "CLOSED" && (
                                                <div className="h-full w-0.5 bg-gray-200 mt-2" />
                                            )}
                                        </div>
                                        <div className="pb-8">
                                            <p className="font-medium">Estado: {getStatusLabel(claim.status)}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(claim.updatedAt, "PPP 'a las' p", { locale: es })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <UpdateClaimStatus claimId={claim.id} currentStatus={claim.status} />
            </div>

            <div className="mt-6">
                <AttachmentList
                    entityId={claim.id}
                    type="claim"
                    attachments={claim.ClaimAttachment}
                />
            </div>
        </div>
    )
}
