"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { pdf } from "@react-pdf/renderer"
import { PolicyCertificate } from "./policy-certificate"
import { Policy, Client, InsuranceCompany, Tenant } from "@prisma/client"
import { toast } from "sonner"

interface DownloadCertificateButtonProps {
    policy: Policy & {
        Client: Client
        InsuranceCompany: InsuranceCompany | null
        Tenant: Tenant
    }
    agent?: {
        name: string | null
        email: string | null
    }
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
    size?: "default" | "sm" | "lg" | "icon"
}

export function DownloadCertificateButton({
    policy,
    agent,
    variant = "outline",
    size = "sm"
}: DownloadCertificateButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false)

    const handleDownload = async () => {
        setIsGenerating(true)
        try {
            const blob = await pdf(<PolicyCertificate policy={policy} agent={agent} />).toBlob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `Certificado_Poliza_${policy.number}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success("Certificado generado correctamente")
        } catch (error) {
            console.error("Error generating certificate PDF:", error)
            toast.error("Error al generar el certificado")
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
            {isGenerating ? "Generando..." : "Certificado PDF"}
        </Button>
    )
}
