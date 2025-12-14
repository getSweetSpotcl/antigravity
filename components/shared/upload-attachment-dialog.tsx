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
import { Label } from "@/components/ui/label"
import { Paperclip, Loader2, UploadCloud, FileIcon, X, CheckCircle2 } from "lucide-react"
import { upload } from "@vercel/blob/client"
import { addQuoteAttachment, addPolicyAttachment, addClaimAttachment } from "@/actions/attachment"
import { toast } from "sonner"

interface UploadAttachmentDialogProps {
    entityId: string
    type: "quote" | "policy" | "claim"
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function UploadAttachmentDialog({ entityId, type }: UploadAttachmentDialogProps) {
    const [open, setOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const inputFileRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validar tamaño
        if (file.size > MAX_FILE_SIZE) {
            toast.error(`El archivo es muy grande. Máximo 10MB permitido.`)
            if (inputFileRef.current) inputFileRef.current.value = ""
            return
        }

        setSelectedFile(file)
        toast.success(`Archivo "${file.name}" seleccionado`)
    }

    const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!selectedFile) {
            toast.error("Seleccione un archivo")
            return
        }

        setIsUploading(true)
        try {
            // 1. Subir a Vercel Blob
            const newBlob = await upload(selectedFile.name, selectedFile, {
                access: "public",
                handleUploadUrl: "/api/upload",
            })

            // 2. Guardar referencia en DB según el tipo
            let result
            const fileData = {
                url: newBlob.url,
                name: selectedFile.name,
                size: selectedFile.size,
                type: selectedFile.type,
            }

            if (type === "quote") {
                result = await addQuoteAttachment(entityId, fileData)
            } else if (type === "policy") {
                result = await addPolicyAttachment(entityId, fileData)
            } else if (type === "claim") {
                result = await addClaimAttachment(entityId, fileData)
            }

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Archivo subido correctamente")
                setOpen(false)
                setSelectedFile(null)
                if (inputFileRef.current) inputFileRef.current.value = ""
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast.error("Error al subir el archivo. Verifique la configuración.")
        } finally {
            setIsUploading(false)
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    const removeFile = () => {
        setSelectedFile(null)
        if (inputFileRef.current) inputFileRef.current.value = ""
    }

    const getTitle = () => {
        switch (type) {
            case "quote": return "Cotización"
            case "policy": return "Póliza"
            case "claim": return "Siniestro"
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Adjuntar Archivo a {getTitle()}</DialogTitle>
                    <DialogDescription>
                        Suba documentos relacionados (PDF, Imágenes, Word).
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="file">Archivo</Label>

                        {!selectedFile ? (
                            <div className="flex items-center justify-center w-full">
                                <label
                                    htmlFor="dropzone-file"
                                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 border-muted-foreground/25 hover:border-primary/50 transition-all duration-200"
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-foreground">
                                            <span className="font-semibold">Click para subir</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            PDF, PNG, JPG, DOCX (MAX. 10MB)
                                        </p>
                                    </div>
                                    <input
                                        id="dropzone-file"
                                        type="file"
                                        className="hidden"
                                        ref={inputFileRef}
                                        onChange={handleFileChange}
                                        accept=".pdf,.png,.jpg,.jpeg,.docx,.doc"
                                    />
                                </label>
                            </div>
                        ) : (
                            <div className="w-full space-y-3">
                                <div className="flex items-start gap-3 p-4 border-2 border-green-500 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md flex-shrink-0">
                                        <FileIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground break-words">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatFileSize(selectedFile.size)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={removeFile}
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isUploading || !selectedFile}>
                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isUploading ? "Subiendo..." : "Subir Archivo"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
