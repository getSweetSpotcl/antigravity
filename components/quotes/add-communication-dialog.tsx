"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Loader2, UploadCloud, FileIcon, X, CheckCircle2, MessageSquarePlus } from "lucide-react"
import { upload } from "@vercel/blob/client"
import { addQuoteCommunication, addCommunicationAttachment } from "@/actions/communication"
import { toast } from "sonner"

const CommunicationSchema = z.object({
    type: z.enum(["call", "email", "meeting", "note"], {
        message: "Seleccione un tipo de comunicación",
    }),
    subject: z.string().optional(),
    content: z.string().min(1, "El contenido es requerido"),
    contactPerson: z.string().optional(),
})

type CommunicationFormData = z.infer<typeof CommunicationSchema>

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface AddCommunicationDialogProps {
    quoteId: string
}

export function AddCommunicationDialog({ quoteId }: AddCommunicationDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const inputFileRef = useRef<HTMLInputElement>(null)

    const form = useForm<CommunicationFormData>({
        resolver: zodResolver(CommunicationSchema),
        defaultValues: {
            type: "note",
            subject: "",
            content: "",
            contactPerson: "",
        },
    })

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])

        // Validar tamaño de cada archivo
        const validFiles = files.filter(file => {
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`El archivo "${file.name}" es muy grande. Máximo 10MB.`)
                return false
            }
            return true
        })

        if (validFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...validFiles])
            toast.success(`${validFiles.length} archivo(s) agregado(s)`)
        }

        // Limpiar el input
        if (inputFileRef.current) {
            inputFileRef.current.value = ""
        }
    }

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
        toast.info("Archivo removido")
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    const onSubmit = async (data: CommunicationFormData) => {
        setIsSubmitting(true)
        try {
            // 1. Crear la comunicación
            const result = await addQuoteCommunication(quoteId, data)

            if (result.error || !result.communication) {
                toast.error(result.error || "Error al crear la comunicación")
                return
            }

            // 2. Subir archivos adjuntos si hay
            if (selectedFiles.length > 0) {
                toast.info(`Subiendo ${selectedFiles.length} archivo(s)...`)

                for (const file of selectedFiles) {
                    try {
                        // Subir a Vercel Blob
                        const blob = await upload(file.name, file, {
                            access: "public",
                            handleUploadUrl: "/api/upload",
                        })

                        // Guardar referencia en DB
                        await addCommunicationAttachment(result.communication.id, {
                            url: blob.url,
                            name: file.name,
                            size: file.size,
                            type: file.type,
                        })
                    } catch (error) {
                        console.error(`Error uploading ${file.name}:`, error)
                        toast.error(`Error al subir ${file.name}`)
                    }
                }
            }

            toast.success("Comunicación agregada correctamente")
            setOpen(false)
            form.reset()
            setSelectedFiles([])
        } catch (error) {
            console.error("Error:", error)
            toast.error("Error al agregar la comunicación")
        } finally {
            setIsSubmitting(false)
        }
    }

    const communicationTypes = [
        { value: "call", label: "Llamada" },
        { value: "email", label: "Email" },
        { value: "meeting", label: "Reunión" },
        { value: "note", label: "Nota" },
    ]

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <MessageSquarePlus className="mr-2 h-4 w-4" />
                    Nueva Comunicación
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Agregar Comunicación</DialogTitle>
                    <DialogDescription>
                        Registre una nueva interacción con el cliente.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Tipo de Comunicación */}
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Comunicación</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione un tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {communicationTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Asunto */}
                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Asunto (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Seguimiento de cotización" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Persona de Contacto */}
                        <FormField
                            control={form.control}
                            name="contactPerson"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Persona de Contacto (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Juan Pérez" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Contenido */}
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contenido</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describa los detalles de la comunicación..."
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Archivos Adjuntos */}
                        <div className="space-y-2">
                            <Label>Archivos Adjuntos (Opcional)</Label>

                            {selectedFiles.length === 0 ? (
                                <div className="flex items-center justify-center w-full">
                                    <label
                                        htmlFor="communication-files"
                                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 border-muted-foreground/25 hover:border-primary/50 transition-all duration-200"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="mb-1 text-sm text-foreground">
                                                <span className="font-semibold">Click para agregar archivos</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                PDF, PNG, JPG, DOCX (MAX. 10MB)
                                            </p>
                                        </div>
                                        <input
                                            id="communication-files"
                                            type="file"
                                            className="hidden"
                                            ref={inputFileRef}
                                            onChange={handleFileChange}
                                            accept=".pdf,.png,.jpg,.jpeg,.docx,.doc"
                                            multiple
                                        />
                                    </label>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {selectedFiles.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-3 p-3 border-2 border-green-500 bg-green-50 dark:bg-green-950/20 rounded-lg"
                                        >
                                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md flex-shrink-0">
                                                <FileIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground break-words">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeFile(index)}
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => inputFileRef.current?.click()}
                                        className="w-full"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Agregar más archivos
                                    </Button>
                                    <input
                                        id="communication-files"
                                        type="file"
                                        className="hidden"
                                        ref={inputFileRef}
                                        onChange={handleFileChange}
                                        accept=".pdf,.png,.jpg,.jpeg,.docx,.doc"
                                        multiple
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? "Guardando..." : "Guardar Comunicación"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
