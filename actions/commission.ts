"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import {
    CommissionSchema,
    UpdateCommissionSchema,
    CommissionPaymentSchema,
    GenerateCommissionSchema,
} from "@/schemas/commission"
import { getTenantContext } from "@/lib/tenant-context"
import { auth } from "@/lib/auth"
import type { CommissionStatus } from "@prisma/client"
import { addMonths, addDays } from "date-fns"

const STATUS_LABELS: Record<CommissionStatus, string> = {
    PENDING: "Pendiente",
    PARTIAL: "Parcial",
    PAID: "Pagada",
    OVERDUE: "Vencida",
    CANCELLED: "Cancelada",
}

// Obtener todas las comisiones con filtros
export const getCommissions = async (filters?: {
    status?: CommissionStatus
    policyId?: string
    dateFrom?: Date
    dateTo?: Date
    dueDateFrom?: Date
    dueDateTo?: Date
}) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const where: any = { tenantId }

    if (filters?.status) where.status = filters.status
    if (filters?.policyId) where.policyId = filters.policyId

    if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {}
        if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
        if (filters.dateTo) where.createdAt.lte = filters.dateTo
    }

    if (filters?.dueDateFrom || filters?.dueDateTo) {
        where.dueDate = {}
        if (filters.dueDateFrom) where.dueDate.gte = filters.dueDateFrom
        if (filters.dueDateTo) where.dueDate.lte = filters.dueDateTo
    }

    const commissions = await prisma.commission.findMany({
        where,
        include: {
            Policy: {
                include: {
                    Client: true,
                    InsuranceCompany: true,
                },
            },
            CommissionPayment: {
                orderBy: { paymentDate: "desc" },
            },
        },
        orderBy: [
            { status: "asc" },
            { dueDate: "asc" },
        ],
    })

    return commissions
}

// Obtener comisión por ID
export const getCommissionById = async (id: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const commission = await prisma.commission.findUnique({
        where: { id },
        include: {
            Policy: {
                include: {
                    Client: true,
                    InsuranceCompany: true,
                },
            },
            CommissionPayment: {
                orderBy: { paymentDate: "desc" },
            },
        },
    })

    if (!commission || commission.tenantId !== tenantId) {
        return null
    }

    return commission
}

// Crear comisión manual
export const createCommission = async (values: z.infer<typeof CommissionSchema>) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const validatedFields = CommissionSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    const {
        policyId,
        percentage,
        baseAmount,
        currency,
        dueDate,
        periodStart,
        periodEnd,
        installment,
        totalInstallments,
        notes,
    } = validatedFields.data

    // Verificar que la póliza pertenece al tenant
    const policy = await prisma.policy.findUnique({
        where: { id: policyId },
    })

    if (!policy || policy.tenantId !== tenantId) {
        return { error: "Póliza no encontrada" }
    }

    const percentageNum = parseFloat(percentage)
    const baseAmountNum = parseFloat(baseAmount)
    const commissionAmount = (baseAmountNum * percentageNum) / 100

    try {
        const commission = await prisma.commission.create({
            data: {
                policyId,
                tenantId,
                percentage: percentageNum,
                baseAmount: baseAmountNum,
                amount: commissionAmount,
                pendingAmount: commissionAmount,
                currency: currency || "UF",
                dueDate: dueDate || null,
                periodStart: periodStart || null,
                periodEnd: periodEnd || null,
                installment: installment || null,
                totalInstallments: totalInstallments || null,
                notes: notes || null,
            },
        })

        revalidatePath("/dashboard/commissions")
        return { success: "Comisión creada exitosamente", commissionId: commission.id }
    } catch {
        return { error: "Error al crear la comisión" }
    }
}

