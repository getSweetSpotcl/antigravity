"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { pdf } from "@react-pdf/renderer"
import { QuoteDocument } from "./quote-document"
import { Quote, Client, InsuranceCompany, Tenant } from "@prisma/client"
import { toast } from "sonner"

interface DownloadQuoteButtonProps {
    quote: Quote & {
        client: Client | null
        company: InsuranceCompany | null
        tenant: Tenant
    }
}

export function DownloadQuoteButton({ quote }: DownloadQuoteButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false)

    const handleDownload = async () => {
        setIsGenerating(true)
        try {
            const blob = await pdf(<QuoteDocument quote={quote} />).toBlob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `Cotizacion_${quote.quoteNumber || quote.id.slice(0, 8)}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success("PDF generado correctamente")
        } catch (error) {
            console.error("Error generating PDF:", error)
            toast.error("Error al generar el PDF")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={isGenerating}>
            {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <FileDown className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? "Generando..." : "Descargar PDF"}
        </Button>
    )
}
