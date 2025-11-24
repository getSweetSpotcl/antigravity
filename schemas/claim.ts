import { z } from "zod"
// @ts-expect-error
import { ClaimStatus } from "@prisma/client"

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
})

export const UpdateClaimStatusSchema = z.object({
    claimId: z.string().min(1, "ID del siniestro requerido"),
    status: z.nativeEnum(ClaimStatus, {
        message: "Estado de siniestro inválido",
    }),
    notes: z.string().optional(),
})

export type ClaimFormValues = z.infer<typeof ClaimSchema>
export type UpdateClaimStatusValues = z.infer<typeof UpdateClaimStatusSchema>
