"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Send, CheckCircle2, XCircle, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateQuoteStatus, deleteQuote } from "@/actions/quote"

// @ts-expect-error
import { Quote, Client, InsuranceCompany, Tenant } from "@prisma/client"
import { DownloadQuoteButton } from "@/components/quotes/pdf/download-button"
import { UploadAttachmentDialog } from "@/components/quotes/attachments/upload-attachment-dialog"

interface QuoteWithRelations extends Quote {
    client: Client | null
    company: InsuranceCompany | null
    tenant: Tenant
}

interface QuoteListProps {
    quotes: QuoteWithRelations[]
}

const statusConfig = {
    DRAFT: { label: "Borrador", color: "bg-slate-100 text-slate-700 border-slate-200" },
    SENT: { label: "Enviada", color: "bg-blue-100 text-blue-700 border-blue-200" },
    ACCEPTED: { label: "Aceptada", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    REJECTED: { label: "Rechazada", color: "bg-red-100 text-red-700 border-red-200" },
}

export const QuoteList = ({ quotes }: QuoteListProps) => {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const handleStatusChange = (id: string, status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED") => {
        startTransition(() => {
            updateQuoteStatus(id, status)
                .then((data) => {
                    if (data.error) {
                        toast.error(data.error)
                    }
                    if (data.success) {
                        toast.success(data.success)
                        router.refresh()
                    }
                })
        })
    }

    const handleDelete = (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta cotización?")) return

        startTransition(() => {
            deleteQuote(id)
                .then((data) => {
                    if (data.error) {
                        toast.error(data.error)
                    }
                    if (data.success) {
                        toast.success(data.success)
                        router.refresh()
                    }
                })
        })
    }

    if (quotes.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Cotizaciones Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center p-10 text-muted-foreground">
                        No hay cotizaciones registradas.
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cotizaciones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente / Prospecto</TableHead>
                            <TableHead>Compañía</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Prima Total</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {quotes.map((quote: any) => {
                            const clientName = quote.client
                                ? `${quote.client.firstName} ${quote.client.lastName}`
                                : quote.prospectName || "Sin nombre"

                            return (
                                <TableRow key={quote.id}>
                                    <TableCell className="font-medium">{clientName}</TableCell>
                                    <TableCell>{quote.company?.name || "N/A"}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-normal">
                                            {quote.policyType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        {quote.totalPremium?.toFixed(2)} {quote.currency}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={`${statusConfig[quote.status as keyof typeof statusConfig]?.color || "bg-gray-100"} border`}
                                        >
                                            {statusConfig[quote.status as keyof typeof statusConfig]?.label || quote.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-500">
                                        {format(new Date(quote.createdAt), "dd MMM yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menú</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <div className="px-2 py-1.5 flex gap-2">
                                                    <DownloadQuoteButton quote={quote} />
                                                    <UploadAttachmentDialog quoteId={quote.id} />
                                                </div>
                                                <DropdownMenuSeparator />
                                                {quote.status === "DRAFT" && (
                                                    <DropdownMenuItem onClick={() => handleStatusChange(quote.id, "SENT")}>
                                                        <Send className="mr-2 h-4 w-4" />
                                                        Marcar como Enviada
                                                    </DropdownMenuItem>
                                                )}
                                                {quote.status === "SENT" && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(quote.id, "ACCEPTED")}>
                                                            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                                                            Marcar como Aceptada
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(quote.id, "REJECTED")}>
                                                            <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                                            Marcar como Rechazada
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(quote.id)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

