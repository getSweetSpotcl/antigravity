"use client"

import { useState } from "react"
import { ClaimStatus } from "@prisma/client"
import { updateClaimStatus } from "@/actions/claim"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UpdateClaimStatusProps {
    claimId: string
    currentStatus: ClaimStatus
}

const statusOptions: { value: ClaimStatus; label: string }[] = [
    { value: "REPORTED", label: "Reportado" },
    { value: "IN_PROCESS", label: "En Proceso" },
    { value: "APPROVED", label: "Aprobado" },
    { value: "REJECTED", label: "Rechazado" },
    { value: "CLOSED", label: "Cerrado" },
]

export function UpdateClaimStatus({ claimId, currentStatus }: UpdateClaimStatusProps) {
    const [status, setStatus] = useState<ClaimStatus>(currentStatus)
    const [isPending, setIsPending] = useState(false)

    const handleUpdate = async () => {
        if (status === currentStatus) {
            toast.info("Seleccione un estado diferente")
            return
        }

        setIsPending(true)
        try {
            const result = await updateClaimStatus({ claimId, status })
            if (result.success) {
                toast.success("Estado actualizado correctamente")
                window.location.reload()
            } else {
                toast.error(result.error || "Error al actualizar estado")
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Actualizar Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Select value={status} onValueChange={(value) => setStatus(value as ClaimStatus)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    onClick={handleUpdate}
                    disabled={isPending || status === currentStatus}
                    className="w-full"
                >
                    {isPending ? "Actualizando..." : "Actualizar Estado"}
                </Button>
            </CardContent>
        </Card>
    )
}
