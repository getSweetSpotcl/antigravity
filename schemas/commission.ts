import { z } from "zod"
import { CommissionStatus, PaymentMethod } from "@prisma/client"

export const CommissionStatuses = ["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"] as const
export const PaymentMethods = ["TRANSFER", "CHECK", "CASH", "CREDIT_CARD", "OTHER"] as const
export const Currencies = ["UF", "CLP", "USD"] as const

// Schema para crear comisión
export const CommissionSchema = z.object({
    policyId: z.string().min(1, "La póliza es requerida"),
    percentage: z.string().min(1, "El porcentaje es requerido").refine((val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0 && num <= 100
    }, "El porcentaje debe estar entre 0 y 100"),
    baseAmount: z.string().min(1, "El monto base es requerido").refine((val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num > 0
    }, "El monto base debe ser positivo"),
    currency: z.enum(Currencies).optional(),
    dueDate: z.date().optional(),
    periodStart: z.date().optional(),
    periodEnd: z.date().optional(),
    installment: z.number().int().positive().optional(),
    totalInstallments: z.number().int().positive().optional(),
    notes: z.string().optional(),
})

// Schema para actualizar comisión
export const UpdateCommissionSchema = z.object({
    percentage: z.any().optional(),
    baseAmount: z.any().optional(),
    amount: z.any().optional(),
    currency: z.enum(Currencies).optional(),
    status: z.nativeEnum(CommissionStatus).optional(),
    dueDate: z.date().nullable().optional(),
    periodStart: z.date().nullable().optional(),
    periodEnd: z.date().nullable().optional(),
    installment: z.number().int().positive().nullable().optional(),
    totalInstallments: z.number().int().positive().nullable().optional(),
    notes: z.string().nullable().optional(),
})

// Schema para registrar pago
export const CommissionPaymentSchema = z.object({
    commissionId: z.string().min(1, "La comisión es requerida"),
    amount: z.string().min(1, "El monto es requerido").refine((val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num > 0
    }, "El monto debe ser positivo"),
    currency: z.enum(Currencies).optional(),
    paymentDate: z.date({
        message: "La fecha de pago es requerida",
    }),
    paymentMethod: z.nativeEnum(PaymentMethod, {
        message: "El método de pago es requerido",
    }),
    reference: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    notes: z.string().optional(),
})

// Schema para generar comisiones automáticamente desde póliza
export const GenerateCommissionSchema = z.object({
    policyId: z.string().min(1, "La póliza es requerida"),
    percentage: z.string().min(1, "El porcentaje es requerido").refine((val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0 && num <= 100
    }, "El porcentaje debe estar entre 0 y 100"),
    installments: z.number().int().min(1).max(12).optional(), // Cuotas (1-12)
    dueDate: z.date().optional(),
})

// Types
export type CommissionFormValues = z.infer<typeof CommissionSchema>
export type UpdateCommissionFormValues = z.infer<typeof UpdateCommissionSchema>
export type CommissionPaymentFormValues = z.infer<typeof CommissionPaymentSchema>
export type GenerateCommissionFormValues = z.infer<typeof GenerateCommissionSchema>
