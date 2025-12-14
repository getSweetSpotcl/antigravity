"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Paperclip, X, FileText, Image as ImageIcon, File, Eye, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface QuoteAttachmentsProps {
    files: File[]
    onFilesChange: (files: File[]) => void
}

export function QuoteAttachments({ files, onFilesChange }: QuoteAttachmentsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [previewFile, setPreviewFile] = useState<{ file: File; url: string } | null>(null)
    const [isSelecting, setIsSelecting] = useState(false)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])

        if (selectedFiles.length === 0) {
            setIsSelecting(false)
            return
        }

        // Validar tamaño (máx 10MB por archivo)
        const invalidFiles = selectedFiles.filter(f => f.size > 10 * 1024 * 1024)
        if (invalidFiles.length > 0) {
            toast.error(`Algunos archivos superan el límite de 10MB: ${invalidFiles.map(f => f.name).join(", ")}`)
            setIsSelecting(false)
            return
        }

        // Agregar nuevos archivos
        onFilesChange([...files, ...selectedFiles])

        // Mostrar feedback visual
        toast.success(
            <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                    <p className="font-semibold">{selectedFiles.length} archivo(s) agregado(s)</p>
                    <p className="text-xs text-muted-foreground">
                        {selectedFiles.map(f => f.name).join(", ")}
                    </p>
                </div>
            </div>
        )

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
        setIsSelecting(false)
    }

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index)
        onFilesChange(newFiles)
        toast.success("Archivo eliminado")
    }

    const previewFileHandler = (file: File) => {
        const url = URL.createObjectURL(file)
        setPreviewFile({ file, url })
    }

    const closePreview = () => {
        if (previewFile) {
            URL.revokeObjectURL(previewFile.url)
        }
        setPreviewFile(null)
    }

    const getFileIcon = (file: File) => {
        if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
        if (file.type === "application/pdf") return <FileText className="h-4 w-4" />
        return <File className="h-4 w-4" />
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B"
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
        return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    }

    const canPreview = (file: File) => {
        return file.type.startsWith("image/") || file.type === "application/pdf"
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Archivos Adjuntos (Opcional)
                    </CardTitle>
                    <CardDescription>
                        Puedes adjuntar documentos, imágenes o PDFs relacionados con esta cotización (máx. 10MB por archivo)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                            onChange={handleFileSelect}
                            onClick={() => setIsSelecting(true)}
                            className="hidden"
                            id="quote-file-input"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full"
                            disabled={isSelecting}
                        >
                            <Paperclip className="mr-2 h-4 w-4" />
                            {isSelecting ? "Seleccionando..." : "Seleccionar Archivos"}
                        </Button>
                    </div>

                    {files.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                {files.length} archivo(s) seleccionado(s):
                            </p>
                            <div className="space-y-2">
                                {files.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-green-50 rounded-md border border-green-200 animate-in fade-in slide-in-from-bottom-2"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="text-green-600">
                                                {getFileIcon(file)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {canPreview(file) && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => previewFileHandler(file)}
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeFile(index)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Preview Dialog */}
            <Dialog open={!!previewFile} onOpenChange={(open) => !open && closePreview()}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {previewFile && getFileIcon(previewFile.file)}
                            {previewFile?.file.name}
                        </DialogTitle>
                    </DialogHeader>
                    {previewFile && (
                        <div className="mt-4">
                            {previewFile.file.type.startsWith("image/") ? (
                                <img
                                    src={previewFile.url}
                                    alt={previewFile.file.name}
                                    className="w-full h-auto rounded-lg"
                                />
                            ) : previewFile.file.type === "application/pdf" ? (
                                <iframe
                                    src={previewFile.url}
                                    className="w-full h-[70vh] rounded-lg border"
                                    title={previewFile.file.name}
                                />
                            ) : null}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
