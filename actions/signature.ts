"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { SignatureDocumentType } from "@prisma/client"
import { headers } from "next/headers"
import { randomBytes } from "crypto"

const SignatureSchema = z.object({
    documentType: z.enum(["QUOTE", "POLICY", "ENDORSEMENT", "CLAIM"]),
    documentId: z.string().min(1, "ID de documento requerido"),
    signerName: z.string().min(1, "Nombre del firmante requerido"),
    signerRut: z.string().min(1, "RUT del firmante requerido"),
    signerEmail: z.string().email("Email inválido").optional().or(z.literal("")),
    signatureData: z.string().optional(), // Canvas data URL for handwritten signature
    acceptedTerms: z.boolean(),
})

export type SignatureFormValues = z.infer<typeof SignatureSchema>

// Crear firma de documento
export async function createSignature(values: SignatureFormValues) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const validatedFields = SignatureSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message }
    }

    if (!validatedFields.data.acceptedTerms) {
        return { error: "Debe aceptar los términos para firmar el documento" }
    }

    try {
        // Get IP and User Agent
        const headersList = await headers()
        const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
        const userAgent = headersList.get("user-agent") || "unknown"

        // Generate verification token
        const verificationToken = randomBytes(32).toString("hex")

        const signature = await prisma.documentSignature.create({
            data: {
                documentType: validatedFields.data.documentType as SignatureDocumentType,
                documentId: validatedFields.data.documentId,
                signerName: validatedFields.data.signerName,
                signerRut: validatedFields.data.signerRut,
                signerEmail: validatedFields.data.signerEmail || null,
                signatureData: validatedFields.data.signatureData || null,
                acceptedTerms: true,
                acceptedAt: new Date(),
                ipAddress,
                userAgent,
                verificationToken,
                tenantId,
            },
        })

        // Revalidate the appropriate path based on document type
        const pathMap: Record<string, string> = {
            QUOTE: `/dashboard/quotes/${validatedFields.data.documentId}`,
            POLICY: `/dashboard/policies/${validatedFields.data.documentId}`,
            ENDORSEMENT: `/dashboard/policies`,
            CLAIM: `/dashboard/claims/${validatedFields.data.documentId}`,
        }

        revalidatePath(pathMap[validatedFields.data.documentType] || "/dashboard")

        return { success: "Documento firmado correctamente", signatureId: signature.id }
    } catch (error) {
        console.error("Error creating signature:", error)
        return { error: "Error al firmar el documento" }
    }
}

// Obtener firma de un documento
export async function getDocumentSignature(documentType: string, documentId: string) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const signature = await prisma.documentSignature.findFirst({
        where: {
            tenantId,
            documentType: documentType as SignatureDocumentType,
            documentId,
            acceptedTerms: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    return signature
}

// Obtener todas las firmas de un documento
export async function getDocumentSignatures(documentType: string, documentId: string) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const signatures = await prisma.documentSignature.findMany({
        where: {
            tenantId,
            documentType: documentType as SignatureDocumentType,
            documentId,
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    return signatures
}

// Verificar firma por token
export async function verifySignature(token: string) {
    const signature = await prisma.documentSignature.findUnique({
        where: {
            verificationToken: token,
        },
        include: {
            Tenant: {
                select: {
                    name: true,
                    logoUrl: true,
                },
            },
        },
    })

    if (!signature) {
        return { error: "Firma no encontrada" }
    }

    return {
        success: true,
        signature: {
            id: signature.id,
            documentType: signature.documentType,
            signerName: signature.signerName,
            signerRut: signature.signerRut,
            acceptedAt: signature.acceptedAt,
            tenant: signature.Tenant,
        },
    }
}

// Crear solicitud de firma (genera link para el cliente)
export async function createSignatureRequest(documentType: string, documentId: string, clientData: {
    name: string
    rut: string
    email?: string
}) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    try {
        const verificationToken = randomBytes(32).toString("hex")

        const signatureRequest = await prisma.documentSignature.create({
            data: {
                documentType: documentType as SignatureDocumentType,
                documentId,
                signerName: clientData.name,
                signerRut: clientData.rut,
                signerEmail: clientData.email || null,
                acceptedTerms: false,
                verificationToken,
                tenantId,
            },
        })

        return {
            success: true,
            token: signatureRequest.verificationToken,
            signatureId: signatureRequest.id,
        }
    } catch (error) {
        console.error("Error creating signature request:", error)
        return { error: "Error al crear la solicitud de firma" }
    }
}

// Completar firma por token (cuando el cliente acepta)
export async function completeSignature(token: string, signatureData?: string) {
    try {
        const headersList = await headers()
        const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
        const userAgent = headersList.get("user-agent") || "unknown"

        const signature = await prisma.documentSignature.update({
            where: {
                verificationToken: token,
            },
            data: {
                acceptedTerms: true,
                acceptedAt: new Date(),
                signatureData: signatureData || null,
                ipAddress,
                userAgent,
            },
        })

        return { success: "Documento firmado correctamente", signatureId: signature.id }
    } catch (error) {
        console.error("Error completing signature:", error)
        return { error: "Error al completar la firma" }
    }
}

// Eliminar firma
export async function deleteSignature(signatureId: string) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    try {
        await prisma.documentSignature.delete({
            where: {
                id: signatureId,
                tenantId,
            },
        })

        return { success: "Firma eliminada correctamente" }
    } catch (error) {
        console.error("Error deleting signature:", error)
        return { error: "Error al eliminar la firma" }
    }
}
