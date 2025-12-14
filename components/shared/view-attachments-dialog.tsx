"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Paperclip } from "lucide-react"
import { AttachmentList } from "./attachment-list"

interface ViewAttachmentsDialogProps {
    entityId: string
    type: "quote" | "policy" | "claim"
    attachments: any[]
}

export function ViewAttachmentsDialog({ entityId, type, attachments }: ViewAttachmentsDialogProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Paperclip className="h-4 w-4" />
                    <span className="sr-only">Ver adjuntos</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Archivos Adjuntos</DialogTitle>
                </DialogHeader>
                <AttachmentList entityId={entityId} type={type} attachments={attachments} />
            </DialogContent>
        </Dialog>
    )
}
