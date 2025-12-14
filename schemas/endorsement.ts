import { z } from "zod"
import { EndorsementType } from "@prisma/client"

export const EndorsementTypes = [
    "GENERAL_MODIFICATION",
    "RENEWAL",
    "CANCELLATION",
    "INCLUSION",
    "EXCLUSION",
] as const

export const EndorsementSchema = z.object({
    policyId: z.string().min(1, "La póliza es requerida"),
    type: z.nativeEnum(EndorsementType, {
        message: "Tipo de endoso inválido",
    }),
    description: z.string().min(1, "La descripción es requerida"),
    date: z.date({
        message: "La fecha es requerida",
    }),
    number: z.string().optional(),
    // Campos opcionales para cambios de prima
    premiumChange: z.string().optional().refine((val) => {
        if (!val) return true
        const num = parseFloat(val)
        return !isNaN(num)
    }, "Debe ser un número válido"),
    effectiveDate: z.date().optional(),
    notes: z.string().optional(),
})

export const UpdateEndorsementSchema = z.object({
    type: z.nativeEnum(EndorsementType).optional(),
    description: z.string().min(1).optional(),
    date: z.date().optional(),
    number: z.string().nullable().optional(),
    premiumChange: z.any().optional(),
    effectiveDate: z.date().nullable().optional(),
    notes: z.string().nullable().optional(),
})

export type EndorsementFormValues = z.infer<typeof EndorsementSchema>
export type UpdateEndorsementFormValues = z.infer<typeof UpdateEndorsementSchema>
