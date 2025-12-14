"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import {
    createAgentCommissionSchema,
    updateAgentCommissionSchema,
    registerAgentCommissionPaymentSchema,
    type CreateAgentCommissionInput,
    type UpdateAgentCommissionInput,
    type RegisterAgentCommissionPaymentInput,
    type AgentCommissionFilters,
} from "@/schemas/agent-commission"
import { getTenantContext } from "@/lib/tenant-context"
import { auth } from "@/lib/auth"
import type { CommissionStatus } from "@prisma/client"
import { addDays } from "date-fns"

// Obtener todas las comisiones de vendedor con filtros
export const getAgentCommissions = async (filters?: AgentCommissionFilters) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const where: Record<string, unknown> = { tenantId }

    if (filters?.status) where.status = filters.status
    if (filters?.agentId) where.agentId = filters.agentId
    if (filters?.policyId) where.policyId = filters.policyId
    if (filters?.commissionId) where.commissionId = filters.commissionId

    if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {}
        if (filters.dateFrom) (where.createdAt as Record<string, unknown>).gte = filters.dateFrom
        if (filters.dateTo) (where.createdAt as Record<string, unknown>).lte = filters.dateTo
    }

    const agentCommissions = await prisma.agentCommission.findMany({
        where,
        include: {
            Policy: {
                include: {
                    Client: true,
                    InsuranceCompany: true,
                },
            },
            Agent: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    defaultCommissionPercentage: true,
                    bankName: true,
                    bankAccountNumber: true,
                    bankAccountType: true,
                },
            },
            Commission: {
                select: {
                    id: true,
                    amount: true,
                    status: true,
                    paidAmount: true,
                },
            },
            AgentCommissionPayment: {
                orderBy: { paymentDate: "desc" },
            },
        },
        orderBy: [
            { status: "asc" },
            { dueDate: "asc" },
        ],
    })

    return agentCommissions
}

// Obtener comisión de vendedor por ID
export const getAgentCommissionById = async (id: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const agentCommission = await prisma.agentCommission.findUnique({
        where: { id },
        include: {
            Policy: {
                include: {
                    Client: true,
                    InsuranceCompany: true,
                },
            },
            Agent: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    defaultCommissionPercentage: true,
                    bankName: true,
                    bankAccountNumber: true,
                    bankAccountType: true,
                },
            },
            Commission: {
                include: {
                    CommissionPayment: true,
                },
            },
            AgentCommissionPayment: {
                orderBy: { paymentDate: "desc" },
            },
        },
    })

    if (!agentCommission || agentCommission.tenantId !== tenantId) {
        return null
    }

    return agentCommission
}

// Crear comisión de vendedor (llamada internamente al crear comisión de corredora)
export const createAgentCommission = async (values: CreateAgentCommissionInput) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const validatedFields = createAgentCommissionSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    const {
        commissionId,
        policyId,
        agentId,
        percentage,
        baseAmount,
        currency,
        dueDate,
        notes,
    } = validatedFields.data

    // Verificar que la comisión de corredora existe y pertenece al tenant
    const brokerageCommission = await prisma.commission.findUnique({
        where: { id: commissionId },
    })

    if (!brokerageCommission || brokerageCommission.tenantId !== tenantId) {
        return { error: "Comisión de corredora no encontrada" }
    }

    // Verificar que el vendedor existe
    const agent = await prisma.user.findUnique({
        where: { id: agentId },
    })

    if (!agent || agent.tenantId !== tenantId) {
        return { error: "Vendedor no encontrado" }
    }

    // Calcular monto de comisión del vendedor
    const agentAmount = (baseAmount * percentage) / 100

    try {
        const agentCommission = await prisma.agentCommission.create({
            data: {
                commissionId,
                policyId,
                agentId,
                tenantId,
                percentage,
                baseAmount,
                amount: agentAmount,
                pendingAmount: agentAmount,
                currency: currency || "UF",
                dueDate: dueDate || brokerageCommission.dueDate,
                notes: notes || null,
            },
        })

        revalidatePath("/dashboard/commissions")
        revalidatePath("/dashboard/commissions/agents")
        return { success: "Comisión de vendedor creada exitosamente", agentCommissionId: agentCommission.id }
    } catch {
        return { error: "Error al crear la comisión de vendedor" }
    }
}