// Generar comisiones automáticamente desde una póliza
export const generateCommissionsFromPolicy = async (values: z.infer<typeof GenerateCommissionSchema>) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const validatedFields = GenerateCommissionSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    const { policyId, percentage, installments = 1, dueDate } = validatedFields.data

    const policy = await prisma.policy.findUnique({
        where: { id: policyId },
        include: {
            Agent: {
                select: {
                    id: true,
                    defaultCommissionPercentage: true,
                },
            },
        },
    })

    if (!policy || policy.tenantId !== tenantId) {
        return { error: "Póliza no encontrada" }
    }

    const percentageNum = parseFloat(percentage)
    const premium = Number(policy.premium)
    const totalCommission = (premium * percentageNum) / 100
    const commissionPerInstallment = totalCommission / installments

    try {
        const createdCommissions = []
        const createdAgentCommissions = []

        for (let i = 0; i < installments; i++) {
            const installmentDueDate = dueDate
                ? addMonths(dueDate, i)
                : addMonths(policy.startDate, i + 1)

            const commission = await prisma.commission.create({
                data: {
                    policyId,
                    tenantId,
                    percentage: percentageNum,
                    baseAmount: premium / installments,
                    amount: commissionPerInstallment,
                    pendingAmount: commissionPerInstallment,
                    currency: policy.currency,
                    dueDate: installmentDueDate,
                    periodStart: addMonths(policy.startDate, i),
                    periodEnd: addMonths(policy.startDate, i + 1),
                    installment: i + 1,
                    totalInstallments: installments,
                },
            })

            createdCommissions.push(commission)

            // Auto-generar comisión de vendedor si hay agente asignado
            if (policy.agentId && policy.Agent?.defaultCommissionPercentage) {
                const agentPercentage = Number(policy.Agent.defaultCommissionPercentage)
                const agentAmount = (commissionPerInstallment * agentPercentage) / 100

                const agentCommission = await prisma.agentCommission.create({
                    data: {
                        commissionId: commission.id,
                        policyId,
                        agentId: policy.agentId,
                        tenantId,
                        percentage: agentPercentage,
                        baseAmount: commissionPerInstallment,
                        amount: agentAmount,
                        pendingAmount: agentAmount,
                        currency: policy.currency,
                        dueDate: installmentDueDate,
                    },
                })

                createdAgentCommissions.push(agentCommission)
            }
        }

        revalidatePath("/dashboard/commissions")
        revalidatePath("/dashboard/commissions/agents")
        revalidatePath(`/dashboard/policies/${policyId}`)

        const agentMessage = createdAgentCommissions.length > 0
            ? ` y ${createdAgentCommissions.length} comisión(es) de vendedor`
            : ""

        return {
            success: `${installments} comisión(es) de corredora${agentMessage} generada(s) exitosamente`,
            commissionIds: createdCommissions.map((c) => c.id),
            agentCommissionIds: createdAgentCommissions.map((c) => c.id),
        }
    } catch {
        return { error: "Error al generar las comisiones" }
    }
}

// Actualizar comisión
export const updateCommission = async (id: string, values: z.infer<typeof UpdateCommissionSchema>) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const existingCommission = await prisma.commission.findUnique({
        where: { id },
    })

    if (!existingCommission || existingCommission.tenantId !== tenantId) {
        return { error: "Comisión no encontrada" }
    }

    const validatedFields = UpdateCommissionSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    try {
        await prisma.commission.update({
            where: { id },
            data: validatedFields.data,
        })

        revalidatePath("/dashboard/commissions")
        revalidatePath(`/dashboard/commissions/${id}`)
        return { success: "Comisión actualizada exitosamente" }
    } catch {
        return { error: "Error al actualizar la comisión" }
    }
}

