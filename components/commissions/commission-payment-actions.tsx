"use client"

import { useState } from "react"
import type { Commission, Policy, Client, InsuranceCompany, CommissionPayment } from "@prisma/client"
import { deleteCommissionPayment } from "@/actions/commission"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { DollarSign, MoreHorizontal, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { RegisterPaymentDialog } from "./register-payment-dialog"

type CommissionWithRelations = Commission & {
    Policy: Policy & {
        Client: Client
        InsuranceCompany: InsuranceCompany | null
    }
    CommissionPayment: CommissionPayment[]
}

interface CommissionPaymentActionsProps {
    commission?: CommissionWithRelations
    canRegisterPayment?: boolean
    paymentId?: string
    canDelete?: boolean
}

export function CommissionPaymentActions({
    commission,
    canRegisterPayment,
    paymentId,
    canDelete,
}: CommissionPaymentActionsProps) {
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDeletePayment = async () => {
        if (!paymentId) return

        setIsDeleting(true)
        try {
            const result = await deleteCommissionPayment(paymentId)
            if (result.success) {
                toast.success(result.success)
                setDeleteDialogOpen(false)
            } else {
                toast.error(result.error || "Error al eliminar el pago")
            }
        } catch {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsDeleting(false)
        }
    }

    // If this is for registering a new payment (header button)
    if (commission && canRegisterPayment) {
        return (
            <>
                <Button onClick={() => setPaymentDialogOpen(true)}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Registrar Pago
                </Button>
                <RegisterPaymentDialog
                    commission={commission}
                    open={paymentDialogOpen}
                    onOpenChange={setPaymentDialogOpen}
                />
            </>
        )
    }

    // If this is for deleting a payment (row action)
    if (paymentId && canDelete) {
        return (
            <>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => setDeleteDialogOpen(true)}
                            className="text-red-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar Pago
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar Pago</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. El monto del pago será
                                restado del total pagado de la comisión.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeletePayment}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {isDeleting ? "Eliminando..." : "Eliminar"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        )
    }

    return null
}