// Actualizar comisión de vendedor
export const updateAgentCommission = async (id: string, values: UpdateAgentCommissionInput) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const existingCommission = await prisma.agentCommission.findUnique({
        where: { id },
    })

    if (!existingCommission || existingCommission.tenantId !== tenantId) {
        return { error: "Comisión de vendedor no encontrada" }
    }

    const validatedFields = updateAgentCommissionSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    const updateData: Record<string, unknown> = {}

    if (validatedFields.data.percentage !== undefined) {
        const newPercentage = validatedFields.data.percentage
        const newAmount = (Number(existingCommission.baseAmount) * newPercentage) / 100
        const paidAmount = Number(existingCommission.paidAmount)

        updateData.percentage = newPercentage
        updateData.amount = newAmount
        updateData.pendingAmount = newAmount - paidAmount
    }

    if (validatedFields.data.dueDate !== undefined) {
        updateData.dueDate = validatedFields.data.dueDate
    }

    if (validatedFields.data.notes !== undefined) {
        updateData.notes = validatedFields.data.notes
    }

    if (validatedFields.data.status !== undefined) {
        updateData.status = validatedFields.data.status
    }

    try {
        await prisma.agentCommission.update({
            where: { id },
            data: updateData,
        })

        revalidatePath("/dashboard/commissions/agents")
        revalidatePath(`/dashboard/commissions/agents/${id}`)
        return { success: "Comisión de vendedor actualizada exitosamente" }
    } catch {
        return { error: "Error al actualizar la comisión" }
    }
}

// Registrar pago de comisión de vendedor
export const registerAgentCommissionPayment = async (values: RegisterAgentCommissionPaymentInput) => {
    const tenantId = await getTenantContext()
    const session = await auth()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const validatedFields = registerAgentCommissionPaymentSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    const {
        agentCommissionId,
        amount,
        currency,
        paymentDate,
        paymentMethod,
        reference,
        bankName,
        accountNumber,
        notes,
    } = validatedFields.data

    const agentCommission = await prisma.agentCommission.findUnique({
        where: { id: agentCommissionId },
    })

    if (!agentCommission || agentCommission.tenantId !== tenantId) {
        return { error: "Comisión de vendedor no encontrada" }
    }

    // Validar que el pago no exceda el monto pendiente
    if (amount > Number(agentCommission.pendingAmount)) {
        return { error: "El monto del pago excede el monto pendiente" }
    }

    try {
        // Crear el pago
        await prisma.agentCommissionPayment.create({
            data: {
                agentCommissionId,
                amount,
                currency: currency || agentCommission.currency,
                paymentDate,
                paymentMethod,
                reference: reference || null,
                bankName: bankName || null,
                accountNumber: accountNumber || null,
                notes: notes || null,
                recordedBy: session?.user?.id || null,
                recordedByName: session?.user?.name || null,
            },
        })

        // Actualizar la comisión
        const newPaidAmount = Number(agentCommission.paidAmount) + amount
        const newPendingAmount = Number(agentCommission.amount) - newPaidAmount

        let newStatus: CommissionStatus = agentCommission.status

        if (newPendingAmount <= 0) {
            newStatus = "PAID"
        } else if (newPaidAmount > 0) {
            newStatus = "PARTIAL"
        }

        await prisma.agentCommission.update({
            where: { id: agentCommissionId },
            data: {
                paidAmount: newPaidAmount,
                pendingAmount: newPendingAmount,
                status: newStatus,
                paidDate: newStatus === "PAID" ? new Date() : null,
            },
        })

        revalidatePath("/dashboard/commissions/agents")
        revalidatePath(`/dashboard/commissions/agents/${agentCommissionId}`)
        return { success: "Pago registrado exitosamente" }
    } catch {
        return { error: "Error al registrar el pago" }
    }
}

