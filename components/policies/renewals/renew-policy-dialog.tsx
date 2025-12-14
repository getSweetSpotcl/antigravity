"use client"

import { useState } from "react"
import { Policy, Client, InsuranceCompany } from "@prisma/client"
import { format, addYears } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { renewPolicy } from "@/actions/renewal"

interface RenewPolicyDialogProps {
    policy: Policy & {
        Client: Client
        InsuranceCompany: InsuranceCompany | null
    }
}

export function RenewPolicyDialog({ policy }: RenewPolicyDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [newEndDate, setNewEndDate] = useState<Date>(addYears(policy.endDate, 1))

    const handleRenew = async () => {
        setIsPending(true)
        try {
            const result = await renewPolicy(policy.id, newEndDate)
            if (result.success) {
                toast.success("Póliza renovada correctamente")
                setOpen(false)
                window.location.reload()
            } else {
                toast.error(result.error || "Error al renovar póliza")
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Renovar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Renovar Póliza {policy.number}</DialogTitle>
                    <DialogDescription>
                        Seleccione la nueva fecha de vencimiento para la renovación.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Cliente</p>
                        <p className="text-sm text-muted-foreground">
                            {policy.Client.firstName} {policy.Client.lastName}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Vencimiento Actual</p>
                        <p className="text-sm text-muted-foreground">
                            {format(policy.endDate, "PPP", { locale: es })}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Nueva Fecha de Vencimiento</p>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !newEndDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {newEndDate ? format(newEndDate, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={newEndDate}
                                    onSelect={(date) => date && setNewEndDate(date)}
                                    disabled={(date) => date < policy.endDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleRenew} disabled={isPending || !newEndDate}>
                        {isPending ? "Renovando..." : "Confirmar Renovación"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
