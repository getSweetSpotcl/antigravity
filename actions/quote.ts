"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { QuoteSchema, CommunicationSchema } from "@/schemas/quote"
import { getTenantContext } from "@/lib/tenant-context"

// Obtener compañías de seguros
export const getInsuranceCompanies = async () => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        throw new Error("No autorizado")
    }

    const companies = await prisma.insuranceCompany.findMany({
        where: {
            tenantId: tenantId,
        },
        orderBy: {
            name: "asc",
        },
    })

    return companies
}

// Obtener cotizaciones - Force Recompile
// Obtener cotizaciones - Force Recompile
export const getQuotes = async () => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        throw new Error("No autorizado")
    }

    const quotes = await prisma.quote.findMany({
        where: {
            tenantId: tenantId,
        },
        include: {
            client: true,
            company: true,
            tenant: true,
            attachments: {
                orderBy: {
                    createdAt: "desc",
                },
            },
            communications: {
                orderBy: {
                    createdAt: "desc",
                },
                take: 5,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    return quotes
}

// Obtener una cotización específica
export const getQuoteById = async (id: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        throw new Error("No autorizado")
    }

    const quote = await prisma.quote.findUnique({
        where: { id },
        include: {
            client: true,
            company: true,
            attachments: {
                orderBy: {
                    createdAt: "desc",
                },
            },
            communications: {
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    })

    if (!quote || quote.tenantId !== tenantId) {
        throw new Error("Cotización no encontrada")
    }

    return quote
}

// Crear cotización
export const createQuote = async (values: z.infer<typeof QuoteSchema>) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const validatedFields = QuoteSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Datos inválidos" }
    }

    const {
        quoteNumber,
        clientId,
        prospectName,
        contractorName,
        contractorRut,
        contractorEmail,
        contractorPhone,
        sameAsContractor,
        insuredName,
        insuredRut,
        insuredAddress,
        beneficiaryName,
        beneficiaryRut,
        beneficiaryType,
        companyId,
        customCompanyName,
        insuranceLine,
        policyType,
        propertyDetails,
        vehicleDetails,
        lifeInsuranceDetails,
        guaranteeDetails,
        liabilityDetails,
        transportDetails,
        engineeringDetails,
        useCustomPropertyDetails,
        customPropertyDetails,
        coverages,
        totalInsuredAmount,
        totalPremium,
        currency,
        validFrom,
        validUntil,
        policyDuration,
        notes,
        internalNotes,
    } = validatedFields.data

    try {
        // Manejar creación de compañía personalizada
        let finalCompanyId = companyId
        if (companyId === "OTHER" && customCompanyName) {
            const existingCompany = await prisma.insuranceCompany.findFirst({
                where: {
                    name: { equals: customCompanyName, mode: 'insensitive' },
                    tenantId: tenantId
                }
            })

            if (existingCompany) {
                finalCompanyId = existingCompany.id
            } else {
                const newCompany = await prisma.insuranceCompany.create({
                    data: {
                        name: customCompanyName,
                        tenantId: tenantId,
                        rut: 'S/I', // Sin Información por ahora
                        contact: 'S/I',
                        email: 'S/I',
                        phone: 'S/I'
                    }
                })
                finalCompanyId = newCompany.id
            }
        }

        // Construir el objeto de detalles del bien asegurado
        let insuredProperty: any = {}

        if (useCustomPropertyDetails && customPropertyDetails) {
            insuredProperty = { description: customPropertyDetails, type: "CUSTOM" }
        } else if (propertyDetails) {
            insuredProperty = propertyDetails
        } else if (vehicleDetails) {
            insuredProperty = vehicleDetails
        } else if (lifeInsuranceDetails) {
            insuredProperty = lifeInsuranceDetails
        } else if (guaranteeDetails) {
            insuredProperty = guaranteeDetails
        } else if (liabilityDetails) {
            insuredProperty = liabilityDetails
        } else if (transportDetails) {
            insuredProperty = transportDetails
        } else if (engineeringDetails) {
            insuredProperty = engineeringDetails
        }

        // Generar número de cotización si no existe
        const generatedQuoteNumber = quoteNumber || `COT-${Date.now()}`

        await prisma.quote.create({
            data: {
                quoteNumber: generatedQuoteNumber,
                prospectName: prospectName || null,
                clientId: clientId || null,
                contractorName,
                contractorRut,
                contractorEmail: contractorEmail || null,
                contractorPhone: contractorPhone || null,
                insuredName: sameAsContractor ? contractorName : (insuredName || null),
                insuredRut: sameAsContractor ? contractorRut : (insuredRut || null),
                insuredAddress: insuredAddress || null,
                beneficiaryName: beneficiaryName || null,
                beneficiaryRut: beneficiaryRut || null,
                beneficiaryType: beneficiaryType || null,
                companyId: finalCompanyId,
                policyType,
                insuredProperty: insuredProperty as any,
                coverages: coverages as any,
                totalInsuredAmount: totalInsuredAmount ? parseFloat(totalInsuredAmount) : null,
                totalPremium: parseFloat(totalPremium),
                currency,
                validFrom: validFrom || null,
                validUntil,
                policyDuration: policyDuration ? parseInt(policyDuration) : null,
                notes: notes || null,
                internalNotes: internalNotes || null,
                status: "DRAFT",
                tenantId: tenantId,
            },
        })

        revalidatePath("/dashboard/quotes")
        return { success: "Cotización creada exitosamente", quoteNumber: generatedQuoteNumber }
    } catch (error) {
        console.error("Error creating quote:", error)
        return { error: "Error al crear la cotización" }
    }
}

// Actualizar estado de cotización
export const updateQuoteStatus = async (
    id: string,
    status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED"
) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    try {
        const quote = await prisma.quote.findUnique({
            where: { id },
        })

        if (!quote || quote.tenantId !== tenantId) {
            return { error: "Cotización no encontrada" }
        }

        await prisma.quote.update({
            where: { id },
            data: { status },
        })

        revalidatePath("/dashboard/quotes")
        return { success: "Estado actualizado" }
    } catch (error) {
        console.error("Error updating quote status:", error)
        return { error: "Error al actualizar el estado" }
    }
}

// Eliminar cotización
export const deleteQuote = async (id: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    try {
        const quote = await prisma.quote.findUnique({
            where: { id },
        })

        if (!quote || quote.tenantId !== tenantId) {
            return { error: "Cotización no encontrada" }
        }

        await prisma.quote.delete({
            where: { id },
        })

        revalidatePath("/dashboard/quotes")
        return { success: "Cotización eliminada" }
    } catch (error) {
        console.error("Error deleting quote:", error)
        return { error: "Error al eliminar la cotización" }
    }
}

// Agregar comunicación
export const addCommunication = async (values: z.infer<typeof CommunicationSchema>) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const validatedFields = CommunicationSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Datos inválidos" }
    }

    const { quoteId, type, subject, content, contactPerson } = validatedFields.data

    try {
        // Verificar que la cotización pertenece al tenant
        const quote = await prisma.quote.findUnique({
            where: { id: quoteId },
        })

        if (!quote || quote.tenantId !== tenantId) {
            return { error: "Cotización no encontrada" }
        }

        await prisma.quoteCommunication.create({
            data: {
                quoteId,
                type,
                subject: subject || null,
                content,
                contactPerson: contactPerson || null,
            },
        })

        revalidatePath(`/dashboard/quotes/${quoteId}`)
        return { success: "Comunicación registrada" }
    } catch (error) {
        console.error("Error adding communication:", error)
        return { error: "Error al registrar la comunicación" }
    }
}