// Eliminar pago de comisión de vendedor
export const deleteAgentCommissionPayment = async (paymentId: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const payment = await prisma.agentCommissionPayment.findUnique({
        where: { id: paymentId },
        include: { AgentCommission: true },
    })

    if (!payment || payment.AgentCommission.tenantId !== tenantId) {
        return { error: "Pago no encontrado" }
    }

    try {
        const agentCommission = payment.AgentCommission
        const paymentAmount = Number(payment.amount)

        // Eliminar el pago
        await prisma.agentCommissionPayment.delete({
            where: { id: paymentId },
        })

        // Actualizar la comisión
        const newPaidAmount = Number(agentCommission.paidAmount) - paymentAmount
        const newPendingAmount = Number(agentCommission.amount) - newPaidAmount

        let newStatus: CommissionStatus = "PENDING"
        if (newPaidAmount > 0 && newPendingAmount > 0) {
            newStatus = "PARTIAL"
        } else if (newPendingAmount <= 0) {
            newStatus = "PAID"
        }

        await prisma.agentCommission.update({
            where: { id: agentCommission.id },
            data: {
                paidAmount: newPaidAmount,
                pendingAmount: newPendingAmount,
                status: newStatus,
                paidDate: null,
            },
        })

        revalidatePath("/dashboard/commissions/agents")
        revalidatePath(`/dashboard/commissions/agents/${agentCommission.id}`)
        return { success: "Pago eliminado exitosamente" }
    } catch {
        return { error: "Error al eliminar el pago" }
    }
}

// Cancelar comisión de vendedor
export const cancelAgentCommission = async (id: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const agentCommission = await prisma.agentCommission.findUnique({
        where: { id },
        include: { AgentCommissionPayment: true },
    })

    if (!agentCommission || agentCommission.tenantId !== tenantId) {
        return { error: "Comisión de vendedor no encontrada" }
    }

    if (agentCommission.AgentCommissionPayment.length > 0) {
        return { error: "No se puede cancelar una comisión con pagos registrados" }
    }

    try {
        await prisma.agentCommission.update({
            where: { id },
            data: { status: "CANCELLED" },
        })

        revalidatePath("/dashboard/commissions/agents")
        return { success: "Comisión de vendedor cancelada exitosamente" }
    } catch {
        return { error: "Error al cancelar la comisión" }
    }
}

// Obtener comisiones de vendedor por agente
export const getAgentCommissionsByAgentId = async (agentId: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const agentCommissions = await prisma.agentCommission.findMany({
        where: { agentId, tenantId },
        include: {
            Policy: {
                include: {
                    Client: { select: { firstName: true, lastName: true } },
                    InsuranceCompany: { select: { name: true } },
                },
            },
            Commission: { select: { amount: true, status: true } },
            AgentCommissionPayment: {
                orderBy: { paymentDate: "desc" },
            },
        },
        orderBy: [
            { status: "asc" },
            { createdAt: "desc" },
        ],
    })

    return agentCommissions
}

// Obtener estadísticas de comisiones de vendedor
export const getAgentCommissionStats = async (agentId?: string, period?: { from: Date; to: Date }) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const where: Record<string, unknown> = { tenantId }

    if (agentId) where.agentId = agentId

    if (period) {
        where.createdAt = {
            gte: period.from,
            lte: period.to,
        }
    }

    const [
        totalCount,
        byStatus,
        totalAmount,
        paidAmount,
        pendingAmount,
    ] = await Promise.all([
        prisma.agentCommission.count({ where }),
        prisma.agentCommission.groupBy({
            by: ["status"],
            where,
            _count: true,
            _sum: { amount: true, paidAmount: true, pendingAmount: true },
        }),
        prisma.agentCommission.aggregate({
            where,
            _sum: { amount: true },
        }),
        prisma.agentCommission.aggregate({
            where,
            _sum: { paidAmount: true },
        }),
        prisma.agentCommission.aggregate({
            where: { ...where, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
            _sum: { pendingAmount: true },
        }),
    ])

    const statusSummary = byStatus.reduce(
        (acc, item) => {
            acc[item.status] = {
                count: item._count,
                amount: Number(item._sum.amount) || 0,
                paid: Number(item._sum.paidAmount) || 0,
                pending: Number(item._sum.pendingAmount) || 0,
            }
            return acc
        },
        {} as Record<string, { count: number; amount: number; paid: number; pending: number }>
    )

    return {
        totalCount,
        totalAmount: Number(totalAmount._sum.amount) || 0,
        totalPaid: Number(paidAmount._sum.paidAmount) || 0,
        totalPending: Number(pendingAmount._sum.pendingAmount) || 0,
        byStatus: statusSummary,
    }
}

