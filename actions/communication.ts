"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Schema de validación
const CommunicationSchema = z.object({
    type: z.enum(["call", "email", "meeting", "note"]),
    subject: z.string().optional(),
    content: z.string().min(1, "El contenido es requerido"),
    contactPerson: z.string().optional(),
})

export type CommunicationFormData = z.infer<typeof CommunicationSchema>

/**
 * Agregar una nueva comunicación a una cotización
 */
export async function addQuoteCommunication(
    quoteId: string,
    data: CommunicationFormData
) {
    try {
        const validatedData = CommunicationSchema.parse(data)

        const communication = await prisma.quoteCommunication.create({
            data: {
                quoteId,
                ...validatedData,
            },
        })

        revalidatePath(`/dashboard/quotes/${quoteId}`)
        return { success: true, communication }
    } catch (error) {
        console.error("Error adding communication:", error)
        return { error: "Error al agregar la comunicación" }
    }
}

/**
 * Agregar archivo adjunto a una comunicación
 */
export async function addCommunicationAttachment(
    communicationId: string,
    fileData: {
        url: string
        name: string
        size: number
        type: string
    }
) {
    try {
        const attachment = await prisma.communicationAttachment.create({
            data: {
                communicationId,
                fileName: fileData.name,
                fileUrl: fileData.url,
                fileType: fileData.type,
                fileSize: fileData.size,
            },
        })

        // Revalidar la página de la cotización
        const communication = await prisma.quoteCommunication.findUnique({
            where: { id: communicationId },
            select: { quoteId: true },
        })

        if (communication) {
            revalidatePath(`/dashboard/quotes/${communication.quoteId}`)
        }

        return { success: true, attachment }
    } catch (error) {
        console.error("Error adding communication attachment:", error)
        return { error: "Error al agregar el archivo adjunto" }
    }
}

/**
 * Eliminar archivo adjunto de una comunicación
 */
export async function deleteCommunicationAttachment(attachmentId: string) {
    try {
        // Obtener información antes de eliminar
        const attachment = await prisma.communicationAttachment.findUnique({
            where: { id: attachmentId },
            include: {
                QuoteCommunication: {
                    select: { quoteId: true },
                },
            },
        })

        if (!attachment) {
            return { error: "Archivo no encontrado" }
        }

        await prisma.communicationAttachment.delete({
            where: { id: attachmentId },
        })

        revalidatePath(`/dashboard/quotes/${attachment.QuoteCommunication.quoteId}`)
        return { success: true }
    } catch (error) {
        console.error("Error deleting communication attachment:", error)
        return { error: "Error al eliminar el archivo" }
    }
}

/**
 * Obtener todas las comunicaciones de una cotización
 */
export async function getQuoteCommunications(quoteId: string) {
    try {
        const communications = await prisma.quoteCommunication.findMany({
            where: { quoteId },
            include: {
                CommunicationAttachment: {
                    orderBy: { createdAt: "desc" },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        return { success: true, communications }
    } catch (error) {
        console.error("Error fetching communications:", error)
        return { error: "Error al obtener las comunicaciones" }
    }
}

/**
 * Actualizar una comunicación existente
 */
export async function updateQuoteCommunication(
    communicationId: string,
    data: CommunicationFormData
) {
    try {
        const validatedData = CommunicationSchema.parse(data)

        const communication = await prisma.quoteCommunication.update({
            where: { id: communicationId },
            data: validatedData,
        })

        // Obtener quoteId para revalidar
        const comm = await prisma.quoteCommunication.findUnique({
            where: { id: communicationId },
            select: { quoteId: true },
        })

        if (comm) {
            revalidatePath(`/dashboard/quotes/${comm.quoteId}`)
        }

        return { success: true, communication }
    } catch (error) {
        console.error("Error updating communication:", error)
        return { error: "Error al actualizar la comunicación" }
    }
}

/**
 * Eliminar una comunicación
 */
export async function deleteQuoteCommunication(communicationId: string) {
    try {
        // Obtener información antes de eliminar
        const communication = await prisma.quoteCommunication.findUnique({
            where: { id: communicationId },
            select: { quoteId: true },
        })

        if (!communication) {
            return { error: "Comunicación no encontrada" }
        }

        await prisma.quoteCommunication.delete({
            where: { id: communicationId },
        })

        revalidatePath(`/dashboard/quotes/${communication.quoteId}`)
        return { success: true }
    } catch (error) {
        console.error("Error deleting communication:", error)
        return { error: "Error al eliminar la comunicación" }
    }
}
