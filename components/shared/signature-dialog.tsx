"use client"

import { useState, useRef, useEffect } from "react"
import { useTransition } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PenLine, Eraser, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createSignature } from "@/actions/signature"

interface SignatureDialogProps {
    documentType: "QUOTE" | "POLICY" | "ENDORSEMENT" | "CLAIM"
    documentId: string
    documentTitle: string
    clientName?: string
    clientRut?: string
    clientEmail?: string
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export function SignatureDialog({
    documentType,
    documentId,
    documentTitle,
    clientName = "",
    clientRut = "",
    clientEmail = "",
    onSuccess,
    trigger,
}: SignatureDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [signerName, setSignerName] = useState(clientName)
    const [signerRut, setSignerRut] = useState(clientRut)
    const [signerEmail, setSignerEmail] = useState(clientEmail)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasSignature, setHasSignature] = useState(false)

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const contextRef = useRef<CanvasRenderingContext2D | null>(null)

    // Initialize canvas
    useEffect(() => {
        if (open && canvasRef.current) {
            const canvas = canvasRef.current
            canvas.width = canvas.offsetWidth * 2
            canvas.height = canvas.offsetHeight * 2

            const context = canvas.getContext("2d")
            if (context) {
                context.scale(2, 2)
                context.lineCap = "round"
                context.strokeStyle = "#1e293b"
                context.lineWidth = 2
                contextRef.current = context
            }
        }
    }, [open])

    // Update form when props change
    useEffect(() => {
        setSignerName(clientName)
        setSignerRut(clientRut)
        setSignerEmail(clientEmail)
    }, [clientName, clientRut, clientEmail])

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas || !contextRef.current) return

        const rect = canvas.getBoundingClientRect()
        let clientX: number, clientY: number

        if ("touches" in e) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }

        contextRef.current.beginPath()
        contextRef.current.moveTo(clientX - rect.left, clientY - rect.top)
        setIsDrawing(true)
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !contextRef.current || !canvasRef.current) return

        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()
        let clientX: number, clientY: number

        if ("touches" in e) {
            e.preventDefault()
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }

        contextRef.current.lineTo(clientX - rect.left, clientY - rect.top)
        contextRef.current.stroke()
        setHasSignature(true)
    }

    const stopDrawing = () => {
        if (contextRef.current) {
            contextRef.current.closePath()
        }
        setIsDrawing(false)
    }

    const clearSignature = () => {
        const canvas = canvasRef.current
        const context = contextRef.current
        if (canvas && context) {
            context.clearRect(0, 0, canvas.width, canvas.height)
            setHasSignature(false)
        }
    }

    const getSignatureData = (): string | undefined => {
        if (!hasSignature || !canvasRef.current) return undefined
        return canvasRef.current.toDataURL("image/png")
    }

    const handleSubmit = async () => {
        if (!acceptedTerms) {
            toast.error("Debe aceptar los términos para firmar")
            return
        }

        if (!signerName || !signerRut) {
            toast.error("Nombre y RUT son requeridos")
            return
        }

        startTransition(async () => {
            const result = await createSignature({
                documentType,
                documentId,
                signerName,
                signerRut,
                signerEmail: signerEmail || "",
                signatureData: getSignatureData(),
                acceptedTerms,
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(result.success)
                setOpen(false)
                setAcceptedTerms(false)
                clearSignature()
                onSuccess?.()
            }
        })
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <PenLine className="mr-2 h-4 w-4" />
                        Firmar
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Firma de Documento</DialogTitle>
                    <DialogDescription>
                        Firme electrónicamente la {getDocumentTypeLabel()}: {documentTitle}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Signer Info */}
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="signerName">Nombre del Firmante</Label>
                            <Input
                                id="signerName"
                                value={signerName}
                                onChange={(e) => setSignerName(e.target.value)}
                                placeholder="Nombre completo"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="signerRut">RUT</Label>
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
                        </div>
                    </div>

                    {/* Signature Canvas */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Firma (opcional)</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearSignature}
                                disabled={!hasSignature}
                            >
                                <Eraser className="mr-1 h-3 w-3" />
                                Limpiar
                            </Button>
                        </div>
                        <div className="border rounded-lg bg-slate-50 relative">
                            <canvas
                                ref={canvasRef}
                                className="w-full h-32 cursor-crosshair touch-none"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                            {!hasSignature && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground text-sm">
                                    Dibuje su firma aquí
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Terms Acceptance */}
                    <div className="flex items-start space-x-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <Checkbox
                            id="terms"
                            checked={acceptedTerms}
                            onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="terms"
                                className="text-sm font-medium leading-relaxed cursor-pointer"
                            >
                                Acepto los términos y condiciones
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Al marcar esta casilla, confirmo que he leído y acepto los términos del
                                documento. Esta aceptación tiene validez legal y quedará registrada con
                                fecha, hora y datos de conexión.
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
                        disabled={isPending || !acceptedTerms || !signerName || !signerRut}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Firmando...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Firmar Documento
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
