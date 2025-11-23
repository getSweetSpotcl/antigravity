"use server"

import * as z from "zod"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { ClientSchema } from "@/schemas/client"
import { revalidatePath } from "next/cache"
import { getTenantContext } from "@/lib/tenant-context"

export const getClients = async () => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const clients = await prisma.client.findMany({
        where: {
            tenantId: tenantId,
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    return clients
}

export const createClient = async (values: z.infer<typeof ClientSchema>) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }



    const validatedFields = ClientSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    const { rut, firstName, lastName, email, phone, address } = validatedFields.data

    const existingClient = await prisma.client.findUnique({
        where: {
            tenantId_rut: {
                tenantId: tenantId,
                rut,
            }
        }
    })

    if (existingClient) {
        return { error: "El cliente ya existe con este RUT" }
    }

    try {
        await prisma.client.create({
            data: {
                rut,
                firstName,
                lastName,
                email,
                phone,
                address,
                tenantId: tenantId,
            },
        })

        revalidatePath("/dashboard/clients")
        return { success: "Cliente creado exitosamente" }
    } catch (error) {
        console.error("Create client error:", error)
        return { error: "Error al crear el cliente" }
    }
}

export const deleteClient = async (id: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    try {
        await prisma.client.delete({
            where: {
                id,
                tenantId: tenantId, // Ensure tenant isolation
            },
        })

        revalidatePath("/dashboard/clients")
        return { success: "Cliente eliminado exitosamente" }
    } catch (error) {
        console.error("Delete client error:", error)
        return { error: "Error al eliminar el cliente" }
    }
}

export const updateClient = async (id: string, values: z.infer<typeof ClientSchema>) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const validatedFields = ClientSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    try {
        await prisma.client.update({
            where: {
                id,
                tenantId: tenantId,
            },
            data: {
                ...validatedFields.data,
            },
        })

        revalidatePath("/dashboard/clients")
        return { success: "Cliente actualizado exitosamente" }
    } catch (error) {
        console.error("Update client error:", error)
        return { error: "Error al actualizar el cliente" }
    }
}
