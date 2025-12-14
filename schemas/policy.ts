import { z } from "zod"

export const PolicyTypes = ["GENERAL", "LIFE", "HEALTH", "AUTO", "HOME", "GUARANTEE"] as const
export const PolicyStatuses = ["ACTIVE", "EXPIRED", "CANCELLED", "RENEWED"] as const
export const Currencies = ["UF", "CLP", "USD"] as const

// Schema para crear póliza
export const PolicySchema = z.object({
    number: z.string().min(1, "El número de póliza es requerido"),
    company: z.string().min(1, "La compañía aseguradora es requerida"),
    companyId: z.string().optional(),
    agentId: z.string().optional(), // Vendedor asignado
    type: z.enum(PolicyTypes, {
        message: "Selecciona un tipo de póliza",
    }),
    startDate: z.date({
        message: "La fecha de inicio es requerida",
    }),
    endDate: z.date({
        message: "La fecha de término es requerida",
    }),
    premium: z.string().min(1, "La prima es requerida").refine((val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num > 0
    }, "La prima debe ser un número positivo"),
    commission: z.string().min(1, "La comisión es requerida").refine((val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0
    }, "La comisión debe ser un número positivo o cero"),
    currency: z.enum(Currencies),
    clientId: z.string().min(1, "Debes seleccionar un cliente"),
    // Campos adicionales opcionales
    insuredProperty: z.any().optional(),
    coverages: z.any().optional(),
    deductibles: z.any().optional(),
}).refine((data) => data.endDate > data.startDate, {
    message: "La fecha de término debe ser posterior a la fecha de inicio",
    path: ["endDate"],
})

// Schema para actualizar póliza (campos parciales)
export const UpdatePolicySchema = z.object({
    number: z.string().min(1).optional(),
    company: z.string().min(1).optional(),
    companyId: z.string().nullable().optional(),
    agentId: z.string().nullable().optional(), // Vendedor asignado
    type: z.enum(PolicyTypes).optional(),
    status: z.enum(PolicyStatuses).optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    premium: z.any().optional(),
    commission: z.any().optional(),
    currency: z.enum(Currencies).optional(),
    insuredProperty: z.any().optional(),
    coverages: z.any().optional(),
    deductibles: z.any().optional(),
})

// Schema para ítems de póliza
export const PolicyItemSchema = z.object({
    description: z.string().min(1, "La descripción es requerida"),
    value: z.string().min(1, "El valor es requerido").refine((val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num > 0
    }, "El valor debe ser un número positivo"),
    currency: z.enum(Currencies).optional(),
    details: z.any().optional(),
})

export type PolicyFormValues = z.infer<typeof PolicySchema>
export type UpdatePolicyFormValues = z.infer<typeof UpdatePolicySchema>
export type PolicyItemFormValues = z.infer<typeof PolicyItemSchema>
