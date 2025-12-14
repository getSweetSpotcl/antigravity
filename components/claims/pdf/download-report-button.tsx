"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { pdf } from "@react-pdf/renderer"
import { ClaimReport } from "./claim-report"
import { Claim, Policy, Client, InsuranceCompany, Tenant } from "@prisma/client"
import { toast } from "sonner"

interface DownloadReportButtonProps {
    claim: Claim & {
        Policy: Policy & {
            Client: Client
            InsuranceCompany: InsuranceCompany | null
            Tenant: Tenant
        }
    }
    agent?: {
        name: string | null
        email: string | null
    }
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
    size?: "default" | "sm" | "lg" | "icon"
}

export function DownloadClaimReportButton({
    claim,
    agent,
    variant = "outline",
    size = "sm"
}: DownloadReportButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false)

    const handleDownload = async () => {
        setIsGenerating(true)
        try {
            const blob = await pdf(<ClaimReport claim={claim} agent={agent} />).toBlob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `Informe_Siniestro_${claim.number || claim.id.slice(0, 8)}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success("Informe generado correctamente")
        } catch (error) {
            console.error("Error generating claim report PDF:", error)
            toast.error("Error al generar el informe")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Button variant={variant} size={size} onClick={handleDownload} disabled={isGenerating}>
            {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <FileDown className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? "Generando..." : "Informe PDF"}
        </Button>
    )
}
