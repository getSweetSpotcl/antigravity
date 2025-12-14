"use server"

import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { AuditAction } from "@prisma/client"

interface GetAuditLogsParams {
    page?: number
    limit?: number
    action?: AuditAction
    entity?: string
    userId?: string
    entityId?: string
    startDate?: Date
    endDate?: Date
    search?: string
}

export async function getAuditLogs(params: GetAuditLogsParams = {}) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { logs: [], total: 0 }
    }

    const {
        page = 1,
        limit = 50,
        action,
        entity,
        userId,
        entityId,
        startDate,
        endDate,
        search,
    } = params

    const where = {
        tenantId,
        ...(action && { action }),
        ...(entity && { entity }),
        ...(userId && { userId }),
        ...(entityId && { entityId }),
        ...(startDate && endDate && {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        }),
        ...(search && {
            OR: [
                { description: { contains: search, mode: "insensitive" as const } },
                { entityName: { contains: search, mode: "insensitive" as const } },
                { userName: { contains: search, mode: "insensitive" as const } },
                { userEmail: { contains: search, mode: "insensitive" as const } },
            ],
        }),
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.auditLog.count({ where }),
    ])

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getAuditLogById(id: string) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    return prisma.auditLog.findFirst({
        where: { id, tenantId },
    })
}

export async function getAuditLogsByEntity(entity: string, entityId: string) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    return prisma.auditLog.findMany({
        where: { tenantId, entity, entityId },
        orderBy: { createdAt: "desc" },
        take: 100,
    })
}

export async function getAuditStats() {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
        totalLogs,
        todayLogs,
        weekLogs,
        monthLogs,
        actionBreakdown,
        entityBreakdown,
        recentUsers,
    ] = await Promise.all([
        prisma.auditLog.count({ where: { tenantId } }),
        prisma.auditLog.count({ where: { tenantId, createdAt: { gte: today } } }),
        prisma.auditLog.count({ where: { tenantId, createdAt: { gte: thisWeek } } }),
        prisma.auditLog.count({ where: { tenantId, createdAt: { gte: thisMonth } } }),
        prisma.auditLog.groupBy({
            by: ["action"],
            where: { tenantId, createdAt: { gte: thisMonth } },
            _count: { action: true },
        }),
        prisma.auditLog.groupBy({
            by: ["entity"],
            where: { tenantId, createdAt: { gte: thisMonth } },
            _count: { entity: true },
        }),
        prisma.auditLog.findMany({
            where: { tenantId, userId: { not: null } },
            select: { userId: true, userName: true, userEmail: true },
            distinct: ["userId"],
            take: 10,
            orderBy: { createdAt: "desc" },
        }),
    ])

    return {
        totalLogs,
        todayLogs,
        weekLogs,
        monthLogs,
        actionBreakdown: actionBreakdown.map((a) => ({
            action: a.action,
            count: a._count.action,
        })),
        entityBreakdown: entityBreakdown.map((e) => ({
            entity: e.entity,
            count: e._count.entity,
        })),
        recentUsers,
    }
}

export async function getEntityHistory(entity: string, entityId: string) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const logs = await prisma.auditLog.findMany({
        where: { tenantId, entity, entityId },
        orderBy: { createdAt: "desc" },
        take: 50,
    })

    return logs.map((log) => ({
        id: log.id,
        action: log.action,
        description: log.description,
        userName: log.userName,
        userEmail: log.userEmail,
        oldValues: log.oldValues,
        newValues: log.newValues,
        createdAt: log.createdAt,
    }))
}

// Clean up old logs (retention policy)
export async function cleanupOldLogs(daysToKeep: number = 365) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    try {
        const result = await prisma.auditLog.deleteMany({
            where: {
                tenantId,
                createdAt: { lt: cutoffDate },
            },
        })

        return { success: true, deleted: result.count }
    } catch (error) {
        console.error("Error cleaning up audit logs:", error)
        return { error: "Error al limpiar logs" }
    }
}

// Get available entities and actions for filters
export async function getAuditFilterOptions() {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { entities: [], actions: [] }
    }

    const [entities, users] = await Promise.all([
        prisma.auditLog.findMany({
            where: { tenantId },
            select: { entity: true },
            distinct: ["entity"],
        }),
        prisma.auditLog.findMany({
            where: { tenantId, userId: { not: null } },
            select: { userId: true, userName: true },
            distinct: ["userId"],
        }),
    ])

    return {
        entities: entities.map((e) => e.entity),
        actions: [
            "CREATE",
            "UPDATE",
            "DELETE",
            "LOGIN",
            "LOGOUT",
            "VIEW",
            "EXPORT",
            "UPLOAD",
            "DOWNLOAD",
            "SIGN",
        ],
        users: users.filter((u) => u.userId).map((u) => ({
            id: u.userId!,
            name: u.userName,
        })),
    }
}
