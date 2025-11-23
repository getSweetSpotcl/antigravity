"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { EndorsementSchema } from "@/schemas/endorsement"

export const createEndorsement = async (values: z.infer<typeof EndorsementSchema>) => {
    const session = await auth()

    if (!session || !session.user?.tenantId) {
        return { success: false, error: "No autorizado" }
    }

    const validatedFields = EndorsementSchema.safeParse(values)

    if (!validatedFields.success) {
        return { success: false, error: "Campos inválidos" }
    }

    const { policyId, type, description, date, number } = validatedFields.data

    try {
        // Verificar que la póliza pertenece al tenant
        const policy = await prisma.policy.findUnique({
            where: { id: policyId },
        })

        if (!policy || policy.tenantId !== session.user.tenantId) {
            return { success: false, error: "Póliza no encontrada" }
        }

        // Crear endoso
        await prisma.endorsement.create({
            data: {
                policyId,
                type,
                description,
                date,
                number,
            },
        })

        // Actualizar estado de póliza si es necesario
        if (type === "CANCELLATION") {
            await prisma.policy.update({
                where: { id: policyId },
                data: { status: "CANCELLED" },
            })
        } else if (type === "RENEWAL") {
            await prisma.policy.update({
                where: { id: policyId },
                data: { status: "RENEWED" },
            })
        }

        revalidatePath(`/dashboard/policies/${policyId}`)
        return { success: true }
    } catch (error) {
        console.error("Error creating endorsement:", error)
        return { success: false, error: "Error al crear el endoso" }
    }
}
