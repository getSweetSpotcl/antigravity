"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DollarSign, Trash2 } from "lucide-react"
import { RegisterAgentPaymentDialog } from "./register-agent-payment-dialog"
import { deleteAgentCommissionPayment } from "@/actions/agent-commission"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { CommissionStatus } from "@prisma/client"

interface AgentCommissionForPayment {
    id: string
    agentId: string
    amount: number | string
    pendingAmount: number | string
    currency: string
    status: CommissionStatus
    Agent: {
        id: string
        name: string | null
        email: string
        bankName?: string | null
        bankAccountNumber?: string | null
        bankAccountType?: string | null
    }
    Policy: {
        number: string
        Client: {
            firstName: string
            lastName: string
        }
    }
}

interface AgentCommissionPaymentActionsProps {
    commission?: AgentCommissionForPayment
    canRegisterPayment?: boolean
    paymentId?: string
    canDelete?: boolean
}

export function AgentCommissionPaymentActions({
    commission,
    canRegisterPayment,
    paymentId,
    canDelete,
}: AgentCommissionPaymentActionsProps) {
    const router = useRouter()
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDeletePayment = async () => {
        if (!paymentId) return

        setIsDeleting(true)
        try {
            const result = await deleteAgentCommissionPayment(paymentId)
            if (result.success) {
                toast.success(result.success)
                router.refresh()
            } else {
                toast.error(result.error || "Error al eliminar pago")
            }
        } catch {
            toast.error("Ocurrio un error inesperado")
        } finally {
            setIsDeleting(false)
        }
    }

    // Render register payment button
    if (commission && canRegisterPayment) {
        return (
            <>
                <Button onClick={() => setPaymentDialogOpen(true)}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Registrar Pago
                </Button>
                <RegisterAgentPaymentDialog
                    commission={commission}
                    open={paymentDialogOpen}
                    onOpenChange={setPaymentDialogOpen}
                />
            </>
        )
    }

    // Render delete payment button
    if (paymentId && canDelete) {
        return (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isDeleting}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Pago</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta accion no se puede deshacer. El monto del pago sera devuelto
                            al saldo pendiente de la comision.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePayment}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )
    }

    return null
}
