"use client"

import { useState, useRef } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Paperclip, Loader2, UploadCloud } from "lucide-react"
import { upload } from "@vercel/blob/client"
import { addQuoteAttachment } from "@/actions/quote"
import { toast } from "sonner"

interface UploadAttachmentDialogProps {
    quoteId: string
}

export function UploadAttachmentDialog({ quoteId }: UploadAttachmentDialogProps) {
    const [open, setOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const inputFileRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!inputFileRef.current?.files) {
            toast.error("Seleccione un archivo")
            return
        }

        const file = inputFileRef.current.files[0]
        if (!file) return

        setIsUploading(true)
        try {
            // 1. Subir a Vercel Blob
            const newBlob = await upload(file.name, file, {
                access: "public",
                handleUploadUrl: "/api/upload",
            })

            // 2. Guardar referencia en DB
            const result = await addQuoteAttachment(quoteId, {
                url: newBlob.url,
                name: file.name,
                size: file.size,
                type: file.type,
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Archivo subido correctamente")
                setOpen(false)
                if (inputFileRef.current) inputFileRef.current.value = ""
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast.error("Error al subir el archivo. Verifique la configuración.")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Paperclip className="mr-2 h-4 w-4" />
                    Adjuntar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adjuntar Archivo</DialogTitle>
                    <DialogDescription>
                        Suba documentos relacionados a esta cotización (PDF, Imágenes, Word).
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="file">Archivo</Label>
                        <div className="flex items-center justify-center w-full">
                            <label
                                htmlFor="dropzone-file"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-2 text-gray-500" />
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">Click para subir</span>
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        PDF, PNG, JPG, DOCX (MAX. 4MB)
                                    </p>
                                </div>
                                <input
                                    id="dropzone-file"
                                    type="file"
                                    className="hidden"
                                    ref={inputFileRef}
                                    onChange={(e) => {
                                        // Force re-render or show selected filename could be added here
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isUploading}>
                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isUploading ? "Subiendo..." : "Subir Archivo"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
