"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { CheckCircle, Clock, PenLine, Info } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { DocumentSignature } from "@prisma/client"

interface SignatureStatusProps {
    signature: DocumentSignature | null
    showDetails?: boolean
    className?: string
}

export function SignatureStatus({ signature, showDetails = true, className }: SignatureStatusProps) {
    if (!signature) {
        return (
            <Badge variant="outline" className={className}>
                <Clock className="mr-1 h-3 w-3" />
                Pendiente de firma
            </Badge>
        )
    }

    if (!signature.acceptedTerms) {
        return (
            <Badge variant="secondary" className={className}>
                <PenLine className="mr-1 h-3 w-3" />
                Firma solicitada
            </Badge>
        )
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant="default" className={`bg-green-600 hover:bg-green-700 ${className}`}>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Firmado
                    </Badge>
                </TooltipTrigger>
                {showDetails && (
                    <TooltipContent className="max-w-xs">
                        <div className="space-y-1 text-xs">
                            <p className="font-semibold">{signature.signerName}</p>
                            <p>RUT: {signature.signerRut}</p>
                            {signature.signerEmail && <p>Email: {signature.signerEmail}</p>}
                            {signature.acceptedAt && (
                                <p>
                                    Firmado el:{" "}
                                    {format(new Date(signature.acceptedAt), "dd/MM/yyyy HH:mm", {
                                        locale: es,
                                    })}
                                </p>
                            )}
                        </div>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    )
}

interface SignatureInfoCardProps {
    signature: DocumentSignature
    className?: string
}

export function SignatureInfoCard({ signature, className }: SignatureInfoCardProps) {
    return (
        <div className={`p-4 bg-green-50 border border-green-200 rounded-lg ${className}`}>
            <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-1 flex-1">
                    <h4 className="font-medium text-green-800">Documento Firmado</h4>
                    <div className="text-sm text-green-700 space-y-0.5">
                        <p>
                            <strong>Firmante:</strong> {signature.signerName}
                        </p>
                        <p>
                            <strong>RUT:</strong> {signature.signerRut}
                        </p>
                        {signature.signerEmail && (
                            <p>
                                <strong>Email:</strong> {signature.signerEmail}
                            </p>
                        )}
                        {signature.acceptedAt && (
                            <p>
                                <strong>Fecha:</strong>{" "}
                                {format(new Date(signature.acceptedAt), "dd 'de' MMMM 'de' yyyy, HH:mm", {
                                    locale: es,
                                })}
                            </p>
                        )}
                    </div>
                    {signature.signatureData && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                            <p className="text-xs text-green-600 mb-2">Firma manuscrita:</p>
                            <div className="bg-white p-2 rounded border border-green-200 inline-block">
                                <img
                                    src={signature.signatureData}
                                    alt="Firma"
                                    className="max-h-16"
                                />
                            </div>
                        </div>
                    )}
                    <div className="mt-2 pt-2 border-t border-green-200">
                        <p className="text-xs text-green-600">
                            <Info className="inline h-3 w-3 mr-1" />
                            Token de verificación: {signature.verificationToken.slice(0, 8)}...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