// Obtener resumen para dashboard
export const getAgentCommissionsDashboardSummary = async () => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const today = new Date()
    const in30Days = addDays(today, 30)

    const [
        pendingTotal,
        overdueTotal,
        upcomingDue,
        recentPayments,
        byAgent,
    ] = await Promise.all([
        // Total pendiente
        prisma.agentCommission.aggregate({
            where: {
                tenantId,
                status: { in: ["PENDING", "PARTIAL"] },
            },
            _sum: { pendingAmount: true },
            _count: true,
        }),
        // Total vencido
        prisma.agentCommission.aggregate({
            where: {
                tenantId,
                status: "OVERDUE",
            },
            _sum: { pendingAmount: true },
            _count: true,
        }),
        // Próximas a vencer (30 días)
        prisma.agentCommission.findMany({
            where: {
                tenantId,
                status: { in: ["PENDING", "PARTIAL"] },
                dueDate: {
                    gte: today,
                    lte: in30Days,
                },
            },
            include: {
                Policy: {
                    include: {
                        Client: { select: { firstName: true, lastName: true } },
                    },
                },
                Agent: { select: { name: true, email: true } },
            },
            orderBy: { dueDate: "asc" },
            take: 5,
        }),
        // Pagos recientes
        prisma.agentCommissionPayment.findMany({
            where: {
                AgentCommission: { tenantId },
            },
            include: {
                AgentCommission: {
                    include: {
                        Agent: { select: { name: true } },
                        Policy: { select: { number: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
        }),
        // Resumen por vendedor
        prisma.agentCommission.groupBy({
            by: ["agentId"],
            where: {
                tenantId,
                status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
            },
            _sum: { pendingAmount: true },
            _count: true,
        }),
    ])

    // Obtener nombres de agentes
    const agentIds = byAgent.map((a) => a.agentId)
    const agents = await prisma.user.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true },
    })

    const agentMap = new Map(agents.map((a) => [a.id, a.name]))

    return {
        pending: {
            count: pendingTotal._count,
            amount: Number(pendingTotal._sum.pendingAmount) || 0,
        },
        overdue: {
            count: overdueTotal._count,
            amount: Number(overdueTotal._sum.pendingAmount) || 0,
        },
        upcomingDue,
        recentPayments,
        byAgent: byAgent.map((a) => ({
            agentId: a.agentId,
            agentName: agentMap.get(a.agentId) || "Desconocido",
            count: a._count,
            pendingAmount: Number(a._sum.pendingAmount) || 0,
        })),
    }
}

// Obtener comisiones de vendedor vinculadas a una comisión de corredora
export const getAgentCommissionsByBrokerageCommissionId = async (commissionId: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const agentCommissions = await prisma.agentCommission.findMany({
        where: { commissionId, tenantId },
        include: {
            Agent: { select: { id: true, name: true, email: true } },
            AgentCommissionPayment: {
                orderBy: { paymentDate: "desc" },
            },
        },
        orderBy: { createdAt: "asc" },
    })

    return agentCommissions
}

// Marcar comisiones de vendedor vencidas
export const markOverdueAgentCommissions = async () => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const today = new Date()

    try {
        const result = await prisma.agentCommission.updateMany({
            where: {
                tenantId,
                status: { in: ["PENDING", "PARTIAL"] },
                dueDate: { lt: today },
            },
            data: { status: "OVERDUE" },
        })

        revalidatePath("/dashboard/commissions/agents")
        return { success: `${result.count} comisiones de vendedor marcadas como vencidas` }
    } catch {
        return { error: "Error al actualizar comisiones" }
    }
}