// Agregar archivo adjunto
export const addAttachment = async (
    quoteId: string,
    fileName: string,
    fileUrl: string,
    fileType: string,
    fileSize: number,
    description?: string
) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

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
                fileName,
                fileUrl,
                fileType,
                fileSize,
                description: description || null,
            },
        })

        revalidatePath(`/dashboard/quotes/${quoteId}`)
        return { success: "Archivo adjuntado exitosamente" }
    } catch (error) {
        console.error("Error adding attachment:", error)
        return { error: "Error al adjuntar el archivo" }
    }
}

// Eliminar archivo adjunto
export const deleteAttachment = async (attachmentId: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    try {
        const attachment = await prisma.quoteAttachment.findUnique({
            where: { id: attachmentId },
            include: {
                quote: true,
            },
        })

        if (!attachment || attachment.quote.tenantId !== tenantId) {
            return { error: "Archivo no encontrado" }
        }

        await prisma.quoteAttachment.delete({
            where: { id: attachmentId },
        })

        revalidatePath(`/dashboard/quotes/${attachment.quoteId}`)
        return { success: "Archivo eliminado" }
    } catch (error) {
        console.error("Error deleting attachment:", error)
        return { error: "Error al eliminar el archivo" }
    }
}

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

    if (!tenantId) {
        return { error: "No autorizado" }
    }

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
        console.error("Error adding attachment:", error)
        return { error: "Error al guardar el archivo" }
    }
}
