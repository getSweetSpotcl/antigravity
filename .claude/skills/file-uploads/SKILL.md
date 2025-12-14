---
name: file-uploads
description: Gestión de archivos adjuntos con Vercel Blob. Usar cuando se necesite subir, almacenar o eliminar archivos.
---

# Skill: File Uploads

Este skill documenta la gestión de archivos adjuntos en GiCS usando Vercel Blob Storage.

## Configuración

### Variables de Entorno

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxxx
```

## API Route de Upload

```typescript
// app/api/upload/route.ts
import { put, del } from "@vercel/blob"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant-context"

// Tipos de archivo permitidos
const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

// Tamaño máximo: 10MB
const MAX_SIZE = 10 * 1024 * 1024

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            )
        }

        const tenantId = await getTenantContext()
        if (!tenantId) {
            return NextResponse.json(
                { error: "Tenant no encontrado" },
                { status: 401 }
            )
        }

        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json(
                { error: "No se proporcionó archivo" },
                { status: 400 }
            )
        }

        // Validar tipo de archivo
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Tipo de archivo no permitido" },
                { status: 400 }
            )
        }

        // Validar tamaño
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: "El archivo excede el tamaño máximo (10MB)" },
                { status: 400 }
            )
        }

        // Generar nombre único
        const timestamp = Date.now()
        const fileName = `${tenantId}/${timestamp}-${file.name}`

        // Subir a Vercel Blob
        const blob = await put(fileName, file, {
            access: "public",
            addRandomSuffix: false,
        })

        return NextResponse.json({
            url: blob.url,
            name: file.name,
            size: file.size,
            type: file.type,
        })
    } catch (error) {
        console.error("Error uploading file:", error)
        return NextResponse.json(
            { error: "Error al subir el archivo" },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            )
        }

        const { url } = await request.json()

        if (!url) {
            return NextResponse.json(
                { error: "URL no proporcionada" },
                { status: 400 }
            )
        }

        await del(url)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting file:", error)
        return NextResponse.json(
            { error: "Error al eliminar el archivo" },
            { status: 500 }
        )
    }
}
```

## Componente de Upload

```tsx
// components/shared/file-upload.tsx
"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, File, Loader2, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface FileUploadProps {
    onUploadComplete: (file: UploadedFile) => void
    accept?: string[]
    maxSize?: number
    disabled?: boolean
}

interface UploadedFile {
    url: string
    name: string
    size: number
    type: string
}

export function FileUpload({
    onUploadComplete,
    accept = ["image/*", ".pdf", ".doc", ".docx", ".xls", ".xlsx"],
    maxSize = 10 * 1024 * 1024,
    disabled = false,
}: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false)

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Error al subir archivo")
            }

            const data = await response.json()
            onUploadComplete(data)
            toast.success("Archivo subido correctamente")
        } catch (error) {
            console.error("Upload error:", error)
            toast.error(error instanceof Error ? error.message : "Error al subir archivo")
        } finally {
            setIsUploading(false)
        }
    }, [onUploadComplete])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: accept.reduce((acc, type) => {
            if (type.startsWith(".")) {
                // Extension
                acc[`application/${type.slice(1)}`] = [type]
            } else {
                acc[type] = []
            }
            return acc
        }, {} as Record<string, string[]>),
        maxSize,
        disabled: disabled || isUploading,
        multiple: false,
    })

    return (
        <div
            {...getRootProps()}
            className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                transition-colors duration-200
                ${isDragActive ? "border-cyan-500 bg-cyan-50" : "border-slate-200 hover:border-slate-300"}
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
        >
            <input {...getInputProps()} />
            {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
                    <p className="text-sm text-muted-foreground">Subiendo archivo...</p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">
                        {isDragActive
                            ? "Suelta el archivo aquí"
                            : "Arrastra un archivo o haz clic para seleccionar"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Máximo {Math.round(maxSize / 1024 / 1024)}MB
                    </p>
                </div>
            )}
        </div>
    )
}
```

## Lista de Archivos Adjuntos

```tsx
// components/shared/attachments-list.tsx
"use client"

