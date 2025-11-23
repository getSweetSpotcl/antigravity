"use client"

import { Button } from "@/components/ui/button"
import { LogIn, Loader2 } from "lucide-react"
import { switchAdminContext } from "@/actions/admin"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface TenantSwitcherButtonProps {
    tenantId: string
    tenantName: string
}

export function TenantSwitcherButton({ tenantId, tenantName }: TenantSwitcherButtonProps) {
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    const handleSwitch = async () => {
        setIsPending(true)
        try {
            const result = await switchAdminContext(tenantId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(result.success)
                router.push("/dashboard") // Redirigir al dashboard para ver el contexto aplicado
            }
        } catch (error) {
            toast.error("Error al cambiar de contexto")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSwitch}
            disabled={isPending}
        >
            {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <LogIn className="mr-2 h-4 w-4" />
            )}
            Gestionar
        </Button>
    )
}
