import { z } from "zod"
import { ClaimStatus } from "@prisma/client"

export const ClaimStatuses = ["REPORTED", "IN_PROCESS", "APPROVED", "REJECTED", "CLOSED"] as const

export const ClaimSchema = z.object({
    policyId: z.string().min(1, "La póliza es requerida"),
    number: z.string().optional(),
    description: z.string().min(1, "La descripción es requerida"),
    date: z.date({
        message: "La fecha del siniestro es requerida",
    }),
    status: z.nativeEnum(ClaimStatus, {
        message: "Estado de siniestro inválido",
    }).optional(),
    // Montos
    claimAmount: z.string().optional().refine((val) => {
        if (!val) return true
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0
    }, "Debe ser un número positivo"),
    reserveAmount: z.string().optional().refine((val) => {
        if (!val) return true
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0
    }, "Debe ser un número positivo"),
    currency: z.string().optional(),
    // Información del ajustador
    adjusterName: z.string().optional(),
    adjusterPhone: z.string().optional(),
    adjusterEmail: z.string().email("Email inválido").optional().or(z.literal("")),
    adjusterCompany: z.string().optional(),
    // Fecha denuncia a compañía
    reportedToCompanyDate: z.date().optional(),
    // Notas
    internalNotes: z.string().optional(),
})

export const UpdateClaimSchema = z.object({
    description: z.string().min(1).optional(),
    status: z.nativeEnum(ClaimStatus).optional(),
    claimAmount: z.any().optional(),
    reserveAmount: z.any().optional(),
    approvedAmount: z.any().optional(),
    paidAmount: z.any().optional(),
    currency: z.string().optional(),
    adjusterName: z.string().nullable().optional(),
    adjusterPhone: z.string().nullable().optional(),
    adjusterEmail: z.string().nullable().optional(),
    adjusterCompany: z.string().nullable().optional(),
    reportedToCompanyDate: z.date().nullable().optional(),
    adjustmentDate: z.date().nullable().optional(),
    resolutionDate: z.date().nullable().optional(),
    internalNotes: z.string().nullable().optional(),
})

export const UpdateClaimStatusSchema = z.object({
    claimId: z.string().min(1, "ID del siniestro requerido"),
    status: z.nativeEnum(ClaimStatus, {
        message: "Estado de siniestro inválido",
    }),
    notes: z.string().optional(),
})

export const AddClaimHistorySchema = z.object({
    claimId: z.string().min(1),
    action: z.string().min(1),
    description: z.string().min(1),
    oldValue: z.string().optional(),
    newValue: z.string().optional(),
})

export type ClaimFormValues = z.infer<typeof ClaimSchema>
export type UpdateClaimFormValues = z.infer<typeof UpdateClaimSchema>
export type UpdateClaimStatusValues = z.infer<typeof UpdateClaimStatusSchema>