import { useState } from "react"
import { File, Image, Trash2, Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
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

interface Attachment {
    id: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize?: number
    description?: string
}

interface AttachmentsListProps {
    attachments: Attachment[]
    onDelete?: (id: string) => Promise<void>
    readonly?: boolean
}

export function AttachmentsList({
    attachments,
    onDelete,
    readonly = false,
}: AttachmentsListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        if (!onDelete) return

        setDeletingId(id)
        try {
            await onDelete(id)
            toast.success("Archivo eliminado")
        } catch (error) {
            toast.error("Error al eliminar archivo")
        } finally {
            setDeletingId(null)
        }
    }

    const getIcon = (type: string) => {
        if (type.startsWith("image/")) {
            return <Image className="h-4 w-4" />
        }
        return <File className="h-4 w-4" />
    }

    const formatSize = (bytes?: number) => {
        if (!bytes) return ""
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    }

    if (attachments.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-4">
                No hay archivos adjuntos
            </p>
        )
    }

    return (
        <div className="space-y-2">
            {attachments.map((attachment) => (
                <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded bg-slate-100 text-slate-600">
                            {getIcon(attachment.fileType)}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                                {attachment.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatSize(attachment.fileSize)}
                                {attachment.description && ` • ${attachment.description}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                        >
                            <a
                                href={attachment.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </Button>
                        {!readonly && onDelete && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700"
                                        disabled={deletingId === attachment.id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción no se puede deshacer.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDelete(attachment.id)}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Eliminar
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
```

## Server Actions para Adjuntos

```typescript
// actions/attachment.ts
"use server"

import { del } from "@vercel/blob"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { revalidatePath } from "next/cache"

export async function addQuoteAttachment(
    quoteId: string,
    fileData: { url: string; name: string; size: number; type: string }
) {
    const tenantId = await getTenantContext()
    if (!tenantId) return { error: "No autorizado" }

    const quote = await prisma.quote.findUnique({ where: { id: quoteId } })
    if (!quote || quote.tenantId !== tenantId) {
        return { error: "Cotización no encontrada" }
    }

    await prisma.quoteAttachment.create({
        data: {
            quoteId,
            fileUrl: fileData.url,
            fileName: fileData.name,
            fileSize: fileData.size,
            fileType: fileData.type,
        },
    })

    revalidatePath(`/dashboard/quotes/${quoteId}`)
    return { success: "Archivo adjuntado" }
}

export async function deleteQuoteAttachment(attachmentId: string) {
    const tenantId = await getTenantContext()
    if (!tenantId) return { error: "No autorizado" }

    const attachment = await prisma.quoteAttachment.findUnique({
        where: { id: attachmentId },
        include: { quote: true },
    })

    if (!attachment || attachment.quote.tenantId !== tenantId) {
        return { error: "Archivo no encontrado" }
    }

    // Eliminar de Vercel Blob
    try {
        await del(attachment.fileUrl)
    } catch (error) {
        console.error("Error deleting from blob:", error)
    }

    // Eliminar de base de datos
    await prisma.quoteAttachment.delete({
        where: { id: attachmentId },
    })

    revalidatePath(`/dashboard/quotes/${attachment.quoteId}`)
    return { success: "Archivo eliminado" }
}
```

## Tipos de Adjuntos por Entidad

| Entidad | Modelo | Tipos Comunes |
|---------|--------|---------------|
| Quote | QuoteAttachment | Cotizaciones, fotos, documentos |
| Policy | PolicyAttachment | Póliza, certificados, endosos |
| Claim | ClaimAttachment | Denuncias, fotos, facturas, liquidaciones |
| Communication | CommunicationAttachment | Emails, respuestas |

## Consideraciones de Seguridad

- Validar tipo de archivo en servidor
- Limitar tamaño máximo
- Organizar por tenant en el storage
- Verificar pertenencia antes de eliminar
- No exponer URLs internas

## Archivos de Referencia

- `app/api/upload/route.ts` - API de upload
- `actions/attachment.ts` - Server actions
- `components/shared/file-upload.tsx` - Componente de upload
- `components/shared/attachments-list.tsx` - Lista de adjuntos
- `components/shared/view-attachments-dialog.tsx` - Diálogo visor
