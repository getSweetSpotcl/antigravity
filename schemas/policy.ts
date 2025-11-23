import { z } from "zod"

export const PolicySchema = z.object({
    number: z.string().min(1, "El número de póliza es requerido"),
    company: z.string().min(1, "La compañía aseguradora es requerida"),
    type: z.enum(["GENERAL", "LIFE", "HEALTH", "AUTO", "HOME", "GUARANTEE"], {
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
    currency: z.enum(["UF", "CLP", "USD"]),
    clientId: z.string().min(1, "Debes seleccionar un cliente"),
}).refine((data) => data.endDate > data.startDate, {
    message: "La fecha de término debe ser posterior a la fecha de inicio",
    path: ["endDate"],
})

export type PolicyFormValues = z.infer<typeof PolicySchema>
