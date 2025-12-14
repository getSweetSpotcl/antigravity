"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { pdf } from "@react-pdf/renderer"
import { CommissionStatement } from "./commission-statement"
import { Commission, Policy, Client, InsuranceCompany, Tenant, CommissionPayment } from "@prisma/client"
import { toast } from "sonner"

interface DownloadStatementButtonProps {
    commission: Commission & {
        Policy: Policy & {
            Client: Client
            InsuranceCompany: InsuranceCompany | null
        }
        CommissionPayment: CommissionPayment[]
    }
    tenant: Tenant
    agent?: {
        name: string | null
        email: string | null
    }
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
    size?: "default" | "sm" | "lg" | "icon"
}

export function DownloadStatementButton({
    commission,
    tenant,
    agent,
    variant = "outline",
    size = "sm"
}: DownloadStatementButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false)

    const handleDownload = async () => {
        setIsGenerating(true)
        try {
            const blob = await pdf(
                <CommissionStatement commission={commission} tenant={tenant} agent={agent} />
            ).toBlob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `Estado_Comision_${commission.Policy.number}_${commission.id.slice(0, 8)}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success("Estado de comisión generado correctamente")
        } catch (error) {
            console.error("Error generating commission statement PDF:", error)
            toast.error("Error al generar el estado de comisión")
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
            {isGenerating ? "Generando..." : "Estado PDF"}
        </Button>
    )
}
