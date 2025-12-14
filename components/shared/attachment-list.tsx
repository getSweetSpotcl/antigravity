"use client"

import { useState, useEffect } from "react"
import { FileIcon, Trash2, Download, Eye, X, FileText, Image as ImageIcon, ZoomIn, ZoomOut, Maximize2, Minimize2, ChevronLeft, ChevronRight, RotateCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { deleteQuoteAttachment, deletePolicyAttachment, deleteClaimAttachment } from "@/actions/attachment"
import { toast } from "sonner"
import { UploadAttachmentDialog } from "./upload-attachment-dialog"
import { cn } from "@/lib/utils"

interface Attachment {
    id: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number | null
    createdAt: Date
}

interface AttachmentListProps {
    entityId: string
    type: "quote" | "policy" | "claim"
    attachments: Attachment[]
}

export function AttachmentList({ entityId, type, attachments }: AttachmentListProps) {
    const [previewIndex, setPreviewIndex] = useState<number | null>(null)
    const [zoom, setZoom] = useState(100)
    const [rotation, setRotation] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Helper function - must be declared before use
    const isPreviewable = (fileType: string) => {
        return fileType.startsWith("image/") || fileType === "application/pdf"
    }

    const previewFile = previewIndex !== null ? attachments[previewIndex] : null
    const previewableAttachments = attachments.filter(a => isPreviewable(a.fileType))

    useEffect(() => {
        if (previewFile) {
            setIsLoading(true)
            setZoom(100)
            setRotation(0)
        }
    }, [previewFile])

    const handleDelete = async (attachmentId: string) => {
        if (!confirm("¿Está seguro de eliminar este archivo?")) return

        let result
        if (type === "quote") {
            result = await deleteQuoteAttachment(attachmentId)
        } else if (type === "policy") {
            result = await deletePolicyAttachment(attachmentId)
        } else if (type === "claim") {
            result = await deleteClaimAttachment(attachmentId)
        }

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Archivo eliminado")
        }
    }

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return "Tamaño desconocido"
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    const handleFileClick = (attachment: Attachment) => {
        if (isPreviewable(attachment.fileType)) {
            const index = attachments.findIndex(a => a.id === attachment.id)
            setPreviewIndex(index)
        } else {
            window.open(attachment.fileUrl, "_blank")
        }
    }

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200))
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50))
    const handleRotate = () => setRotation(prev => (prev + 90) % 360)
    const handleResetZoom = () => {
        setZoom(100)
        setRotation(0)
    }

    const handlePrevious = () => {
        if (previewIndex !== null && previewIndex > 0) {
            setPreviewIndex(previewIndex - 1)
        }
    }

    const handleNext = () => {
        if (previewIndex !== null && previewIndex < attachments.length - 1) {
            setPreviewIndex(previewIndex + 1)
        }
    }

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith("image/")) {
            return <ImageIcon className="h-5 w-5" />
        } else if (fileType === "application/pdf") {
            return <FileText className="h-5 w-5" />
        }
        return <FileIcon className="h-5 w-5" />
    }

    const getFileIconColor = (fileType: string) => {
        if (fileType.startsWith("image/")) {
            return "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"
        } else if (fileType === "application/pdf") {
            return "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
        }
        return "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
    }

    const closePreview = () => {
        setPreviewIndex(null)
        setIsFullscreen(false)
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Archivos Adjuntos</CardTitle>
                        <CardDescription>
                            Documentos y archivos relacionados
                        </CardDescription>
                    </div>
                    <UploadAttachmentDialog entityId={entityId} type={type} />
                </CardHeader>
                <CardContent>
                    {attachments.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                            No hay archivos adjuntos
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {attachments.map((attachment) => (
                                <div
                                    key={attachment.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-all duration-200 group hover:shadow-sm"
                                >
                                    <div
                                        className="flex items-center space-x-3 overflow-hidden flex-1 cursor-pointer"
                                        onClick={() => handleFileClick(attachment)}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-md transition-transform group-hover:scale-110",
                                            getFileIconColor(attachment.fileType)
                                        )}>
                                            {getFileIcon(attachment.fileType)}
                                        </div>
                                        <div className="truncate flex-1">
                                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                                {attachment.fileName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(attachment.fileSize)} • {new Date(attachment.createdAt).toLocaleDateString('es-ES', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        {isPreviewable(attachment.fileType) && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Eye className="h-4 w-4 text-primary" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-1 ml-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                            title="Descargar"
                                            className="hover:bg-primary/10 hover:text-primary"
                                        >
                                            <a href={attachment.fileUrl} download target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDelete(attachment.id)
                                            }}
                                            title="Eliminar"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Previsualización Mejorado */}
            <Dialog open={previewIndex !== null} onOpenChange={(open) => !open && closePreview()}>
                <DialogContent
                    className={cn(
                        "p-0 gap-0 border-0 bg-black/95 backdrop-blur-sm transition-all duration-300",
                        isFullscreen ? "!max-w-full h-screen" : "!max-w-[95vw] h-[95vh]"
                    )}
                    showCloseButton={false}
                >
                    {/* Título oculto visualmente para accesibilidad */}
                    <VisuallyHidden.Root>
                        <DialogTitle>{previewFile?.fileName || "Vista previa de archivo"}</DialogTitle>
                    </VisuallyHidden.Root>

                    {/* Barra de controles flotante superior */}
                    <div className="absolute top-0 left-0 right-0 z-20 p-3 bg-gradient-to-b from-black/80 via-black/50 to-transparent">
                        <div className="flex items-center justify-between">
                            {/* Información del archivo (izquierda) */}
                            <div className="flex items-center gap-2 text-white/90 max-w-[50%]">
                                <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/20">
                                    <p className="text-sm font-medium truncate">{previewFile?.fileName}</p>
                                    <p className="text-xs text-white/60">
                                        {formatFileSize(previewFile?.fileSize || 0)}
                                        {previewableAttachments.length > 1 && (
                                            <span className="ml-2">
                                                • {(previewIndex || 0) + 1}/{attachments.length}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Controles (derecha) */}
                            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-lg p-1 border border-white/20">
                                {/* Navegación entre archivos */}
                                {previewableAttachments.length > 1 && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handlePrevious}
                                            disabled={previewIndex === 0}
                                            title="Anterior"
                                            className="text-white hover:bg-white/20 disabled:opacity-30"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleNext}
                                            disabled={previewIndex === attachments.length - 1}
                                            title="Siguiente"
                                            className="text-white hover:bg-white/20 disabled:opacity-30"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </Button>
                                        <div className="w-px h-6 bg-white/20 mx-1" />
                                    </>
                                )}

                                {/* Controles de zoom (solo para imágenes) */}
                                {previewFile?.fileType.startsWith("image/") && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleZoomOut}
                                            disabled={zoom <= 50}
                                            title="Alejar"
                                            className="text-white hover:bg-white/20 disabled:opacity-30"
                                        >
                                            <ZoomOut className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleResetZoom}
                                            className="min-w-[60px] text-white hover:bg-white/20"
                                            title="Restablecer"
                                        >
                                            {zoom}%
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleZoomIn}
                                            disabled={zoom >= 200}
                                            title="Acercar"
                                            className="text-white hover:bg-white/20 disabled:opacity-30"
                                        >
                                            <ZoomIn className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleRotate}
                                            title="Rotar"
                                            className="text-white hover:bg-white/20"
                                        >
                                            <RotateCw className="h-4 w-4" />
                                        </Button>
                                        <div className="w-px h-6 bg-white/20 mx-1" />
                                    </>
                                )}

                                {/* Pantalla completa */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                                    className="text-white hover:bg-white/20"
                                >
                                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </Button>

                                <div className="w-px h-6 bg-white/20 mx-1" />

                                {/* Descargar */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                    title="Descargar"
                                    className="text-white hover:bg-white/20"
                                >
                                    <a href={previewFile?.fileUrl} download target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4" />
                                    </a>
                                </Button>

                                {/* Cerrar */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={closePreview}
                                    title="Cerrar"
                                    className="text-white hover:bg-white/20"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Contenido del visor - Pantalla completa */}
                    <div className="w-full h-full overflow-hidden bg-black relative">
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                                    <p className="text-sm text-white/70">Cargando archivo...</p>
                                </div>
                            </div>
                        )}

                        {previewFile?.fileType.startsWith("image/") ? (
                            <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
                                <img
                                    src={previewFile.fileUrl}
                                    alt={previewFile.fileName}
                                    className="transition-all duration-300 ease-in-out"
                                    style={{
                                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                                        maxWidth: zoom === 100 ? '100%' : 'none',
                                        maxHeight: zoom === 100 ? '100%' : 'none',
                                    }}
                                    onLoad={() => setIsLoading(false)}
                                />
                            </div>
                        ) : previewFile?.fileType === "application/pdf" ? (
                            <iframe
                                src={`${previewFile.fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                                className="w-full h-full border-0"
                                title={previewFile.fileName}
                                onLoad={() => setIsLoading(false)}
                            />
                        ) : null}
                    </div>

                    {/* Indicador de navegación con teclado */}
                    {previewableAttachments.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-xs text-white/80 shadow-lg">
                            Usa ← → para navegar
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