// Registrar pago de comisión
export const registerCommissionPayment = async (values: z.infer<typeof CommissionPaymentSchema>) => {
    const tenantId = await getTenantContext()
    const session = await auth()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const validatedFields = CommissionPaymentSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    const {
        commissionId,
        amount,
        currency,
        paymentDate,
        paymentMethod,
        reference,
        bankName,
        accountNumber,
        notes,
    } = validatedFields.data

    const commission = await prisma.commission.findUnique({
        where: { id: commissionId },
    })

    if (!commission || commission.tenantId !== tenantId) {
        return { error: "Comisión no encontrada" }
    }

    const paymentAmount = parseFloat(amount)

    // Validar que el pago no exceda el monto pendiente
    if (paymentAmount > Number(commission.pendingAmount)) {
        return { error: "El monto del pago excede el monto pendiente" }
    }

    try {
        // Crear el pago
        await prisma.commissionPayment.create({
            data: {
                commissionId,
                amount: paymentAmount,
                currency: currency || commission.currency,
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
        const newPaidAmount = Number(commission.paidAmount) + paymentAmount
        const newPendingAmount = Number(commission.amount) - newPaidAmount

        let newStatus: CommissionStatus = commission.status

        if (newPendingAmount <= 0) {
            newStatus = "PAID"
        } else if (newPaidAmount > 0) {
            newStatus = "PARTIAL"
        }

        await prisma.commission.update({
            where: { id: commissionId },
            data: {
                paidAmount: newPaidAmount,
                pendingAmount: newPendingAmount,
                status: newStatus,
                paidDate: newStatus === "PAID" ? new Date() : null,
            },
        })

        revalidatePath("/dashboard/commissions")
        revalidatePath(`/dashboard/commissions/${commissionId}`)
        return { success: "Pago registrado exitosamente" }
    } catch {
        return { error: "Error al registrar el pago" }
    }
}

// Eliminar pago de comisión
export const deleteCommissionPayment = async (paymentId: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const payment = await prisma.commissionPayment.findUnique({
        where: { id: paymentId },
        include: { Commission: true },
    })

    if (!payment || payment.Commission.tenantId !== tenantId) {
        return { error: "Pago no encontrado" }
    }

    try {
        const commission = payment.Commission
        const paymentAmount = Number(payment.amount)

        // Eliminar el pago
        await prisma.commissionPayment.delete({
            where: { id: paymentId },
        })

        // Actualizar la comisión
        const newPaidAmount = Number(commission.paidAmount) - paymentAmount
        const newPendingAmount = Number(commission.amount) - newPaidAmount

        let newStatus: CommissionStatus = "PENDING"
        if (newPaidAmount > 0 && newPendingAmount > 0) {
            newStatus = "PARTIAL"
        } else if (newPendingAmount <= 0) {
            newStatus = "PAID"
        }

        await prisma.commission.update({
            where: { id: commission.id },
            data: {
                paidAmount: newPaidAmount,
                pendingAmount: newPendingAmount,
                status: newStatus,
                paidDate: null,
            },
        })

        revalidatePath("/dashboard/commissions")
        revalidatePath(`/dashboard/commissions/${commission.id}`)
        return { success: "Pago eliminado exitosamente" }
    } catch {
        return { error: "Error al eliminar el pago" }
    }
}

// Cancelar comisión
export const cancelCommission = async (id: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const commission = await prisma.commission.findUnique({
        where: { id },
        include: { CommissionPayment: true },
    })

    if (!commission || commission.tenantId !== tenantId) {
        return { error: "Comisión no encontrada" }
    }

    if (commission.CommissionPayment.length > 0) {
        return { error: "No se puede cancelar una comisión con pagos registrados" }
    }

    try {
        await prisma.commission.update({
            where: { id },
            data: { status: "CANCELLED" },
        })

        revalidatePath("/dashboard/commissions")
        return { success: "Comisión cancelada exitosamente" }
    } catch {
        return { error: "Error al cancelar la comisión" }
    }
}

// Marcar comisiones vencidas
export const markOverdueCommissions = async () => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const today = new Date()

    try {
        const result = await prisma.commission.updateMany({
            where: {
                tenantId,
                status: { in: ["PENDING", "PARTIAL"] },
                dueDate: { lt: today },
            },
            data: { status: "OVERDUE" },
        })

        revalidatePath("/dashboard/commissions")
        return { success: `${result.count} comisiones marcadas como vencidas` }
    } catch {
        return { error: "Error al actualizar comisiones" }
    }
}

// Obtener estadísticas de comisiones
export const getCommissionStats = async (period?: { from: Date; to: Date }) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const where: any = { tenantId }

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
        prisma.commission.count({ where }),
        prisma.commission.groupBy({
            by: ["status"],
            where,
            _count: true,
            _sum: { amount: true, paidAmount: true, pendingAmount: true },
        }),
        prisma.commission.aggregate({
            where,
            _sum: { amount: true },
        }),
        prisma.commission.aggregate({
            where,
            _sum: { paidAmount: true },
        }),
        prisma.commission.aggregate({
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

// Obtener comisiones de una póliza
export const getCommissionsByPolicyId = async (policyId: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const policy = await prisma.policy.findUnique({
        where: { id: policyId },
    })

    if (!policy || policy.tenantId !== tenantId) {
        return []
    }

    const commissions = await prisma.commission.findMany({
        where: { policyId },
        include: {
            CommissionPayment: {
                orderBy: { paymentDate: "desc" },
            },
        },
        orderBy: { installment: "asc" },
    })

    return commissions
}

// Obtener pólizas activas para generar comisiones
export const getPoliciesForCommission = async () => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const policies = await prisma.policy.findMany({
        where: {
            tenantId,
            status: "ACTIVE",
        },
        select: {
            id: true,
            number: true,
            premium: true,
            currency: true,
            commission: true,
            Client: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
        },
        orderBy: { number: "asc" },
    })

    return policies.map((p) => ({
        id: p.id,
        number: p.number,
        premium: Number(p.premium),
        currency: p.currency,
        commission: Number(p.commission),
        Client: p.Client,
    }))
}

// Obtener resumen de comisiones para dashboard
export const getCommissionsDashboardSummary = async () => {
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
    ] = await Promise.all([
        // Total pendiente
        prisma.commission.aggregate({
            where: {
                tenantId,
                status: { in: ["PENDING", "PARTIAL"] },
            },
            _sum: { pendingAmount: true },
            _count: true,
        }),
        // Total vencido
        prisma.commission.aggregate({
            where: {
                tenantId,
                status: "OVERDUE",
            },
            _sum: { pendingAmount: true },
            _count: true,
        }),
        // Próximas a vencer (30 días)
        prisma.commission.findMany({
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
                        InsuranceCompany: { select: { name: true } },
                    },
                },
            },
            orderBy: { dueDate: "asc" },
            take: 5,
        }),
        // Pagos recientes
        prisma.commissionPayment.findMany({
            where: {
                Commission: { tenantId },
            },
            include: {
                Commission: {
                    include: {
                        Policy: {
                            select: { number: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
        }),
    ])

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
    }
}
