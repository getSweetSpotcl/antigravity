"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

const BrandingSchema = z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido").optional(),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido").optional(),
    footerText: z.string().max(500, "Máximo 500 caracteres").optional(),
    legalName: z.string().max(200).optional(),
    fantasyName: z.string().max(200).optional(),
    cmfRegistration: z.string().max(100).optional(),
    phone: z.string().max(50).optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    address: z.string().max(300).optional(),
    website: z.string().url("URL inválida").optional().or(z.literal("")),
})

export type BrandingFormValues = z.infer<typeof BrandingSchema>

// Obtener configuración de branding
export async function getBrandingSettings() {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
            id: true,
            name: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
            signatureUrl: true,
            footerText: true,
            legalName: true,
            fantasyName: true,
            cmfRegistration: true,
            phone: true,
            email: true,
            address: true,
            website: true,
        },
    })

    return tenant
}

// Actualizar configuración de branding
export async function updateBrandingSettings(values: BrandingFormValues) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const validatedFields = BrandingSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message }
    }

    try {
        await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                primaryColor: validatedFields.data.primaryColor || null,
                secondaryColor: validatedFields.data.secondaryColor || null,
                footerText: validatedFields.data.footerText || null,
                legalName: validatedFields.data.legalName || null,
                fantasyName: validatedFields.data.fantasyName || null,
                cmfRegistration: validatedFields.data.cmfRegistration || null,
                phone: validatedFields.data.phone || null,
                email: validatedFields.data.email || null,
                address: validatedFields.data.address || null,
                website: validatedFields.data.website || null,
            },
        })

        revalidatePath("/dashboard/settings")
        return { success: "Configuración actualizada" }
    } catch {
        return { error: "Error al actualizar la configuración" }
    }
}

// Actualizar logo
export async function updateLogo(logoUrl: string) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    try {
        await prisma.tenant.update({
            where: { id: tenantId },
            data: { logoUrl },
        })

        revalidatePath("/dashboard/settings")
        return { success: "Logo actualizado" }
    } catch {
        return { error: "Error al actualizar el logo" }
    }
}

// Actualizar firma
export async function updateSignature(signatureUrl: string) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    try {
        await prisma.tenant.update({
            where: { id: tenantId },
            data: { signatureUrl },
        })

        revalidatePath("/dashboard/settings")
        return { success: "Firma actualizada" }
    } catch {
        return { error: "Error al actualizar la firma" }
    }
}

// Eliminar logo
export async function removeLogo() {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    try {
        await prisma.tenant.update({
            where: { id: tenantId },
            data: { logoUrl: null },
        })

        revalidatePath("/dashboard/settings")
        return { success: "Logo eliminado" }
    } catch {
        return { error: "Error al eliminar el logo" }
    }
}

// Eliminar firma
export async function removeSignature() {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    try {
        await prisma.tenant.update({
            where: { id: tenantId },
            data: { signatureUrl: null },
        })

        revalidatePath("/dashboard/settings")
        return { success: "Firma eliminada" }
    } catch {
        return { error: "Error al eliminar la firma" }
    }
}
