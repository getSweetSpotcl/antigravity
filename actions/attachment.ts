"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// --- QUOTES ---

export const addQuoteAttachment = async (
    quoteId: string,
    fileData: {
        url: string
        name: string
        size: number
        type: string
    }
) => {
    const tenantId = await getTenantContext()
    if (!tenantId) return { error: "No autorizado" }

    try {
        const quote = await prisma.quote.findUnique({
            where: { id: quoteId },
        })

        if (!quote || quote.tenantId !== tenantId) {
            return { error: "Cotización no encontrada" }
        }

        await prisma.quoteAttachment.create({
            data: {
                quoteId,
                fileUrl: fileData.url,
                fileName: fileData.name,
                fileSize: fileData.size,
                fileType: fileData.type,
            },
        })

        revalidatePath(`/dashboard/quotes/${quoteId}`)
        return { success: "Archivo adjuntado correctamente" }
    } catch (error) {
        console.error("Error adding quote attachment:", error)
        return { error: "Error al guardar el archivo" }
    }
}

export const deleteQuoteAttachment = async (attachmentId: string) => {
    const tenantId = await getTenantContext()
    if (!tenantId) return { error: "No autorizado" }

    try {
        const attachment = await prisma.quoteAttachment.findUnique({
            where: { id: attachmentId },
            include: { Quote: true },
        })

        if (!attachment || attachment.Quote.tenantId !== tenantId) {
            return { error: "Archivo no encontrado" }
        }

        await prisma.quoteAttachment.delete({
            where: { id: attachmentId },
        })

        revalidatePath(`/dashboard/quotes/${attachment.quoteId}`)
        return { success: "Archivo eliminado" }
    } catch (error) {
        console.error("Error deleting quote attachment:", error)
        return { error: "Error al eliminar el archivo" }
    }
}

// --- POLICIES ---

export const addPolicyAttachment = async (
    policyId: string,
    fileData: {
        url: string
        name: string
        size: number
        type: string
    }
) => {
    const tenantId = await getTenantContext()
    if (!tenantId) return { error: "No autorizado" }

    try {
        const policy = await prisma.policy.findUnique({
            where: { id: policyId },
        })

        if (!policy || policy.tenantId !== tenantId) {
            return { error: "Póliza no encontrada" }
        }

        await prisma.policyAttachment.create({
            data: {
                policyId,
                fileUrl: fileData.url,
                fileName: fileData.name,
                fileSize: fileData.size,
                fileType: fileData.type,
            },
        })

        revalidatePath(`/dashboard/policies/${policyId}`)
        return { success: "Archivo adjuntado correctamente" }
    } catch (error) {
        console.error("Error adding policy attachment:", error)
        return { error: "Error al guardar el archivo" }
    }
}

export const deletePolicyAttachment = async (attachmentId: string) => {
    const tenantId = await getTenantContext()
    if (!tenantId) return { error: "No autorizado" }

    try {
        const attachment = await prisma.policyAttachment.findUnique({
            where: { id: attachmentId },
            include: { Policy: true },
        })

        if (!attachment || attachment.Policy.tenantId !== tenantId) {
            return { error: "Archivo no encontrado" }
        }

        await prisma.policyAttachment.delete({
            where: { id: attachmentId },
        })

        revalidatePath(`/dashboard/policies/${attachment.policyId}`)
        return { success: "Archivo eliminado" }
    } catch (error) {
        console.error("Error deleting policy attachment:", error)
        return { error: "Error al eliminar el archivo" }
    }
}

// --- CLAIMS ---

export const addClaimAttachment = async (
    claimId: string,
    fileData: {
        url: string
        name: string
        size: number
        type: string
    }
) => {
    const tenantId = await getTenantContext()
    if (!tenantId) return { error: "No autorizado" }

    try {
        const claim = await prisma.claim.findUnique({
            where: { id: claimId },
        })

        if (!claim || claim.tenantId !== tenantId) {
            return { error: "Siniestro no encontrado" }
        }

        await prisma.claimAttachment.create({
            data: {
                claimId,
                fileUrl: fileData.url,
                fileName: fileData.name,
                fileSize: fileData.size,
                fileType: fileData.type,
            },
        })

        revalidatePath(`/dashboard/claims/${claimId}`)
        return { success: "Archivo adjuntado correctamente" }
    } catch (error) {
        console.error("Error adding claim attachment:", error)
        return { error: "Error al guardar el archivo" }
    }
}

export const deleteClaimAttachment = async (attachmentId: string) => {
    const tenantId = await getTenantContext()
    if (!tenantId) return { error: "No autorizado" }

    try {
        const attachment = await prisma.claimAttachment.findUnique({
            where: { id: attachmentId },
            include: { Claim: true },
        })

        if (!attachment || attachment.Claim.tenantId !== tenantId) {
            return { error: "Archivo no encontrado" }
        }

        await prisma.claimAttachment.delete({
            where: { id: attachmentId },
        })

        revalidatePath(`/dashboard/claims/${attachment.claimId}`)
        return { success: "Archivo eliminado" }
    } catch (error) {
        console.error("Error deleting claim attachment:", error)
        return { error: "Error al eliminar el archivo" }
    }
}
