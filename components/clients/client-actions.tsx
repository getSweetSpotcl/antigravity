"use client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"
import { useState } from "react"
import { deleteClient } from "@/actions/client"
import { toast } from "sonner"
import { Client } from "@prisma/client"
// import { EditClientDialog } from "./edit-client-dialog" // TODO: Create this

interface ClientActionsProps {
    client: Client
}

export function ClientActions({ client }: ClientActionsProps) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const onDelete = async () => {
        setIsPending(true)
        try {
            const result = await deleteClient(client.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Cliente eliminado")
            }
        } catch (error) {
            toast.error("Algo salió mal")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="text-red-600">
                        <Trash className="mr-2 h-4 w-4" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* <EditClientDialog open={open} onOpenChange={setOpen} client={client} /> */}
        </>
    )
}
