"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Edit, Send, CheckCircle2, XCircle, FileText, MessageSquare, Paperclip, FilePlus, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Quote, Client, InsuranceCompany, QuoteAttachment, Tenant, Policy } from "@prisma/client"
import { DownloadQuoteButton } from "./pdf/download-button"
import { AttachmentList } from "@/components/shared/attachment-list"
import { EditQuoteDialog } from "./edit-quote-dialog"
import { CommunicationsList } from "./communications-list"
import { POLICY_TYPES_ES } from "@/lib/insurance-constants"
import { updateQuoteStatus, createPolicyFromQuote } from "@/actions/quote"
import { toast } from "sonner"

interface CommunicationAttachment {
    id: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number | null
    createdAt: Date
}

interface Communication {
    id: string
    type: string
    subject: string | null
    content: string
    contactPerson: string | null
    createdAt: Date
    CommunicationAttachment: CommunicationAttachment[]
}

interface QuoteWithRelations extends Omit<Quote, 'totalPremium' | 'totalInsuredAmount'> {
    Client: Client | null
    InsuranceCompany: InsuranceCompany | null
    Tenant: Tenant
    QuoteAttachment?: QuoteAttachment[]
    QuoteCommunication?: Communication[]
    Policy?: Policy | null
    totalPremium: string
    totalInsuredAmount: string | null
}

interface QuoteDetailViewProps {
    quote: QuoteWithRelations
    clients: Client[]
    companies: InsuranceCompany[]
    currentUser?: {
        name: string | null
        email: string | null
    }
}

