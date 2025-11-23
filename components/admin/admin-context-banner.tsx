"use client"

import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import { clearAdminContext } from "@/actions/admin"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AdminContextBannerProps {
    tenantName?: string
    isSuperAdmin: boolean
    hasActiveContext: boolean
}

export function AdminContextBanner({ tenantName, isSuperAdmin, hasActiveContext }: AdminContextBannerProps) {
    const router = useRouter()

    if (!isSuperAdmin) return null

    const handleExit = async () => {
        await clearAdminContext()
        toast.success("Modo administración finalizado")
        router.refresh()
    }

    if (hasActiveContext) {
        return (
            <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-amber-900 text-sm">
                <div className="flex items-center gap-2">
                    <span className="font-bold">MODO ADMINISTRACIÓN:</span>
                    <span>Estás operando como {tenantName || "Tenant Externo"}</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 hover:bg-amber-200 text-amber-900"
                    onClick={handleExit}
                >
                    <XCircle className="mr-2 h-4 w-4" />
                    Salir
                </Button>
            </div>
        )
    }

    return null
}
