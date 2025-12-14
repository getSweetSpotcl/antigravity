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
            Client: true,
            InsuranceCompany: true,
            Tenant: true,
            Agent: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            QuoteAttachment: {
                orderBy: {
                    createdAt: "desc",
                },
            },
            QuoteCommunication: {
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
            Client: true,
            InsuranceCompany: true,
            Tenant: true,
            Agent: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    defaultCommissionPercentage: true,
                },
            },
            QuoteAttachment: {
                orderBy: {
                    createdAt: "desc",
                },
            },
            QuoteCommunication: {
                include: {
                    CommunicationAttachment: {
                        orderBy: {
                            createdAt: "desc",
                        },
                    },
                },
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
        agentId,
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
        const generateQuoteNumber = () => {
            const date = new Date()
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
            return `COT-${year}${month}${day}-${random}`
        }
        const generatedQuoteNumber = quoteNumber || generateQuoteNumber()

        await prisma.quote.create({
            data: {
                quoteNumber: generatedQuoteNumber,
                prospectName: prospectName || null,
                clientId: clientId || null,
                agentId: agentId || null,
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

// Actualizar cotización completa
export const updateQuote = async (id: string, values: z.infer<typeof QuoteSchema>) => {
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
        agentId,
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
        const existingQuote = await prisma.quote.findUnique({
            where: { id },
        })

        if (!existingQuote || existingQuote.tenantId !== tenantId) {
            return { error: "Cotización no encontrada" }
        }

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
                        rut: 'S/I',
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

        await prisma.quote.update({
            where: { id },
            data: {
                quoteNumber: quoteNumber || existingQuote.quoteNumber,
                prospectName: prospectName || null,
                clientId: clientId || null,
                agentId: agentId || null,
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
            },
        })

        revalidatePath("/dashboard/quotes")
        revalidatePath(`/dashboard/quotes/${id}`)
        return { success: "Cotización actualizada exitosamente" }
    } catch (error) {
        console.error("Error updating quote:", error)
        return { error: "Error al actualizar la cotización" }
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
                Quote: true,
            },
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
        console.error("Error deleting attachment:", error)
        return { error: "Error al eliminar el archivo" }
    }
}

// Crear póliza desde cotización
export const createPolicyFromQuote = async (quoteId: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    try {
        const quote = await prisma.quote.findUnique({
            where: { id: quoteId },
            include: {
                Client: true,
                InsuranceCompany: true,
                Policy: true,
            },
        })

        if (!quote || quote.tenantId !== tenantId) {
            return { error: "Cotización no encontrada" }
        }

        // Verificar que la cotización tenga un cliente asociado
        if (!quote.clientId) {
            return { error: "La cotización debe tener un cliente asociado para crear una póliza. Edita la cotización y selecciona un cliente existente." }
        }

        // Verificar que no exista ya una póliza para esta cotización
        if (quote.Policy) {
            return { error: "Ya existe una póliza asociada a esta cotización" }
        }

        // Generar número de póliza
        const generatePolicyNumber = () => {
            const date = new Date()
            const year = date.getFullYear()
            const random = String(Math.floor(Math.random() * 100000)).padStart(5, '0')
            return `POL-${year}-${random}`
        }

        // Calcular fecha de fin basada en duración
        const startDate = quote.validFrom || new Date()
        const durationMonths = quote.policyDuration || 12
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + durationMonths)

        // Calcular comisión
        const commissionPercentage = quote.commissionPercentage ? Number(quote.commissionPercentage) : 0
        const commission = Number(quote.totalPremium) * (commissionPercentage / 100)

        // Crear la póliza
        const policy = await prisma.policy.create({
            data: {
                number: generatePolicyNumber(),
                company: quote.InsuranceCompany?.name || "Sin compañía",
                companyId: quote.companyId,
                agentId: quote.agentId,
                type: quote.policyType,
                status: "ACTIVE",
                startDate: startDate,
                endDate: endDate,
                premium: Number(quote.totalPremium),
                commission: commission,
                currency: quote.currency,
                clientId: quote.clientId,
                tenantId: tenantId,
                quoteId: quote.id,
                coverages: quote.coverages as any,
                insuredProperty: quote.insuredProperty as any,
            },
        })

        // Actualizar estado de la cotización a ACCEPTED
        await prisma.quote.update({
            where: { id: quoteId },
            data: { status: "ACCEPTED" },
        })

        revalidatePath("/dashboard/quotes")
        revalidatePath(`/dashboard/quotes/${quoteId}`)
        revalidatePath("/dashboard/policies")

        return {
            success: `Póliza ${policy.number} creada exitosamente`,
            policyId: policy.id,
            policyNumber: policy.number
        }
    } catch (error) {
        console.error("Error creating policy from quote:", error)
        return { error: "Error al crear la póliza" }
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
