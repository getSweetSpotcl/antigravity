import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Building2, Calendar, DollarSign, User, FileText, AlertTriangle, Shield } from "lucide-react"
import Link from "next/link"
import { EndorsementList } from "@/components/policies/endorsements/endorsement-list"
import { CreateEndorsementDialog } from "@/components/policies/endorsements/create-endorsement-dialog"
import { AttachmentList } from "@/components/shared/attachment-list"
import { getPolicyById } from "@/actions/policy"
import { serializeDecimal } from "@/lib/serialize"

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: "Vigente",
    EXPIRED: "Vencida",
    CANCELLED: "Anulada",
    RENEWED: "Renovada",
}

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    ACTIVE: "default",
    EXPIRED: "destructive",
    CANCELLED: "secondary",
    RENEWED: "outline",
}

const TYPE_LABELS: Record<string, string> = {
    GENERAL: "General",
    LIFE: "Vida",
    HEALTH: "Salud",
    AUTO: "Automóvil",
    HOME: "Hogar",
    GUARANTEE: "Garantía",
}

export default async function PolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.tenantId) {
        redirect("/auth/login")
    }

    const policyRaw = await getPolicyById(id)

    if (!policyRaw) {
        redirect("/dashboard/policies")
    }

    const policy = serializeDecimal(policyRaw)

    const daysUntilExpiry = differenceInDays(new Date(policy.endDate), new Date())
    const isExpiringSoon = policy.status === "ACTIVE" && daysUntilExpiry <= 30 && daysUntilExpiry > 0
    const isExpired = policy.status === "ACTIVE" && daysUntilExpiry < 0

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/policies">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">Póliza {policy.number}</h1>
                            <Badge variant={STATUS_COLORS[policy.status] || "outline"}>
                                {STATUS_LABELS[policy.status] || policy.status}
                            </Badge>
                            <Badge variant="outline">{TYPE_LABELS[policy.type] || policy.type}</Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            {policy.InsuranceCompany?.name || policy.company}
                        </p>
                    </div>
                </div>
                {isExpiringSoon && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-medium">Vence en {daysUntilExpiry} días</span>
                    </div>
                )}
                {isExpired && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-medium">Póliza vencida</span>
                    </div>
                )}
            </div>

            {/* Resumen en cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cliente</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">
                            {policy.Client.firstName} {policy.Client.lastName}
                        </div>
                        <p className="text-xs text-muted-foreground">{policy.Client.rut}</p>
                        {policy.Client.email && (
                            <p className="text-xs text-muted-foreground">{policy.Client.email}</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Compañía</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">
                            {policy.InsuranceCompany?.name || policy.company}
                        </div>
                        {policy.InsuranceCompany?.rut && (
                            <p className="text-xs text-muted-foreground">{policy.InsuranceCompany.rut}</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Prima Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Number(policy.premium).toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">{policy.currency}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Comisión</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Number(policy.commission).toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">{policy.currency}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Vigencia */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Período de Vigencia</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-8">
                        <div>
                            <p className="text-sm text-muted-foreground">Inicio</p>
                            <p className="text-lg font-semibold">{format(policy.startDate, "PPP", { locale: es })}</p>
                        </div>
                        <div className="text-2xl text-muted-foreground">→</div>
                        <div>
                            <p className="text-sm text-muted-foreground">Término</p>
                            <p className={`text-lg font-semibold ${isExpiringSoon ? "text-amber-600" : ""} ${isExpired ? "text-red-600" : ""}`}>
                                {format(policy.endDate, "PPP", { locale: es })}
                            </p>
                        </div>
                        {policy.status === "ACTIVE" && daysUntilExpiry > 0 && (
                            <Badge variant={isExpiringSoon ? "destructive" : "secondary"} className="ml-auto">
                                {daysUntilExpiry} días restantes
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Tabs con contenido */}
            <Tabs defaultValue="endorsements" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="endorsements" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Endosos ({policy.Endorsement.length})
                    </TabsTrigger>
                    <TabsTrigger value="claims" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Siniestros ({policy.Claim.length})
                    </TabsTrigger>
                    <TabsTrigger value="attachments" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Documentos ({policy.PolicyAttachment.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="endorsements" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Endosos y Movimientos</h3>
                            <p className="text-sm text-muted-foreground">Historial de modificaciones a la póliza</p>
                        </div>
                        <CreateEndorsementDialog policyId={policy.id} />
                    </div>
                    <EndorsementList endorsements={policy.Endorsement} policyId={policy.id} />
                </TabsContent>

                <TabsContent value="claims" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Siniestros</h3>
                            <p className="text-sm text-muted-foreground">Siniestros reportados para esta póliza</p>
                        </div>
                        <Link href={`/dashboard/claims?policyId=${policy.id}`}>
                            <Button variant="outline">Ver todos</Button>
                        </Link>
                    </div>
                    {policy.Claim.length === 0 ? (
                        <Card>
                            <CardContent className="py-10 text-center text-muted-foreground">
                                No hay siniestros registrados para esta póliza.
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {policy.Claim.slice(0, 5).map((claim: any) => (
                                        <div key={claim.id} className="flex items-center justify-between p-4">
                                            <div>
                                                <p className="font-medium">{claim.number || "Sin número"}</p>
                                                <p className="text-sm text-muted-foreground truncate max-w-md">{claim.description}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline">{claim.status}</Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {format(new Date(claim.date), "dd/MM/yyyy")}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="attachments" className="space-y-4">
                    <AttachmentList
                        entityId={policy.id}
                        type="policy"
                        attachments={policy.PolicyAttachment}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
