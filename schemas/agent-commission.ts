import { z } from "zod"

// Create Agent Commission schema
export const createAgentCommissionSchema = z.object({
    commissionId: z.string().min(1, "La comisión de corredora es requerida"),
    policyId: z.string().min(1, "La póliza es requerida"),
    agentId: z.string().min(1, "El vendedor es requerido"),
    percentage: z.number().min(0, "El porcentaje debe ser mayor o igual a 0").max(100, "El porcentaje no puede superar 100"),
    baseAmount: z.number().min(0, "El monto base debe ser mayor o igual a 0"),
    currency: z.string().default("UF"),
    dueDate: z.date().optional(),
    notes: z.string().optional(),
})

export type CreateAgentCommissionInput = z.infer<typeof createAgentCommissionSchema>

// Update Agent Commission schema
export const updateAgentCommissionSchema = z.object({
    percentage: z.number().min(0).max(100).optional(),
    dueDate: z.date().optional().nullable(),
    notes: z.string().optional().nullable(),
    status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).optional(),
})

export type UpdateAgentCommissionInput = z.infer<typeof updateAgentCommissionSchema>

// Register Agent Commission Payment schema
export const registerAgentCommissionPaymentSchema = z.object({
    agentCommissionId: z.string().min(1, "La comisión del vendedor es requerida"),
    amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
    currency: z.string().min(1, "La moneda es requerida"),
    paymentDate: z.date(),
    paymentMethod: z.enum(["TRANSFER", "CHECK", "CASH", "CREDIT_CARD", "OTHER"]),
    reference: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    notes: z.string().optional(),
})

export type RegisterAgentCommissionPaymentInput = z.infer<typeof registerAgentCommissionPaymentSchema>

// Filter schema for listing
export const agentCommissionFiltersSchema = z.object({
    status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).optional(),
    agentId: z.string().optional(),
    policyId: z.string().optional(),
    commissionId: z.string().optional(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
})

export type AgentCommissionFilters = z.infer<typeof agentCommissionFiltersSchema>

// Agent settings schema
export const updateAgentSettingsSchema = z.object({
    defaultCommissionPercentage: z.number().min(0).max(100).optional().nullable(),
    bankName: z.string().optional().nullable(),
    bankAccountNumber: z.string().optional().nullable(),
    bankAccountType: z.enum(["corriente", "vista"]).optional().nullable(),
})

export type UpdateAgentSettingsInput = z.infer<typeof updateAgentSettingsSchema>