const statusConfig = {
    DRAFT: { label: "Borrador", color: "bg-slate-100 text-slate-700", icon: FileText },
    SENT: { label: "Enviada", color: "bg-blue-100 text-blue-700", icon: Send },
    ACCEPTED: { label: "Aceptada", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    REJECTED: { label: "Rechazada", color: "bg-red-100 text-red-700", icon: XCircle },
}

export function QuoteDetailView({ quote, clients, companies, currentUser }: QuoteDetailViewProps) {
    const router = useRouter()
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [showCreatePolicyDialog, setShowCreatePolicyDialog] = useState(false)

    const StatusIcon = statusConfig[quote.status as keyof typeof statusConfig]?.icon || FileText
    const statusInfo = statusConfig[quote.status as keyof typeof statusConfig]

    const handleStatusChange = (newStatus: string) => {
        startTransition(async () => {
            const result = await updateQuoteStatus(quote.id, newStatus as any)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Estado actualizado correctamente")
                router.refresh()
            }
        })
    }

    const handleCreatePolicy = () => {
        startTransition(async () => {
            const result = await createPolicyFromQuote(quote.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(result.success)
                setShowCreatePolicyDialog(false)
                router.push(`/dashboard/policies/${result.policyId}`)
            }
        })
    }

    const clientName = quote.Client
        ? `${quote.Client.firstName} ${quote.Client.lastName}`
        : quote.prospectName || "Sin cliente"

    // Prisma ya deserializa los campos JSON automáticamente
    const coverages = Array.isArray(quote.coverages) ? quote.coverages : []

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/dashboard/quotes")}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Cotización #{quote.quoteNumber || quote.id.slice(0, 8)}
                        </h1>
                        <p className="text-muted-foreground">
                            {clientName} • {quote.InsuranceCompany?.name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Status Dropdown */}
                    <Select
                        value={quote.status}
                        onValueChange={handleStatusChange}
                        disabled={isPending}
                    >
                        <SelectTrigger className={`w-[160px] ${statusInfo?.color} border`}>
                            <StatusIcon className="mr-2 h-4 w-4" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DRAFT">
                                <div className="flex items-center">
                                    <FileText className="mr-2 h-4 w-4 text-slate-500" />
                                    Borrador
                                </div>
                            </SelectItem>
                            <SelectItem value="SENT">
                                <div className="flex items-center">
                                    <Send className="mr-2 h-4 w-4 text-blue-500" />
                                    Enviada
                                </div>
                            </SelectItem>
                            <SelectItem value="ACCEPTED">
                                <div className="flex items-center">
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                                    Aceptada
                                </div>
                            </SelectItem>
                            <SelectItem value="REJECTED">
                                <div className="flex items-center">
                                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                    Rechazada
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <DownloadQuoteButton quote={quote as any} agent={currentUser} />

                    {/* Crear Póliza Button - solo si no existe póliza y tiene cliente */}
                    {!quote.Policy && quote.clientId && (
                        <Button
                            onClick={() => setShowCreatePolicyDialog(true)}
                            disabled={isPending}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <FilePlus className="mr-2 h-4 w-4" />
                            )}
                            Crear Póliza
                        </Button>
                    )}

                    {/* Mostrar enlace a póliza si ya existe */}
                    {quote.Policy && (
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/dashboard/policies/${quote.Policy?.id}`)}
                            className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Ver Póliza
                        </Button>
                    )}

                    <Button onClick={() => setIsEditOpen(true)} disabled={isPending}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="details" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="details">Detalles</TabsTrigger>
                    <TabsTrigger value="coverages">Coberturas</TabsTrigger>
                    <TabsTrigger value="attachments">
                        <Paperclip className="mr-2 h-4 w-4" />
                        Adjuntos ({quote.QuoteAttachment?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="communications">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Comunicaciones ({quote.QuoteCommunication?.length || 0})
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Detalles */}
                <TabsContent value="details" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Cliente y Partes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Cliente y Partes</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="text-muted-foreground">Tomador:</span>
                                    <span className="font-medium">{quote.contractorName}</span>

                                    <span className="text-muted-foreground">RUT:</span>
                                    <span>{quote.contractorRut}</span>

                                    {quote.contractorEmail && (
                                        <>
                                            <span className="text-muted-foreground">Email:</span>
                                            <span>{quote.contractorEmail}</span>
                                        </>
                                    )}

                                    {quote.contractorPhone && (
                                        <>
                                            <span className="text-muted-foreground">Teléfono:</span>
                                            <span>{quote.contractorPhone}</span>
                                        </>
                                    )}

                                    <span className="text-muted-foreground">Asegurado:</span>
                                    <span className="font-medium">{quote.insuredName || quote.contractorName}</span>

                                    {quote.beneficiaryName && (
                                        <>
                                            <span className="text-muted-foreground">Beneficiario:</span>
                                            <span>{quote.beneficiaryName}</span>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Información del Seguro */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Información del Seguro</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="text-muted-foreground">Compañía:</span>
                                    <span className="font-medium">{quote.InsuranceCompany?.name}</span>

                                    <span className="text-muted-foreground">Tipo:</span>
                                    <span>
                                        <Badge variant="outline">
                                            {POLICY_TYPES_ES[quote.policyType as keyof typeof POLICY_TYPES_ES] || quote.policyType}
                                        </Badge>
                                    </span>

                                    <span className="text-muted-foreground">Vigencia Desde:</span>
                                    <span>
                                        {quote.validFrom ? format(new Date(quote.validFrom), "PPP", { locale: es }) : "A definir"}
                                    </span>

                                    <span className="text-muted-foreground">Vigencia Hasta:</span>
                                    <span>
                                        {format(new Date(quote.validUntil), "PPP", { locale: es })}
                                    </span>

                                    <span className="text-muted-foreground">Duración:</span>
                                    <span>{quote.policyDuration} meses</span>

                                    <span className="text-muted-foreground">Moneda:</span>
                                    <span>{quote.currency}</span>

                                    {(quote as any).polNumber && (
                                        <>
                                            <span className="text-muted-foreground font-bold text-blue-600">N° POL:</span>
                                            <span className="font-bold text-blue-600">{(quote as any).polNumber}</span>
                                        </>
                                    )}

                                    {currentUser && (
                                        <>
                                            <span className="text-muted-foreground">Ejecutivo:</span>
                                            <span className="text-xs">{currentUser.name}</span>
                                        </>
                                    )}
                                </div>

                                {(quote as any).particularConditions && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-xs font-medium text-slate-500 mb-1">Condiciones Particulares:</p>
                                        <p className="text-sm whitespace-pre-wrap bg-slate-50 p-2 rounded border">
                                            {(quote as any).particularConditions}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Prima Neta:</span>
                                        <span>{Number(quote.totalPremium).toFixed(2)} {quote.currency}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">IVA (19%):</span>
                                        <span>{(Number(quote.totalPremium) * 0.19).toFixed(2)} {quote.currency}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-bold">
                                        <span>Total:</span>
                                        <span className="text-blue-600">{(Number(quote.totalPremium) * 1.19).toFixed(2)} {quote.currency}</span>
                                    </div>

                                    <div className="mt-2 pt-2 border-t border-dashed">
                                        <div className="flex justify-between text-sm font-medium text-emerald-700">
                                            <span>
                                                {(quote as any).paymentInstallments || 1} {(quote as any).paymentInstallments == 1 ? "Cuota" : "Cuotas"} de:
                                            </span>
                                            <span>
                                                {((Number(quote.totalPremium) * 1.19) / ((quote as any).paymentInstallments || 1)).toFixed(2)} {quote.currency}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Comisión Corredor (Visible solo si es > 0) */}
                                    {(quote as any).commissionPercentage > 0 && (
                                        <div className="mt-2 pt-2 border-t border-dashed">
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>Comisión Corredor ({(quote as any).commissionPercentage}%):</span>
                                                <span>
                                                    {(Number(quote.totalPremium) * ((quote as any).commissionPercentage / 100)).toFixed(2)} {quote.currency}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bien Asegurado */}
                    {quote.insuredProperty && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Bien Asegurado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {typeof quote.insuredProperty === 'string' ? (
                                    <p className="text-sm whitespace-pre-wrap">{quote.insuredProperty}</p>
                                ) : (
                                    <div className="space-y-3">
                                        {Object.entries(quote.insuredProperty as Record<string, any>).map(([key, value]) => {
                                            // Skip empty values
                                            if (!value || value === '') return null

                                            // Format key to readable label
                                            const labels: Record<string, string> = {
                                                type: 'Tipo',
                                                description: 'Descripción',
                                                plate: 'Patente',
                                                brand: 'Marca',
                                                model: 'Modelo',
                                                year: 'Año',
                                                usage: 'Uso',
                                                vehicleValue: 'Valor del Vehículo',
                                                propertyType: 'Tipo de Propiedad',
                                                constructionType: 'Tipo de Construcción',
                                                address: 'Dirección',
                                                commune: 'Comuna',
                                                city: 'Ciudad',
                                                buildingValue: 'Valor Edificación',
                                                contentsValue: 'Valor Contenidos',
                                                insuredAge: 'Edad del Asegurado',
                                                occupation: 'Ocupación',
                                                coverageAmount: 'Monto de Cobertura',
                                            }

                                            const label = labels[key] || key.charAt(0).toUpperCase() + key.slice(1)

                                            return (
                                                <div key={key} className="grid grid-cols-3 gap-2 text-sm border-b pb-2 last:border-0">
                                                    <span className="text-muted-foreground font-medium">{label}:</span>
                                                    <span className="col-span-2">{String(value)}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Notas */}
                    {(quote.notes || quote.internalNotes) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {quote.notes && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Notas para el Cliente</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
                                    </CardContent>
                                </Card>
                            )}
                            {quote.internalNotes && (
                                <Card className="bg-yellow-50">
                                    <CardHeader>
                                        <CardTitle className="text-base">Notas Internas</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm whitespace-pre-wrap">{quote.internalNotes}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </TabsContent>

                {/* Tab: Coberturas */}
                <TabsContent value="coverages">
                    <Card>
                        <CardHeader>
                            <CardTitle>Coberturas y Primas</CardTitle>
                            <CardDescription>
                                Detalle de las coberturas incluidas en esta cotización
                                {(quote as any).polNumber && (
                                    <span className="block mt-1 font-medium text-blue-600">
                                        N° POL (Condiciones Generales): {(quote as any).polNumber}
                                    </span>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {coverages.map((coverage: any, index: number) => (
                                    <div key={index} className="flex justify-between items-start p-4 bg-slate-50 rounded-lg border">
                                        <div className="flex-1">
                                            <h4 className="font-medium">
                                                {coverage.name}
                                                {coverage.cadNumber && (
                                                    <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                                        CAD: {coverage.cadNumber}
                                                    </span>
                                                )}
                                            </h4>
                                            <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                                {coverage.insuredAmount && (
                                                    <div>
                                                        <span className="font-medium">Monto Asegurado:</span>{" "}
                                                        {coverage.insuredAmount} {quote.currency}
                                                    </div>
                                                )}
                                                {coverage.deductible && (
                                                    <div>
                                                        <span className="font-medium">Deducible:</span> {coverage.deductible}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-blue-600">
                                                {parseFloat(coverage.premium || "0").toFixed(2)} {quote.currency}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Prima Neta</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            <div className="flex justify-between items-center bg-blue-50 p-6 rounded-lg">
                                <div>
                                    <div className="text-sm text-muted-foreground">Prima Total Neta</div>
                                    {quote.totalInsuredAmount && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Monto Total Asegurado: {parseFloat(quote.totalInsuredAmount).toFixed(2)} {quote.currency}
                                        </div>
                                    )}
                                </div>
                                <div className="text-3xl font-bold text-blue-700">
                                    {parseFloat(quote.totalPremium || "0").toFixed(2)} {quote.currency}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Adjuntos */}
                <TabsContent value="attachments">
                    <AttachmentList
                        entityId={quote.id}
                        type="quote"
                        attachments={quote.QuoteAttachment || []}
                    />
                </TabsContent>

                {/* Tab: Comunicaciones */}
                <TabsContent value="communications">
                    <CommunicationsList
                        quoteId={quote.id}
                        communications={quote.QuoteCommunication || []}
                    />
                </TabsContent>
            </Tabs>

            {/* Edit Dialog */}
            <EditQuoteDialog
                quote={quote}
                clients={clients}
                companies={companies}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
            />

            {/* Create Policy Confirmation Dialog */}
            <AlertDialog open={showCreatePolicyDialog} onOpenChange={setShowCreatePolicyDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Crear Póliza desde Cotización</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="text-sm text-muted-foreground">
                                <p>Se creará una nueva póliza con los datos de esta cotización.</p>
                                <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Cliente:</span>
                                        <span className="font-medium">{clientName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Compañía:</span>
                                        <span className="font-medium">{quote.InsuranceCompany?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Prima:</span>
                                        <span className="font-medium">{quote.totalPremium} {quote.currency}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Comisión ({(quote as any).commissionPercentage || 0}%):</span>
                                        <span className="font-medium text-emerald-600">
                                            {(Number(quote.totalPremium) * (((quote as any).commissionPercentage || 0) / 100)).toFixed(2)} {quote.currency}
                                        </span>
                                    </div>
                                </div>
                                <p className="mt-4 text-amber-600 text-sm">
                                    El estado de la cotización cambiará automáticamente a "Aceptada".
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCreatePolicy}
                            disabled={isPending}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <FilePlus className="mr-2 h-4 w-4" />
                                    Crear Póliza
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
