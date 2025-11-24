import { z } from "zod"
// @ts-expect-error
import { EndorsementType } from "@prisma/client"

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
})

export type EndorsementFormValues = z.infer<typeof EndorsementSchema>
