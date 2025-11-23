import { z } from "zod"
import { ClaimStatus } from "@prisma/client"

export const ClaimSchema = z.object({
    policyId: z.string().min(1, "La póliza es requerida"),
    description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
    date: z.date({
        required_error: "La fecha del siniestro es requerida",
    }),
    number: z.string().optional(),
})

export const UpdateClaimStatusSchema = z.object({
    claimId: z.string().min(1, "ID del siniestro requerido"),
    status: z.nativeEnum(ClaimStatus, {
        errorMap: () => ({ message: "Estado de siniestro inválido" }),
    }),
    notes: z.string().optional(),
})

export type ClaimFormValues = z.infer<typeof ClaimSchema>
export type UpdateClaimStatusValues = z.infer<typeof UpdateClaimStatusSchema>
