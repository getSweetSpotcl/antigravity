"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getPortalSession, getClientIdsByRut } from "@/actions/portal-auth"
import { getTenantContext } from "@/lib/tenant-context"
import { sendEmail, generateBrokerMessageEmail } from "@/lib/email"
import { auth } from "@/lib/auth"

const MessageSchema = z.object({
    subject: z.string().min(1, "Asunto requerido"),
    content: z.string().min(1, "Mensaje requerido"),
    policyId: z.string().optional(),
    claimId: z.string().optional(),
    tenantId: z.string().optional(), // Multi-corredor: tenant al que enviar mensaje
})

export type MessageFormValues = z.infer<typeof MessageSchema>

// Obtener mensajes del cliente (multi-corredor)
export async function getPortalMessages() {
    const session = await getPortalSession()

    if (!session) {
        return []
    }

    // Multi-corredor: obtener los IDs de todos los tenants del usuario
    const tenantIds = session.tenants.map(t => t.id)

    const messages = await prisma.portalMessage.findMany({
        where: {
            OR: [
                { clientUserId: session.user.id },
                {
                    tenantId: { in: tenantIds },
                    clientUserId: null,
                    // Mensajes enviados al cliente por los corredores
                },
            ],
        },
        orderBy: { createdAt: "desc" },
        include: {
            MessageAttachment: true,
        },
    })

    // Enriquecer mensajes con información del tenant
    const messagesWithTenant = await Promise.all(
        messages.map(async (message) => {
            const tenant = session.tenants.find(t => t.id === message.tenantId)
            return {
                ...message,
                attachments: message.MessageAttachment,
                tenantName: tenant?.name || "Corredor",
            }
        })
    )

    return messagesWithTenant
}

// Obtener mensajes no leídos
export async function getUnreadMessagesCount() {
    const session = await getPortalSession()

    if (!session) {
        return 0
    }

    const count = await prisma.portalMessage.count({
        where: {
            clientUserId: session.user.id,
            isFromClient: false,
            isRead: false,
        },
    })

    return count
}

// Enviar mensaje al corredor (multi-corredor)
export async function sendPortalMessage(values: MessageFormValues) {
    const session = await getPortalSession()

    if (!session) {
        return { error: "No autorizado" }
    }

    const validatedFields = MessageSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message }
    }

    const { subject, content, policyId, claimId, tenantId: selectedTenantId } = validatedFields.data

    // Multi-corredor: obtener todos los clientIds del usuario
    const clientIds = await getClientIdsByRut(session.user.rut)

    let targetTenantId: string

    // Si se especifica póliza, verificar y usar ese tenant
    if (policyId) {
        const policy = await prisma.policy.findFirst({
            where: {
                id: policyId,
                clientId: { in: clientIds },
            },
        })
        if (!policy) {
            return { error: "Póliza no válida" }
        }
        targetTenantId = policy.tenantId
    }
    // Si se especifica siniestro, verificar y usar ese tenant
    else if (claimId) {
        const claim = await prisma.claim.findFirst({
            where: {
                id: claimId,
                Policy: { clientId: { in: clientIds } },
            },
        })
        if (!claim) {
            return { error: "Siniestro no válido" }
        }
        targetTenantId = claim.tenantId
    }
    // Si se especifica tenant directamente, verificar que el usuario tiene acceso
    else if (selectedTenantId) {
        const validTenant = session.tenants.find(t => t.id === selectedTenantId)
        if (!validTenant) {
            return { error: "Corredor no válido" }
        }
        targetTenantId = selectedTenantId
    }
    // Usar el tenant principal por defecto
    else {
        targetTenantId = session.primaryTenant.id
    }

    try {
        await prisma.portalMessage.create({
            data: {
                clientUserId: session.user.id,
                tenantId: targetTenantId,
                subject,
                content,
                policyId: policyId || null,
                claimId: claimId || null,
                isFromClient: true,
            },
        })

        revalidatePath("/portal/messages")

        return { success: "Mensaje enviado exitosamente" }
    } catch {
        return { error: "Error al enviar el mensaje" }
    }
}

// Marcar mensaje como leído
export async function markMessageAsRead(messageId: string) {
    const session = await getPortalSession()

    if (!session) {
        return { error: "No autorizado" }
    }

    const message = await prisma.portalMessage.findFirst({
        where: {
            id: messageId,
            clientUserId: session.user.id,
        },
    })

    if (!message) {
        return { error: "Mensaje no encontrado" }
    }

    if (!message.isRead) {
        await prisma.portalMessage.update({
            where: { id: messageId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        })
    }

    revalidatePath("/portal/messages")

    return { success: true }
}

// Marcar todos los mensajes como leídos
export async function markAllMessagesAsRead() {
    const session = await getPortalSession()

    if (!session) {
        return { error: "No autorizado" }
    }

    await prisma.portalMessage.updateMany({
        where: {
            clientUserId: session.user.id,
            isFromClient: false,
            isRead: false,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    })

    revalidatePath("/portal/messages")

    return { success: true }
}

// Schema para mensaje del corredor al cliente
const BrokerMessageSchema = z.object({
    clientUserId: z.string(),
    subject: z.string().min(1, "Asunto requerido"),
    content: z.string().min(1, "Mensaje requerido"),
    policyId: z.string().optional(),
    claimId: z.string().optional(),
})

export type BrokerMessageFormValues = z.infer<typeof BrokerMessageSchema>

// Enviar mensaje del corredor al cliente (con notificación por email)
export async function sendBrokerMessage(values: BrokerMessageFormValues) {
    const tenantId = await getTenantContext()
    const session = await auth()

    if (!tenantId || !session?.user) {
        return { error: "No autorizado" }
    }

    const validatedFields = BrokerMessageSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message }
    }

    const { clientUserId, subject, content, policyId, claimId } = validatedFields.data

    // Verificar que el clientUser pertenece a un cliente del tenant actual
    const clientUser = await prisma.clientUser.findUnique({
        where: { id: clientUserId },
        include: {
            Client: {
                include: { Tenant: true },
            },
        },
    })

    if (!clientUser || clientUser.Client.tenantId !== tenantId) {
        return { error: "Cliente no encontrado" }
    }

    // Obtener información del tenant para el email
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
    })

    if (!tenant) {
        return { error: "Tenant no encontrado" }
    }

    try {
        // Crear el mensaje
        await prisma.portalMessage.create({
            data: {
                clientUserId,
                tenantId,
                subject,
                content,
                policyId: policyId || null,
                claimId: claimId || null,
                isFromClient: false,
            },
        })

        // Enviar notificación por email al cliente
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
        const portalUrl = `${baseUrl}/portal/messages`

        await sendEmail({
            to: clientUser.email,
            subject: `Nuevo mensaje de ${tenant.name}: ${subject}`,
            html: generateBrokerMessageEmail({
                clientName: `${clientUser.Client.firstName} ${clientUser.Client.lastName}`,
                brokerageName: tenant.name,
                brokerName: session.user.name || "Tu corredor",
                subject,
                message: content,
                portalUrl,
            }),
        })

        revalidatePath("/dashboard/clients")

        return { success: "Mensaje enviado exitosamente" }
    } catch (error) {
        console.error("Error sending broker message:", error)
        return { error: "Error al enviar el mensaje" }
    }
}

// Obtener mensajes de un cliente específico (para el corredor)
export async function getClientMessages(clientUserId: string) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const messages = await prisma.portalMessage.findMany({
        where: {
            clientUserId,
            tenantId,
        },
        orderBy: { createdAt: "desc" },
        include: {
            MessageAttachment: true,
        },
    })

    return messages
}
