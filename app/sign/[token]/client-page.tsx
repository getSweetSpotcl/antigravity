"use client"

import { useState, useRef, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Eraser, PenLine, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { completeSignature } from "@/actions/signature"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface SignatureClientPageProps {
    signatureRequest: {
        id: string
        token: string
        signerName: string
        signerRut: string
        signerEmail: string | null
        acceptedTerms: boolean
        acceptedAt: Date | null
        signatureData: string | null
    }
    tenant: {
        name: string
        legalName: string
        logoUrl: string | null
        primaryColor: string
    }
    documentDetails: {
        title: string
        type: string
        number?: string
    } | null
}

export function SignatureClientPage({
    signatureRequest,
    tenant,
    documentDetails,
}: SignatureClientPageProps) {
    const [isPending, startTransition] = useTransition()
    const [acceptedTerms, setAcceptedTerms] = useState(signatureRequest.acceptedTerms)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasSignature, setHasSignature] = useState(!!signatureRequest.signatureData)
    const [isCompleted, setIsCompleted] = useState(signatureRequest.acceptedTerms)

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const contextRef = useRef<CanvasRenderingContext2D | null>(null)

    // Initialize canvas
    useEffect(() => {
        if (canvasRef.current && !isCompleted) {
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
    }, [isCompleted])

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

        startTransition(async () => {
            const result = await completeSignature(signatureRequest.token, getSignatureData())

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Documento firmado exitosamente")
                setIsCompleted(true)
            }
        })
    }

    // Already signed view
    if (isCompleted) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg">
                    <CardHeader className="text-center">
                        {tenant.logoUrl ? (
                            <img
                                src={tenant.logoUrl}
                                alt={tenant.name}
                                className="h-12 mx-auto mb-4 object-contain"
                            />
                        ) : (
                            <h2
                                className="text-2xl font-bold mb-4"
                                style={{ color: tenant.primaryColor }}
                            >
                                {tenant.name}
                            </h2>
                        )}
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <CardTitle className="text-green-800">Documento Firmado</CardTitle>
                        <CardDescription>
                            El documento ha sido firmado exitosamente
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-2">
                            <p className="text-sm text-green-800">
                                <strong>Documento:</strong> {documentDetails?.title || "Documento"}
                            </p>
                            <p className="text-sm text-green-800">
                                <strong>Firmante:</strong> {signatureRequest.signerName}
                            </p>
                            <p className="text-sm text-green-800">
                                <strong>RUT:</strong> {signatureRequest.signerRut}
                            </p>
                            {signatureRequest.acceptedAt && (
                                <p className="text-sm text-green-800">
                                    <strong>Fecha:</strong>{" "}
                                    {format(
                                        new Date(signatureRequest.acceptedAt),
                                        "dd 'de' MMMM 'de' yyyy, HH:mm",
                                        { locale: es }
                                    )}
                                </p>
                            )}
                        </div>

                        {signatureRequest.signatureData && (
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-2">
                                    Firma registrada:
                                </p>
                                <div className="inline-block bg-white p-3 rounded border">
                                    <img
                                        src={signatureRequest.signatureData}
                                        alt="Firma"
                                        className="max-h-20"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <ShieldCheck className="h-4 w-4" />
                            <span>Token de verificación: {signatureRequest.token.slice(0, 12)}...</span>
                        </div>
                    </CardContent>
                    <CardFooter className="text-center text-xs text-muted-foreground">
                        {tenant.legalName}
                    </CardFooter>
                </Card>
            </div>
        )
    }

    // Signature form view
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    {tenant.logoUrl ? (
                        <img
                            src={tenant.logoUrl}
                            alt={tenant.name}
                            className="h-12 mx-auto mb-4 object-contain"
                        />
                    ) : (
                        <h2
                            className="text-2xl font-bold mb-4"
                            style={{ color: tenant.primaryColor }}
                        >
                            {tenant.name}
                        </h2>
                    )}
                    <CardTitle>Firma de Documento</CardTitle>
                    <CardDescription>
                        {documentDetails
                            ? `Firme electrónicamente: ${documentDetails.title}`
                            : "Complete su firma electrónica"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Signer Info */}
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                        <h3 className="font-medium text-sm text-slate-600">Datos del Firmante</h3>
                        <div className="grid gap-1 text-sm">
                            <p>
                                <strong>Nombre:</strong> {signatureRequest.signerName}
                            </p>
                            <p>
                                <strong>RUT:</strong> {signatureRequest.signerRut}
                            </p>
                            {signatureRequest.signerEmail && (
                                <p>
                                    <strong>Email:</strong> {signatureRequest.signerEmail}
                                </p>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Signature Canvas */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                                <PenLine className="h-4 w-4" />
                                Firma (opcional)
                            </Label>
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
                        <div className="border-2 border-dashed rounded-lg bg-white relative">
                            <canvas
                                ref={canvasRef}
                                className="w-full h-40 cursor-crosshair touch-none"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                            {!hasSignature && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground">
                                    Dibuje su firma aquí
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Puede dibujar su firma con el mouse o con el dedo en dispositivos táctiles.
                        </p>
                    </div>

                    <Separator />

                    {/* Terms Acceptance */}
                    <div className="flex items-start space-x-3 p-4 rounded-lg border-2"
                        style={{
                            backgroundColor: `${tenant.primaryColor}10`,
                            borderColor: `${tenant.primaryColor}30`,
                        }}
                    >
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
                                Acepto los términos y condiciones del documento
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Al marcar esta casilla, confirmo que he leído y acepto los términos.
                                Esta aceptación tiene validez legal y quedará registrada con fecha,
                                hora, dirección IP y datos de navegador.
                            </p>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={isPending || !acceptedTerms}
                        style={{ backgroundColor: tenant.primaryColor }}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando firma...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Firmar Documento
                            </>
                        )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                        Este servicio es provisto por {tenant.legalName}
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
