import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import type { AuditAction, Prisma } from "@prisma/client"

interface AuditLogInput {
    tenantId: string
    action: AuditAction
    entity: string
    entityId?: string
    entityName?: string
    description?: string
    oldValues?: Record<string, unknown>
    newValues?: Record<string, unknown>
    metadata?: Record<string, unknown>
}

// Get current user info from session
async function getCurrentUser() {
    try {
        const session = await auth()
        if (session?.user) {
            return {
                userId: session.user.id,
                userName: session.user.name || null,
                userEmail: session.user.email || null,
                userRole: session.user.role || null,
            }
        }
    } catch {
        // Session not available (e.g., in cron jobs)
    }
    return null
}

// Get request info from headers
async function getRequestInfo() {
    try {
        const headersList = await headers()
        return {
            ipAddress: headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || null,
            userAgent: headersList.get("user-agent") || null,
            requestPath: headersList.get("x-invoke-path") || null,
            requestMethod: headersList.get("x-invoke-method") || null,
        }
    } catch {
        // Headers not available
    }
    return {}
}

// Main audit logging function
export async function logAudit(input: AuditLogInput) {
    try {
        const user = await getCurrentUser()
        const requestInfo = await getRequestInfo()

        await prisma.auditLog.create({
            data: {
                tenantId: input.tenantId,
                action: input.action,
                entity: input.entity,
                entityId: input.entityId,
                entityName: input.entityName,
                description: input.description,
                oldValues: input.oldValues as Prisma.InputJsonValue,
                newValues: input.newValues as Prisma.InputJsonValue,
                metadata: input.metadata as Prisma.InputJsonValue,
                userId: user?.userId,
                userName: user?.userName,
                userEmail: user?.userEmail,
                userRole: user?.userRole,
                ...requestInfo,
            },
        })
    } catch (error) {
        // Don't throw - audit logging should not break the main flow
        console.error("Error logging audit:", error)
    }
}

// Convenience functions for common actions

export async function logCreate(
    tenantId: string,
    entity: string,
    entityId: string,
    entityName?: string,
    newValues?: Record<string, unknown>
) {
    await logAudit({
        tenantId,
        action: "CREATE",
        entity,
        entityId,
        entityName,
        description: `Creó ${entity.toLowerCase()}: ${entityName || entityId}`,
        newValues,
    })
}

export async function logUpdate(
    tenantId: string,
    entity: string,
    entityId: string,
    entityName?: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>
) {
    await logAudit({
        tenantId,
        action: "UPDATE",
        entity,
        entityId,
        entityName,
        description: `Actualizó ${entity.toLowerCase()}: ${entityName || entityId}`,
        oldValues,
        newValues,
    })
}

export async function logDelete(
    tenantId: string,
    entity: string,
    entityId: string,
    entityName?: string,
    oldValues?: Record<string, unknown>
) {
    await logAudit({
        tenantId,
        action: "DELETE",
        entity,
        entityId,
        entityName,
        description: `Eliminó ${entity.toLowerCase()}: ${entityName || entityId}`,
        oldValues,
    })
}

export async function logLogin(tenantId: string, userEmail: string) {
    await logAudit({
        tenantId,
        action: "LOGIN",
        entity: "User",
        description: `Inicio de sesión: ${userEmail}`,
        metadata: { email: userEmail },
    })
}

export async function logLogout(tenantId: string, userEmail: string) {
    await logAudit({
        tenantId,
        action: "LOGOUT",
        entity: "User",
        description: `Cierre de sesión: ${userEmail}`,
        metadata: { email: userEmail },
    })
}

export async function logExport(
    tenantId: string,
    entity: string,
    format: string,
    filters?: Record<string, unknown>
) {
    await logAudit({
        tenantId,
        action: "EXPORT",
        entity,
        description: `Exportó ${entity.toLowerCase()} en formato ${format}`,
        metadata: { format, filters },
    })
}

export async function logView(
    tenantId: string,
    entity: string,
    entityId: string,
    entityName?: string
) {
    await logAudit({
        tenantId,
        action: "VIEW",
        entity,
        entityId,
        entityName,
        description: `Visualizó ${entity.toLowerCase()}: ${entityName || entityId}`,
    })
}

export async function logUpload(
    tenantId: string,
    entity: string,
    entityId: string,
    fileName: string
) {
    await logAudit({
        tenantId,
        action: "UPLOAD",
        entity,
        entityId,
        description: `Subió archivo: ${fileName}`,
        metadata: { fileName },
    })
}

export async function logDownload(
    tenantId: string,
    entity: string,
    entityId: string,
    fileName: string
) {
    await logAudit({
        tenantId,
        action: "DOWNLOAD",
        entity,
        entityId,
        description: `Descargó: ${fileName}`,
        metadata: { fileName },
    })
}

export async function logSign(
    tenantId: string,
    entity: string,
    entityId: string,
    signerName: string
) {
    await logAudit({
        tenantId,
        action: "SIGN",
        entity,
        entityId,
        description: `Documento firmado por: ${signerName}`,
        metadata: { signerName },
    })
}

// Helper to calculate changes between old and new values
export function calculateChanges(
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>
): { changed: Record<string, { old: unknown; new: unknown }> } {
    const changed: Record<string, { old: unknown; new: unknown }> = {}

    for (const key of Object.keys(newValues)) {
        if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
            changed[key] = {
                old: oldValues[key],
                new: newValues[key],
            }
        }
    }

    return { changed }
}
