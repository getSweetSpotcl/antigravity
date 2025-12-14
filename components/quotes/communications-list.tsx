"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, Users, FileText, Paperclip, Eye, Download, Trash2, Edit2, MoreVertical } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AddCommunicationDialog } from "./add-communication-dialog"
import { deleteCommunicationAttachment, deleteQuoteCommunication, updateQuoteCommunication } from "@/actions/communication"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CommunicationFormData } from "@/actions/communication"

interface CommunicationAttachment {
    id: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number | null
    createdAt: Date
}

interface Communication {
    id: string
    type: string
    subject: string | null
    content: string
    contactPerson: string | null
    createdAt: Date
    CommunicationAttachment: CommunicationAttachment[]
}

// Edit Communication Form Component
interface EditCommunicationFormProps {
    communication: Communication
    onSave: (data: CommunicationFormData) => Promise<void>
    onCancel: () => void
}

function EditCommunicationForm({ communication, onSave, onCancel }: EditCommunicationFormProps) {
    const [formData, setFormData] = useState<CommunicationFormData>({
        type: communication.type as "call" | "email" | "meeting" | "note",
        subject: communication.subject || "",
        content: communication.content,
        contactPerson: communication.contactPerson || "",
    })
    const [isSaving, setIsSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        await onSave(formData)
        setIsSaving(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="call">Llamada</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="meeting">Reunión</SelectItem>
                        <SelectItem value="note">Nota</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="subject">Asunto (opcional)</Label>
                <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Asunto de la comunicación"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="content">Contenido *</Label>
                <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Describe la comunicación..."
                    className="min-h-[120px]"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="contactPerson">Persona de contacto (opcional)</Label>
                <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Nombre de la persona contactada"
                />
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </div>
        </form>
    )
}

interface CommunicationsListProps {
    quoteId: string
    communications: Communication[]
}

export function CommunicationsList({ quoteId, communications }: CommunicationsListProps) {
    const router = useRouter()
    const [previewFile, setPreviewFile] = useState<CommunicationAttachment | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [editingComm, setEditingComm] = useState<Communication | null>(null)

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "call":
                return <Phone className="h-4 w-4" />
            case "email":
                return <Mail className="h-4 w-4" />
            case "meeting":
                return <Users className="h-4 w-4" />
            case "note":
                return <FileText className="h-4 w-4" />
            default:
                return <FileText className="h-4 w-4" />
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "call":
                return "Llamada"
            case "email":
                return "Email"
            case "meeting":
                return "Reunión"
            case "note":
                return "Nota"
            default:
                return type
        }
    }

    const getTypeBadgeVariant = (type: string): "default" | "secondary" | "outline" => {
        switch (type) {
            case "call":
                return "default"
            case "email":
                return "secondary"
            case "meeting":
                return "outline"
            default:
                return "outline"
        }
    }

    const handleDeleteCommunication = async (commId: string) => {
        if (!confirm("¿Está seguro de eliminar esta comunicación? Esta acción no se puede deshacer.")) return

        const result = await deleteQuoteCommunication(commId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Comunicación eliminada")
            router.refresh()
        }
    }

    const handleDeleteAttachment = async (attachmentId: string) => {
        if (!confirm("¿Está seguro de eliminar este archivo?")) return

        const result = await deleteCommunicationAttachment(attachmentId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Archivo eliminado")
            router.refresh()
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

    const isPreviewable = (fileType: string) => {
        return fileType.startsWith("image/") || fileType === "application/pdf"
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Historial de Comunicaciones</CardTitle>
                        <CardDescription>
                            Registro de todas las interacciones relacionadas con esta cotización
                        </CardDescription>
                    </div>
                    <AddCommunicationDialog quoteId={quoteId} />
                </CardHeader>
                <CardContent>
                    {communications.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-sm text-muted-foreground">
                                No hay comunicaciones registradas
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Agregue la primera comunicación para comenzar el seguimiento
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {communications.map((comm, index) => (
                                <div
                                    key={comm.id}
                                    className="relative pl-8 pb-8 last:pb-0"
                                >
                                    {/* Timeline line */}
                                    {index !== communications.length - 1 && (
                                        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                                    )}

                                    {/* Timeline dot */}
                                    <div className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm">
                                        {getTypeIcon(comm.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant={getTypeBadgeVariant(comm.type)}>
                                                        {getTypeLabel(comm.type)}
                                                    </Badge>
                                                    {comm.subject && (
                                                        <h4 className="font-semibold text-sm">
                                                            {comm.subject}
                                                        </h4>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(comm.createdAt), "PPp", { locale: es })}
                                                    {comm.contactPerson && (
                                                        <span className="ml-2">
                                                            • Contacto: {comm.contactPerson}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setEditingComm(comm)}>
                                                        <Edit2 className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteCommunication(comm.id)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <p className="text-sm text-foreground whitespace-pre-wrap mb-3">
                                            {comm.content}
                                        </p>

                                        {/* Attachments */}
                                        {comm.CommunicationAttachment.length > 0 && (
                                            <div className="mt-3 pt-3 border-t">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        {comm.CommunicationAttachment.length} archivo(s) adjunto(s)
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    {comm.CommunicationAttachment.map((attachment) => (
                                                        <div
                                                            key={attachment.id}
                                                            className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-medium truncate">
                                                                        {attachment.fileName}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {formatFileSize(attachment.fileSize)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {isPreviewable(attachment.fileType) && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={() => setPreviewFile(attachment)}
                                                                        title="Ver"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    asChild
                                                                    title="Descargar"
                                                                >
                                                                    <a href={attachment.fileUrl} download target="_blank" rel="noopener noreferrer">
                                                                        <Download className="h-4 w-4" />
                                                                    </a>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                                    onClick={() => handleDeleteAttachment(attachment.id)}
                                                                    title="Eliminar"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* File Preview Modal */}
            <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
                <DialogContent
                    className={cn(
                        "p-0 gap-0 border-0 bg-black/95 backdrop-blur-sm transition-all duration-300 !max-w-[95vw] h-[95vh]"
                    )}
                    showCloseButton={false}
                >
                    <VisuallyHidden.Root>
                        <DialogTitle>{previewFile?.fileName || "Vista previa"}</DialogTitle>
                    </VisuallyHidden.Root>

                    {/* Floating toolbar */}
                    <div className="absolute top-0 left-0 right-0 z-20 p-3 bg-gradient-to-b from-black/80 via-black/50 to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/20">
                                <p className="text-sm font-medium text-white truncate max-w-[300px]">
                                    {previewFile?.fileName}
                                </p>
                                <p className="text-xs text-white/60">
                                    {formatFileSize(previewFile?.fileSize || 0)}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-lg p-1 border border-white/20">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                    className="text-white hover:bg-white/20"
                                >
                                    <a href={previewFile?.fileUrl} download target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4" />
                                    </a>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setPreviewFile(null)}
                                    className="text-white hover:bg-white/20"
                                >
                                    <FileText className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* File content */}
                    <div className="w-full h-full overflow-hidden bg-black relative">
                        {previewFile?.fileType.startsWith("image/") ? (
                            <div className="w-full h-full flex items-center justify-center p-4">
                                <img
                                    src={previewFile.fileUrl}
                                    alt={previewFile.fileName}
                                    className="max-w-full max-h-full object-contain"
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
                </DialogContent>
            </Dialog>

            {/* Edit Communication Dialog */}
            {editingComm && (
                <Dialog open={!!editingComm} onOpenChange={(open) => !open && setEditingComm(null)}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogTitle>Editar Comunicación</DialogTitle>
                        <EditCommunicationForm
                            communication={editingComm}
                            onSave={async (data) => {
                                const result = await updateQuoteCommunication(editingComm.id, data)
                                if (result.error) {
                                    toast.error(result.error)
                                } else {
                                    toast.success("Comunicación actualizada")
                                    setEditingComm(null)
                                    router.refresh()
                                }
                            }}
                            onCancel={() => setEditingComm(null)}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}
