"use client"

import { useState, useTransition } from "react"
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
import { Send, Loader2, Copy, Check, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { createSignatureRequest } from "@/actions/signature"

interface RequestSignatureDialogProps {
    documentType: "QUOTE" | "POLICY" | "ENDORSEMENT" | "CLAIM"
    documentId: string
    documentTitle: string
    clientName?: string
    clientRut?: string
    clientEmail?: string
    trigger?: React.ReactNode
}

export function RequestSignatureDialog({
    documentType,
    documentId,
    documentTitle,
    clientName = "",
    clientRut = "",
    clientEmail = "",
    trigger,
}: RequestSignatureDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [signerName, setSignerName] = useState(clientName)
    const [signerRut, setSignerRut] = useState(clientRut)
    const [signerEmail, setSignerEmail] = useState(clientEmail)
    const [signatureLink, setSignatureLink] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const handleSubmit = async () => {
        if (!signerName || !signerRut) {
            toast.error("Nombre y RUT son requeridos")
            return
        }

        startTransition(async () => {
            const result = await createSignatureRequest(documentType, documentId, {
                name: signerName,
                rut: signerRut,
                email: signerEmail || undefined,
            })

            if (result.error) {
                toast.error(result.error)
            } else if (result.token) {
                const baseUrl = window.location.origin
                const link = `${baseUrl}/sign/${result.token}`
                setSignatureLink(link)
                toast.success("Solicitud de firma creada")
            }
        })
    }

    const copyLink = async () => {
        if (signatureLink) {
            await navigator.clipboard.writeText(signatureLink)
            setCopied(true)
            toast.success("Enlace copiado al portapapeles")
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const openLink = () => {
        if (signatureLink) {
            window.open(signatureLink, "_blank")
        }
    }

    const handleClose = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            setSignatureLink(null)
            setCopied(false)
        }
    }

    const getDocumentTypeLabel = () => {
        const labels = {
            QUOTE: "Cotización",
            POLICY: "Póliza",
            ENDORSEMENT: "Endoso",
            CLAIM: "Siniestro",
        }
        return labels[documentType]
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Send className="mr-2 h-4 w-4" />
                        Solicitar Firma
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Solicitar Firma del Cliente</DialogTitle>
                    <DialogDescription>
                        Genere un enlace para que el cliente firme la {getDocumentTypeLabel()}: {documentTitle}
                    </DialogDescription>
                </DialogHeader>

                {!signatureLink ? (
                    <>
                        <div className="space-y-4 py-4">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="signerName">Nombre del Cliente *</Label>
                                    <Input
                                        id="signerName"
                                        value={signerName}
                                        onChange={(e) => setSignerName(e.target.value)}
                                        placeholder="Nombre completo"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="signerRut">RUT *</Label>
                                    <Input
                                        id="signerRut"
                                        value={signerRut}
                                        onChange={(e) => setSignerRut(e.target.value)}
                                        placeholder="12.345.678-9"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="signerEmail">Email (opcional)</Label>
                                    <Input
                                        id="signerEmail"
                                        type="email"
                                        value={signerEmail}
                                        onChange={(e) => setSignerEmail(e.target.value)}
                                        placeholder="correo@ejemplo.cl"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Si ingresa un email, podrá enviar el enlace directamente al cliente.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isPending || !signerName || !signerRut}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Generar Enlace
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <div className="space-y-4 py-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-sm text-green-800 font-medium mb-2">
                                    Enlace de firma generado exitosamente
                                </p>
                                <p className="text-xs text-green-700 mb-3">
                                    Comparta este enlace con el cliente para que pueda firmar el documento.
                                </p>

                                <div className="flex gap-2">
                                    <Input
                                        value={signatureLink}
                                        readOnly
                                        className="text-xs bg-white"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={copyLink}
                                        className="shrink-0"
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={openLink}
                                        className="shrink-0"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>
                                    <strong>Cliente:</strong> {signerName}
                                </p>
                                <p>
                                    <strong>RUT:</strong> {signerRut}
                                </p>
                                {signerEmail && (
                                    <p>
                                        <strong>Email:</strong> {signerEmail}
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={() => handleClose(false)}>
                                Cerrar
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
